export interface Vec2 {
    x: number;
    y: number;
}

export interface Size {
    w: number;
    h: number;
}

export interface Ball {
    pos: Vec2;
    vel: Vec2;
    size: Size;
}

export interface PaddleAnim {
    start_time: number;
    start_y: number;
    end_y: number;
    start_h: number;
    end_h: number;
}

export interface Paddle {
    pos: Vec2;
    size: Size;
    anim: PaddleAnim;
}

export interface GameState {
    ball: Ball;
    leftPaddle: Paddle;
    rightPaddle: Paddle;
    score: number;
    highscore: number;
    isPlaying: boolean;
}
