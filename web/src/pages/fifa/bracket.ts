/* ===========================================================
   World Cup 2026 — Knockout Bracket: pure data + logic.
   No DOM / React here so it stays trivially testable and the
   share codec can decode into a scratch map before it goes live.
   Bracket verified against the official Round of 32 draw.
   =========================================================== */

export type Team = { n: string; c: string };
export type SlotKey = "a" | "b";
export type SlotRef = { t: string } | { from: number };
export type Match = { a: SlotRef; b: SlotRef };
export type Winners = Record<number, string>;
export type Side = "left" | "center" | "right";
export type Column = { side: Side; title: string; ids: number[] };

// Teams: ISO 3166-1 alpha-2 codes drive flag images from flagcdn.com.
export const T: Record<string, Team> = {
  ZA: { n: "South Africa", c: "za" }, CA: { n: "Canada", c: "ca" },
  DE: { n: "Germany", c: "de" }, PY: { n: "Paraguay", c: "py" },
  NL: { n: "Netherlands", c: "nl" }, MA: { n: "Morocco", c: "ma" },
  BR: { n: "Brazil", c: "br" }, JP: { n: "Japan", c: "jp" },
  FR: { n: "France", c: "fr" }, SE: { n: "Sweden", c: "se" },
  CI: { n: "Ivory Coast", c: "ci" }, NO: { n: "Norway", c: "no" },
  MX: { n: "Mexico", c: "mx" }, EC: { n: "Ecuador", c: "ec" },
  EN: { n: "England", c: "gb-eng" }, CD: { n: "DR Congo", c: "cd" },
  US: { n: "United States", c: "us" }, BA: { n: "Bosnia & Herz.", c: "ba" },
  BE: { n: "Belgium", c: "be" }, SN: { n: "Senegal", c: "sn" },
  ES: { n: "Spain", c: "es" }, AT: { n: "Austria", c: "at" },
  PT: { n: "Portugal", c: "pt" }, HR: { n: "Croatia", c: "hr" },
  CH: { n: "Switzerland", c: "ch" }, DZ: { n: "Algeria", c: "dz" },
  AR: { n: "Argentina", c: "ar" }, CV: { n: "Cape Verde", c: "cv" },
  CO: { n: "Colombia", c: "co" }, GH: { n: "Ghana", c: "gh" },
  AU: { n: "Australia", c: "au" }, EG: { n: "Egypt", c: "eg" },
};

// Each match: a/b slots are either a fixed team {t} (Round of 32)
// or fed by the winner of an earlier match {from}.
export const MATCHES: Record<number, Match> = {
  // Round of 32
  73: { a: { t: "ZA" }, b: { t: "CA" } },
  74: { a: { t: "DE" }, b: { t: "PY" } },
  75: { a: { t: "NL" }, b: { t: "MA" } },
  76: { a: { t: "BR" }, b: { t: "JP" } },
  77: { a: { t: "FR" }, b: { t: "SE" } },
  78: { a: { t: "CI" }, b: { t: "NO" } },
  79: { a: { t: "MX" }, b: { t: "EC" } },
  80: { a: { t: "EN" }, b: { t: "CD" } },
  81: { a: { t: "US" }, b: { t: "BA" } },
  82: { a: { t: "BE" }, b: { t: "SN" } },
  83: { a: { t: "ES" }, b: { t: "AT" } },
  84: { a: { t: "PT" }, b: { t: "HR" } },
  85: { a: { t: "CH" }, b: { t: "DZ" } },
  86: { a: { t: "AR" }, b: { t: "CV" } },
  87: { a: { t: "CO" }, b: { t: "GH" } },
  88: { a: { t: "AU" }, b: { t: "EG" } },
  // Round of 16
  89: { a: { from: 74 }, b: { from: 77 } },
  90: { a: { from: 73 }, b: { from: 75 } },
  91: { a: { from: 76 }, b: { from: 78 } },
  92: { a: { from: 79 }, b: { from: 80 } },
  93: { a: { from: 83 }, b: { from: 84 } },
  94: { a: { from: 81 }, b: { from: 82 } },
  95: { a: { from: 86 }, b: { from: 88 } },
  96: { a: { from: 85 }, b: { from: 87 } },
  // Quarter-finals
  97: { a: { from: 89 }, b: { from: 90 } },
  98: { a: { from: 93 }, b: { from: 94 } },
  99: { a: { from: 91 }, b: { from: 92 } },
  100: { a: { from: 95 }, b: { from: 96 } },
  // Semi-finals
  101: { a: { from: 97 }, b: { from: 98 } },
  102: { a: { from: 99 }, b: { from: 100 } },
  // Final
  104: { a: { from: 101 }, b: { from: 102 } },
};

export const FINAL_ID = 104;

