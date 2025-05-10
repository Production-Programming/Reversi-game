import {default as Player} from '../public/assets/js/player';
import {default as Cell} from '../public/assets/js/cell';
import {default as Board} from '../public/assets/js/board';
import {default as Game} from '../public/assets/js/game';

const player1 = new Player("Игрок 1", "white");
const player2 = new Player("Игрок 2", "black");

test('Create game', () => {
    let game = new Game(player1, player2);
  
    game.newGame(8);

    expect(game.getCell(4, 4).color).toBe("white");
    expect(game.getCell(5, 5).color).toBe("white");
    expect(game.getCell(4, 5).color).toBe("black");
    expect(game.getCell(5, 4).color).toBe("black");

    expect(game.possible_moves.find(cell => cell.row === 3 && cell.col === 5)).toBe(true);
    expect(game.possible_moves.find(cell => cell.row === 4 && cell.col === 6)).toBe(true);
    expect(game.possible_moves.find(cell => cell.row === 5 && cell.col === 3)).toBe(true);
    expect(game.possible_moves.find(cell => cell.row === 6 && cell.col === 4)).toBe(true);
});

test('Change color Up', () => {
    let game = new Game(player1, player2);
  
    game.newGame(8);

    game.placePiece(6, 4);

    expect(game.getCell(5, 4).color).toBe("white");
});

test('Change color Down', () => {
    let game = new Game(player1, player2);
  
    game.newGame(8);

    game.placePiece(3, 5);

    expect(game.getCell(4, 5).color).toBe("white");
});

test('Change color Right', () => {
    let game = new Game(player1, player2);
  
    game.newGame(8);

    game.placePiece(5, 3);

    expect(game.getCell(5, 4).color).toBe("white");
});

test('Change color Left', () => {
    let game = new Game(player1, player2);
  
    game.newGame(8);

    game.placePiece(4, 6);

    expect(game.getCell(4, 5).color).toBe("white");
});

test('Change color Up Right', () => {
    let game = new Game(player1, player2);
  
    game.newGame(8);

    game.placePiece(3, 5);
    game.placePiece(3, 6);

    expect(game.getCell(4, 5).color).toBe("black");
});

test('Change color Down Left', () => {
    let game = new Game(player1, player2);
  
    game.newGame(8);

    game.placePiece(6, 4);
    game.placePiece(6, 3);

    expect(game.getCell(5, 4).color).toBe("black");
});

test('Change color Up Left', () => {
    let game = new Game(player1, player2);
  
    game.newGame(8);

    game.placePiece(3, 5);
    game.placePiece(3, 4);
    game.placePiece(3, 3);

    expect(game.getCell(3, 4).color).toBe("white");
    expect(game.getCell(4, 4).color).toBe("white");
});

test('Change color Down Right', () => {
    let game = new Game(player1, player2);
  
    game.newGame(8);

    game.placePiece(6, 4);
    game.placePiece(6, 5);
    game.placePiece(6, 6);

    expect(game.getCell(5, 5).color).toBe("white");
    expect(game.getCell(5, 6).color).toBe("white");
});