class Player {

    constructor(player, color) {
        this._name = player;
        this._color = color;
        this._pieces = 2;
    }

    get name() {
        return this._name;
    }

    get color() {
        return this._color;
    }

    get pieces() {
        return this._pieces;
    }
    
    set pieces(pieces) {
        this._pieces = pieces
    }
}