class Cell {

    constructor(row, col, piece = null) {
        this._row = row; 
        this._col = col; 
        this._piece = piece;
    }

    get piece() {
        return this._piece;
    }

    get row() {
        return this._row;
    }

    get col() {
        return this._col;
    }

    set piece(color){
        this._piece = color;
    }

    isEmpty() {
        return this._piece === null ? true : false;
    }

}