import { H, W } from "./constants";
import type { GameState } from "./types";

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
    ctx.fillStyle = "rgb(100,100,100)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "white";
    ctx.fillRect(
        state.leftPaddle.pos.x,
        state.leftPaddle.pos.y,
        state.leftPaddle.size.w,
        state.leftPaddle.size.h,
    );
    ctx.fillRect(
        state.rightPaddle.pos.x,
        state.rightPaddle.pos.y,
        state.rightPaddle.size.w,
        state.rightPaddle.size.h,
    );
    ctx.fillRect(
        state.ball.pos.x,
        state.ball.pos.y,
        state.ball.size.w,
        state.ball.size.h,
    );

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "80px monospace";

    if (state.isPlaying) {
        ctx.fillText(`score: ${state.score}`, W / 2, H / 2 - 80);
    } else {
        ctx.fillText("click to jump", W / 2, H / 2 - 80);
        ctx.fillText(`best score: ${state.highscore}`, W / 2, H / 2 + 80);
    }
}
