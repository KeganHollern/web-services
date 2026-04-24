import {
    BALL_SIZE,
    BALL_SPEED,
    H,
    LEFT_PADDLE_X,
    PADDLE_HEIGHT,
    PADDLE_WIDTH,
    RIGHT_PADDLE_X,
    W,
} from "./constants";
import type { GameState, Paddle } from "./types";

function makePaddle(x: number): Paddle {
    return {
        pos: { x, y: 0 },
        size: { w: PADDLE_WIDTH, h: PADDLE_HEIGHT },
        anim: {
            start_time: 0,
            start_y: 0,
            end_y: 0,
            start_h: 0,
            end_h: 0,
        },
    };
}

export function createInitialState(highscore: number): GameState {
    const state: GameState = {
        ball: {
            pos: { x: 0, y: 0 },
            vel: { x: 0, y: 0 },
            size: { w: BALL_SIZE, h: BALL_SIZE },
        },
        leftPaddle: makePaddle(LEFT_PADDLE_X),
        rightPaddle: makePaddle(RIGHT_PADDLE_X),
        score: 0,
        highscore,
        gameOver: false,
    };
    resetState(state, highscore);
    return state;
}

export function resetState(state: GameState, highscore: number): void {
    state.ball.pos.x = W / 2 - BALL_SIZE / 2;
    state.ball.pos.y = H / 2 - BALL_SIZE / 2;
    state.ball.vel.x = BALL_SPEED;
    state.ball.vel.y = 0;

    state.leftPaddle.pos.x = LEFT_PADDLE_X;
    state.leftPaddle.pos.y = (H - PADDLE_HEIGHT) / 2;
    state.leftPaddle.size.w = PADDLE_WIDTH;
    state.leftPaddle.size.h = PADDLE_HEIGHT;
    state.leftPaddle.anim.start_time = 0;

    state.rightPaddle.pos.x = RIGHT_PADDLE_X;
    state.rightPaddle.pos.y = (H - PADDLE_HEIGHT) / 2;
    state.rightPaddle.size.w = PADDLE_WIDTH;
    state.rightPaddle.size.h = PADDLE_HEIGHT;
    state.rightPaddle.anim.start_time = 0;

    state.score = 0;
    state.highscore = highscore;
    state.gameOver = false;
}
