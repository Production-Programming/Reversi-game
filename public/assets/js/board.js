export default class Board {

    constructor(length) {
        this._cells = new Array;
        this._board_length = length;
        this._possible_moves = new Array;
    }

    get cells() {
        return this._cells;
    }

    get length() {
        return this._board_length;
    }

    get possibleMoves() {
        return this._possible_moves;
    }

    addCell(cell) {
        this._cells.push(cell);
    }

    
    printBoard() {
        let board_HTML = "";

        for (let row = 1; row <= this._board_length; row++) {
            board_HTML += `<div class="row" style="height: ${100/this._board_length}%">`;

            for (let col = 1; col <= this._board_length; col++) {
                board_HTML += `<div class="cell d-flex justify-content-center align-items-center p-1" 
                id="${row}-${col}" style="width: ${100/this._board_length}%"></div>`;
            }

            board_HTML += `</div>`;
        }
        $("#board").html(board_HTML);
    }

    fillLayout(player1, player2){
        $("#p1").html(player1.name);
        $("#p1-color").css("backgroundImage", `url(assets/images/piece_${player1.color}.png)`);
        $("#p1-pieces").attr("id", `${player1.color}-pieces`);
        $(`#${player1.color}-pieces`).html(2);
        if (player1.color === "black"){
            $(`#${player1.color}-pieces`).addClass("text-light");
        }

        $("#p2").html(player2.name);
        $("#p2-color").css("backgroundImage", `url(assets/images/piece_${player2.color}.png)`);
        $("#p2-pieces").attr("id", `${player2.color}-pieces`);
        $(`#${player2.color}-pieces`).html(2);
        if (player2.color === "black"){
            $(`#${player2.color}-pieces`).addClass("text-light");
        }

    }

    showMove(row, col, color) {
        let piece_HTML = `<img class="img-fluid piece_placeholder" src="assets/images/piece_${color}.png">`;

        $(`#${row}-${col}`).html(piece_HTML);

        let highlightedCell = `#${row}-${col}`;
        this._possible_moves.push(highlightedCell);

    }

    hideMoves(){
        let cells = this.possibleMoves;

        for (let cell of cells) {
            $(`${cell}`).html("");
        }
        
        this._possible_moves = [];
    }

     placePiece(row, col, color){
        let piece_HTML = `<img class="img-fluid" src="assets/images/piece_${color}.png">`;
        $(`#${row}-${col}`).html(piece_HTML);
    }

    updatePieces( color, pieces){
        $(`#${color}-pieces`).html(pieces);
    }
}