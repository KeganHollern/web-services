import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { H, JUMP_VELOCITY, W } from "./game/constants";
import { animatePaddle, setPaddleAnimation } from "./game/animation";
import { applyPhysics, checkCollision, checkGameOver } from "./game/physics";
import { createInitialState, resetState } from "./game/state";
import { createLoop } from "./game/loop";
import { attachInput } from "./game/input";
import { loadHighscore, updateHighscore } from "./game/highscore";
import { play, preload, resume } from "./game/audio";

export function PingPage() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const state = createInitialState(loadHighscore());

        void preload();

        const applyLetterboxTransform = () => {
            const dpr = window.devicePixelRatio || 1;
            const cssWidth = window.innerWidth;
            const cssHeight = window.innerHeight;
            canvas.width = Math.round(cssWidth * dpr);
            canvas.height = Math.round(cssHeight * dpr);
            canvas.style.width = `${cssWidth}px`;
            canvas.style.height = `${cssHeight}px`;

            const scale = Math.min(cssWidth / W, cssHeight / H);
            const offsetX = (cssWidth - W * scale) / 2;
            const offsetY = (cssHeight - H * scale) / 2;

            // Paint letterbox bars black, then set the scaled transform so
            // game-coordinate drawing fills the play area.
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, cssWidth, cssHeight);
            ctx.setTransform(
                dpr * scale,
                0,
                0,
                dpr * scale,
                dpr * offsetX,
                dpr * offsetY,
            );
        };

        applyLetterboxTransform();
        window.addEventListener("resize", applyLetterboxTransform);
        window.addEventListener("orientationchange", applyLetterboxTransform);

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
            window.removeEventListener("resize", applyLetterboxTransform);
            window.removeEventListener("orientationchange", applyLetterboxTransform);
        };
    }, [navigate]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: "block",
                width: "100vw",
                height: "100vh",
                background: "#000",
                touchAction: "none",
            }}
        />
    );
}
