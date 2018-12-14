const Player = require('./player');
const Side = require('./side');
const PLAYER_TYPE = require('./playerType');
const ROOM_STATE = require('./roomState');
const Board = require('./board');
const ResPackage = require('../net/resPackage');
const DataAccess = require('dataAccess');
const Executor = DataAccess.executor;
const Command = DataAccess.command;
const MOVE_ACTION = require('./moveAction');
class Room {

    constructor(p1, p2, pc, delaySet){
        if(!delaySet){
            this.roomId = "";
            this.roomState = ROOM_STATE.READY;
            this.pc = pc;
            this.p1 = new Player(p1, PLAYER_TYPE.USER);
            this.p2 = new Player(p2, this.pc?PLAYER_TYPE.PC:PLAYER_TYPE.USER);
            this.board = new Board();
            this.curTurn = 0;
        }
    }

    setDBInfo(info){
        let infoObj = info;
        let boardInfo = JSON.parse(infoObj.info);
        this.roomId = infoObj.id;
        this.roomState = infoObj.state;
        this.pc = infoObj.pc === 1;

        this.curTurn = boardInfo.curTurn?boardInfo.curTurn:0;

        this.p1 = new Player(infoObj['p1_uid'], PLAYER_TYPE.USER);
        this.p1.hasReady = boardInfo.p1.hasReady;
        this.p1.side = boardInfo.p1.side;
        this.p1.curHp = boardInfo.p1.curHp;

        this.p2 = new Player(infoObj['p2_uid'], this.pc ? PLAYER_TYPE.PC : PLAYER_TYPE.USER);
        this.p2.hasReady = boardInfo.p2.hasReady;
        this.p2.side = boardInfo.p2.side;
        this.p2.curHp = boardInfo.p2.curHp;

        this.board = new Board(true);
        this.board.setDBInfo(boardInfo.board)
    }

    roomInfo(client){
        return {
            roomId: this.roomId,
            roomState : this.roomState,
            p1:this.p1.playerInfo(),
            p2:this.p2.playerInfo(),
            pc:this.pc,
            curTurn:this.curTurn,
            state:this.roomState,
            board:this.board.boardInfo(client)
        }
    }

    broadcast(){
        let info = this.roomInfo(true);
        info.code = GameCode.SUCCESS;
        let res_p = new ResPackage({
            handler:'chess',
            event:'roomInfo',
            rawData:info
        });
        BaseHandler.sendToClient(res_p, this.p1.getWs());
        if(!this.pc){
            BaseHandler.sendToClient(res_p, this.p2.getWs());
        }
    }

    updateRoomInfoToDB(cb,state){
        let sql = new Command('update room set info = ? where id = ?',[JSON.stringify(this.roomInfo(false)), this.roomId]);
        if(state){
            sql = new Command('update room set info = ?,state = ? where id = ?',[JSON.stringify(this.roomInfo(false)),state, this.roomId]);
        }
        Executor.query(DBEnv, sql, (e)=>{
            if(e){
                Log.error(`updateRoomInfoToDB error :${e.toString()}`);
            }
            cb&&cb();
        });
    }

    hasPlayer(uid){
        if(this.p1.uid === uid || this.p2.uid === uid){
            return true;
        }
        return false;
    }

    getOtherPlayer(uid){
        if(this.p1.uid !== uid){
            return this.p1;
        }
        return this.p2;
    }

    getPlayer(uid){
        if(this.p1.uid === uid){
            return this.p1;
        }
        return this.p2;
    }

    tryBeginGame(){
        if(this.p1.hasReady && this.p2.hasReady) {
            this.roomState = ROOM_STATE.ING;
            this.turnUser();
            this.updateRoomInfoToDB(null,this.roomState);
        }
        else{
            this.updateRoomInfoToDB();
        }
    }

    turnUser(){
        if(this.curTurn===0){
            this.p1.turn(true);
            this.p2.turn(false);
        }
        else{
            this.p1.turn(false);
            this.p2.turn(true);
        }
    }

    canTurn(player){
        if(player === this.p1 && this.curTurn === 0){
            return true;
        }
        if(player === this.p2 && this.curTurn === 1){
            return true;
        }
        Log.error(`当前并不是${player.uid}的回合，不能行动！`);
        return false;
    }

    flipPiece(pId,uid){
        let player = this.getPlayer(uid);
        if(this.canTurn(player)){
            let piece = this.board.findPiece(pId);
            if(piece){
                if(player.side !== Side.UNDEFINED && player.side !== piece.side){
                    Log.error(`${uid} 尝试翻一个 不属于 自己的颜色 ${player.side} ${piece.side} ${this.roomId}`);
                    return {
                        code : GameCode.FLIP_NOT_YOUR_SIDE
                    }
                }
                else{
                    if(player.side === Side.UNDEFINED){
                        player.side = piece.side;
                        let otherPlayer = this.getOtherPlayer(uid);
                        if(player.side === Side.BLACK){
                            otherPlayer.side = Side.RED;
                        }
                        else{
                            otherPlayer.side = Side.BLACK;
                        }
                    }
                    piece.hasFlip = true;
                    this.updateRoomInfoToDB();
                    return {
                        code:GameCode.SUCCESS,
                        piece:piece.clientInfo()
                    }
                }
            }
            else{
                return {
                    code : GameCode.PIECE_NOT_FIND
                }
            }
        }
        else{
            return {
                code : GameCode.NOT_YOUR_TURN
            }
        }
    }

    movePiece(pId,uid,x,y){
        let player = this.getPlayer(uid);
        if(this.canTurn(player)){
            let piece = this.board.findPiece(pId);
            if(piece && piece.side === player.side && piece.hasFlip){
                if(piece.canMove(x,y,this.board)){

                }
                else{
                    Log.error(`棋子移动非法 ${JSON.stringify(piece)} ${x} ${y}`);
                }
            }
            else{
                Log.error(`尝试翻一个不属于自己的颜色 ${player.side} ${piece.side} roomId ${this.roomId} hasFlip ${piece.hasFlip}`)
            }
        }
        return null;
    }
}

module.exports = Room;