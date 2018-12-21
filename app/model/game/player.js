const Side = require('./side');
const PLAYER_TYPE = require('./playerType');
const ResPackage = require('../../model/net/resPackage');
const Request = require('request');
class Player {
    constructor(uid, type) {
        this.uid = uid;
        this.type = type;
        this.hasReady = this.type !== PLAYER_TYPE.USER;
        this.side = Side.UNDEFINED;
        this.curHp = 60;
        this.animEnd = false;
        this.chess = null;
        this.timer = null;
        this.timeoutLock = false;
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

    beginTimer(){
        this.clearTimer();
        const timeout = 1500;
        this.timer = setTimeout(()=>{
            this.clearTimer();
            this.timeoutLock = true;
            Log.info(`用户 ${this.uid}操作 ${timeout} 超时`);
            this.chess.forceTurnUser(this.uid);
        },timeout)
    }

    clearTimer(){
        this.timer&&clearTimeout(this.timer);
        this.timer = null;
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
            this.timeoutLock = false;
            BaseHandler.sendToClient(res_p,this.getWs());
            // this.beginTimer();
        }
        else{
            if(go){
                Log.info(`PC ${this.uid} AI行动`);
                let r = this.chess.isInRoom(this.uid);
                if(r){
                    const aiUrl = `https://dchess.magiclizi.com/ai/`;
                    let form = {
                            boardInfo:r.board.boardInfo(false),
                            side:this.side
                    };
                    let postBody = {
                        'content-type': 'application/json',
                        url: aiUrl,
                        json: form
                    };
                    Log.info(`发送到AI 服务器`);
                    Log.info(JSON.stringify(form));
                    Request.post(postBody,(err,response,body)=>{
                        if(err){
                            Log.error(`AI 处理 失败:${err.toString()}`);
                        }
                        else{
                            let bodyInfo = JSON.parse(body);
                            if(bodyInfo.type === "move") {
                                Log.info(`ai move ${body}`);
                            }
                            else if(bodyInfo.type === "flip"){
                                Log.info(`ai flip ${body}`);
                            }

                            //跳过
                            let res_p = {
                                handler:'chess',
                                event:'jumpAction',
                                rawData: {
                                    code:GameCode.SUCCESS,
                                    side:this.side
                                }
                            };
                            r.broadcastSend(res_p);
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