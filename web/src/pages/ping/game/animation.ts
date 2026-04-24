import { H, PADDLE_ANIM_DURATION, PADDLE_SHRINK_FACTOR } from "./constants";
import type { Paddle } from "./types";

export function setPaddleAnimation(paddle: Paddle, now: number): void {
    const newH = paddle.size.h * PADDLE_SHRINK_FACTOR;
    const maxY = Math.max(0, H - newH);
    const newY = Math.random() * maxY;

    paddle.anim.start_time = now;
    paddle.anim.start_y = paddle.pos.y;
    paddle.anim.end_y = newY;
    paddle.anim.start_h = paddle.size.h;
    paddle.anim.end_h = newH;
}

export function animatePaddle(paddle: Paddle, now: number): void {
    if (paddle.anim.start_time === 0) return;

    const elapsed = now - paddle.anim.start_time;
    const t = Math.max(0, Math.min(1, elapsed / PADDLE_ANIM_DURATION));

    paddle.pos.y = paddle.anim.start_y + (paddle.anim.end_y - paddle.anim.start_y) * t;
    paddle.size.h = paddle.anim.start_h + (paddle.anim.end_h - paddle.anim.start_h) * t;

    if (t >= 1) paddle.anim.start_time = 0;
}
