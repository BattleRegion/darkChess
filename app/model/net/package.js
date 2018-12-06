class Package {
    constructor(opt){
        this.token = opt.token;
        this.handler = opt.handler;
        this.event = opt.event;
        this.rawData = opt.rawData;
    }
}

module.exports = Package;