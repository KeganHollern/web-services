import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

import { Header } from "@/components/page-header";

import { H, JUMP_VELOCITY, W } from "./game/constants";
import { animatePaddle, setPaddleAnimation } from "./game/animation";
import { applyPhysics, checkCollision, checkGameOver } from "./game/physics";
import { createInitialState, resetState } from "./game/state";
import { createLoop } from "./game/loop";
import { attachInput } from "./game/input";
import { loadHighscore, updateHighscore } from "./game/highscore";
import { play, preload, resume } from "./game/audio";

export function PingPage() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const navigate = useNavigate();

    const breadcrumbs = [{ label: "ping.lystic.dev" }];

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const state = createInitialState(loadHighscore());

        void preload();

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            const availW = Math.max(1, Math.floor(rect.width));
            const availH = Math.max(1, Math.floor(rect.height));

            // Largest 16:9 (W:H) box that fits inside the container.
            const fit = Math.min(availW / W, availH / H);
            const cssWidth = Math.max(1, Math.floor(W * fit));
            const cssHeight = Math.max(1, Math.floor(H * fit));

            canvas.style.width = `${cssWidth}px`;
            canvas.style.height = `${cssHeight}px`;
            canvas.width = Math.round(cssWidth * dpr);
            canvas.height = Math.round(cssHeight * dpr);

            // Scale game-coordinate drawing to fill the canvas exactly.
            const scale = cssWidth / W;
            ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
        };

        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);

        const update = (dt: number) => {
            if (!state.isPlaying) return;

            applyPhysics(state.ball, dt);

            const now = performance.now() / 1000;
            animatePaddle(state.leftPaddle, now);
            animatePaddle(state.rightPaddle, now);

            if (checkCollision(state)) {
                const hitPaddle =
                    state.ball.vel.x > 0 ? state.rightPaddle : state.leftPaddle;
                state.ball.vel.x = -state.ball.vel.x;
                state.score += 1;
                setPaddleAnimation(hitPaddle, now);
                play("wallhit");
            }

            if (checkGameOver(state)) {
                play("explosion");
                const best = updateHighscore(state.score);
                resetState(state, best);
            }
        };

        const loop = createLoop(ctx, state, update);
        loop.start();

        const detachInput = attachInput(
            canvas,
            () => {
                resume();
                if (!state.isPlaying) state.isPlaying = true;
                state.ball.vel.y = JUMP_VELOCITY;
                play("jump");
            },
            () => navigate("/"),
        );

        return () => {
            loop.stop();
            detachInput();
            resizeObserver.disconnect();
        };
    }, [navigate]);

    return (
        <>
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div
                    ref={containerRef}
                    className="flex-1 flex justify-center items-center w-full p-4 min-h-0 min-w-0"
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            display: "block",
                            background: "#000",
                            touchAction: "none",
                        }}
                    />
                </div>
            </main>
        </>
    );
}
