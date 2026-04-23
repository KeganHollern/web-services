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
}

export function createWireBridge(client: SignalingClient): WireBridge {
    const rtcHandlers: Array<(msg: SignalingMessage) => void> = [];
    const appHandlers: Array<(msg: AppMessage) => void> = [];

    client.on("message", ({ plaintext }) => {
        let msg: WireMessage;
        try {
            msg = JSON.parse(plaintext) as WireMessage;
        } catch {
            return;
        }
        if (msg.kind === "offer" || msg.kind === "answer" || msg.kind === "ice") {
            for (const h of rtcHandlers) h(msg);
        } else if (msg.kind === "sas-confirmed" || msg.kind === "relay-enabled") {
            for (const h of appHandlers) h(msg);
        }
    });

    const transport: SignalingTransport = {
        send(msg) {
            void client.send(JSON.stringify(msg));
        },
        onMessage(handler) {
            rtcHandlers.push(handler);
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
    };
}
