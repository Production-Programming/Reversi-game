class Game {

    constructor(player1, player2) {
        this._playing = false;
        this._player1 = player1;
        this._player2 = player2;
        this._turn = player1;
        this._board = null;
        this._pieces_placed = 4;
        this._possible_moves = new Array();
    }

    get turn() {
        return this._turn;
    }

    get opponent() {
        return this._turn === this._player1 ? this._player2 : this._player1;
    }

    get board() {
        return this._board;
    }

    get possibleMoves(){
        return this._possible_moves;
    }

    moveDirections = [
        { row: -1, col: 0 },
        { row: -1, col: 1 },
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: -1 },
        { row: 0, col: -1 },
        { row: -1, col: -1 },
    ];

    newBoard(length) {
        this._board = new Board(length);
    }


    newGame(boardLength, withHtml = true) {
        this._turn = this._player1.color === "black" ? this._player1 : this._player2;

        this._playing = true;
        this.newBoard(boardLength);
        if (withHtml){
            this.board.printBoard();
        }
        this.fillBoard(withHtml);
        if (withHtml){
            this.addEventsToBoard();
            this.board.fillLayout(this._player1, this._player2);
        }
        
        this._pieces_placed = 4;
        this._possible_moves = new Array();
        this._player1.pieces = 2;
        this._player2.pieces = 2;

        this.getMoves(withHtml);
    }

    fillBoard(withHtml = true) {
        for (let row = 1; row <= this._board.length; row++) {
            for (let col = 1; col <= this._board.length; col++) {
                this._board.addCell(new Cell(row, col));
            }
        }

        let startingPieces = [
            { row: this._board.length / 2, col: this._board.length / 2, color: "white" },
            { row: this._board.length / 2, col: this._board.length / 2 + 1, color: "black" },
            { row: this._board.length / 2 + 1, col: this._board.length / 2, color: "black" },
            { row: this._board.length / 2 + 1, col: this._board.length / 2 + 1, color: "white" },
        ];


        let cell;
        startingPieces.forEach(piece => {
            cell = this.getCell(piece.row, piece.col);
            cell.piece = piece.color;
            if (withHtml){
                this._board.placePiece(piece.row, piece.col, piece.color);
            }
        });

    }

    addEventsToBoard() {
        $("#p1-surrender").click(() => {
            this.surrenderWindow(this._player1);
        });
        $("#p2-surrender").click(() => {
            this.surrenderWindow(this._player2);
        });

        for (let row = 1; row <= this.board.length; row++) {
            for (let col = 1; col <= this.board.length; col++) {
                $(`#${row}-${col}`).on("click", () => {
                    if (this._playing) {
                        if (this._possible_moves.find(cell => cell.row === row && cell.col === col)) 
                            this.placePiece(row, col);

                        else if (this.getCell(row, col).isEmpty()){
                            Swal.fire({
                                toast: true,
                                title: '<p style="text-align: center"> Невозможно сделать ход в эту клетку</p>',
                                icon: "warning",
                                position: 'center',
                                showConfirmButton: false,
                                timer: 1000,
                                width: '25%',
                            });

                        }

                    }

                });

            }
        }

    }

    getCell(row, col) {
        return this._board.cells.find(cell => cell.row === row && cell.col === col);
    }

    getEmptyCells() {
        return this._board.cells.find(cell => cell.piece === null);
    }

    getPieces(color) {
        return this._board.cells.filter(cell => cell.piece === color);
    }

    getMoves(withHtml = true) {
        let cells = this.getPieces(this._turn.color);

        for (let cell of cells) {
            for (let move of this.moveDirections) {
                let moveResult = this.checkMove(cell.row, cell.col, move.row, move.col, this.turn.color);
                if (moveResult){
                    this._possible_moves.push(moveResult);
                } 
            }
        }

        if (withHtml){
            for (let move of this._possible_moves){
                this._board.showMove(move.row, move.col, this.turn.color);
            }
        }
    }

    checkMove(row, col, moveRow, moveCol, color, opponentPiece = false) {
        if (!this.isMoveInsideBoard(row + moveRow, col + moveCol)) 
            return false;
        else {
            if (this.getCell(row + moveRow, col + moveCol).piece === color || (!opponentPiece && !this.getCell(row + moveRow, col + moveCol).piece)) 
                return false;
            else if (this.getCell(row + moveRow, col + moveCol).piece == null && opponentPiece) 
                return { row: row + moveRow, col: col + moveCol, id: `${row + moveRow}-${col + moveCol}` };
            else if (this.getCell(row + moveRow, col + moveCol).piece != color) 
                return this.checkMove(row + moveRow, col + moveCol, moveRow, moveCol, color, true);
            
        }

    }

    isMoveInsideBoard(row, col){
        return (row < 1 || row > this._board.length || col < 1 || col > this._board.length) ? false : true;
    }

    placePiece(row, col, withHtml = true) {
        this._pieces_placed += 1;

        this.clearMoves(withHtml);

        this.getCell(row, col).piece = this._turn.color;
        if (withHtml){
            this._board.placePiece(row, col, this._turn.color);
        }

        this.checkCapturedPieces(row, col, withHtml);

        if (this._pieces_placed === Math.pow(this._board.length, 2) & withHtml)
            this.endGameWindow();

        else if (!this.checkMovesLeft(this.opponent) & withHtml){
            if (!this.checkMovesLeft(this.turn)) 
                this.noMovesLeftWindow();
            else
                this.skipTurnWindow();
            
        } else
            this.changeTurn(withHtml);

    }

    checkCapturedPieces(row, col, withHtml = true) {

        let capturedPieces = 0;
        let captured = false;
        let rowAux = row;
        let colAux = col;

        for (let move of this.moveDirections) {
            while (this.isMoveInsideBoard(rowAux + move.row, colAux + move.col) && 
                    this.getCell(rowAux + move.row, colAux + move.col).piece === this.opponent.color && !captured ) {
                if (this.isMoveInsideBoard(rowAux + move.row * 2, colAux + move.col * 2) && 
                    this.getCell(rowAux + move.row * 2, colAux + move.col * 2).piece === this.turn.color) {
                    
                    capturedPieces += this.captureFromTo(row, col, rowAux + move.row , colAux + move.col, move.row, move.col, withHtml);
                    captured = true;
                }

                rowAux += move.row;
                colAux += move.col;
            }

            rowAux = row;
            colAux = col;
            captured = false;

        }

        this.turn.pieces += capturedPieces + 1;
        this.opponent.pieces -= capturedPieces;
        if (withHtml){
            this._board.updatePieces( this.turn.color, this.turn.pieces);
            this._board.updatePieces( this.opponent.color, this.opponent.pieces);
        }
        
        if (this.opponent.pieces === 0 & withHtml) 
            this.winnerWindow(this.turn.name + " выиграл(а)!");    

    }

    captureFromTo(row, col, toRow, toCol, moveRow, moveCol, withHtml = true) {
        let capturedPieces = 0;

        while (row !== toRow || col !== toCol) {
            if (withHtml){
                this._board.placePiece(row + moveRow, col + moveCol, this._turn.color);
            }
            this.getCell(row + moveRow, col + moveCol).piece = this._turn.color;
            
            row += moveRow;
            col += moveCol;
            capturedPieces += 1;
        }
        return capturedPieces;
    }

    checkMovesLeft(player) {
        let cells = this.getPieces(player.color);
        for (let cell of cells) {
            for (let move of this.moveDirections) {
                if (this.checkMove( cell.row, cell.col, move.row , move.col, player.color))
                    return true;
                
            }
        }

        return false;
    }

    clearMoves(withHtml = true) {
        if (withHtml){
            this._board.hideMoves();
        }
        this._possible_moves = [];
    }

    changeTurn(withHtml = true) {
        this._turn = this._turn === this._player1 ? this._player2 : this._player1;
        this.getMoves(withHtml);
    }

    endGameWindow(){
        if (this._player1.pieces === this._player2.pieces)
            this.winnerWindow("Ничья");
        else
            this._player1.pieces > this._player2.pieces ? this.winnerWindow(this._player1.name + " выиграл(а)!") : this.winnerWindow(this._player2.name + " выиграл(а)!");
    }

    winnerWindow(message) {
        this._playing = false;
        let url = "assets/images/win.gif"; 

        if (message === "Ничья")
            url = "assets/images/draw.png";

        Swal.fire({
            text: message,
            imageUrl: url,
            imageWidth: 300,
            imageHeight: 300,
            confirmButtonColor: '#588c65',
            confirmButtonText: 'ок',

        }).then(() => {
            this.newGameWindow();
        });

    }

    skipTurnWindow() {

            Swal.fire({

                title: `У ${this.opponent.name} нет ходов`,
                position: 'center',
                confirmButtonColor: '#588c65',
                confirmButtonText: 'ок',
                showCancelButton: false,
                width: '40%',

            }).then(() => { this.getMoves(); });

    }

    noMovesLeftWindow() {

            Swal.fire({

                title: `Ходов не осталось`,
                position: 'center',
                confirmButtonColor: '#588c65',
                confirmButtonText: 'ок',
                showCancelButton: false,
                width: '40%',

            }).then(() => { this.endGameWindow(); });

    }

    surrenderWindow(player) {

        if (this._playing && this._turn == player) {

            Swal.fire({

                title: 'Вы уверены, что хотите сдаться?',
                icon: 'question',
                position: 'center',
                confirmButtonColor: '#588c65',
                confirmButtonText: 'да',
                showCancelButton: true,
                cancelButtonColor: '#d96666',
                cancelButtonText: 'нет',
                width: '40%',

            }).then((result) => {
                if (result.isConfirmed) {

                    this._playing = false;
                    Swal.fire({

                        text: `${player.name} сдался`,
                        showConfirmButton: true,
                        width: '40%',

                    }).then(() => {
                        this.newGameWindow();
                    });

                }
            });

        }
    }

    newGameWindow() {

        Swal.fire({

            title: 'Хотите сыграть еще одну игру?',
            icon: 'question',
            position: 'center',
            confirmButtonColor: '#588c65',
            confirmButtonText: 'да',
            showCancelButton: true,
            cancelButtonColor: '#d96666',
            cancelButtonText: 'нет',
            width: '40%',

        }).then((result) => {

            this.clearMoves();
            
            if (result.isConfirmed) 
                this.newGame(this._board._board_length);
            else{
                window.location.href = 'menu.html?username=' + decodeURI(getParameterValue('username'));
            }

        });

    }

}
