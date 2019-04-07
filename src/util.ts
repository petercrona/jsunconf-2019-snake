import * as R from 'ramda';
import { Vector, Game } from './types';

export const vectorAdd = (vec1: Vector, vec2: Vector) => [
	vec1[0] + vec2[0],
	vec1[1] + vec2[1]
];

const gameStatusLens = R.lensPath(['status']);
const gameScoreLens = R.lensPath(['score']);

const snakeLens = R.lensPath(['snake']);
const snakeLengthLens = R.compose(R.lensPath(['snake']), R.lensPath(['length']));
const snakePositionLens = R.compose(snakeLens, R.lensPath(['position']));
const movementVectorLens = R.compose(snakeLens, R.lensPath(['movementVector']));
const prevMovementVectorLens = R.compose(snakeLens, R.lensPath(['prevMovementVector']));

const boardLens = R.lensPath(['board']);
const applesLens = R.compose(boardLens, R.lensPath(['apples']));

const currentSnakeHead = R.compose(R.last, R.view(snakePositionLens));
export const getNextSnakePosition = R.lift(vectorAdd)(
	R.view(movementVectorLens),
	currentSnakeHead
);

const getPositionsOccupiedBySnake = R.compose(R.length, R.view(snakePositionLens));
export const isSnakeAtTargetLength = R.lift(R.equals)(
	getPositionsOccupiedBySnake,
	R.view(snakeLengthLens)
);

const appleExpired = R.compose(R.equals(0), R.prop('ttl'));
const decAppleTtl = R.over(R.lensProp('ttl'), R.dec);
export const updateApplesTtl = R.over(applesLens, R.map(decAppleTtl));
export const removeOldApples = R.over(applesLens, R.reject(appleExpired));

export const getWallPositions = (game: Game) => {
	const board = R.view(boardLens, game);
	const width = board.width;
	const height = board.height;

	return [
		...R.zip(R.range(0, width), R.repeat(0, width)),
		...R.zip(R.range(0, width + 1), R.repeat(height, width + 1)),
		...R.zip(R.repeat(0, height), R.range(0, height)),
		...R.zip(R.repeat(width, height + 1), R.range(0, height + 1))
	];
};

export const isGameRunning = R.compose(
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

	return R.filter(R.identity, R.values(possiblyFree));
};

export const incScore = R.over(gameScoreLens, R.inc);
export const growSnake = R.over(snakeLengthLens, R.inc);

export const getApplePositions = R.compose(
	R.map(R.prop('pos')),
	R.view(applesLens)
);

export const getSnakeHead = R.compose(R.last, R.view(snakePositionLens));

export const getSnakeTail = R.compose(R.init, R.view(snakePositionLens));

export const gameOver = R.set(gameStatusLens, 'GAME_OVER');

export const didSnakeCollideWithSelf = R.lift(R.includes)(getSnakeHead, getSnakeTail);

export const didCollideWithApple = R.lift(R.includes)(
	getSnakeHead,
	getApplePositions
);

export const removeAppleAtSnakeHead = game => {
	const isAppleAtSnakeHeadPosition = R.compose(
		R.equals(getSnakeHead(game)),
		R.prop('pos')
	);

	return R.over(
		applesLens,
		R.reject(isAppleAtSnakeHeadPosition),
		game
	);
};

const getX = R.nth(0);
const getY = R.nth(1);
const getBoardWidth = R.compose(R.prop('width'), R.view(boardLens));
const getBoardHeight = R.compose(R.prop('height'), R.view(boardLens));

export const didCollideWithWall = R.anyPass([
	R.useWith(R.lte(R.__, 0), [R.compose(getX, getSnakeHead)]),
	R.lift(R.gte)(R.compose(getX, getSnakeHead), getBoardWidth),
	R.useWith(R.lte(R.__, 0), [R.compose(getY, getSnakeHead)]),
	R.lift(R.gte)(R.compose(getY, getSnakeHead), getBoardHeight)
]);

export const noZeroes = R.none(R.equals(0));

const isPossibleMove = R.useWith(
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
);

export const updatePrevMovementVector = R.lift(R.set(prevMovementVectorLens))(
	R.view(movementVectorLens),
	R.identity
);