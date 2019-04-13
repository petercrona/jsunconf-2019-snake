import * as R from 'ramda';
import { Vector, Game, Apple, Board, Snake } from './types';

export const vectorAdd = (vec1: Vector, vec2: Vector) => [
    vec1[0] + vec2[0],
    vec1[1] + vec2[1]
] as Vector;

const gameStatusLens = R.lensPath(['status']);
const gameScoreLens = R.lensPath(['score']);

const snakeLens = R.lensPath(['snake']);
const snakeLengthLens = R.compose(R.lensPath(['snake']), R.lensPath(['length'])) as R.Lens;
const snakePositionLens = R.compose(snakeLens, R.lensPath(['position'])) as R.Lens;
const movementVectorLens = R.compose(snakeLens, R.lensPath(['movementVector'])) as R.Lens;
const prevMovementVectorLens = R.compose(snakeLens, R.lensPath(['prevMovementVector'])) as R.Lens;

const boardLens = R.lensPath(['board']);
const applesLens = R.compose(boardLens, R.lensPath(['apples'])) as R.Lens;

const currentSnakeHead = R.compose(R.last, R.view(snakePositionLens)) as
    unknown as (game: Game) => Vector;

export let getNextSnakePosition: (game: Game) => Vector;
getNextSnakePosition = R.lift(vectorAdd)(
    R.view(movementVectorLens),
    currentSnakeHead
);

let getPositionsOccupiedBySnake: (game: Game) => number;
getPositionsOccupiedBySnake = R.compose(R.length, R.view(snakePositionLens));

export let isSnakeAtTargetLength: (game: Game) => boolean;
isSnakeAtTargetLength = R.lift(R.equals)(
    getPositionsOccupiedBySnake,
    R.view(snakeLengthLens)
);

let appleExpired: (apple: Apple) => boolean;
appleExpired = R.compose(R.equals(0), R.prop('ttl'));

let decAppleTtl: (apple: Apple) => Apple;
decAppleTtl = R.over(R.lensProp('ttl'), R.dec);

export let updateApplesTtl: (game: Game) => Game;
updateApplesTtl = R.over(applesLens, R.map(decAppleTtl));

export let removeOldApples: (game: Game) => Game;
removeOldApples = R.over(applesLens, R.reject(appleExpired));

export const getWallPositions = (game: Game) => {
    const board: Board = R.view(boardLens, game);
    const width = board.width;
    const height = board.height;

    return [
        ...R.zip(R.range(0, width), R.repeat(0, width)),
        ...R.zip(R.range(0, width + 1), R.repeat(height, width + 1)),
        ...R.zip(R.repeat(0, height), R.range(0, height)),
        ...R.zip(R.repeat(width, height + 1), R.range(0, height + 1))
    ] as Vector[];
};

export let isGameRunning: (game: Game) => boolean;
isGameRunning = R.compose(
    R.equals('GAME_RUNNING'),
    R.view(gameStatusLens)
);

export const getFreePositions = (game: Game) => {
    const board: Board = R.view(boardLens, game);
    const possiblyFree = R.indexBy(
        R.toString,
        R.xprod(
            R.range(1, board.width - 1),
            R.range(1, board.height - 1)
        )
    );

    const snake: Snake = R.view(snakeLens, game);
    R.forEach(pos => {
        possiblyFree[R.toString(pos)] = false;
    }, snake.position);

    const apples: Apple[] = R.view(applesLens, game);
    R.forEach(apple => {
        possiblyFree[R.toString(apple.pos)] = false;
    }, apples);

    return R.filter(
        R.identity as (a: any) => boolean,
        R.values(possiblyFree)
    ) as Vector[];
};

export let incScore: (game: Game) => Game;
incScore = R.over(gameScoreLens, R.inc);

export let growSnake: (game: Game) => Game;
growSnake = R.over(snakeLengthLens, R.inc);

export const getApplePositions = R.compose(
    R.map(R.prop('pos')),
    R.view(applesLens)
) as (game: Game) => Vector[];

const getSnakeHead = R.compose(R.last, R.view(snakePositionLens)) as
    unknown as (game: Game) => Vector;

export const getSnakeTail = R.compose(R.init, R.view(snakePositionLens)) as
    unknown as (game: Game) => Vector[];

export let gameOver: (game: Game) => Game;
gameOver = R.set(gameStatusLens, 'GAME_OVER');

export let didSnakeCollideWithSelf: (game: Game) => boolean;
didSnakeCollideWithSelf = R.lift(R.includes)(getSnakeHead, getSnakeTail);

export let didCollideWithApple: (game: Game) => boolean;
didCollideWithApple = R.lift(R.includes)(
    getSnakeHead,
    getApplePositions
);

export const removeAppleAtSnakeHead = (game: Game) => {
    const isAppleAtSnakeHeadPosition = R.compose(
        R.equals(getSnakeHead(game)),
        R.prop('pos')
    );

    return R.over(
        applesLens,
        R.reject(isAppleAtSnakeHeadPosition),
        game
    ) as Game;
};

let getX: (vector: Vector) => number;
getX = R.nth(0);

let getY: (vector: Vector) => number;
getY = R.nth(1);

const getBoardWidth = R.compose(R.prop('width'), R.view(boardLens)) as
    (game: Game) => number;

const getBoardHeight = R.compose(R.prop('height'), R.view(boardLens)) as
    (game: Game) => number;

export let didCollideWithWall: (game: Game) => boolean;
didCollideWithWall = R.anyPass([
    R.useWith(R.lte(R.__, 0), [R.compose(getX, getSnakeHead)]),
    R.lift(R.gte)(R.compose(getX, getSnakeHead), getBoardWidth),
    R.useWith(R.lte(R.__, 0), [R.compose(getY, getSnakeHead)]),
    R.lift(R.gte)(R.compose(getY, getSnakeHead), getBoardHeight)
]);

export let noZeroes: (numbers: number[]) => boolean;
noZeroes = R.none(R.equals(0));

let isPossibleMove: (movementVector: Vector, game: Game) => boolean;
isPossibleMove = R.useWith(
    R.compose(noZeroes, vectorAdd),
    [
        R.identity,
        R.view(prevMovementVectorLens)
    ]
);

export const move = R.ifElse(
    isPossibleMove,
    R.set(movementVectorLens),
    R.nthArg(1)
) as (movementVector: Vector) => (game: Game) => Game;

export let updatePrevMovementVector: (game: Game) => Game;
updatePrevMovementVector = R.lift(R.set(prevMovementVectorLens))(
    R.view(movementVectorLens),
    R.identity
);

export const doesBoardHaveFreeSpace = (game: Game) => {
    const board: Board = R.view(boardLens, game);
    const availableSpace = board.width * board.height;
    const snake: Snake = R.view(snakeLens, game);
    const apples: Apple[] = R.view(applesLens, game);
    const usedSpace = snake.length + apples.length;

    return usedSpace < availableSpace;
};

export const findFreePosition = (game: Game) => {
    const freePositions = getFreePositions(game);
    return freePositions[Math.floor(game.prng() * freePositions.length)];
}

export const createApple = (game: Game, pos: [number, number]) => {
    const ttl = Math.floor(game.prng() * 20) + 30;
    return { ttl, pos } as Apple;
}