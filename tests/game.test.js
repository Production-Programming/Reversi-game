const player1 = new Player("Игрок 1", "white");
const player2 = new Player("Игрок 2", "black");

describe("Game module tests", function() {

  it("Create board", function() {
      let game = new Game(player1, player2);
      assert.equal(game.board, null);
      game.newBoard(8);
      assert.typeOf(game.board, 'Object');
  });

  it("Fill board", function() {
    let game = new Game(player1, player2);

    game.newBoard(8, false);
    game.fillBoard(false);

    for (let row = 1; row <= game.board.length; row++) {
      for (let col = 1; col <= game.board.length; col++) {
          if (row !== 4 & row !== 5 || col !== 4 & col !== 5){
            assert.equal(game.getCell(row, col).piece, null);
          }
      }
    }

    assert.equal(game.getCell(4, 4).piece, "white");
    assert.equal(game.getCell(5, 5).piece, "white");
    assert.equal(game.getCell(4, 5).piece, "black");
    assert.equal(game.getCell(5, 4).piece, "black");
  });

  it("Get cell", function() {
    let game = new Game(player1, player2);
    game.newBoard(8, false);
    game.fillBoard(false);
    for (let row = 1; row <= game.board.length; row++) {
      for (let col = 1; col <= game.board.length; col++) {
        if (row !== 4 & row !== 5 || col !== 4 & col !== 5){
          assert.equal(game.getCell(row, col).row, row);
          assert.equal(game.getCell(row, col).col, col);
          assert.equal(game.getCell(row, col).piece, null);
        }
      }
    }
    assert.equal(game.getCell(4, 4).row, 4);
    assert.equal(game.getCell(4, 4).col, 4);
    assert.equal(game.getCell(4, 4).piece, "white");
    assert.equal(game.getCell(5, 5).row, 5);
    assert.equal(game.getCell(5, 5).col, 5);
    assert.equal(game.getCell(5, 5).piece, "white");
    assert.equal(game.getCell(4, 5).row, 4);
    assert.equal(game.getCell(4, 5).col, 5);
    assert.equal(game.getCell(4, 5).piece, "black");
    assert.equal(game.getCell(5, 4).row, 5);
    assert.equal(game.getCell(5, 4).col, 4);
    assert.equal(game.getCell(5, 4).piece, "black");
  });

  it("Get empty cells", function() {
    let game = new Game(player1, player2);
    game.newBoard(8);
    game.fillBoard(false);
    let emptyCells = game.getEmptyCells();
    assert.equal(emptyCells.row, 1);
    assert.equal(emptyCells.col, 1);
  });

  it("Get pieces", function() {
    let game = new Game(player1, player2);
    game.newBoard(8);
    game.fillBoard(false);
    let whiteCells = game.getPieces("white");
    let blackCells = game.getPieces("black");
    for (let row = 1; row <= game.board.length; row++) {
      for (let col = 1; col <= game.board.length; col++) {
        if (row !== 4 & row !== 5 || col !== 4 & col !== 5){
          assert.equal(whiteCells.some((el) => el.row === row & el.col === col), false);
          assert.equal(blackCells.some((el) => el.row === row & el.col === col), false);
        }
      }
    }
    assert.equal(whiteCells.some((el) => el.row === 4 & el.col === 4), true);
    assert.equal(whiteCells.some((el) => el.row === 5 & el.col === 5), true);
    assert.equal(blackCells.some((el) => el.row === 4 & el.col === 5), true);
    assert.equal(blackCells.some((el) => el.row === 5 & el.col === 4), true);
  });

  it("Check move inside board", function() {
    let game = new Game(player1, player2);
    game.newBoard(8);
    for (let row = 1; row <= game.board.length; row++) {
      for (let col = 1; col <= game.board.length; col++) {
        assert.equal(game.isMoveInsideBoard(row, col), true);
      }
    }
    assert.equal(game.isMoveInsideBoard(0, 0), false);
    assert.equal(game.isMoveInsideBoard(9, 9), false);
  });

  it("Check moves left", function() {
    let game = new Game(player1, player2);
    game.newBoard(8);
    game.fillBoard(false);
    assert.equal(game.checkMovesLeft(player1), true);
    assert.equal(game.checkMovesLeft(player2), true);
  });

  it("Change turn", function() {
    let game = new Game(player1, player2);
    game.newBoard(8);
    assert.equal(game.turn, player1);
    game.changeTurn(false);
    assert.equal(game.turn, player2);
  });
});

