export type SignalingMessage =
    | { kind: "offer"; sdp: string }
    | { kind: "answer"; sdp: string }
    | { kind: "ice"; candidate: RTCIceCandidateInit };

export interface SignalingTransport {
    send(msg: SignalingMessage): void;
    onMessage(handler: (msg: SignalingMessage) => void): void;
}

export interface DataChannelHandle {
    send(data: string | ArrayBuffer): void;
    onMessage(handler: (data: string | ArrayBuffer) => void): void;
    close(): void;
}

export type TransportKind = "direct" | "relay";

export interface PeerSession {
    getLocalFingerprint(): string | null;
    getRemoteFingerprint(): string | null;
    openDataChannel(label: string): Promise<DataChannelHandle>;
    // Returns the kind of path the selected ICE candidate pair is on, or null
    // if negotiation has not completed yet.
    getTransport(): Promise<TransportKind | null>;
    // Swap ICE servers (e.g. add a TURN entry after an opt-in) and, on the
    // offerer, kick off an ICE restart so the new candidates are tried.
    enableRelay(iceServers: RTCIceServer[]): Promise<void>;
    // Attach media to the session after it has been constructed. The sharer
    // defers getDisplayMedia until SAS is confirmed so that the SDP exchange
    // (and thus the fingerprint that SAS is derived from) happens without
    // waiting on OS permission prompts. attachMedia adds the tracks and
    // renegotiates. On the viewer side this is not supported.
    attachMedia(stream: MediaStream): Promise<void>;
    dispose(): void;
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
];

// If ICE has not reached connected/completed within this window we treat the
// attempt as failed — some networks never emit iceconnectionstate "failed"
// and just stall in "checking".
const ICE_FAIL_TIMEOUT_MS = 15_000;

// A placeholder channel created up-front on the sharer so that the initial
// offer always includes an m=application section and SCTP is negotiated
// regardless of whether media tracks are attached.
const INIT_CHANNEL_LABEL = "__rtc_init__";

export function extractFingerprint(sdp: string | null | undefined): string | null {
    if (!sdp) return null;
    const m = sdp.match(/^a=fingerprint:\s*(.+)$/m);
    return m ? m[1].trim() : null;
}

function wrapChannel(dc: RTCDataChannel): DataChannelHandle {
    const listeners: Array<(data: string | ArrayBuffer) => void> = [];
    dc.addEventListener("message", (ev: MessageEvent) => {
        for (const l of listeners) l(ev.data);
    });
    return {
        send(data) {
            if (typeof data === "string") dc.send(data);
            else dc.send(data);
        },
        onMessage(handler) {
            listeners.push(handler);
        },
        close() {
            try {
                dc.close();
            } catch {
                /* already closed */
            }
        },
    };
}

function waitForOpen(dc: RTCDataChannel): Promise<void> {
    if (dc.readyState === "open") return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
        const cleanup = () => {
            dc.removeEventListener("open", onOpen);
            dc.removeEventListener("error", onError);
            dc.removeEventListener("close", onClose);
        };
        const onOpen = () => {
            cleanup();
            resolve();
        };
        const onError = (e: Event) => {
            cleanup();
            reject(e);
        };
        const onClose = () => {
            cleanup();
            reject(new Error("datachannel closed before open"));
        };
        dc.addEventListener("open", onOpen);
        dc.addEventListener("error", onError);
        dc.addEventListener("close", onClose);
    });
}

interface SessionCtx {
    pc: RTCPeerConnection;
    tracks: MediaStreamTrack[];
    channels: RTCDataChannel[];
    disposed: boolean;
    iceFailTimer: ReturnType<typeof setTimeout> | null;
    iceFailFired: boolean;
    onIceFail: (() => void) | null;
}

function disposeCtx(ctx: SessionCtx): void {
    if (ctx.disposed) return;
    ctx.disposed = true;
    if (ctx.iceFailTimer != null) {
        clearTimeout(ctx.iceFailTimer);
        ctx.iceFailTimer = null;
    }
    for (const c of ctx.channels) {
        try {
            c.close();
        } catch {
            /* noop */
        }
    }
    for (const t of ctx.tracks) {
        try {
            t.stop();
        } catch {
            /* noop */
        }
    }
    try {
        ctx.pc.close();
    } catch {
        /* noop */
    }
}

function fireIceFail(ctx: SessionCtx): void {
    if (ctx.iceFailFired || ctx.disposed) return;
    ctx.iceFailFired = true;
    if (ctx.iceFailTimer != null) {
        clearTimeout(ctx.iceFailTimer);
        ctx.iceFailTimer = null;
    }
    const cb = ctx.onIceFail;
    if (cb) {
        try { cb(); } catch { /* callback errors must not break dispose */ }
    }
}

function armIceFailWatchdog(ctx: SessionCtx): void {
    if (ctx.iceFailTimer != null || ctx.iceFailFired || ctx.disposed) return;
    ctx.iceFailTimer = setTimeout(() => {
        ctx.iceFailTimer = null;
        const state = ctx.pc.iceConnectionState;
        if (state !== "connected" && state !== "completed") {
            fireIceFail(ctx);
        }
    }, ICE_FAIL_TIMEOUT_MS);
}

