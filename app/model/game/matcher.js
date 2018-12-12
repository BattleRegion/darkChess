const Chess = require('../../../app/handler/chess');
class Matcher {
    constructor(uid) {
        this.uid = uid;
        this.timer = null;
    }

    beginMatch(cb){
        this.timer = setInterval(()=>{
            let pool = Chess.matchPool;

        },1000);
    }

    stopMatch(){

    }
}