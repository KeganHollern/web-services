import { GRAVITY, H, W } from "./constants";
import type { Ball, GameState, Paddle } from "./types";

export function applyPhysics(ball: Ball, dt: number): void {
    const dy = ball.vel.y * dt + 0.5 * GRAVITY * dt * dt;
    ball.pos.y += dy;
    ball.pos.x += ball.vel.x * dt;
    ball.vel.y = ball.vel.y + GRAVITY * dt;
}

function aabb(ball: Ball, paddle: Paddle): boolean {
    return (
        ball.pos.x < paddle.pos.x + paddle.size.w &&
        ball.pos.x + ball.size.w > paddle.pos.x &&
        ball.pos.y < paddle.pos.y + paddle.size.h &&
        ball.pos.y + ball.size.h > paddle.pos.y
    );
}

export function checkCollision(state: GameState): boolean {
    const paddle = state.ball.vel.x < 0 ? state.leftPaddle : state.rightPaddle;
    return aabb(state.ball, paddle);
}

export function checkGameOver(state: GameState): boolean {
    return (
        state.ball.pos.x < 0 ||
        state.ball.pos.x > W ||
        state.ball.pos.y > H
    );
}
