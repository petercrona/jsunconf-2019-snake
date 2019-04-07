import * as R from 'ramda';
import { mb32 } from './prng';
import { getWallPositions, removeOldApples, updateApplesTtl, isGameRunning, isSnakeAtTargetLength, getNextSnakePosition, getFreePositions, incScore, growSnake, getApplePositions, getSnakeHead, getSnakeTail, gameOver, didSnakeCollideWithSelf, didCollideWithApple, removeAppleAtSnakeHead, didCollideWithWall, vectorAdd, noZeroes, move, updatePrevMovementVector } from './util';
import { Snake, Game, Board, GameStatus, Vector } from './types';

// === Constructors
const newSnake = (): Snake => ({
    movementVector: [0, 1],
    prevMovementVector: [0, 1],
    position: [[10, 5]],
    length: 4
});

const newBoard = (): Board => ({
    width: 50,
    height: 30,
    apples: []
});

export const newGame = (seed: number): Game => ({
    score: 0,
    status: 'GAME_RUNNING',
    snake: newSnake(),
    board: newBoard(),
    prng: mb32(seed)
});

// === Lenses
const snakeLens = R.lensPath(['snake']);
const snakePositionLens = R.compose(snakeLens, R.lensPath(['position']));
const boardLens = R.lensPath(['board']);
const applesLens = R.compose(boardLens, R.lensPath(['apples']));

// === Modifiers
export let moveUp: (game: Game) => Game;
moveUp = move([0, -1]);

export let moveDown: (game: Game) => Game;
moveDown = move([0, 1]);

export let moveRight: (game: Game) => Game;
moveRight = move([1, 0]);

export let moveLeft: (game: Game) => Game;
moveLeft = move([-1, 0]);

// === Game loop
const shouldAddNewApple = (game: Game) => {
    const board = R.view(boardLens, game);
    const availableSpace = board.width * board.height;
    const snake = R.view(snakeLens, game);
    const apples = R.view(applesLens, game);
    const usedSpace = snake.length + apples.length;

    return usedSpace < availableSpace && game.prng() <= 0.1;
};

const addAppleToRandomPosition = (game: Game): Game => {
    const freePositions = getFreePositions(game);
    const pos = freePositions[Math.floor(game.prng() * freePositions.length)];
    const ttl = Math.floor(game.prng() * 20) + 30;
    const newApple = { ttl, pos };
    return R.over(applesLens, R.append(newApple), game);
};

let maybeAddNewApple: (game: Game) => Game;
maybeAddNewApple = R.ifElse(
    shouldAddNewApple,
    addAppleToRandomPosition,
    R.identity
);

let checkWallCollision: (game: Game) => Game;
checkWallCollision = R.ifElse(
    didCollideWithWall,
    gameOver,
    R.identity
);

let checkSnakeCollideWithSelf: (game: Game) => Game;
checkSnakeCollideWithSelf = R.ifElse(
    didSnakeCollideWithSelf,
    gameOver,
    R.identity
);

let checkAppleCollision: (game: Game) => Game;
checkAppleCollision = R.ifElse(
    didCollideWithApple,
    R.compose(removeAppleAtSnakeHead, incScore, growSnake),
    R.identity
);

const updateSnakePosition = (game: Game): Game => {
    const dropTail = isSnakeAtTargetLength(game) ? R.drop(1) : R.identity;
    const nextSnakePosition = getNextSnakePosition(game);

    return R.over(
        snakePositionLens,
        R.compose(dropTail, R.append(nextSnakePosition)),
        game
    );
};

let checkAndHandleCollisions: (game: Game) => Game;
checkAndHandleCollisions = R.compose(
    checkWallCollision,
    checkSnakeCollideWithSelf,
    checkAppleCollision
);

export let tick: (game: Game) => Game;
tick = R.ifElse(
    isGameRunning,
    R.compose(
        maybeAddNewApple,
        removeOldApples,
        updateApplesTtl,
        checkAndHandleCollisions,
        updateSnakePosition,
        updatePrevMovementVector
    ),
    R.identity
);

// === Public Getters
export let getScore: (game: Game) => number;
getScore = R.prop('score');

export let getWalls: (game: Game) => Vector[];
getWalls = getWallPositions;

export let getApples: (game: Game) => Vector[];
getApples = R.compose(R.map(R.prop('pos')), R.view(applesLens));

export let getSnake: (game: Game) => Vector[];
getSnake = R.view(snakePositionLens);

export let getStatus: (game: Game) => GameStatus;
getStatus = R.prop('status');