import { Maximize2, Minimize2, RotateCcw, Share2, Shuffle, Trophy, Undo2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Header } from "@/components/page-header";
import { PageMeta } from "@/components/page-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    bracketSummary,
    chunkPairs,
    COLUMNS,
    type Column,
    decodeState,
    encodeState,
    FINAL_ID,
    flagUrl,
    isLocked,
    RESULTS,
    simulateWinners,
    slotTeam,
    T,
    TOTAL_MATCHES,
    type Winners,
    withResults,
} from "./bracket";
import "./fifa.css";

const STORAGE_KEY = "wc2026-bracket-picks";
const FIT_MIN_WIDTH = 1024;
const LOCKED_COUNT = Object.keys(RESULTS).length;

function readHash(): Winners | null {
    if (typeof window === "undefined") return null;
    const m = /[#&?]b=([012]+)/.exec(window.location.hash);
    return m ? decodeState(m[1]) : null;
}

function loadInitial(): Winners {
    // Locked results (e.g. Canada beat South Africa) are always enforced on top.
    const fromUrl = readHash(); // a shared link wins over local storage
    if (fromUrl && Object.keys(fromUrl).length) return withResults(fromUrl);
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return withResults(raw ? JSON.parse(raw) : {});
    } catch {
        return withResults({});
    }
}

function persist(winners: Winners) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(winners));
    } catch { /* ignore quota/private-mode */ }
    // keep the URL hash in sync so the page is always shareable / refresh-safe
    try {
        const code = encodeState(winners);
        const base = window.location.pathname + window.location.search;
        const url = Object.keys(winners).length ? `${base}#b=${code}` : base;
        window.history.replaceState(null, "", url);
    } catch { /* ignore */ }
}

function ChampionBanner({ winners }: { winners: Winners }) {
    const champ = winners[FINAL_ID];
    if (!champ) return null;
    const team = T[champ];
    const fa = slotTeam(winners, FINAL_ID, "a");
    const fb = slotTeam(winners, FINAL_ID, "b");
    const runnerKey = champ === fa ? fb : fa;
    const runner = runnerKey ? T[runnerKey] : null;
    return (
        <div className="fifa-champion" role="status" aria-live="polite">
            <span className="fifa-c-trophy" aria-hidden>🏆</span>
            <div className="fifa-c-body">
                <div className="fifa-c-label">World Cup 2026 Champions</div>
                <div className="fifa-c-name">
                    <img src={flagUrl(team.c)} alt="" /> {team.n}
                </div>
                {runner && (
                    <div className="fifa-c-sub">
                        defeated <img src={flagUrl(runner.c)} alt="" /> {runner.n} in the final
                    </div>
                )}
            </div>
            <span className="fifa-c-trophy" aria-hidden>🏆</span>
        </div>
    );
}

