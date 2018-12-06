const ResPackage = require('../net/resPackage');

class Kick extends ResPackage{
    constructor() {
        super({});
        this.handler = 'user';
        this.event = 'kick';
    }
}

module.exports = Kick;