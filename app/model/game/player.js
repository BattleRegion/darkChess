const Side = require('./side');
class Player {
    constructor(uid, type) {
        this.uid = uid;
        this.type = type;
        this.side = Side.UNDEFINED;
        this.turn = false;
        this.hasReady = false;
    }

    getWs(){
        return ServerManager.getWsByUid(this.uid);
    }
}

module.exports = Player;