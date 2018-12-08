const ResPackage = require('./resPackage');

class ErrorPackage extends ResPackage{
    constructor(event,msg) {
        super({});
        this.handler = 'error';
        this.event = event;
        this.rawData = {
            msg:msg?msg:''
        }
    }
}

module.exports = ErrorPackage;