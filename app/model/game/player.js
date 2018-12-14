const Side = require('./side');
const PLAYER_TYPE = require('./playerType');
const ResPackage = require('../../model/net/resPackage');
class Player {
    constructor(uid, type) {
        this.uid = uid;
        this.type = type;
        this.hasReady = this.type !== PLAYER_TYPE.USER;
        this.side = Side.UNDEFINED;
        this.curHp = 60;
    }

    playerInfo(){
        return {
            uid:this.uid,
            type:this.type,
            hasReady:this.hasReady,
            side:this.side,
            curHp:this.curHp
        }
    }

    turn(go){
        if(this.type === PLAYER_TYPE.USER){
            let res_p = new ResPackage({
                handler:"chess",
                event:"turn",
                rawData:{
                    code:GameCode.SUCCESS,
                    lock:!go
                }
            });
            BaseHandler.sendToClient(res_p,this.getWs());
        }
        else{
            if(go){
                Log.info(`PC ${this.uid} AI行动`)
            }
        }
    }

    getWs(){
        return ServerManager.getWsByUid(this.uid);
    }
}

module.exports = Player;