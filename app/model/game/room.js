const Player = require('./player');
const Side = require('./side');
const PLAYER_TYPE = require('./playerType');
const ROOM_STATE = require('./roomState');
const Board = require('./board');
const ResPackage = require('../net/resPackage');
const DataAccess = require('dataAccess');
const Executor = DataAccess.executor;
const Command = DataAccess.command;
class Room {

    constructor(roomId, p1_uid, p2_uid, hasPc) {
        this.roomId = roomId;
        this.p1 = new Player(p1_uid, PLAYER_TYPE.USER);
        this.p2 = new Player(p2_uid, hasPc?PLAYER_TYPE.PC:PLAYER_TYPE.USER);
        if(hasPc){
            this.p2.hasReady = true;
        }
        this.roomState = ROOM_STATE.READY;
        this.board = new Board();
    }

    getUser(uid){
        if(this.p1.uid === uid){
            return this.p1;
        }
        return this.p2;
    }

    userReady(uid){
        let u = this.getUser(uid);
        if(u){
            u.hasReady = true;
            let res_p = new ResPackage({
                handler:"chess",
                event:"ready",
                rawData:{
                    result:true
                }
            });
            BaseHandler.sendToClient(res_p, u.getWs());

            if(this.p1.hasReady === true && this.p2.hasReady === true){
                //begin game
                setTimeout(()=>{
                    this.beginGame();
                },1000);
            }
        }
        else{
            Log.error(`${uid} 不存在于 room ${this.roomId} 中`);
        }
    }

    updateDBInfo(cb){
        let info = this.getDBInfo();
        let sql = new Command('update room set info = ?,state = ? where id = ?',
            [JSON.stringify(info),this.roomState,this.roomId]);
        Executor.query(DBEnv, sql, cb);
    }

    getDBInfo(){
        return{
            p1:this.p1,
            p2:this.p2,
            blocks:this.board.blocks
        }
    }

    broadcastRoomInfo(){
        Log.info(`广播 room ${this.roomId} 信息`);
        let res_p = new ResPackage({
            handler:"room",
            event:"info",
            rawData:this.getClientInfo()
        });
        BaseHandler.sendToClient(res_p, this.p1.getWs());
        BaseHandler.sendToClient(res_p, this.p2.getWs());
    }

    getClientInfo(){
        return{
            roomId:this.roomId,
            roomState: this.roomState,
            p1:this.p1,
            p2:this.p2,
            pieces: this.board.blocks.map((data)=>{
                return {
                    piece:data.getPInfo()
                }
            }).filter(data=>data.piece)
        }
    }

    beginGame(){
        this.roomState = ROOM_STATE.ING;
        this.updateDBInfo(e=>{
            if(e) {
                Log.error(`beginGameError ${e.toString()}`);
            }
            else{
                this.p1turn();
            }
        })
    }

    loopTurn(){
        if(this.p1.turn){
            this.p2turn();
        }
        else if(this.p2.turn){
            this.p1turn();
        }
    }

    p1turn(){
        Log.info(`room ${this.roomId} 轮到P1行动`);
        this.p1.turn = true;
        this.p2.turn = false;
    }

    p2turn(){
        Log.info(`room ${this.roomId} 轮到P2行动`);
        this.p1.turn = false;
        this.p2.turn = true;
        if(this.p2.type === PLAYER_TYPE.PC ){
            Log.info(`room ${this.roomId} P2 为 PC 执行AI 逻辑`);
        }
    }

    flip(uid, pieceId){
        let p = this.getUser(uid);
        if(p && p.turn){
            this.loopTurn();
            let block = this.board.findPieceBlock(pieceId);
            if(block && block.piece && !block.piece.hasFlip){
                block.piece.hasFlip = true;
                if(p.side === Side.UNDEFINED){
                    p.side = block.piece.side;
                }
                this.updateDBInfo(e=>{
                    if(!e){
                        // this.broadcastRoomInfo();
                    }
                    else{
                        this.loopTurn();
                        Log.error(`${uid} flip ${pieceId} error ${e.toString()}`);
                    }
                })
            }
            else{
                this.loopTurn();
                Log.error(`${pieceId} 不存在 或者 已经被翻过了！`);
            }
        }
        else{
            Log.error(`当前不是${uid}行动，或者${uid} 不存在 room ${this.roomId}中！`);
        }
    }
}

module.exports = Room;