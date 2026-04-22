// Short authentication string derived from both peers' DTLS fingerprints.
//
// Sorting before hashing means both sides compute the same value without
// having to agree on who is "A" and who is "B". A MITM would have to
// substitute both fingerprints with ones producing the same SAS — infeasible
// under SHA-256 at 24 bits of truncation for a human-compared code.

export async function computeSAS(fpA: string, fpB: string): Promise<string> {
    const [lo, hi] = [fpA.trim(), fpB.trim()].sort();
    const data = new TextEncoder().encode(`${lo}|${hi}`);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
    const n = (digest[0] << 16) | (digest[1] << 8) | digest[2];
    const code = (n % 1_000_000).toString().padStart(6, "0");
    return `${code.slice(0, 3)}-${code.slice(3)}`;
}
