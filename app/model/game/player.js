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
        this.animEnd = false;
        this.chess = null;
    }

    playerInfo(){
        return {
            uid:this.uid,
            type:this.type,
            hasReady:this.hasReady,
            side:this.side,
            curHp:this.curHp,
            animEnd:this.animEnd
        }
    }

    turn(go, round){
        this.animEnd = false;
        if(this.type === PLAYER_TYPE.USER){
            let res_p = new ResPackage({
                handler:"chess",
                event:"turn",
                rawData:{
                    code:GameCode.SUCCESS,
                    side:this.side,
                    round:round,
                    lock:!go
                }
            });
            BaseHandler.sendToClient(res_p,this.getWs());
        }
        else{
            if(go){
                Log.info(`PC ${this.uid} AI行动`);
                let r = this.chess.isInRoom(this.uid);
                if(r){
                    r.swapTurn(this.uid, end=>{
                        if(end){
                            //game end romove room
                            this.chess.cleanRoomInfo(r.roomId);
                        }
                    });
                }
            }
        }
    }

    getWs(){
        return ServerManager.getWsByUid(this.uid);
    }
}

module.exports = Player;