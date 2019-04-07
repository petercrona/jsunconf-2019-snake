export type Vector = [number, number];

export type GameStatus = 'GAME_OVER' | 'GAME_RUNNING';

export interface Game {
    score: number;
    status: GameStatus;
    snake: Snake;
    board: Board;
    prng: () => number;
}

export interface Snake {
    movementVector: Vector;
    prevMovementVector: Vector;
    position: [Vector];
    length: number;
}

export interface Board {
    width: number;
    height: number;
    apples: Apple[]
}

export interface Apple {
    ttl: number,
    pos: [Vector]
}