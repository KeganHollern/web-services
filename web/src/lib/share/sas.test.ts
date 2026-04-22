import { describe, expect, it } from "vitest";
import { SAS_ALPHABET, SAS_LENGTH, deriveSas, startSasExchange } from "./sas";
import type { DataChannelHandle } from "./rtc";

const FP_A = "sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99";
const FP_B = "sha-256 11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00";

describe("SAS_ALPHABET", () => {
    it("contains exactly 256 entries", () => {
        expect(SAS_ALPHABET.length).toBe(256);
    });

    it("has no duplicate entries", () => {
        expect(new Set(SAS_ALPHABET).size).toBe(256);
    });

    it("is all non-empty strings", () => {
        for (const emoji of SAS_ALPHABET) {
            expect(typeof emoji).toBe("string");
            expect(emoji.length).toBeGreaterThan(0);
        }
    });
});

describe("deriveSas", () => {
    it("returns exactly 5 emojis drawn from the alphabet", async () => {
        const sas = await deriveSas(FP_A, FP_B);
        expect(sas.length).toBe(SAS_LENGTH);
        for (const e of sas) {
            expect(SAS_ALPHABET).toContain(e);
        }
    });

    it("is deterministic: same inputs produce the same output", async () => {
        const a = await deriveSas(FP_A, FP_B);
        const b = await deriveSas(FP_A, FP_B);
        expect(a).toEqual(b);
    });

    it("is symmetric: swapping local/remote produces identical output", async () => {
        const ab = await deriveSas(FP_A, FP_B);
        const ba = await deriveSas(FP_B, FP_A);
        expect(ab).toEqual(ba);
    });

    it("normalizes case and whitespace", async () => {
        const plain = await deriveSas(FP_A, FP_B);
        const scuffed = await deriveSas(
            `  ${FP_A.toLowerCase()}  `,
            FP_B.toUpperCase(),
        );
        expect(scuffed).toEqual(plain);
    });

    it("differing fingerprints produce different output with high probability", async () => {
        // Generate N random fingerprint pairs; count how many collide with a
        // fixed baseline. Per-pair collision probability across 5 bytes is
        // 256^-5 ≈ 1e-12, so any collision in a small sample is a bug.
        const baseline = await deriveSas(FP_A, FP_B);
        const baselineKey = baseline.join(",");

        const samples = 50;
        let collisions = 0;
        for (let i = 0; i < samples; i++) {
            const local = `sha-256 ${randomHex(32)}`;
            const remote = `sha-256 ${randomHex(32)}`;
            const sas = await deriveSas(local, remote);
            if (sas.join(",") === baselineKey) collisions++;
        }
        expect(collisions).toBe(0);
    });

    it("a one-bit flip in either fingerprint changes the output", async () => {
        const original = await deriveSas(FP_A, FP_B);
        const flipped = await deriveSas(FP_A.replace("AA", "AB"), FP_B);
        expect(flipped).not.toEqual(original);
    });

    it("rejects empty fingerprints", async () => {
        await expect(deriveSas("", FP_B)).rejects.toThrow();
        await expect(deriveSas(FP_A, "")).rejects.toThrow();
    });
});

function randomHex(bytes: number): string {
    const buf = new Uint8Array(bytes);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0").toUpperCase())
        .reduce((acc, pair, i) => acc + (i === 0 ? "" : ":") + pair, "");
}

// Paired in-memory DataChannel stand-ins for exercising startSasExchange.
function pairedChannels(): { a: DataChannelHandle; b: DataChannelHandle } {
    const aListeners: Array<(d: string | ArrayBuffer) => void> = [];
    const bListeners: Array<(d: string | ArrayBuffer) => void> = [];
    const a: DataChannelHandle = {
        send: (data) => {
            for (const l of bListeners) l(data);
        },
        onMessage: (h) => aListeners.push(h),
        close: () => {},
    };
    const b: DataChannelHandle = {
        send: (data) => {
            for (const l of aListeners) l(data);
        },
        onMessage: (h) => bListeners.push(h),
        close: () => {},
    };
    return { a, b };
}

describe("startSasExchange", () => {
    it("resolves ok when both peers confirm", async () => {
        const { a, b } = pairedChannels();
        const ex1 = startSasExchange(a);
        const ex2 = startSasExchange(b);
        ex1.confirm();
        ex2.confirm();
        expect(await ex1.result).toEqual({ ok: true });
        expect(await ex2.result).toEqual({ ok: true });
    });

    it("reports local rejection without waiting on the peer", async () => {
        const { a, b } = pairedChannels();
        const ex1 = startSasExchange(a);
        const ex2 = startSasExchange(b);
        ex1.reject();
        // ex2 never decides; ex1 still resolves.
        expect(await ex1.result).toEqual({ ok: false, reason: "local-rejected" });
        expect(await ex2.result).toEqual({ ok: false, reason: "remote-rejected" });
    });

    it("reports remote rejection when the peer declines", async () => {
        const { a, b } = pairedChannels();
        const ex1 = startSasExchange(a);
        const ex2 = startSasExchange(b);
        ex2.reject();
        ex1.confirm();
        expect(await ex1.result).toEqual({ ok: false, reason: "remote-rejected" });
    });

    it("ignores duplicate confirm/reject after the first decision", async () => {
        const { a, b } = pairedChannels();
        const ex1 = startSasExchange(a);
        const ex2 = startSasExchange(b);
        ex1.confirm();
        ex1.reject(); // no-op after first call
        ex2.confirm();
        expect(await ex1.result).toEqual({ ok: true });
    });
});
