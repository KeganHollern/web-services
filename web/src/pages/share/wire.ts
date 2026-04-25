// Bridge between the encrypted SignalingClient and the RTC layer's
// SignalingTransport. Everything we emit over the WebSocket is encrypted by
// SignalingClient; on top of that we multiplex RTC SDP/ICE messages with
// application-level messages (currently just SAS confirmation).

import type { SignalingClient } from "@/lib/share/signaling";
import type { SignalingMessage, SignalingTransport } from "@/lib/share/rtc";

export type AppMessage =
    | { kind: "sas-confirmed" }
    | { kind: "relay-enabled" };

type WireMessage = SignalingMessage | AppMessage;

export interface WireBridge {
    transport: SignalingTransport;
    sendApp(msg: AppMessage): Promise<void>;
    onAppMessage(handler: (msg: AppMessage) => void): void;
    // Drop the currently-registered RTC handler so a disposed session no
    // longer sees incoming SDP/ICE. The sharer reuses the bridge across
    // peer-rejoin cycles, so leftover handlers from a previous PC must be
    // cleared before a new session registers its own.
    resetRtcHandler(): void;
}

export function createWireBridge(client: SignalingClient): WireBridge {
    let rtcHandler: ((msg: SignalingMessage) => void) | null = null;
    const appHandlers: Array<(msg: AppMessage) => void> = [];

    client.on("message", ({ plaintext }) => {
        let msg: WireMessage;
        try {
            msg = JSON.parse(plaintext) as WireMessage;
        } catch {
            return;
        }
        if (msg.kind === "offer" || msg.kind === "answer" || msg.kind === "ice") {
            rtcHandler?.(msg);
        } else if (msg.kind === "sas-confirmed" || msg.kind === "relay-enabled") {
            for (const h of appHandlers) h(msg);
        }
    });

    const transport: SignalingTransport = {
        send(msg) {
            void client.send(JSON.stringify(msg));
        },
        onMessage(handler) {
            // Single-handler model: a fresh session registration replaces
            // any prior handler. Combined with resetRtcHandler() this keeps
            // disposed sessions from racing the active one.
            rtcHandler = handler;
        },
    };

    return {
        transport,
        sendApp(msg) {
            return client.send(JSON.stringify(msg));
        },
        onAppMessage(handler) {
            appHandlers.push(handler);
        },
        resetRtcHandler() {
            rtcHandler = null;
        },
    };
}
