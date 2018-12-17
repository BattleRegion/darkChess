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

    constructor(p1, p2, pc, delaySet){
        if(!delaySet){
            this.roomId = "";
            this.roomState = ROOM_STATE.READY;
            this.pc = pc;
            this.p1 = new Player(p1, PLAYER_TYPE.USER);
            this.p2 = new Player(p2, this.pc?PLAYER_TYPE.PC:PLAYER_TYPE.USER);
            this.board = new Board();
            this.curTurn = 0;
            this.round = 0;
        }
    }

    setChess(chess){
        this.p1.chess = chess;
        this.p2.chess = chess;
    }

    setDBInfo(info){
        let infoObj = info;
        let boardInfo = JSON.parse(infoObj.info);
        this.roomId = infoObj.id;
        this.roomState = infoObj.state;
        this.pc = infoObj.pc === 1;
        this.round = infoObj.round?infoObj.round:0;
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
            round:this.round,
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
        this.broadcastSend(res_p);
    }

    broadcastSend(res_p){
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

    getPlayerBySide(side){
        if(this.p1.side === side){
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

    swapTurn(uid, cb){
        Log.info(`swapTurn ${uid}`);
        let p = this.getPlayer(uid);
        p.animEnd = true;
        let otherP = this.getOtherPlayer(uid);
        if(otherP.type === PLAYER_TYPE.PC){
            otherP.animEnd = true;
            Log.info(`另外一个是PC 不用播放动画`);
        }
        if(p.animEnd && otherP.animEnd){
            Log.info(`双方动画都结束，进入下一轮`);
            if(this.curTurn === 0){
                this.curTurn = 1;
            }
            else{
                this.curTurn = 0;
            }

            if(this.p1.curHp <=0 || this.p2.curHp <=0){
                this.updateRoomInfoToDB(()=>{
                    let res_p = {
                        handler:'chess',
                        event:'roomEnd',
                        rawData: {
                            code:GameCode.SUCCESS,
                            winSide: this.p1.curHp <= 0? this.p2.side:this.p1.side
                        }
                    };
                    this.broadcastSend(res_p);
                    cb(true);
                },ROOM_STATE.END);
            }
            else{
                this.turnUser();
                this.updateRoomInfoToDB();
                cb(false);
            }
        }
        else{
            cb(false);
        }
    }

    turnUser(){
        Log.info(`turnUser ${this.roomId}`);
        if(this.curTurn===0){
            this.p1.turn(true,this.round);
            this.p2.turn(false,this.round);
        }
        else{
            this.p1.turn(false,this.round);
            this.p2.turn(true,this.round);
        }
        this.round = this.round + 1
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
                this.storeAction('flip',{
                    uid:uid,
                    piece:piece
                });
                this.updateRoomInfoToDB();
                let res_p = {
                    handler:'chess',
                    event:'flip',
                    rawData:{
                        code:GameCode.SUCCESS,
                        piece:piece.clientInfo()
                    }
                };
                this.broadcastSend(res_p);
                return null;
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
                let moveResult = piece.canMove(x,y,this.board);
                if(moveResult === 1){
                    Log.info(`${JSON.stringify(piece)} 移动到 ${x} ${y}`);
                    this.storeAction('move',{
                        uid:uid,
                        piece:piece,
                        x:x,
                        y:y
                    });
                    let b = this.board.getBlock(piece.x,piece.y);
                    piece.move(b, this.board, false);
                    this.updateRoomInfoToDB();
                    let res_p =  {
                        handler:'chess',
                        event:'move',
                        rawData:{
                            code:GameCode.SUCCESS,
                            atkPiece:piece,
                            defPiece:null,
                            p1Hp:this.p1.curHp,
                            p2Hp:this.p2.curHp
                        }
                    };
                    this.broadcastSend(res_p);
                    return null;
                }
                else if(moveResult === 2){
                    let atkBlock = this.board.getBlock(x, y);
                    Log.info(`${JSON.stringify(piece)} 攻击 ${JSON.stringify(atkBlock.piece)}`);
                    this.storeAction('atk',{
                        uid:uid,
                        piece:piece,
                        atkPiece:atkBlock.piece
                    });
                    let deadPiece = piece.atk(atkBlock, this.board);
                    let p = this.getPlayerBySide(deadPiece.side);
                    p.curHp = p.curHp - deadPiece.hp;
                    Log.info(`攻击后死亡的棋子为:${JSON.stringify(deadPiece)} 受伤的玩家为 ${JSON.stringify(p.playerInfo())}`);
                    this.updateRoomInfoToDB();
                    let res_p =  {
                        handler:'chess',
                        event:'move',
                        rawData:{
                            code:GameCode.SUCCESS,
                            atkPiece:piece,
                            defPiece:atkBlock.piece,
                            p1Hp:this.p1.curHp,
                            p2Hp:this.p2.curHp
                        }
                    };
                    this.broadcastSend(res_p);
                    return null;
                }
                else{
                    return {
                        code:moveResult
                    }
                }
            }
            else{
                Log.error(`尝试移动一个不属于自己的颜色 ${player.side} ${piece?piece.side:'piece null'} roomId ${this.roomId} hasFlip ${piece?piece.hasFlip:'piece null'}`);
                return {
                    code: GameCode.MOVE_ILLEGAL
                }
            }
        }
        else{
            return {
                code : GameCode.NOT_YOUR_TURN
            }
        }
    }

    storeAction(action,detail){
        let sql = new Command('insert into action(roomId,round,action,detail,createAt) values(?,?,?,?,?)',
            [this.roomId,this.round,action,JSON.stringify(detail),~~(new Date().getTime()/1000)]);
        Executor.query(DBEnv,sql,(e,r)=>{
            if(e){
                Log.error(`store action error ${e.toString()}`)
            }
        })
    }
}

module.exports = Room;