function wireIceFailDetect(ctx: SessionCtx): void {
    ctx.pc.addEventListener("iceconnectionstatechange", () => {
        const s = ctx.pc.iceConnectionState;
        if (s === "connected" || s === "completed") {
            if (ctx.iceFailTimer != null) {
                clearTimeout(ctx.iceFailTimer);
                ctx.iceFailTimer = null;
            }
            // Allow a subsequent restart (e.g. after enableRelay) to detect
            // failure again.
            ctx.iceFailFired = false;
        } else if (s === "failed") {
            fireIceFail(ctx);
        }
    });
}

async function resolveTransport(pc: RTCPeerConnection): Promise<TransportKind | null> {
    // RTCStatsReport is a Map-like; iterate to find the nominated succeeded
    // candidate pair, then look up its two candidates by id.
    type Stat = { type: string; state?: string; nominated?: boolean; selected?: boolean; localCandidateId?: string; remoteCandidateId?: string; candidateType?: string };
    let report: RTCStatsReport;
    try {
        report = await pc.getStats();
    } catch {
        return null;
    }
    let pair: Stat | null = null;
    report.forEach((v: unknown) => {
        const s = v as Stat;
        if (s.type !== "candidate-pair") return;
        if (s.state !== "succeeded") return;
        if (s.nominated === true || s.selected === true) pair = s;
    });
    if (!pair) return null;
    const local = report.get((pair as Stat).localCandidateId ?? "") as Stat | undefined;
    const remote = report.get((pair as Stat).remoteCandidateId ?? "") as Stat | undefined;
    if (local?.candidateType === "relay" || remote?.candidateType === "relay") return "relay";
    return "direct";
}

function makeHandle(
    ctx: SessionCtx,
    openDataChannel: (label: string) => Promise<DataChannelHandle>,
    enableRelay: (iceServers: RTCIceServer[]) => Promise<void>,
    attachMedia: (stream: MediaStream) => Promise<void>,
): PeerSession {
    return {
        getLocalFingerprint() {
            return extractFingerprint(ctx.pc.localDescription?.sdp);
        },
        getRemoteFingerprint() {
            return extractFingerprint(ctx.pc.remoteDescription?.sdp);
        },
        openDataChannel,
        getTransport() {
            return resolveTransport(ctx.pc);
        },
        enableRelay,
        attachMedia,
        dispose() {
            disposeCtx(ctx);
        },
    };
}

function wireIce(
    pc: RTCPeerConnection,
    signaling: SignalingTransport,
    isDisposed: () => boolean,
): void {
    pc.addEventListener("icecandidate", (e) => {
        if (isDisposed()) return;
        if (e.candidate) {
            signaling.send({ kind: "ice", candidate: e.candidate.toJSON() });
        }
    });
}

export interface SharerOptions {
    signaling: SignalingTransport;
    iceServers?: RTCIceServer[];
    // Fired when ICE reaches the "failed" state, or when it has not reached
    // connected/completed within ICE_FAIL_TIMEOUT_MS. Signals to the UI that a
    // relay fallback should be offered.
    onIceFail?: () => void;
}

export function createSharerSession(opts: SharerOptions): PeerSession {
    const iceServers = opts.iceServers ?? DEFAULT_ICE_SERVERS;
    const pc = new RTCPeerConnection({ iceServers });
    const ctx: SessionCtx = {
        pc,
        tracks: [],
        channels: [],
        disposed: false,
        iceFailTimer: null,
        iceFailFired: false,
        onIceFail: opts.onIceFail ?? null,
    };

    wireIce(pc, opts.signaling, () => ctx.disposed);
    wireIceFailDetect(ctx);

    const initDc = pc.createDataChannel(INIT_CHANNEL_LABEL);
    ctx.channels.push(initDc);

    opts.signaling.onMessage((msg) => {
        if (ctx.disposed) return;
        if (msg.kind === "answer") {
            pc.setRemoteDescription({ type: "answer", sdp: msg.sdp }).catch((e) => {
                console.error("sharer setRemoteDescription failed", e);
            });
        } else if (msg.kind === "ice") {
            pc.addIceCandidate(msg.candidate).catch((e) => {
                console.error("sharer addIceCandidate failed", e);
            });
        }
    });

    // Send the initial offer immediately, with only the placeholder data
    // channel. Media is attached later via attachMedia() once the user has
    // confirmed SAS — this lets the fingerprint reach the viewer in <1s
    // regardless of how long the OS permission dialog takes.
    void (async () => {
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            if (ctx.disposed || !offer.sdp) return;
            opts.signaling.send({ kind: "offer", sdp: offer.sdp });
            armIceFailWatchdog(ctx);
        } catch (e) {
            console.error("sharer setup failed", e);
        }
    })();

    const openDataChannel = async (label: string): Promise<DataChannelHandle> => {
        if (ctx.disposed) throw new Error("session disposed");
        const dc = pc.createDataChannel(label);
        ctx.channels.push(dc);
        await waitForOpen(dc);
        return wrapChannel(dc);
    };

    const enableRelay = async (iceServers: RTCIceServer[]): Promise<void> => {
        if (ctx.disposed) return;
        pc.setConfiguration({ iceServers });
        // Allow a second-attempt failure to refire onIceFail (e.g. if TURN
        // itself can't reach the peer).
        ctx.iceFailFired = false;
        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);
        if (ctx.disposed || !offer.sdp) return;
        opts.signaling.send({ kind: "offer", sdp: offer.sdp });
        armIceFailWatchdog(ctx);
    };

    const attachMedia = async (stream: MediaStream): Promise<void> => {
        if (ctx.disposed) return;
        for (const t of stream.getTracks()) {
            pc.addTrack(t, stream);
            ctx.tracks.push(t);
        }
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (ctx.disposed || !offer.sdp) return;
        opts.signaling.send({ kind: "offer", sdp: offer.sdp });
        // The DTLS fingerprint stays the same across renegotiations (it's
        // bound to the PC's identity), so SAS computed pre-media remains
        // valid. We only need to re-arm ICE-fail detection in case the
        // renegotiation itself stalls.
        ctx.iceFailFired = false;
        armIceFailWatchdog(ctx);
    };

    return makeHandle(ctx, openDataChannel, enableRelay, attachMedia);
}

