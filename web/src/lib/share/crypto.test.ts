import { describe, expect, it } from "vitest";
import {
    ROOM_KEY_BYTES,
    decrypt,
    encodeShareUrl,
    encrypt,
    generateRoomKey,
    parseShareUrl,
} from "./crypto";

describe("generateRoomKey", () => {
    it("returns a 32-byte Uint8Array", () => {
        const key = generateRoomKey();
        expect(key).toBeInstanceOf(Uint8Array);
        expect(key.length).toBe(ROOM_KEY_BYTES);
    });

    it("produces different keys on subsequent calls", () => {
        const a = generateRoomKey();
        const b = generateRoomKey();
        expect(a).not.toEqual(b);
    });
});

describe("encrypt/decrypt", () => {
    it("roundtrips plaintext", async () => {
        const key = generateRoomKey();
        const plaintext = "hello p2p screenshare \u{1F680}";
        const payload = await encrypt(key, plaintext);
        const out = await decrypt(key, payload);
        expect(out).toBe(plaintext);
    });

    it("produces a fresh nonce per call", async () => {
        const key = generateRoomKey();
        const a = await encrypt(key, "same plaintext");
        const b = await encrypt(key, "same plaintext");
        expect(a).not.toBe(b);
    });

    it("throws when ciphertext is tampered with", async () => {
        const key = generateRoomKey();
        const payload = await encrypt(key, "tamper me");

        // Flip one bit in the middle of the payload (past the nonce).
        const bin = atob(payload);
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        const idx = bytes.length - 1;
        bytes[idx] = bytes[idx] ^ 0x01;
        let s = "";
        for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
        const corrupted = btoa(s);

        await expect(decrypt(key, corrupted)).rejects.toThrow();
    });

    it("throws when the wrong key is used", async () => {
        const payload = await encrypt(generateRoomKey(), "secret");
        await expect(decrypt(generateRoomKey(), payload)).rejects.toThrow();
    });

    it("throws on a payload shorter than the nonce", async () => {
        const key = generateRoomKey();
        await expect(decrypt(key, btoa("short"))).rejects.toThrow();
    });
});

describe("encodeShareUrl / parseShareUrl", () => {
    it("roundtrips roomId and key", () => {
        const key = generateRoomKey();
        const url = encodeShareUrl("abc123", key);
        expect(url.startsWith("#abc123.")).toBe(true);
        const parsed = parseShareUrl(url);
        expect(parsed.roomId).toBe("abc123");
        expect(parsed.key).toEqual(key);
    });

    it("accepts the fragment without a leading #", () => {
        const key = generateRoomKey();
        const url = encodeShareUrl("room", key).slice(1);
        const parsed = parseShareUrl(url);
        expect(parsed.roomId).toBe("room");
        expect(parsed.key).toEqual(key);
    });

    it("throws when the fragment is missing entirely", () => {
        expect(() => parseShareUrl("")).toThrow(/missing share fragment/);
        expect(() => parseShareUrl("#")).toThrow(/missing share fragment/);
    });

    it("throws when the key is missing", () => {
        expect(() => parseShareUrl("#justroomid")).toThrow(/missing key/);
        expect(() => parseShareUrl("#roomid.")).toThrow(/missing key/);
    });

    it("throws when the roomId is missing", () => {
        expect(() => parseShareUrl("#.somekey")).toThrow(/missing roomId/);
    });

    it("throws on malformed base64url", () => {
        expect(() => parseShareUrl("#room.!!!not-base64!!!")).toThrow(/malformed base64url/);
    });

    it("throws when key decodes to wrong length", () => {
        // Three bytes encoded as base64url = "YWJj" (abc). Not 32 bytes.
        expect(() => parseShareUrl("#room.YWJj")).toThrow(/must decode to 32 bytes/);
    });

    it("rejects roomIds containing a dot during encode", () => {
        expect(() => encodeShareUrl("bad.id", generateRoomKey())).toThrow();
    });
});
