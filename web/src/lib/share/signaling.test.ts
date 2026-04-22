import { describe, expect, it, vi } from "vitest";
import { encodeShareUrl, generateRoomKey } from "./crypto";
import { SignalingClient } from "./signaling";

// Minimal WebSocket mock — just enough surface for the client to drive it.
class MockWebSocket {
    static OPEN = 1;
    readyState = 0;
    sent: string[] = [];
    url: string;
    private listeners: Record<string, Set<(ev: unknown) => void>> = {};

    constructor(url: string) {
        this.url = url;
        queueMicrotask(() => {
            this.readyState = MockWebSocket.OPEN;
            this.fire("open", {});
        });
    }

    addEventListener(type: string, handler: (ev: unknown) => void): void {
        (this.listeners[type] ??= new Set()).add(handler);
    }

    removeEventListener(type: string, handler: (ev: unknown) => void): void {
        this.listeners[type]?.delete(handler);
    }

    send(data: string): void {
        this.sent.push(data);
    }

    close(): void {
        this.readyState = 3;
        this.fire("close", {});
    }

    fire(type: string, ev: unknown): void {
        this.listeners[type]?.forEach((h) => h(ev));
    }
}

describe("SignalingClient", () => {
    it("never leaks the room key to the WebSocket", async () => {
        const key = generateRoomKey();
        const shareUrl = encodeShareUrl("room-42", key);
        // Isolate the base64url'd key as it appears in the URL fragment.
        const fragmentKey = shareUrl.split(".")[1];

        let socket: MockWebSocket | null = null;
        const client = new SignalingClient(key, {
            baseUrl: "http://localhost",
            wsFactory: (url) => {
                socket = new MockWebSocket(url) as unknown as WebSocket & MockWebSocket;
                return socket as unknown as WebSocket;
            },
        });

        await client.connect("room-42");
        await client.send("sdp-offer-plaintext");
        await client.send("ice-candidate-plaintext");

        expect(socket).not.toBeNull();
        const s = socket as unknown as MockWebSocket;
        expect(s.sent.length).toBe(2);
        expect(s.url).not.toContain(fragmentKey);
        for (const msg of s.sent) {
            expect(msg).not.toContain(fragmentKey);
            // Outgoing envelope must never contain the plaintext either.
            expect(msg).not.toContain("sdp-offer-plaintext");
            expect(msg).not.toContain("ice-candidate-plaintext");
        }
    });

    it("emits peer-joined and peer-left events from server envelopes", async () => {
        const key = generateRoomKey();
        let socket: MockWebSocket | null = null;
        const client = new SignalingClient(key, {
            baseUrl: "http://localhost",
            wsFactory: (url) => {
                socket = new MockWebSocket(url) as unknown as WebSocket & MockWebSocket;
                return socket as unknown as WebSocket;
            },
        });

        const joined = vi.fn();
        const left = vi.fn();
        client.on("peer-joined", joined);
        client.on("peer-left", left);
        await client.connect("r");

        (socket as unknown as MockWebSocket).fire("message", {
            data: JSON.stringify({ type: "peer-joined", peerId: "p1" }),
        });
        (socket as unknown as MockWebSocket).fire("message", {
            data: JSON.stringify({ type: "peer-left", peerId: "p1" }),
        });

        expect(joined).toHaveBeenCalledWith({ peerId: "p1" });
        expect(left).toHaveBeenCalledWith({ peerId: "p1" });
    });

    it("decrypts incoming message envelopes before emitting", async () => {
        const key = generateRoomKey();
        // Build a payload encrypted with the same key the client holds.
        const { encrypt } = await import("./crypto");
        const payload = await encrypt(key, "peer-plaintext");

        let socket: MockWebSocket | null = null;
        const client = new SignalingClient(key, {
            baseUrl: "http://localhost",
            wsFactory: (url) => {
                socket = new MockWebSocket(url) as unknown as WebSocket & MockWebSocket;
                return socket as unknown as WebSocket;
            },
        });

        const msg = vi.fn();
        client.on("message", msg);
        await client.connect("r");

        (socket as unknown as MockWebSocket).fire("message", {
            data: JSON.stringify({ type: "message", from: "peerA", payload }),
        });
        await vi.waitFor(() => expect(msg).toHaveBeenCalledOnce());

        expect(msg).toHaveBeenCalledWith({ from: "peerA", plaintext: "peer-plaintext" });
    });
});
