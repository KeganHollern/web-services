export const HIGHSCORE_KEY = "ping:highscore";

let memoryFallback = 0;

export function loadHighscore(): number {
    try {
        const raw = localStorage.getItem(HIGHSCORE_KEY);
        if (raw === null) return 0;
        const parsed = parseInt(raw, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
        return memoryFallback;
    }
}

export function updateHighscore(score: number): number {
    const current = loadHighscore();
    if (score <= current) return current;
    try {
        localStorage.setItem(HIGHSCORE_KEY, String(score));
    } catch {
        memoryFallback = score;
    }
    return score;
}
