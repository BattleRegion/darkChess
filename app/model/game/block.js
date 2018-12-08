const Pieces = require('./piece');
class block  {

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.piece = null;
    }

    getPInfo(){
        if(this.piece){
            return this.piece.getCurInfo()
        }
        return null;
    }
}

module.exports = block;