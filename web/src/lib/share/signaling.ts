// Thin client over the Go signaling WebSocket.
//
// The server is zero-knowledge: it sees an envelope ({type, from, to, payload})
// and routes by peerId, but the `payload` field is an AES-GCM sealed blob it
// cannot open. Peer-joined / peer-left are plaintext metadata emitted by the
// server when connections open and close.

import { decrypt, encrypt, importRoomKey, type RoomKey } from "./crypto";

export interface CreateRoomResponse {
    roomId: string;
}

export interface PeerEvent {
    peerId: string;
}

export interface SignalingMessage {
    from: string;
    plaintext: string;
}

export type SignalingEventMap = {
    "peer-joined": PeerEvent;
    "peer-left": PeerEvent;
    "message": SignalingMessage;
    "error": { message: string };
    "close": { reason: string };
};

type Listener<K extends keyof SignalingEventMap> = (ev: SignalingEventMap[K]) => void;

type ServerEnvelope =
    | { type: "peer-joined"; peerId: string }
    | { type: "peer-left"; peerId: string }
    | { type: "message"; from: string; payload: string }
    | { type: "error"; message: string };

interface ClientEnvelope {
    type: "message";
    to?: string;
    payload: string;
}

export interface SignalingClientOptions {
    // Base HTTP origin for the signaling server. Defaults to same-origin.
    baseUrl?: string;
    // HTTP path prefix for the share endpoints. Defaults to "/api/share".
    apiPrefix?: string;
    // Injectable for tests.
    wsFactory?: (url: string) => WebSocket;
    fetchImpl?: typeof fetch;
}

export async function createRoom(opts: SignalingClientOptions = {}): Promise<string> {
    const fetchFn = opts.fetchImpl ?? fetch;
    const url = buildHttpUrl(opts, "/room");
    const res = await fetchFn(url, { method: "POST" });
    if (!res.ok) {
        throw new Error(`createRoom failed: HTTP ${res.status}`);
    }
    const body = (await res.json()) as CreateRoomResponse;
    if (!body?.roomId) throw new Error("createRoom: missing roomId in response");
    return body.roomId;
}

export class SignalingClient {
    private ws: WebSocket | null = null;
    private cryptoKey: CryptoKey | null = null;
    private readonly rawKey: RoomKey;
    private roomId: string | null = null;
    private reconnectUsed = false;
    private intentionalClose = false;
    private readonly listeners: {
        [K in keyof SignalingEventMap]?: Set<Listener<K>>;
    } = {};
    private readonly opts: SignalingClientOptions;

    constructor(key: RoomKey, opts: SignalingClientOptions = {}) {
        this.rawKey = key;
        this.opts = opts;
    }

    async connect(roomId: string): Promise<void> {
        this.roomId = roomId;
        this.cryptoKey = this.rawKey instanceof Uint8Array
            ? await importRoomKey(this.rawKey)
            : this.rawKey;
        await this.openSocket();
    }

    async send(plaintext: string, to?: string): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error("signaling socket not open");
        }
        if (!this.cryptoKey) throw new Error("signaling not connected");

        const payload = await encrypt(this.cryptoKey, plaintext);
        const envelope: ClientEnvelope = { type: "message", payload };
        if (to) envelope.to = to;
        this.ws.send(JSON.stringify(envelope));
    }

    on<K extends keyof SignalingEventMap>(event: K, handler: Listener<K>): void {
        let set = this.listeners[event] as Set<Listener<K>> | undefined;
        if (!set) {
            set = new Set<Listener<K>>();
            (this.listeners as Record<string, Set<Listener<K>>>)[event] = set;
        }
        set.add(handler);
    }

    off<K extends keyof SignalingEventMap>(event: K, handler: Listener<K>): void {
        (this.listeners[event] as Set<Listener<K>> | undefined)?.delete(handler);
    }

    close(): void {
        this.intentionalClose = true;
        this.ws?.close();
        this.ws = null;
    }

    private emit<K extends keyof SignalingEventMap>(event: K, data: SignalingEventMap[K]): void {
        const set = this.listeners[event] as Set<Listener<K>> | undefined;
        if (!set) return;
        for (const h of set) {
            try { h(data); } catch { /* listener errors must not break the pipe */ }
        }
    }

    private async openSocket(): Promise<void> {
        if (!this.roomId) throw new Error("roomId not set");
        const url = buildWsUrl(this.opts, `/room/${encodeURIComponent(this.roomId)}`);
        const factory = this.opts.wsFactory ?? ((u: string) => new WebSocket(u));
        const ws = factory(url);
        this.ws = ws;
        this.intentionalClose = false;

        await new Promise<void>((resolve, reject) => {
            const onOpen = () => {
                ws.removeEventListener("error", onError);
                resolve();
            };
            const onError = () => {
                ws.removeEventListener("open", onOpen);
                reject(new Error("signaling socket failed to open"));
            };
            ws.addEventListener("open", onOpen, { once: true });
            ws.addEventListener("error", onError, { once: true });
        });

        ws.addEventListener("message", (ev) => this.handleMessage(ev));
        ws.addEventListener("close", () => this.handleClose());
        ws.addEventListener("error", () => {
            this.emit("error", { message: "websocket error" });
        });
    }

    private async handleMessage(ev: MessageEvent): Promise<void> {
        let env: ServerEnvelope;
        try {
            env = JSON.parse(typeof ev.data === "string" ? ev.data : "") as ServerEnvelope;
        } catch {
            this.emit("error", { message: "malformed server envelope" });
            return;
        }

        switch (env.type) {
            case "peer-joined":
                this.emit("peer-joined", { peerId: env.peerId });
                return;
            case "peer-left":
                this.emit("peer-left", { peerId: env.peerId });
                return;
            case "error":
                this.emit("error", { message: env.message });
                return;
            case "message": {
                if (!this.cryptoKey) return;
                try {
                    const plaintext = await decrypt(this.cryptoKey, env.payload);
                    this.emit("message", { from: env.from, plaintext });
                } catch {
                    this.emit("error", { message: "decrypt failed" });
                }
                return;
            }
        }
    }

    private async handleClose(): Promise<void> {
        if (this.intentionalClose) return;
        if (this.reconnectUsed) {
            this.emit("close", { reason: "reconnect exhausted" });
            return;
        }
        this.reconnectUsed = true;
        try {
            await this.openSocket();
        } catch (e) {
            this.emit("error", { message: e instanceof Error ? e.message : "reconnect failed" });
            this.emit("close", { reason: "reconnect failed" });
        }
    }
}

function buildHttpUrl(opts: SignalingClientOptions, path: string): string {
    const base = opts.baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
    const prefix = opts.apiPrefix ?? "/api/share";
    return `${base}${prefix}${path}`;
}

function buildWsUrl(opts: SignalingClientOptions, path: string): string {
    const prefix = opts.apiPrefix ?? "/api/share";
    if (opts.baseUrl) {
        return toWs(opts.baseUrl) + prefix + path;
    }
    if (typeof window === "undefined") {
        throw new Error("no baseUrl and no window");
    }
    return toWs(window.location.origin) + prefix + path;
}

function toWs(origin: string): string {
    if (origin.startsWith("https://")) return "wss://" + origin.slice("https://".length);
    if (origin.startsWith("http://")) return "ws://" + origin.slice("http://".length);
    return origin;
}
