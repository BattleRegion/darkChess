
class Player {
    constructor(uid) {
        this.uid = uid;
        this.ws = ServerManager.getWsByUid(this.uid);
    }
}

module.exports = Player;