// Visual column layout (left half → final → right half, mirrored).
export const COLUMNS: Column[] = [
  { side: "left", title: "Round of 32", ids: [74, 77, 73, 75, 83, 84, 81, 82] },
  { side: "left", title: "Round of 16", ids: [89, 90, 93, 94] },
  { side: "left", title: "Quarter-finals", ids: [97, 98] },
  { side: "left", title: "Semi-finals", ids: [101] },
  { side: "center", title: "Final", ids: [104] },
  { side: "right", title: "Semi-finals", ids: [102] },
  { side: "right", title: "Quarter-finals", ids: [99, 100] },
  { side: "right", title: "Round of 16", ids: [91, 92, 95, 96] },
  { side: "right", title: "Round of 32", ids: [76, 78, 79, 80, 86, 88, 85, 87] },
];

// Stable dependency order (feeders before the matches they feed) — used for
// both simulate and the share-link codec.
export const ORDERED_IDS = Object.keys(MATCHES).map(Number).sort((a, b) => a - b);
export const TOTAL_MATCHES = ORDERED_IDS.length; // 31

// Actual played results — pre-filled and locked (cannot be changed). These are
// always enforced over saved/shared/simulated state.
export const RESULTS: Winners = {
  73: "CA", // Canada beat South Africa
  74: "PY", // Paraguay beat Germany
  75: "MA", // Morocco beat Netherlands
  76: "BR", // Brazil beat Japan
};
export function isLocked(matchId: number): boolean {
  return Object.prototype.hasOwnProperty.call(RESULTS, matchId);
}
// Apply locked results on top of a winners map, then reconcile.
export function withResults(winners: Winners): Winners {
  return reconcile({ ...winners, ...RESULTS });
}

export function flagUrl(code: string, size: "w40" | "w80" = "w40"): string {
  return `https://flagcdn.com/${size}/${code}.png`;
}

// Resolve a slot's team against an arbitrary winners map.
export function slotTeam(winners: Winners, matchId: number, slot: SlotKey): string | null {
  const s = MATCHES[matchId][slot];
  if ("t" in s) return s.t;        // fixed Round-of-32 team
  return winners[s.from] ?? null;  // winner of a feeder match (may be null)
}

// Return a copy with any now-invalid winner removed, cascading downstream
// until the state is consistent.
export function reconcile(winners: Winners): Winners {
  const w: Winners = { ...winners };
  let changed = true;
  while (changed) {
    changed = false;
    for (const key of Object.keys(w)) {
      const id = Number(key);
      const a = slotTeam(w, id, "a");
      const b = slotTeam(w, id, "b");
      if (w[id] !== a && w[id] !== b) {
        delete w[id];
        changed = true;
      }
    }
  }
  return w;
}

/* ---------- Share codec ----------
   One char per match in ORDERED_IDS: '0' none, '1' slot A, '2' slot B. */
export function encodeState(winners: Winners): string {
  return ORDERED_IDS.map((id) => {
    if (winners[id] === slotTeam(winners, id, "a")) return "1";
    if (winners[id] === slotTeam(winners, id, "b")) return "2";
    return "0";
  }).join("");
}

export function decodeState(str: string | null | undefined): Winners {
  const w: Winners = {};
  if (!str || str.length !== ORDERED_IDS.length) return w;
  ORDERED_IDS.forEach((id, i) => {
    const v = str[i];
    const slot: SlotKey | null = v === "1" ? "a" : v === "2" ? "b" : null;
    if (!slot) return;
    const t = slotTeam(w, id, slot); // upstream already filled (dep order)
    if (t) w[id] = t;
  });
  return w;
}

// Random fill of every match, respecting dependency order and locked results.
export function simulateWinners(): Winners {
  const w: Winners = { ...RESULTS };
  for (const id of ORDERED_IDS) {
    if (w[id]) continue; // keep locked results
    const a = slotTeam(w, id, "a");
    const b = slotTeam(w, id, "b");
    if (a && b) w[id] = Math.random() < 0.5 ? a : b;
  }
  return w;
}

// Short, paste-friendly recap so a shared link isn't opaque in a chat.
export function bracketSummary(winners: Winners): string {
  const champ = winners[FINAL_ID];
  if (champ) {
    const fa = slotTeam(winners, FINAL_ID, "a");
    const fb = slotTeam(winners, FINAL_ID, "b");
    const runnerKey = champ === fa ? fb : fa;
    const tail = runnerKey ? ` (beat ${T[runnerKey].n} in the final)` : "";
    return `🏆 My World Cup 2026 bracket — Champion: ${T[champ].n}${tail}`;
  }
  return `My World Cup 2026 bracket — ${Object.keys(winners).length}/${TOTAL_MATCHES} picked`;
}

export function chunkPairs(ids: number[]): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < ids.length; i += 2) out.push(ids.slice(i, i + 2));
  return out;
}
