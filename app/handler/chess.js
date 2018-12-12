const Room = require('../model/game/room');
const ResPackage = require('../model/net/resPackage');
const DataAccess = require('dataAccess');
const ROOM_STATE = require('../model/game/roomState');
const PLAYER_TYPE = require('../model/game/playerType');
const Executor = DataAccess.executor;
const Command = DataAccess.command;
module.exports = {

    matchingUsers:[],

    rooms:{},

    //匹配玩家
    match: function(req_p, ws){
        let uid = req_p.rawData.uid;
        if(!this.matchingUsers.includes(uid)){
            if(this.matchingUsers.length > 0){
                let oppUid = this.matchingUsers[0];
                this.matchingUsers.slice(0,1);
                Log.info(`用户 ${uid} 匹配到 用户 ${oppUid} 准备创建房间！当前剩余匹配列表 :${JSON.stringify(this.matchingUsers)}`);
                this.createRoom(uid, oppUid, false)
            }
            else{
                this.matchingUsers.push(uid);
                Log.info(`用户 ${uid} 加入匹配列表中. 当前剩余匹配列表 :${JSON.stringify(this.matchingUsers)} 等待其他用户匹配..`);
                BaseHandler.commonResponse(req_p, {code: GameCode.SUCCESS}, ws);
            }
        }
        else{
            Log.error(`用户${uid}已经在匹配列表中..请不要重复调用！`);
            BaseHandler.commonResponse(req_p, {code: GameCode.USER_IN_MATCH, msg: '用户已经在匹配列表中'}, ws);
        }
    },

    //取消匹配
    cancelMatch: function(req_p, ws) {
        let uid = req_p.rawData.uid;
        let needPC = req_p.rawData['needPC'];
        if(this.matchingUsers.includes(uid)){
            this.cleanUserMatch(uid);
            BaseHandler.commonResponse(req_p, {code: GameCode.SUCCESS}, ws);
        }
        else{
            Log.error(`当前用户不在匹配列表中不需要取消，剩余匹配列表${JSON.stringify(this.matchingUsers)}`);
            BaseHandler.commonResponse(req_p, {code:GameCode.CANCEL_MATCH_ERROR, msg:'用户不在匹配列表中无法取消'}, ws);
        }

        if(needPC){
            let pc_uid = `PC_${new Date().getTime()}`;
            Log.info(`用户:${uid} 尝试匹配 一个PC 对手 ${pc_uid}`);
            this.createRoom(uid, pc_uid, true)
        }
    },

    //退出房间
    quitRoom: function(req_p, ws) {
        let uid = req_p.rawData.uid;
        let roomId = req_p.rawData.roomId;
        let room = this.rooms[roomId];
        Log.info(`用户 ${uid} 尝试退出房间 ${roomId}`);
        if(room){
            if(room.hasPlayer(uid)){
                //lose
                let sql = new Command('update room set state = ? where id = ?',[ROOM_STATE.FORCE_END,roomId]);
                Executor.query(DBEnv, sql ,(e)=>{
                    if(!e){
                        //通知另一个玩家
                        let res_p = new ResPackage({
                            handler:'chess',
                            event:'userForceQuit'
                        });
                        let otherPlayer = room.getOtherPlayer(uid);
                        if(otherPlayer.type === PLAYER_TYPE.USER){
                            BaseHandler.sendToClient(res_p,room.getOtherPlayer(uid).getWs());
                        }
                        BaseHandler.commonResponse(req_p,{code:GameCode.SUCCESS},ws);
                        delete this.rooms[roomId];
                        Log.info(`用户 ${uid} 退出房间 ${roomId} 成功`)
                    }
                    else{
                        Log.error(`quit room db error ${e.toString()}`);
                    }
                })
            }
            else{
                Log.error(`quit room ${roomId} no user ${uid}`);
                BaseHandler.commonResponse(req_p,{code:GameCode.ROOM_NOT_EXIST,msg:'房间不存在，无法退出'},ws);
            }
        }
        else{
            Log.error(`quit room no room ${roomId}`);
            BaseHandler.commonResponse(req_p,{code:GameCode.ROOM_NOT_EXIST,msg:'房间不存在，无法退出'},ws);
        }
    },

    //用户ready
    ready: function(req_p, ws){
        let uid = req_p.rawData.uid;
        let roomId = req_p.rawData.roomId;
        Log.info(`用户准备！${uid} roomId:${roomId}`);
        let room = this.roomActionLegal(uid,roomId);
        if(room){
            let p = room.getPlayer(uid);
            p.hasReady = true;
            room.tryBeginGame();
            BaseHandler.commonResponse(req_p, {code:GameCode.SUCCESS},ws)
        }
        else{
            Log.error(`user ${uid} ready ${roomId} not legal`);
            BaseHandler.commonResponse(req_p, {code:GameCode.ACTION_ROOM_ERROR,msg:`操作不合法！`},ws)
        }
    },

    //翻子
    flip: function(req_p, ws){
        let uid = req_p.rawData.uid;
        let roomId = req_p.rawData.roomId;
        let pId = req_p.rawData['pId'];
        let room = this.roomActionLegal(uid,roomId);
        if(room && room.roomState === ROOM_STATE.ING){
            let result = room.flipPiece(pId,uid);
            BaseHandler.commonResponse(req_p,result,ws);
        }
        else{
            Log.error(`room ${roomId} user ${uid} flip ${pId} not legal`);
            BaseHandler.commonResponse(req_p, {code:GameCode.ACTION_ROOM_ERROR,msg:`操作不合法！`},ws)
        }
    },

    //走子
    move: function(req_p, ws){
        let uid = req_p.rawData.uid;
        let roomId = req_p.rawData.roomId;
        let pId = req_p.rawData['pId'];
        let x = req_p.rawData['x'];
        let y = req_p.rawData['y'];
        let room = this.roomActionLegal(uid,roomId);
        if(room && room.roomState === ROOM_STATE.ING){
            let result = room.movePiece(pId, uid, x, y);
            if(result){
                Log.info(`移动棋子成功:${JSON.stringify(result)}`);
                BaseHandler.commonResponse(req_p,{code:GameCode.SUCCESS,result:result},ws);
            }
            else{
                BaseHandler.commonResponse(req_p,{code:GameCode.FLIP_ERROR,msg:`移动棋子发生错误！`},ws);
            }
        }
        else{
            Log.error(`room ${roomId} user ${uid} move ${pId} not legal`);
            BaseHandler.commonResponse(req_p, {code:GameCode.ACTION_ROOM_ERROR,msg:`操作不合法！`},ws)
        }
    },


    // ------------分割线----------

    //从数据库初始化当前房间
    initCurRooms: function(callback){
        Log.info(`begin initCurRooms from db!!!`);
        let sql = new Command('select * from room where state !=3 and state != 4',[]);
        Executor.query(DBEnv, sql ,(e,r)=>{
            if(e){
                callback(e)
            }
            else{
                for(let i = 0;i<r.length;i++){
                    let info = r[i];
                    let roomId = info.id;
                    let room = new Room("","","",true);
                    room.setDBInfo(info);
                    this.rooms[roomId] = room;
                }
                callback(null);
            }
        })
    },

    //清理用户匹配状态
    cleanUserMatch: function(uid){
        for(let i = this.matchingUsers.length - 1;i>=0;i--){
            if(this.matchingUsers[i] === uid){
                this.matchingUsers.splice(i, 1);
                Log.info(`尝试取消用户${uid}匹配状态，剩余匹配列表${JSON.stringify(this.matchingUsers)}`);
                break;
            }
        }
    },

    //创建对局房间
    createRoom: function(p1_uid, p2_uid, pc){
        let exist_room = this.isInRoom(p1_uid);
        if(!exist_room){
            let room = new Room(p1_uid, p2_uid, pc);
            let info = room.roomInfo(false);
            let sql = new Command('insert into room(p1_uid,p2_uid,pc,state,info,createAt) values(?,?,?,?,?,?)',[info.p1.uid, info.p2.uid
                ,info.pc,info.state,
                JSON.stringify(info),
                ~~(new Date().getTime()/1000)]);
            Executor.query(DBEnv, sql, (e,r)=>{
                if(!e){
                    let roomId = r['insertId'];
                    room.roomId = roomId;
                    this.rooms[roomId] = room;
                    room.updateRoomInfoToDB();
                    Log.info(`创建房间成功！p1:${p1_uid} p2:${p2_uid} roomId :${roomId}`);
                    room.broadcast();
                }
                else{
                    Log.error(`create room db error : ${e.toString()}`);
                }
            })
        }
        else {
            Log.error(`用户 ${p1_uid} 存在未结束的房间 room: ${JSON.stringify(exist_room)}`);
            //todo 通知用户房间信息
            exist_room.broadcast();
        }
    },

    //判断是否在房间中
    isInRoom: function(uid){
        let keys = Object.keys(this.rooms);
        for(let i = 0;i<keys.length;i++){
            let k = keys[i];
            let r = this.rooms[k];
            if(r){
                if(r.hasPlayer(uid)){
                    return r;
                }
            }
        }
        return null;
    },

    //判断操作房间是否合法
    roomActionLegal:function(uid, roomId){
        let r = this.rooms[roomId.toString()];
        if(r && r.hasPlayer(uid)){
            return r;
        }
        return null;
    },
};