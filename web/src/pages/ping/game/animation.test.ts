import { describe, expect, it } from "vitest";
import { animatePaddle, setPaddleAnimation } from "./animation";
import {
    H,
    PADDLE_ANIM_DURATION,
    PADDLE_HEIGHT,
    PADDLE_SHRINK_FACTOR,
    PADDLE_WIDTH,
} from "./constants";
import type { Paddle } from "./types";

function makePaddle(y: number, h: number): Paddle {
    return {
        pos: { x: 20, y },
        size: { w: PADDLE_WIDTH, h },
        anim: {
            start_time: 0,
            start_y: 0,
            end_y: 0,
            start_h: 0,
            end_h: 0,
        },
    };
}

describe("setPaddleAnimation", () => {
    it("records the current pose as start and shrinks height by PADDLE_SHRINK_FACTOR for end", () => {
        const paddle = makePaddle(100, PADDLE_HEIGHT);
        setPaddleAnimation(paddle, 5);

        expect(paddle.anim.start_time).toBe(5);
        expect(paddle.anim.start_y).toBe(100);
        expect(paddle.anim.start_h).toBe(PADDLE_HEIGHT);
        expect(paddle.anim.end_h).toBeCloseTo(PADDLE_HEIGHT * PADDLE_SHRINK_FACTOR);
    });

    it("picks an end_y that keeps the shrunk paddle fully visible", () => {
        const paddle = makePaddle(0, PADDLE_HEIGHT);
        const endH = PADDLE_HEIGHT * PADDLE_SHRINK_FACTOR;

        for (let i = 0; i < 50; i++) {
            setPaddleAnimation(paddle, 1);
            expect(paddle.anim.end_y).toBeGreaterThanOrEqual(0);
            expect(paddle.anim.end_y + endH).toBeLessThanOrEqual(H);
        }
    });
});

describe("animatePaddle", () => {
    it("is a no-op when start_time is 0 (idle sentinel)", () => {
        const paddle = makePaddle(123, 456);
        animatePaddle(paddle, 10);
        expect(paddle.pos.y).toBe(123);
        expect(paddle.size.h).toBe(456);
    });

    it("matches start pose at t<=0", () => {
        const paddle = makePaddle(0, PADDLE_HEIGHT);
        paddle.anim.start_time = 10;
        paddle.anim.start_y = 200;
        paddle.anim.end_y = 600;
        paddle.anim.start_h = PADDLE_HEIGHT;
        paddle.anim.end_h = PADDLE_HEIGHT * PADDLE_SHRINK_FACTOR;

        animatePaddle(paddle, 10);
        expect(paddle.pos.y).toBe(200);
        expect(paddle.size.h).toBe(PADDLE_HEIGHT);
        expect(paddle.anim.start_time).toBe(10);

        // Even if `now` is before start_time, we clamp to start pose.
        animatePaddle(paddle, 9);
        expect(paddle.pos.y).toBe(200);
        expect(paddle.size.h).toBe(PADDLE_HEIGHT);
    });

    it("interpolates linearly at midpoint", () => {
        const paddle = makePaddle(0, PADDLE_HEIGHT);
        paddle.anim.start_time = 0;
        paddle.anim.start_y = 100;
        paddle.anim.end_y = 300;
        paddle.anim.start_h = 500;
        paddle.anim.end_h = 400;
        // start_time = 0 is the idle sentinel, so we have to use a non-zero start.
        paddle.anim.start_time = 1;

        animatePaddle(paddle, 1 + PADDLE_ANIM_DURATION / 2);
        expect(paddle.pos.y).toBeCloseTo(200);
        expect(paddle.size.h).toBeCloseTo(450);
        expect(paddle.anim.start_time).toBe(1);
    });

    it("matches end pose at t>=1 and resets start_time to 0", () => {
        const paddle = makePaddle(0, PADDLE_HEIGHT);
        paddle.anim.start_time = 2;
        paddle.anim.start_y = 100;
        paddle.anim.end_y = 700;
        paddle.anim.start_h = PADDLE_HEIGHT;
        paddle.anim.end_h = PADDLE_HEIGHT * PADDLE_SHRINK_FACTOR;

        animatePaddle(paddle, 2 + PADDLE_ANIM_DURATION);
        expect(paddle.pos.y).toBe(700);
        expect(paddle.size.h).toBe(PADDLE_HEIGHT * PADDLE_SHRINK_FACTOR);
        expect(paddle.anim.start_time).toBe(0);

        // Well past the end — still at end pose, still idle.
        paddle.anim.start_time = 2;
        animatePaddle(paddle, 99);
        expect(paddle.pos.y).toBe(700);
        expect(paddle.size.h).toBe(PADDLE_HEIGHT * PADDLE_SHRINK_FACTOR);
        expect(paddle.anim.start_time).toBe(0);
    });
});
