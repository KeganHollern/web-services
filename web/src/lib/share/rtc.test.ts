import { describe, it, expect } from "vitest";
import { nonstandard } from "@roamhq/wrtc";
import {
    createSharerSession,
    createViewerSession,
    extractFingerprint,
} from "./rtc";
import type { SignalingMessage, SignalingTransport } from "./rtc";

interface Loopback {
    sharer: SignalingTransport;
    viewer: SignalingTransport;
    sentBySharer: SignalingMessage[];
    sentByViewer: SignalingMessage[];
}

function loopback(): Loopback {
    let sharerInbound: ((m: SignalingMessage) => void) | null = null;
    let viewerInbound: ((m: SignalingMessage) => void) | null = null;
    const pendingForSharer: SignalingMessage[] = [];
    const pendingForViewer: SignalingMessage[] = [];
    const sentBySharer: SignalingMessage[] = [];
    const sentByViewer: SignalingMessage[] = [];

    const sharer: SignalingTransport = {
        send: (m) => {
            sentBySharer.push(m);
            if (viewerInbound) viewerInbound(m);
            else pendingForViewer.push(m);
        },
        onMessage: (h) => {
            sharerInbound = h;
            while (pendingForSharer.length) h(pendingForSharer.shift()!);
        },
    };

    const viewer: SignalingTransport = {
        send: (m) => {
            sentByViewer.push(m);
            if (sharerInbound) sharerInbound(m);
            else pendingForSharer.push(m);
        },
        onMessage: (h) => {
            viewerInbound = h;
            while (pendingForViewer.length) h(pendingForViewer.shift()!);
        },
    };

    return { sharer, viewer, sentBySharer, sentByViewer };
}

// Settle both sides until either no offer/answer is in flight or `predicate`
// returns true. Used to wait out async negotiation in tests without sleeping.
async function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
    const start = Date.now();
    while (!predicate()) {
        if (Date.now() - start > timeoutMs) throw new Error("waitFor: timeout");
        await new Promise((r) => setTimeout(r, 10));
    }
}

describe("extractFingerprint", () => {
    it("pulls the fingerprint line from SDP", () => {
        const sdp =
            "v=0\r\no=- 1 1 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 AA:BB:CC\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n";
        expect(extractFingerprint(sdp)).toBe("sha-256 AA:BB:CC");
    });

    it("returns null when absent or sdp is empty", () => {
        expect(extractFingerprint(null)).toBeNull();
        expect(extractFingerprint(undefined)).toBeNull();
        expect(extractFingerprint("v=0\r\n")).toBeNull();
    });
});

describe("rtc sessions over loopback", () => {
    it("negotiates, exchanges a datachannel message, and exposes matching fingerprints", async () => {
        const { sharer: sharerTransport, viewer: viewerTransport } = loopback();

        const sharer = createSharerSession({
            signaling: sharerTransport,
        });

        const viewer = createViewerSession({
            signaling: viewerTransport,
            onStream: () => {
                // no media in this test
            },
        });

        const [dcSharer, dcViewer] = await Promise.all([
            sharer.openDataChannel("chat"),
            viewer.openDataChannel("chat"),
        ]);

        const received = new Promise<string>((resolve) => {
            dcViewer.onMessage((data) => {
                if (typeof data === "string") resolve(data);
            });
        });

        dcSharer.send("hello world");
        expect(await received).toBe("hello world");

        const sharerLocal = sharer.getLocalFingerprint();
        const sharerRemote = sharer.getRemoteFingerprint();
        const viewerLocal = viewer.getLocalFingerprint();
        const viewerRemote = viewer.getRemoteFingerprint();

        expect(sharerLocal).toBeTruthy();
        expect(viewerLocal).toBeTruthy();
        expect(sharerLocal).toBe(viewerRemote);
        expect(viewerLocal).toBe(sharerRemote);

        sharer.dispose();
        viewer.dispose();

        // Second dispose should be a no-op.
        sharer.dispose();
        viewer.dispose();
    });

    it("sends the initial offer with no media tracks on construction", async () => {
        const { sharer: sharerTransport, viewer: viewerTransport, sentBySharer } = loopback();

        const sharer = createSharerSession({ signaling: sharerTransport });
        const viewer = createViewerSession({
            signaling: viewerTransport,
            onStream: () => { /* no media yet */ },
        });

        // First message out from the sharer should be the no-media offer,
        // emitted before any getDisplayMedia work happens.
        await waitFor(() => sentBySharer.some((m) => m.kind === "offer"));
        const firstOffer = sentBySharer.find((m) => m.kind === "offer") as
            | Extract<SignalingMessage, { kind: "offer" }>
            | undefined;
        expect(firstOffer).toBeTruthy();
        expect(firstOffer!.sdp).not.toMatch(/^m=video/m);
        expect(firstOffer!.sdp).not.toMatch(/^m=audio/m);
        expect(firstOffer!.sdp).toMatch(/^m=application/m);

        sharer.dispose();
        viewer.dispose();
    });

    it("attachMedia triggers a renegotiation offer with the track and delivers it to the viewer", async () => {
        const { sharer: sharerTransport, viewer: viewerTransport, sentBySharer } = loopback();

        const sharer = createSharerSession({ signaling: sharerTransport });
        const receivedStreams: MediaStream[] = [];
        let resolveTrack!: (s: MediaStream) => void;
        const onTrack = new Promise<MediaStream>((resolve) => {
            resolveTrack = resolve;
        });
        const viewer = createViewerSession({
            signaling: viewerTransport,
            onStream: (stream) => {
                receivedStreams.push(stream);
                resolveTrack(stream);
            },
        });

        try {
            // Wait for the initial (no-media) offer to land so we can
            // distinguish the renegotiation offer that follows.
            await waitFor(() => sentBySharer.filter((m) => m.kind === "offer").length >= 1);
            const fp1Sharer = sharer.getLocalFingerprint();
            await waitFor(() => sharer.getRemoteFingerprint() != null);
            const fp1Viewer = sharer.getRemoteFingerprint();
            expect(fp1Sharer).toBeTruthy();
            expect(fp1Viewer).toBeTruthy();

            const source = new nonstandard.RTCVideoSource();
            const track = source.createTrack();
            const stream = new MediaStream([track as unknown as MediaStreamTrack]);

            await sharer.attachMedia(stream);

            // A second offer should have been sent, this time with media.
            await waitFor(() => sentBySharer.filter((m) => m.kind === "offer").length >= 2);
            const offers = sentBySharer.filter((m) => m.kind === "offer") as Array<
                Extract<SignalingMessage, { kind: "offer" }>
            >;
            expect(offers[1].sdp).toMatch(/^m=video/m);

            // Fingerprints are bound to the PC identity, so they should be
            // unchanged across the renegotiation — SAS computed pre-media
            // stays valid.
            expect(sharer.getLocalFingerprint()).toBe(fp1Sharer);
            expect(sharer.getRemoteFingerprint()).toBe(fp1Viewer);

            // The viewer should receive the track via the renegotiated offer.
            const delivered = await onTrack;
            expect(delivered.getVideoTracks().length).toBeGreaterThan(0);

            track.stop();
        } finally {
            sharer.dispose();
            viewer.dispose();
            // Stop any extra tracks the viewer materialized.
            for (const s of receivedStreams) s.getTracks().forEach((t) => t.stop());
        }
    });
});
