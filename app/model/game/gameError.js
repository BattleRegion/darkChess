const ResPackage = require('../net/resPackage');

class GameError extends ResPackage{
    constructor(code, message) {
        super({});
        this.handler = "gameError";
        this.rawData = {
            code:code,
            message:message
        }
    }
}

module.exports = GameError;