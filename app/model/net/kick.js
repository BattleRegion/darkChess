const ResPackage = require('./resPackage');

class Kick extends ResPackage{
    constructor() {
        super({});
        this.handler = 'user';
        this.event = 'kick';
        this.rawData = {
            code: GameCode.SUCCESS
        }
    }
}

module.exports = Kick;