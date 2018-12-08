const Player = require('./player');
const Board = require('./board');
class Room {

    constructor(p1_uid, p2_uid) {
        this.p1 = new Player(p1_uid);
        this.p2 = new Player(p2_uid);
        this.board = new Board();
    }
}

module.exports = Room;