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

export interface PeerSession {
    getLocalFingerprint(): string | null;
    getRemoteFingerprint(): string | null;
    openDataChannel(label: string): Promise<DataChannelHandle>;
    dispose(): void;
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
];

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
}

function disposeCtx(ctx: SessionCtx): void {
    if (ctx.disposed) return;
    ctx.disposed = true;
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

function makeHandle(
    ctx: SessionCtx,
    openDataChannel: (label: string) => Promise<DataChannelHandle>,
): PeerSession {
    return {
        getLocalFingerprint() {
            return extractFingerprint(ctx.pc.localDescription?.sdp);
        },
        getRemoteFingerprint() {
            return extractFingerprint(ctx.pc.remoteDescription?.sdp);
        },
        openDataChannel,
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
    // DI hook for capture source; defaults to navigator.mediaDevices.getDisplayMedia.
    // Returning null skips media attachment (used in tests without a capture source).
    getMedia?: () => Promise<MediaStream | null>;
}

export function createSharerSession(opts: SharerOptions): PeerSession {
    const iceServers = opts.iceServers ?? DEFAULT_ICE_SERVERS;
    const pc = new RTCPeerConnection({ iceServers });
    const ctx: SessionCtx = { pc, tracks: [], channels: [], disposed: false };

    wireIce(pc, opts.signaling, () => ctx.disposed);

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

    const getMedia = opts.getMedia ?? defaultGetDisplayMedia;

    void (async () => {
        try {
            const stream = await getMedia();
            if (ctx.disposed) return;
            if (stream) {
                for (const t of stream.getTracks()) {
                    pc.addTrack(t, stream);
                    ctx.tracks.push(t);
                }
            }
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            if (ctx.disposed || !offer.sdp) return;
            opts.signaling.send({ kind: "offer", sdp: offer.sdp });
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

    return makeHandle(ctx, openDataChannel);
}

function defaultGetDisplayMedia(): Promise<MediaStream> {
    return navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: { suppressLocalAudioPlayback: true },
    } as DisplayMediaStreamOptions);
}

export interface ViewerOptions {
    signaling: SignalingTransport;
    iceServers?: RTCIceServer[];
    onStream: (stream: MediaStream) => void;
}

export function createViewerSession(opts: ViewerOptions): PeerSession {
    const iceServers = opts.iceServers ?? DEFAULT_ICE_SERVERS;
    const pc = new RTCPeerConnection({ iceServers });
    const ctx: SessionCtx = { pc, tracks: [], channels: [], disposed: false };

    wireIce(pc, opts.signaling, () => ctx.disposed);

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

    return makeHandle(ctx, openDataChannel);
}
