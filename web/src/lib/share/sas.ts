// Short Authentication String verification.
//
// Both peers independently hash their two DTLS fingerprints and map the digest
// into a 5-emoji sequence. If an attacker is MITMing the DTLS handshake, the
// fingerprints the two peers see will differ, so their emoji sequences will
// differ. Reading the sequence aloud over a voice/video channel confirms
// end-to-end authenticity.
//
// The derivation is symmetric: sorting the two fingerprints lexicographically
// before hashing ensures both peers compute the same sequence regardless of
// which side is sharer vs viewer.

import type { DataChannelHandle } from "./rtc";

// 256 visually distinct emojis. One byte of SHA-256 indexes one emoji. The
// set is curated from food, animals, plants, weather, buildings, transport,
// and celebration categories — all with default emoji presentation, so no
// variation selectors are needed. Inspired by Magic Wormhole's and Signal's
// SAS vocabularies.
export const SAS_ALPHABET: readonly string[] = [
    "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝",
    "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶", "🫑", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🫘", "🫒",
    "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔",
    "🍟", "🍕", "🥪", "🥙", "🌮", "🌯", "🫔", "🥗", "🫕", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟",
    "🍚", "🍘", "🍥", "🥠", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬",
    "🍫", "🍯", "🥛", "🫗", "🍵", "🍺", "🍻", "🥂", "🍷", "🍸", "🍹", "🥃", "🥤", "🧋", "🧃", "🧉",
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐺",
    "🐗", "🐴", "🦄", "🦒", "🐘", "🐫", "🐪", "🦏", "🦛", "🐃", "🐑", "🐐", "🦌", "🐒", "🐕", "🐈",
    "🐔", "🐧", "🐦", "🦆", "🦅", "🦉", "🦇", "🦢", "🦜", "🦩", "🐤", "🦃", "🦚", "🐓", "🐣", "🐥",
    "🐠", "🐟", "🐡", "🦈", "🐬", "🐳", "🐋", "🐊", "🐢", "🐍", "🦎", "🦂", "🦀", "🦐", "🦑", "🐙",
    "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🪲", "🦗", "🪰", "🪱", "🦟", "🪳", "🐚", "🦔", "🦓", "🦨",
    "🌵", "🌲", "🌳", "🌴", "🌱", "🌿", "🍀", "🎋", "🎍", "🍂", "🍁", "🌾", "💐", "🌷", "🌹", "🌺",
    "🌸", "🌻", "🌼", "🪷", "🥀", "🪴", "🌙", "🌟", "✨", "🔥", "💧", "🌊", "🌈", "🌞", "🌝", "🌀",
    "🏠", "🏡", "🏰", "🕌", "🏥", "🏫", "🏦", "🏪", "🏨", "⛪", "🗼", "🗽", "🗿", "🎡", "🎢", "🎠",
    "🚗", "🚕", "🚙", "🚌", "🚒", "🚑", "🚚", "🚜", "🛵", "🚲", "🛹", "🛫", "🚀", "🚁", "⛵", "🚢",
    "🎁", "🎈", "🎉", "🎊", "🏆", "🎯", "🎲", "🎸", "🎺", "🎻", "🎵", "🥁", "🎨", "📷", "📚", "🎤",
];

export const SAS_LENGTH = 5;

const SAS_MATCH_MSG = "sas:match";
const SAS_REJECT_MSG = "sas:reject";

function normalize(fingerprint: string): string {
    return fingerprint.trim().toLowerCase();
}

export async function deriveSas(
    localFingerprint: string,
    remoteFingerprint: string,
): Promise<string[]> {
    if (!localFingerprint || !remoteFingerprint) {
        throw new Error("both fingerprints required");
    }
    const a = normalize(localFingerprint);
    const b = normalize(remoteFingerprint);
    const [first, second] = a <= b ? [a, b] : [b, a];

    // Separator prevents "AB"+"CD" and "A"+"BCD" from colliding.
    const input = new TextEncoder().encode(`${first}\n${second}`);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));

    const out: string[] = [];
    for (let i = 0; i < SAS_LENGTH; i++) {
        out.push(SAS_ALPHABET[digest[i]]);
    }
    return out;
}

export type SasVerifyResult =
    | { ok: true }
    | { ok: false; reason: "local-rejected" | "remote-rejected" };

export interface SasExchange {
    confirm(): void;
    reject(): void;
    result: Promise<SasVerifyResult>;
}

// Coordinates a confirm/reject exchange over the DataChannel. The caller
// wires `confirm`/`reject` to the SAS UI buttons and awaits `result` before
// unblocking any media or application data. Both sides must confirm before
// `result` resolves with `ok: true`.
export function startSasExchange(channel: DataChannelHandle): SasExchange {
    let resolveLocal!: (v: boolean) => void;
    const localPromise = new Promise<boolean>((res) => {
        resolveLocal = res;
    });

    let resolveRemote!: (v: boolean) => void;
    const remotePromise = new Promise<boolean>((res) => {
        resolveRemote = res;
    });

    channel.onMessage((data) => {
        const text =
            typeof data === "string"
                ? data
                : new TextDecoder().decode(data);
        if (text === SAS_MATCH_MSG) resolveRemote(true);
        else if (text === SAS_REJECT_MSG) resolveRemote(false);
    });

    // Send the local decision as soon as it's made; don't block on the peer.
    void localPromise.then((v) => {
        channel.send(v ? SAS_MATCH_MSG : SAS_REJECT_MSG);
    });

    // Any rejection (local or remote) resolves immediately. Success requires
    // both sides to confirm.
    type Outcome = "ok" | "local-rejected" | "remote-rejected";
    const pending = <T>() => new Promise<T>(() => {});
    const localOutcome = localPromise.then<Outcome>((v) =>
        v ? pending<Outcome>() : "local-rejected",
    );
    const remoteOutcome = remotePromise.then<Outcome>((v) =>
        v ? pending<Outcome>() : "remote-rejected",
    );
    const bothConfirmed = Promise.all([localPromise, remotePromise]).then<Outcome>(
        ([l, r]) => (l && r ? "ok" : pending<Outcome>()),
    );

    const result = Promise.race([localOutcome, remoteOutcome, bothConfirmed]).then(
        (outcome): SasVerifyResult =>
            outcome === "ok" ? { ok: true } : { ok: false, reason: outcome },
    );

    let decided = false;
    const once = (v: boolean) => {
        if (decided) return;
        decided = true;
        resolveLocal(v);
    };

    return {
        confirm: () => once(true),
        reject: () => once(false),
        result,
    };
}
