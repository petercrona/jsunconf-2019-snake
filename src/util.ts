import * as R from 'ramda';
import { Vector, Game, Apple } from './types';

export const vectorAdd = (vec1: Vector, vec2: Vector) => [
    vec1[0] + vec2[0],
    vec1[1] + vec2[1]
] as Vector;

const gameStatusLens = R.lensPath(['status']);
const gameScoreLens = R.lensPath(['score']);

const snakeLens = R.lensPath(['snake']);
const snakeLengthLens = R.compose(R.lensPath(['snake']), R.lensPath(['length']));
const snakePositionLens = R.compose(snakeLens, R.lensPath(['position']));
const movementVectorLens = R.compose(snakeLens, R.lensPath(['movementVector']));
const prevMovementVectorLens = R.compose(snakeLens, R.lensPath(['prevMovementVector']));

const boardLens = R.lensPath(['board']);
const applesLens = R.compose(boardLens, R.lensPath(['apples']));

let currentSnakeHead: (game: Game) => Vector
currentSnakeHead = R.compose(R.last, R.view(snakePositionLens));

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
    const board = R.view(boardLens, game);
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
    const board = R.view(boardLens, game);
    const possiblyFree = R.indexBy(
        R.identity,
        R.xprod(
            R.range(1, board.width - 1),
            R.range(1, board.height - 1)
        )
    );

    const snake = R.view(snakeLens, game);
    R.forEach(pos => {
        possiblyFree[pos] = false;
    }, snake.position);

    const apples = R.view(applesLens, game);
    R.forEach(apple => {
        possiblyFree[apple.pos] = false;
    }, apples);

    return R.filter(R.identity, R.values(possiblyFree)) as Vector[];
};

export let incScore: (game: Game) => Game;
incScore = R.over(gameScoreLens, R.inc);

export let growSnake: (game: Game) => Game;
growSnake = R.over(snakeLengthLens, R.inc);

export let getApplePositions: (game: Game) => Vector[];
getApplePositions = R.compose(
    R.map(R.prop('pos')),
    R.view(applesLens)
);

export let getSnakeHead: (game: Game) => Vector;
getSnakeHead = R.compose(R.last, R.view(snakePositionLens));

export let getSnakeTail: (game: Game) => Vector[];
getSnakeTail = R.compose(R.init, R.view(snakePositionLens));

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

let getBoardWidth: (game: Game) => number;
getBoardWidth = R.compose(R.prop('width'), R.view(boardLens));

let getBoardHeight: (game: Game) => number;
getBoardHeight = R.compose(R.prop('height'), R.view(boardLens));

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

export let move: (movementVector: Vector, game: Game) => Game;
move = R.ifElse(
    isPossibleMove,
    R.set(movementVectorLens),
    R.nthArg(1)
);

export let updatePrevMovementVector: (game: Game) => Game;
updatePrevMovementVector = R.lift(R.set(prevMovementVectorLens))(
    R.view(movementVectorLens),
    R.identity
);