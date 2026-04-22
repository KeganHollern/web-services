// Zero-knowledge crypto for P2P screen share.
//
// The room key is generated client-side, lives in the URL fragment, and is
// never sent to the server. All signaling payloads are AES-GCM sealed against
// this key before they cross the wire.

export const ROOM_KEY_BYTES = 32;
export const NONCE_BYTES = 12;

export type RoomKey = CryptoKey | Uint8Array;

export interface ParsedShareUrl {
    roomId: string;
    key: Uint8Array;
}

export function generateRoomKey(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(ROOM_KEY_BYTES));
}

export function encodeShareUrl(roomId: string, key: Uint8Array): string {
    if (!roomId) throw new Error("roomId required");
    if (roomId.includes(".")) throw new Error("roomId must not contain '.'");
    if (key.length !== ROOM_KEY_BYTES) {
        throw new Error(`key must be ${ROOM_KEY_BYTES} bytes`);
    }
    return `#${roomId}.${base64urlEncode(key)}`;
}

export function parseShareUrl(hash: string): ParsedShareUrl {
    if (typeof hash !== "string" || hash.length === 0) {
        throw new Error("missing share fragment");
    }
    const body = hash.startsWith("#") ? hash.slice(1) : hash;
    if (body.length === 0) throw new Error("missing share fragment");

    const dot = body.indexOf(".");
    if (dot < 0) throw new Error("missing key");
    const roomId = body.slice(0, dot);
    const rawKey = body.slice(dot + 1);
    if (!roomId) throw new Error("missing roomId");
    if (!rawKey) throw new Error("missing key");

    const key = base64urlDecode(rawKey);
    if (key.length !== ROOM_KEY_BYTES) {
        throw new Error(`key must decode to ${ROOM_KEY_BYTES} bytes`);
    }
    return { roomId, key };
}

export async function encrypt(key: RoomKey, plaintext: string): Promise<string> {
    const cryptoKey = await resolveKey(key);
    const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
    const sealed = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: nonce },
            cryptoKey,
            new TextEncoder().encode(plaintext),
        ),
    );

    const combined = new Uint8Array(nonce.length + sealed.length);
    combined.set(nonce);
    combined.set(sealed, nonce.length);
    return base64Encode(combined);
}

export async function decrypt(key: RoomKey, payload: string): Promise<string> {
    const combined = base64Decode(payload);
    if (combined.length <= NONCE_BYTES) {
        throw new Error("payload too short");
    }
    const nonce = combined.subarray(0, NONCE_BYTES);
    const sealed = combined.subarray(NONCE_BYTES);

    const cryptoKey = await resolveKey(key);
    const opened = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: nonce },
        cryptoKey,
        sealed,
    );
    return new TextDecoder().decode(opened);
}

export async function importRoomKey(raw: Uint8Array): Promise<CryptoKey> {
    if (raw.length !== ROOM_KEY_BYTES) {
        throw new Error(`key must be ${ROOM_KEY_BYTES} bytes`);
    }
    return crypto.subtle.importKey(
        "raw",
        raw,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"],
    );
}

async function resolveKey(key: RoomKey): Promise<CryptoKey> {
    if (key instanceof Uint8Array) return importRoomKey(key);
    return key;
}

function base64Encode(bytes: Uint8Array): string {
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
}

function base64Decode(s: string): Uint8Array {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) {
        throw new Error("malformed base64");
    }
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

function base64urlEncode(bytes: Uint8Array): string {
    return base64Encode(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(s: string): Uint8Array {
    if (!/^[A-Za-z0-9\-_]+$/.test(s)) {
        throw new Error("malformed base64url");
    }
    const pad = (4 - (s.length % 4)) % 4;
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
    return base64Decode(b64);
}