export function FifaPage() {
    const [winners, setWinners] = useState<Winners>(loadInitial);
    const [undoStack, setUndoStack] = useState<string[]>([]);
    const [fitMode, setFitMode] = useState<boolean>(
        () => typeof window !== "undefined" && window.innerWidth >= FIT_MIN_WIDTH,
    );
    const [shareLabel, setShareLabel] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const bracketRef = useRef<HTMLDivElement>(null);
    const userSetFitRef = useRef(false);

    const breadcrumbs = [{ label: "lystic.dev/fifa" }];
    const champ = winners[FINAL_ID];
    const pickedCount = Object.keys(winners).length;

    useEffect(() => {
        persist(winners);
    }, [winners]);

    const commit = useCallback(
        (next: Winners) => {
            setUndoStack((s) => [...s, JSON.stringify(winners)].slice(-100));
            setWinners(withResults(next)); // locked results always enforced
        },
        [winners],
    );

    const pick = useCallback(
        (matchId: number, teamKey: string) => {
            if (isLocked(matchId)) return; // final results can't be changed
            if (winners[matchId] === teamKey) return;
            commit({ ...winners, [matchId]: teamKey });
        },
        [winners, commit],
    );

    const undo = useCallback(() => {
        if (!undoStack.length) return;
        const prev = undoStack[undoStack.length - 1];
        setUndoStack(undoStack.slice(0, -1));
        setWinners(withResults(JSON.parse(prev)));
    }, [undoStack]);

    const simulate = useCallback(() => commit(simulateWinners()), [commit]);
    // Reset clears user picks but keeps the locked results.
    const reset = useCallback(() => {
        if (pickedCount > LOCKED_COUNT) commit({ ...RESULTS });
    }, [commit, pickedCount]);

    const share = useCallback(() => {
        persist(winners);
        const text = `${bracketSummary(winners)}\n${window.location.href}`;
        const flash = (m: string) => {
            setShareLabel(m);
            window.setTimeout(() => setShareLabel(null), 1600);
        };
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(
                () => flash("Copied"),
                () => flash("Copy failed"),
            );
        } else {
            flash("Copy failed");
        }
    }, [winners]);

    const toggleFit = () => {
        userSetFitRef.current = true;
        setFitMode((f) => !f);
    };

    // Scale the bracket to fit the content area (like Ping's canvas), or let it
    // scroll at full size on narrow screens where fitting makes it unreadable.
    const applyFit = useCallback(() => {
        const scroll = scrollRef.current;
        const bracket = bracketRef.current;
        if (!scroll || !bracket) return;

        // The site's SidebarInset grows with content and page-scrolls, and the
        // bracket's min-height keeps a tall layout box even while transform-scaled.
        // Pin our <main> to the viewport (minus the page header) so the bracket
        // area is bounded and the page never scrolls into empty space.
        const main = scroll.parentElement;
        if (main) {
            const header = main.previousElementSibling as HTMLElement | null;
            const headerH = header ? Math.round(header.getBoundingClientRect().height) : 56;
            // flex-1 would let the flex algorithm override an explicit height, so
            // pin it to a fixed box instead.
            main.style.flex = "0 0 auto";
            main.style.height = `calc(100svh - ${headerH}px)`;
        }

        bracket.style.transform = "";
        bracket.style.marginLeft = "";
        bracket.style.marginTop = "";
        if (!fitMode) {
            scroll.style.overflow = "auto";
            return;
        }
        const nw = bracket.offsetWidth;
        const nh = bracket.offsetHeight;
        const cs = getComputedStyle(scroll);
        const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
        const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        const availW = scroll.clientWidth - padX;
        const availH = scroll.clientHeight - padY;
        if (availW <= 0 || availH <= 0 || nw <= 0) return;
        const scale = Math.min(availW / nw, availH / nh, 1.35);
        bracket.style.transformOrigin = "top left";
        bracket.style.transform = `scale(${scale})`;
        // center horizontally, but sit near the top so the embedded page doesn't
        // open with a big empty gap under the controls
        bracket.style.marginLeft = `${Math.max(0, (availW - nw * scale) / 2)}px`;
        bracket.style.marginTop = "0px";
        scroll.style.overflow = "hidden";
    }, [fitMode]);

    useLayoutEffect(() => {
        applyFit();
        const scroll = scrollRef.current;
        if (!scroll) return;
        const ro = new ResizeObserver(() => applyFit());
        ro.observe(scroll);
        return () => ro.disconnect();
    }, [applyFit]);

    // re-fit when the champion banner toggles (changes the area above the bracket)
    useLayoutEffect(() => {
        applyFit();
    }, [champ, applyFit]);

    // follow the breakpoint on resize until the user manually picks a mode
    useEffect(() => {
        const onResize = () => {
            if (userSetFitRef.current) return;
            const want = window.innerWidth >= FIT_MIN_WIDTH;
            setFitMode((prev) => (prev === want ? prev : want));
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const renderSlot = (matchId: number, slot: "a" | "b") => {
        const teamKey = slotTeam(winners, matchId, slot);
        const decided = winners[matchId] != null;
        if (!teamKey) {
            return (
                <div className="fifa-slot fifa-empty" aria-hidden key={slot}>
                    <span className="fifa-flag ph" />
                    <span className="fifa-name">TBD</span>
                </div>
            );
        }
        const team = T[teamKey];
        const isWinner = winners[matchId] === teamKey;
        const locked = isLocked(matchId);
        const cls = ["fifa-slot"];
        if (decided) cls.push("decided");
        if (isWinner) cls.push("winner");
        else if (decided) cls.push("loser");
        if (champ && isWinner && teamKey === champ) cls.push("champ-path");
        if (locked) cls.push("locked");
        const content = (
            <>
                <img
                    className="fifa-flag"
                    loading="lazy"
                    src={flagUrl(team.c)}
                    srcSet={`${flagUrl(team.c, "w80")} 2x`}
                    alt=""
                />
                <span className="fifa-name">{team.n}</span>
            </>
        );
        if (locked) {
            // a real, played result — shown but not changeable
            return (
                <div
                    key={slot}
                    className={cls.join(" ")}
                    title="Final result — locked"
                    aria-label={(isWinner ? "Winner: " : "") + team.n + (isWinner ? " (final result)" : "")}
                >
                    {content}
                </div>
            );
        }
        return (
            <button
                key={slot}
                type="button"
                className={cls.join(" ")}
                aria-pressed={isWinner}
                aria-label={(isWinner ? "Winner: " : "Pick ") + team.n}
                onClick={() => pick(matchId, teamKey)}
            >
                {content}
            </button>
        );
    };

    const renderMatch = (matchId: number) => {
        const pending = !slotTeam(winners, matchId, "a") && !slotTeam(winners, matchId, "b");
        const locked = isLocked(matchId);
        return (
            <div
                className={`fifa-match${pending ? " pending" : ""}${locked ? " locked" : ""}`}
                key={matchId}
            >
                {renderSlot(matchId, "a")}
                {renderSlot(matchId, "b")}
                <span className="fifa-match-no">{locked ? "FT" : `M${matchId}`}</span>
            </div>
        );
    };

    const renderColumn = (col: Column, i: number) => (
        <section className={`fifa-col ${col.side}`} key={i}>
            <div className="fifa-col-title">{col.title}</div>
            <div className="fifa-col-body">
                {col.ids.length === 1 ? (
                    <div className="fifa-pair solo">{renderMatch(col.ids[0])}</div>
                ) : (
                    chunkPairs(col.ids).map((g, gi) => (
                        <div className="fifa-pair" key={gi}>
                            {g.map(renderMatch)}
                        </div>
                    ))
                )}
            </div>
        </section>
    );

    return (
        <>
            <PageMeta
                title="FIFA Bracket — World Cup 2026 results"
                description="See the completed World Cup 2026 knockout bracket and Spain's championship run."
            />
            <Header breadcrumbItems={breadcrumbs} />
            <main className="fifa flex flex-1 flex-col overflow-hidden">
                <div className="fifa-topbar">
                    <div className="fifa-title">
                        <Trophy className="fifa-title-icon" aria-hidden />
                        <span>
                            World Cup <span className="fifa-year">2026</span> Bracket
                        </span>
                    </div>
                    <div className="fifa-controls">
                        <Badge
                            variant="outline"
                            className={`fifa-progress${pickedCount === TOTAL_MATCHES ? " complete" : ""}`}
                        >
                            {LOCKED_COUNT === TOTAL_MATCHES
                                ? "Tournament complete"
                                : `${pickedCount} / ${TOTAL_MATCHES} picked`}
                        </Badge>
                        <Button
                            variant={fitMode ? "secondary" : "outline"}
                            size="sm"
                            onClick={toggleFit}
                            aria-pressed={fitMode}
                        >
                            {fitMode ? <Minimize2 /> : <Maximize2 />}
                            {fitMode ? "Fit" : "Full size"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={simulate}
                            disabled={LOCKED_COUNT === TOTAL_MATCHES}
                        >
                            <Shuffle /> Simulate
                        </Button>
                        <Button variant="outline" size="sm" onClick={undo} disabled={!undoStack.length}>
                            <Undo2 /> Undo
                        </Button>
                        <Button variant="outline" size="sm" onClick={reset} disabled={pickedCount <= LOCKED_COUNT}>
                            <RotateCcw /> Reset
                        </Button>
                        <Button variant="default" size="sm" onClick={share}>
                            <Share2 /> {shareLabel ?? "Share"}
                        </Button>
                    </div>
                </div>

                <ChampionBanner winners={winners} />

                <div ref={scrollRef} className="fifa-scroll flex-1 min-h-0">
                    <div ref={bracketRef} className="fifa-bracket">
                        {COLUMNS.map(renderColumn)}
                    </div>
                </div>

                {!fitMode && (
                    <div className="fifa-hint">Scroll to explore the full bracket →</div>
                )}
            </main>
        </>
    );
}
