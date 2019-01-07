const Side = require('./side');
const PLAYER_TYPE = require('./playerType');
const ResPackage = require('../../model/net/resPackage');
const Request = require('request');
const BasicHp = 30;
const ROUNDMAX = 15;
const AUTODESHP = 1;
const ActionTime = 15 * 1000;
class Player {
    constructor(uid, type) {
        this.uid = uid;
        this.type = type;
        this.hasReady = this.type !== PLAYER_TYPE.USER;
        this.side = Side.UNDEFINED;
        this.basicHp = BasicHp;
        this.curHp = this.basicHp;
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
            basicHp:this.basicHp,
            animEnd:this.animEnd
        }
    }

    turn(go, round){
        this.animEnd = false;
        let roundLimit = false;
        if(go && round > ROUNDMAX){
            this.curHp = this.curHp - AUTODESHP;
            roundLimit = true
        }

        if(this.type === PLAYER_TYPE.USER){
            this.actionTimeCheck();
            let res_p = new ResPackage({
                handler:"chess",
                event:"turn",
                rawData:{
                    code:GameCode.SUCCESS,
                    side:this.side,
                    round:round,
                    lock:!go,
                    roundLimit:roundLimit,
                    curHp:this.curHp,
                    roundReduceHp : AUTODESHP
                }
            });
            BaseHandler.sendToClient(res_p,this.getWs());
        }
        else{
            if(go){
                let randTime =(Math.floor(Math.random()*3) + 1) * 1000;
                let r = this.chess.isInRoom(this.uid);
                if(r){
                    setTimeout(()=>{
                        this.aiDeal(r);
                    },randTime)
                }
            }
        }
    }

    cleanActionTimeCheck(){
        this.timeoutLock = false;
        this.timer&&clearTimeout(this.timer);
    }

    actionTimeCheck(){
        this.cleanActionTimeCheck();
        this.timer = setTimeout(()=>{
            this.timeoutLock = true;
            let r = this.chess.isInRoom(this.uid);
            if(r){
                Log.roomInfo(r.roomId, `${this.uid} 超时 自动跳过！`);
                this.userJump(r);
            }
        },ActionTime)
    }

    aiDeal(r){
        const aiUrl = `https://dchess.magiclizi.com/ai/`;
        let form = {
            boardInfo:r.board.boardInfo(false),
            side:this.side
        };
        let postBody = {
            url: aiUrl,
            json: form
        };
        Log.roomInfo(r.roomId,`当前是AI 控制 发送棋盘信息 到AI 服务器`);
        Request.post(postBody,(err,response,body)=>{
            if(err){
                Log.roomInfo(r.roomId`AI 处理 失败:${err.toString()}`);
            }
            else{
                let bodyInfo = body;
                let result = null;
                if(bodyInfo.type === "move") {
                    Log.roomInfo(r.roomId,`ai move ${JSON.stringify(bodyInfo)}`);
                    let pid = bodyInfo['pid'];
                    let x = bodyInfo['x'];
                    let y = bodyInfo['y'];
                    result = r.movePiece(pid, this.uid, x, y);
                }
                else if(bodyInfo.type === "flip"){
                    Log.roomInfo(r.roomId,`ai flip ${JSON.stringify(bodyInfo)}`);
                    let pid = bodyInfo['pid'];
                    result = r.flipPiece(pid,this.uid);
                }
                else if(bodyInfo.type === "keep"){
                    Log.roomInfo(r.roomId,`ai jump ${JSON.stringify(bodyInfo)}`);
                    this.userJump(r)
                }
                else{
                    Log.roomInfo(r.roomId,`ai action error ${JSON.stringify(bodyInfo)}`);
                }
                if(result){
                    Log.roomInfo(r.roomId,`ai action error ${JSON.stringify(result)}`);
                    this.userJump(r)
                }
            }
        });
    }

    userJump(r){
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

    getWs(){
        return ServerManager.getWsByUid(this.uid);
    }
}

module.exports = Player;