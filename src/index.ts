import * as R from 'ramda';
import { mb32 } from './prng';
import { Board, Game, GameStatus, Snake, Vector, Apple, Configuration } from './types';
import { didCollideWithApple, didCollideWithWall, didSnakeCollideWithSelf, gameOver, getFreePositions, getNextSnakePosition, getWallPositions, growSnake, incScore, isGameRunning, isSnakeAtTargetLength, move, removeAppleAtSnakeHead, removeOldApples, updateApplesTtl, updatePrevMovementVector } from './util';

// === Constructors
const newSnake = (): Snake => ({
    movementVector: [1, 0],
    prevMovementVector: [1, 0],
    position: [[1, 1]],
    length: 4
});

const newBoard = (config: Configuration): Board => ({
    width: config.width,
    height: config.height,
    apples: []
});

export const newGame = (config: Configuration): Game => ({
    score: 0,
    status: 'GAME_RUNNING',
    snake: newSnake(),
    board: newBoard(config),
    prng: mb32(config.seed)
});

// === Lenses
const snakeLens = R.lensPath(['snake']);
const snakePositionLens = R.compose(snakeLens, R.lensPath(['position'])) as R.Lens;
const boardLens = R.lensPath(['board']);
const applesLens = R.compose(boardLens, R.lensPath(['apples'])) as R.Lens;

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
    const board: Board = R.view(boardLens, game);
    const availableSpace = board.width * board.height;
    const snake: Snake = R.view(snakeLens, game);
    const apples: Apple[] = R.view(applesLens, game);
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

export const getApples = R.compose(R.map(R.prop('pos')), R.view(applesLens)) as 
    (game: Game) => Vector[];

export let getSnake: (game: Game) => Vector[];
getSnake = R.view(snakePositionLens);

export let getStatus: (game: Game) => GameStatus;
getStatus = R.prop('status');

export const getWidth = R.compose(R.prop('width'), R.view(boardLens)) as 
    (game: Game) => number;

export const getHeight = R.compose(R.prop('height'), R.view(boardLens)) as 
    (game: Game) => number;