describe("Game integration tests", function() {

    it("Create game", function() {
        let game = new Game(player1, player2);
  
        game.newGame(8, false);

        for (let row = 1; row <= game.board.length; row++) {
          for (let col = 1; col <= game.board.length; col++) {
              if (row !== 4 & row !== 5 || col !== 4 & col !== 5){
                assert.equal(game.getCell(row, col).piece, null);
              }
          }
        }

        assert.equal(game.getCell(4, 4).piece, "white");
        assert.equal(game.getCell(5, 5).piece, "white");
        assert.equal(game.getCell(4, 5).piece, "black");
        assert.equal(game.getCell(5, 4).piece, "black");

        assert.equal(game.possibleMoves.find(cell => cell.row === 3 && cell.col === 4).id, '3-4');
        assert.equal(game.possibleMoves.find(cell => cell.row === 4 && cell.col === 3).id, '4-3');
        assert.equal(game.possibleMoves.find(cell => cell.row === 5 && cell.col === 6).id, '5-6');
        assert.equal(game.possibleMoves.find(cell => cell.row === 6 && cell.col === 5).id, '6-5');

        for (let row = 1; row <= game.board.length; row++) {
          for (let col = 1; col <= game.board.length; col++) {
              if (row !== 3 & row !== 4 & row !== 5 & row !== 6 || col !== 3 & col !== 4 & col !== 5 & col !== 6){
                assert.equal(game.possibleMoves.find(cell => cell.row === row && cell.col === col), undefined);
              }
          }
        }
    });

    it("Change turn", function() {
      let game = new Game(player1, player2);

      game.newGame(8, false);
      assert.equal(game.turn, player2);
      
      game.placePiece(3, 4, false);
      assert.equal(game.turn, player1);
    });

    it('Change color Up', function () {
        let game = new Game(player1, player2);
      
        game.newGame(8, false);

        game.placePiece(3, 4, false);

        assert.equal(game.getCell(4, 4).piece, "black");
    });

    it('Change color Down', function () {
      let game = new Game(player1, player2);
    
      game.newGame(8, false);

      game.placePiece(6, 5, false);

      assert.equal(game.getCell(5, 5).piece, "black");
    });

    it('Change color Right', function () {
      let game = new Game(player1, player2);
    
      game.newGame(8, false);

      game.placePiece(5, 6, false);

      assert.equal(game.getCell(5, 5).piece, "black");
    });

    it('Change color Left', function () {
      let game = new Game(player1, player2);
    
      game.newGame(8, false);

      game.placePiece(4, 3, false);

      assert.equal(game.getCell(4, 4).piece, "black");
    });

    it('Change color Up Right', function () {
      let game = new Game(player1, player2);
    
      game.newGame(8, false);

      game.placePiece(3, 4, false);
      game.placePiece(3, 5, false);
      game.placePiece(3, 6, false);

      assert.equal(game.getCell(3, 5).piece, "black");
      assert.equal(game.getCell(4, 5).piece, "black");
    });

    it('Change color Down Left', function () {
      let game = new Game(player1, player2);
    
      game.newGame(8, false);

      game.placePiece(6, 5, false);
      game.placePiece(6, 4, false);
      game.placePiece(6, 3, false);

      assert.equal(game.getCell(5, 4).piece, "black");
      assert.equal(game.getCell(6, 4).piece, "black");
    });
  
    it('Change color Up Left', function () {
      let game = new Game(player1, player2);
    
      game.newGame(8, false);

      game.placePiece(3, 4, false);
      game.placePiece(3, 3, false);

      assert.equal(game.getCell(4, 4).piece, "white");
    });

    it('Change color Down Right', function () {
      let game = new Game(player1, player2);
    
      game.newGame(8, false);

      game.placePiece(6, 5, false);
      game.placePiece(6, 6, false);

      assert.equal(game.getCell(5, 5).piece, "white");
    });
  
});