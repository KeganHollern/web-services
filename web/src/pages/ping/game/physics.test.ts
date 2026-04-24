import { describe, expect, it } from "vitest";
import {
    BALL_SIZE,
    BALL_SPEED,
    GRAVITY,
    H,
    JUMP_VELOCITY,
    W,
} from "./constants";
import { applyPhysics, checkCollision, checkGameOver } from "./physics";
import { createInitialState } from "./state";
import type { Ball } from "./types";

function makeBall(): Ball {
    return {
        pos: { x: 0, y: 0 },
        vel: { x: 0, y: 0 },
        size: { w: BALL_SIZE, h: BALL_SIZE },
    };
}

describe("applyPhysics", () => {
    it("matches closed-form gravity answer after 1s at rest", () => {
        const ball = makeBall();
        ball.pos.y = 100;
        ball.vel.y = 0;

        applyPhysics(ball, 1);

        // y = y0 + v0*dt + 0.5*G*dt² = 100 + 0 + 2000 = 2100
        expect(ball.pos.y).toBeCloseTo(100 + 0.5 * GRAVITY * 1 * 1);
        // v = v0 + G*dt = 0 + 4000 = 4000
        expect(ball.vel.y).toBeCloseTo(GRAVITY);
    });

    it("integrates horizontal motion linearly", () => {
        const ball = makeBall();
        ball.pos.x = 500;
        ball.vel.x = BALL_SPEED;

        applyPhysics(ball, 0.5);

        expect(ball.pos.x).toBeCloseTo(500 + BALL_SPEED * 0.5);
    });

    it("applies a jump impulse as negative y velocity", () => {
        const ball = makeBall();
        ball.vel.y = JUMP_VELOCITY;

        expect(ball.vel.y).toBeLessThan(0);
        expect(ball.vel.y).toBe(-1500);

        // After a short step, it should still be moving up (gravity hasn't overcome the impulse).
        applyPhysics(ball, 0.1);
        expect(ball.vel.y).toBeLessThan(0);
        // New v = -1500 + 4000*0.1 = -1100
        expect(ball.vel.y).toBeCloseTo(JUMP_VELOCITY + GRAVITY * 0.1);
    });
});

describe("checkCollision", () => {
    it("returns true when the ball overlaps the paddle it is heading toward (right)", () => {
        const state = createInitialState(0);
        // Ball heading right, positioned overlapping right paddle.
        state.ball.vel.x = BALL_SPEED;
        state.ball.pos.x = state.rightPaddle.pos.x - state.ball.size.w + 1;
        state.ball.pos.y = state.rightPaddle.pos.y + 10;

        expect(checkCollision(state)).toBe(true);
    });

    it("returns true when the ball overlaps the paddle it is heading toward (left)", () => {
        const state = createInitialState(0);
        state.ball.vel.x = -BALL_SPEED;
        state.ball.pos.x = state.leftPaddle.pos.x + state.leftPaddle.size.w - 1;
        state.ball.pos.y = state.leftPaddle.pos.y + 10;

        expect(checkCollision(state)).toBe(true);
    });

    it("returns false when the ball is nowhere near a paddle", () => {
        const state = createInitialState(0);
        state.ball.vel.x = BALL_SPEED;
        state.ball.pos.x = W / 2;
        state.ball.pos.y = H / 2;

        expect(checkCollision(state)).toBe(false);
    });

    it("checks the left paddle when vel.x is negative, ignoring the right paddle", () => {
        const state = createInitialState(0);
        // Ball overlapping the RIGHT paddle but heading LEFT — should check LEFT paddle, which is far away.
        state.ball.vel.x = -BALL_SPEED;
        state.ball.pos.x = state.rightPaddle.pos.x - state.ball.size.w + 1;
        state.ball.pos.y = state.rightPaddle.pos.y + 10;

        expect(checkCollision(state)).toBe(false);
    });

    it("checks the right paddle when vel.x is positive, ignoring the left paddle", () => {
        const state = createInitialState(0);
        // Ball overlapping the LEFT paddle but heading RIGHT — should check RIGHT paddle, which is far away.
        state.ball.vel.x = BALL_SPEED;
        state.ball.pos.x = state.leftPaddle.pos.x + state.leftPaddle.size.w - 1;
        state.ball.pos.y = state.leftPaddle.pos.y + 10;

        expect(checkCollision(state)).toBe(false);
    });
});

describe("checkGameOver", () => {
    it("is false when the ball is inside the play area", () => {
        const state = createInitialState(0);
        expect(checkGameOver(state)).toBe(false);
    });

    it("is true when the ball crosses the left edge", () => {
        const state = createInitialState(0);
        state.ball.pos.x = -1;
        expect(checkGameOver(state)).toBe(true);
    });

    it("is true when the ball crosses the right edge", () => {
        const state = createInitialState(0);
        state.ball.pos.x = W + 1;
        expect(checkGameOver(state)).toBe(true);
    });

    it("is true when the ball falls below the bottom edge", () => {
        const state = createInitialState(0);
        state.ball.pos.y = H + 1;
        expect(checkGameOver(state)).toBe(true);
    });

    it("is false when the ball is above the top edge (no ceiling game-over)", () => {
        const state = createInitialState(0);
        state.ball.pos.y = -500;
        expect(checkGameOver(state)).toBe(false);
    });
});
