const ResPackage = require('./resPackage');

class ErrorPackage extends ResPackage{
    constructor(event) {
        super({});
        this.handler = 'error';
        this.event = event;
    }
}

module.exports = ErrorPackage;