export interface ViewerOptions {
    signaling: SignalingTransport;
    iceServers?: RTCIceServer[];
    onStream: (stream: MediaStream) => void;
    onIceFail?: () => void;
}

export function createViewerSession(opts: ViewerOptions): PeerSession {
    const iceServers = opts.iceServers ?? DEFAULT_ICE_SERVERS;
    const pc = new RTCPeerConnection({ iceServers });
    const ctx: SessionCtx = {
        pc,
        tracks: [],
        channels: [],
        disposed: false,
        iceFailTimer: null,
        iceFailFired: false,
        onIceFail: opts.onIceFail ?? null,
    };

    wireIce(pc, opts.signaling, () => ctx.disposed);
    wireIceFailDetect(ctx);

    pc.addEventListener("track", (ev) => {
        if (ctx.disposed) return;
        const stream = ev.streams[0] ?? new MediaStream([ev.track]);
        opts.onStream(stream);
    });

    // Incoming channels are queued by label until openDataChannel is awaited.
    const waiters = new Map<string, Array<(dc: RTCDataChannel) => void>>();
    const pending = new Map<string, RTCDataChannel[]>();

    pc.addEventListener("datachannel", (ev) => {
        const label = ev.channel.label;
        if (label === INIT_CHANNEL_LABEL) {
            try {
                ev.channel.close();
            } catch {
                /* noop */
            }
            return;
        }
        const queue = waiters.get(label);
        if (queue && queue.length) {
            const resolve = queue.shift()!;
            resolve(ev.channel);
            return;
        }
        const arr = pending.get(label) ?? [];
        arr.push(ev.channel);
        pending.set(label, arr);
    });

    opts.signaling.onMessage((msg) => {
        if (ctx.disposed) return;
        void (async () => {
            try {
                if (msg.kind === "offer") {
                    await pc.setRemoteDescription({ type: "offer", sdp: msg.sdp });
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    if (ctx.disposed || !answer.sdp) return;
                    opts.signaling.send({ kind: "answer", sdp: answer.sdp });
                    // Permit fresh ICE-fail detection after a renegotiation
                    // (e.g. the sharer's iceRestart offer).
                    ctx.iceFailFired = false;
                    armIceFailWatchdog(ctx);
                } else if (msg.kind === "ice") {
                    await pc.addIceCandidate(msg.candidate);
                }
            } catch (e) {
                console.error("viewer signaling error", e);
            }
        })();
    });

    const openDataChannel = async (label: string): Promise<DataChannelHandle> => {
        if (ctx.disposed) throw new Error("session disposed");
        const queue = pending.get(label);
        let dc: RTCDataChannel;
        if (queue && queue.length) {
            dc = queue.shift()!;
        } else {
            dc = await new Promise<RTCDataChannel>((resolve) => {
                const arr = waiters.get(label) ?? [];
                arr.push(resolve);
                waiters.set(label, arr);
            });
        }
        ctx.channels.push(dc);
        await waitForOpen(dc);
        return wrapChannel(dc);
    };

    // The viewer is the answerer; it does not trigger ICE restart on its own
    // — the sharer's restartIce offer drives renegotiation. Updating the
    // configuration here just ensures new candidates can use the TURN server
    // if the viewer also holds credentials.
    const enableRelay = async (iceServers: RTCIceServer[]): Promise<void> => {
        if (ctx.disposed) return;
        pc.setConfiguration({ iceServers });
    };

    const attachMedia = async (): Promise<void> => {
        throw new Error("attachMedia is only valid on the sharer side");
    };

    return makeHandle(ctx, openDataChannel, enableRelay, attachMedia);
}
