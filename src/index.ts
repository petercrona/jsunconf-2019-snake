import * as R from 'ramda';
import {getScore, getWalls, getApples, getSnake, getStatus, tick, moveDown, moveLeft, moveUp, moveRight, newGame} from './model';

const term = require('terminal-kit').terminal;
const ScreenBuffer = require('terminal-kit').ScreenBuffer;

var sb = new ScreenBuffer( { dst: term , noFill: true } ) ;

function terminate() {
	term.grabInput( false ) ;
	setTimeout( function() { process.exit() } , 100 ) ;
}

const drawHeader = game => {
	const status = getStatus(game);
	const score = getScore(game);

	sb.put({x: 1, y: 1, attr: {bold: true}}, status);
	sb.put({x: 40, y: 1, attr: {bold: true}}, 'Score: ' + score);

	const widthOfLine = R.length('Score: ' + score) + 40
	term.moveTo(1, 2);
	R.range(1,widthOfLine).forEach((i) => {
		sb.put({x: i, y: 2}, "=");
	});
};

const drawWalls = game => {
	const walls = getWalls(game);

	const x = R.add(1);
	const y = R.add(3);
	R.forEach(wall => {
		sb.moveTo(x(wall[0]), y(wall[1]));
		sb.put({direction: 'none', attr: {color: 'red'}}, '█');
	}, walls);
};

const drawSnake = game => {
	const snake = getSnake(game);
	R.forEach(pos => {
		const x = R.add(1);
		const y = R.add(3);
		sb.put({x: x(pos[0]), y: y(pos[1]), attr: {color: 'green', bgColor: 'black'}}, "X");
	}, snake);
};

const drawApples = game => {
	const apples = getApples(game);
	R.forEach(pos => {
		const x = R.add(1);
		const y = R.add(3);
		sb.moveTo(x(pos[0]), y(pos[1]));
		sb.put({direction: 'none', attr: {color: 'green', bgColor: 'black'}}, '\u2605');
	}, apples);
};

const getSeed = () => Math.floor(Math.random()*Number.MAX_SAFE_INTEGER);

// === Run
let game = newGame(getSeed());

term.hideCursor();

setInterval(() => {
	sb.fill( {attr: {
		color: 255 ,
		bgColor: 0
	} } ) ;

	game = tick(game);

	drawHeader(game);
	drawApples(game);
	drawWalls(game);
	drawSnake(game);

	sb.draw({delta: true});
}, 50);

// Key handling
term.grabInput(true) ;
term.on('key', R.cond([
		[R.equals('UP'), () => game = moveUp(game)],
		[R.equals('DOWN'), () => game = moveDown(game)],
		[R.equals('RIGHT'), () => game = moveRight(game)],
		[R.equals('LEFT'), () => game = moveLeft(game)],
		[R.equals('r'), () => game = newGame(getSeed())],
		[R.equals('q'), terminate],
		[R.equals('CTRL_C'), terminate]
]));
