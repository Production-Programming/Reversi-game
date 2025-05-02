export default class Game {

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


    newGame(boardLength) {

        this._turn = this._player1.color === "white" ? this._player1 : this._player2;

        this._playing = true;
        this.newBoard(boardLength);
        this.board.printBoard();
        this.fillBoard();
        this.addEventsToBoard();
        this.board.fillLayout(this._player1, this._player2);

        this._pieces_placed = 4;
        this._possible_moves = new Array();
        this._player1.pieces = 2;
        this._player2.pieces = 2;

        this.getMoves();

    }

    fillBoard() {
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
            this._board.placePiece(piece.row, piece.col, piece.color);
        });

    }

    addEventsToBoard() {
        $("#p1-surrender").click(() => {
            this.surrender(this._player1);
        });
        $("#p2-surrender").click(() => {
            this.surrender(this._player2);
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
        return this._board.cells.filter(cell => cell.piece == color);
    }

    getMoves() {

        let cells = this.getPieces(this._turn.color);

        for (let cell of cells) {
            for (let move of this.moveDirections) {
                let move_result = this.checkMove(cell.row, cell.col, move.row, move.col, this.turn.color);
                if (move_result) 
                    this._possible_moves.push(move_result);
                
            }
        }

        for (let move of this._possible_moves) 
            this._board.showMove(move.row, move.col, this.turn.color);
        
    }

    checkMove(row, col, move_row, move_col, color, opponent_piece = false) {
        if (!this.isMoveInsideBoard(row + move_row, col + move_col)) 
            return false;
        else {
            if (this.getCell(row + move_row, col + move_col).piece === color || (!opponent_piece && !this.getCell(row + move_row, col + move_col).piece)) 
                return false;
            else if (this.getCell(row + move_row, col + move_col).piece == null && opponent_piece) 
                return { row: row + move_row, col: col + move_col, id: `${row + move_row}-${col + move_col}` };
            else if (this.getCell(row + move_row, col + move_col).piece != color) 
                return this.checkMove(row + move_row, col + move_col, move_row, move_col, color, true);
            
        }

    }

    isMoveInsideBoard(row, col){
        return (row < 1 || row > this._board.length || col < 1 || col > this._board.length) ? false : true;
    }

    placePiece(row, col) {
        this._pieces_placed += 1;

        this.clearMoves();

        this.getCell(row, col).piece = this._turn.color;
        this._board.placePiece(row, col, this._turn.color);

        this.checkCapturedPieces(row, col);

        if (this._pieces_placed === Math.pow(this._board.length, 2))
            this.endGame();

        else if (!this.checkMovesLeft(this.opponent)){
            if (!this.checkMovesLeft(this.turn)) 
                this.noMovesLeftToast();
            else
                this.skipTurnToast();
            
        } else
            this.changeTurn();

    }

    checkCapturedPieces(row, col) {

        let captured_pieces = 0;
        let captured = false;
        let row_aux = row;
        let col_aux = col;

        for (let move of this.moveDirections) {
            while (this.isMoveInsideBoard(row_aux + move.row, col_aux + move.col) && 
                    this.getCell(row_aux + move.row, col_aux + move.col).piece === this.opponent.color && !captured ) {
                if (this.isMoveInsideBoard(row_aux + move.row * 2, col_aux + move.col * 2) && 
                    this.getCell(row_aux + move.row * 2, col_aux + move.col * 2).piece === this.turn.color) {
                    
                    captured_pieces += this.captureFromTo(row, col, row_aux + move.row , col_aux + move.col, move.row, move.col);
                    captured = true;
                }

                row_aux += move.row;
                col_aux += move.col;
            }

            row_aux = row;
            col_aux = col;
            captured = false;

        }

        this.turn.pieces += captured_pieces + 1;
        this.opponent.pieces -= captured_pieces;
        this._board.updatePieces( this.turn.color, this.turn.pieces);
        this._board.updatePieces( this.opponent.color, this.opponent.pieces);
        
        if (this.opponent.pieces == 0) 
            this.winner(this.turn.name + " выиграл(а)!");    

    }

    captureFromTo(row, col, to_row, to_col, move_row, move_col) {
        let captured_pieces = 0;

        while (row != to_row || col != to_col) {
            this._board.placePiece(row + move_row, col + move_col, this._turn.color);
            this.getCell(row + move_row, col + move_col).piece = this._turn.color;
            
            row += move_row;
            col += move_col;
            captured_pieces += 1;
        }
        return captured_pieces;
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

    clearMoves() {
        this._board.hideMoves();
        this._possible_moves = [];
    }

    changeTurn() {
        this._turn = this._turn === this._player1 ? this._player2 : this._player1;
        this.getMoves();
    }

    endGame(){
        if (this._player1.pieces === this._player2.pieces)
            this.winner("Ничья");
        else
            this._player1.pieces > this._player2.pieces ? this.winner(this._player1.name + " выиграл(а)!") : this.winner(this._player2.name + " выиграл(а)!");
    }

    winner(message) {
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
            this.newGameModal();
        });

    }

    skipTurnToast() {

            Swal.fire({

                title: `У ${this.opponent.name} нет ходов`,
                position: 'center',
                confirmButtonColor: '#588c65',
                confirmButtonText: 'ок',
                showCancelButton: false,
                width: '40%',

            }).then(() => { this.getMoves(); });

    }

    noMovesLeftToast() {

            Swal.fire({

                title: `Ходов не осталось`,
                position: 'center',
                confirmButtonColor: '#588c65',
                confirmButtonText: 'ок',
                showCancelButton: false,
                width: '40%',

            }).then(() => { this.endGame(); });

    }

    surrender(player) {

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
                        this.newGameModal();
                    });

                }
            });

        }
    }

    newGameModal() {

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

        });

    }

}
