import { render } from "./renderer";
import type { GameState } from "./types";

const MAX_DT = 1 / 30;

export interface LoopHandle {
    start: () => void;
    stop: () => void;
}

export function createLoop(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    update: (dt: number) => void,
): LoopHandle {
    let rafId = 0;
    let lastTimeMs = 0;
    let running = false;

    const tick = (nowMs: number) => {
        if (!running) return;
        let dt = lastTimeMs === 0 ? 0 : (nowMs - lastTimeMs) / 1000;
        if (dt > MAX_DT) dt = MAX_DT;
        lastTimeMs = nowMs;

        update(dt);
        render(ctx, state);

        rafId = requestAnimationFrame(tick);
    };

    return {
        start() {
            if (running) return;
            running = true;
            lastTimeMs = 0;
            rafId = requestAnimationFrame(tick);
        },
        stop() {
            running = false;
            if (rafId !== 0) cancelAnimationFrame(rafId);
            rafId = 0;
        },
    };
}
