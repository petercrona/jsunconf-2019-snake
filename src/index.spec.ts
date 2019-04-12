import * as Snake from ".";
import { expect } from "chai";
import "mocha";

describe("Snake Model", () => {
  it("width is set to given value", () => {
    const game = createGame({ width: 10 });

    const width = Snake.getWidth(game);

    expect(width).to.equal(10);
  });

  it("height is set to given value", () => {
    const game = createGame({ height: 15 });

    const height = Snake.getHeight(game);

    expect(height).to.equal(15);
  });

  it("two different seeds give to different values", () => {
    let game1 = createGame({ seed: 1 });
    let game2 = createGame({ seed: 2 });

    for (let i = 0; i < 10; i++) {
      game1 = Snake.tick(game1);
      game2 = Snake.tick(game2);
    }

    const applesGame1 = Snake.getApples(game1);
    const applesGame2 = Snake.getApples(game2);

    expect(applesGame1).to.not.deep.equal(applesGame2);
  });

  it("going into the top wall leads to game over", () => {
    let game = createGame();
    game = Snake.moveUp(game);
    game = Snake.tick(game);

    const status = Snake.getStatus(game);

    expect(status).to.equal("GAME_OVER");
  });

  it("going in the default direction one tick leaves the game running", () => {
    let game = createGame();
    game = Snake.tick(game);

    const status = Snake.getStatus(game);

    expect(status).to.equal("GAME_RUNNING");
  });

  it("going down into the bottom wall leads to game over", () => {
    let game = createGame();
    game = Snake.moveDown(game);

    for (let i = 0; i < Snake.getHeight(game); i++) {
      game = Snake.tick(game);
    }

    const status = Snake.getStatus(game);

    expect(status).to.equal("GAME_OVER");
  });

  it("going into the right wall leads to game over", () => {
    let game = createGame();
    game = Snake.moveRight(game);

    for (let i = 0; i < Snake.getWidth(game); i++) {
      game = Snake.tick(game);
    }

    const status = Snake.getStatus(game);

    expect(status).to.equal("GAME_OVER");
  });

  it("going into the left wall leads to game over", () => {
    let game = createGame();
    game = Snake.moveDown(game);
    game = Snake.moveLeft(game);

    for (let i = 0; i < Snake.getWidth(game); i++) {
      game = Snake.tick(game);
    }

    const status = Snake.getStatus(game);

    expect(status).to.equal("GAME_OVER");
  });

  it("Eating an apple increase the score by 1", () => {
    let game = runEatApple();

    const score = Snake.getScore(game);

    expect(score).to.equal(1);
  });

  it("Eating an apple increase the snake positions by 1", () => {
    let game = runEatApple();
    game = Snake.tick(game);

    const snake = Snake.getSnake(game);

    expect(snake.length).to.equal(5);
  });

  it("Snake crashing into itself leads to game over", () => {
    let game = runEatApple();
    game = Snake.moveLeft(game);
    game = Snake.tick(game);
    game = Snake.moveUp(game);
    game = Snake.tick(game);
    game = Snake.moveRight(game);
    game = Snake.tick(game);

    const status = Snake.getStatus(game);

    expect(status).to.equal("GAME_OVER");
  });

  /**
   * Assumptions:
   * Snake initially moves right
   * Snake has intial length 4
   */
  function createGame({ seed = 1, width = 10, height = 10 } = {}) {
    return Snake.newGame({ seed, width, height });
  }

  /**
   * Run the snake onto the first apple
   */
  function runEatApple() {
    let game = createGame({ seed: 1 });
    game = Snake.tick(game);
    game = Snake.tick(game);
    game = Snake.tick(game);
    game = Snake.tick(game);
    game = Snake.moveDown(game);
    game = Snake.tick(game);
    game = Snake.tick(game);
    return Snake.tick(game);
  }
});
