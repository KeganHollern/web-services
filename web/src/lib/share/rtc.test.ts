import { describe, it, expect } from "vitest";
import {
    createSharerSession,
    createViewerSession,
    extractFingerprint,
} from "./rtc";
import type { SignalingMessage, SignalingTransport } from "./rtc";

function loopback(): { sharer: SignalingTransport; viewer: SignalingTransport } {
    let sharerInbound: ((m: SignalingMessage) => void) | null = null;
    let viewerInbound: ((m: SignalingMessage) => void) | null = null;
    const pendingForSharer: SignalingMessage[] = [];
    const pendingForViewer: SignalingMessage[] = [];

    const sharer: SignalingTransport = {
        send: (m) => {
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
            if (sharerInbound) sharerInbound(m);
            else pendingForSharer.push(m);
        },
        onMessage: (h) => {
            viewerInbound = h;
            while (pendingForViewer.length) h(pendingForViewer.shift()!);
        },
    };

    return { sharer, viewer };
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
            getMedia: async () => null,
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
});
