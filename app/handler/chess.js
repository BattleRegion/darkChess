const Room = require('../model/game/room');
const ResPackage = require('../model/net/resPackage');
const DataAccess = require('dataAccess');
const ROOM_STATE = require('../model/game/roomState');
const PLAYER_TYPE = require('../model/game/playerType');
const CryptoUtil = require('../../util/cryptoUtil');
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
            // BaseHandler.commonResponse(req_p, {code:GameCode.CANCEL_MATCH_ERROR, msg:'用户不在匹配列表中无法取消'}, ws);
            BaseHandler.commonResponse(req_p, {code: GameCode.SUCCESS}, ws);
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
        let room = this.isInRoom(uid);
        if(room){
            let roomId = room.roomId;
            Log.roomInfo(roomId,`用户 ${uid} 尝试退出房间 ${roomId}`);
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
                    this.cleanRoomInfo(roomId);
                    Log.roomInfo(roomId,`用户 ${uid} 退出房间 ${roomId} 成功`)
                }
                else{
                    Log.roomInfo(roomId,`quit room db error ${e.toString()}`);
                }
            })
        }
        else{
            Log.error(`quit room no room`);
            BaseHandler.commonResponse(req_p,{code:GameCode.SUCCESS},ws);
            // BaseHandler.commonResponse(req_p,{code:GameCode.ROOM_NOT_EXIST,msg:'房间不存在，无法退出'},ws);
        }
    },

    //用户ready
    ready: function(req_p, ws){
        let uid = req_p.rawData.uid;
        let roomId = req_p.rawData.roomId;
        Log.roomInfo(roomId,`ready receive ${JSON.stringify(req_p.rawData)}`);
        let room = this.roomActionLegal(uid,roomId);
        if(room){
            let p = room.getPlayer(uid);
            p.hasReady = true;
            room.tryBeginGame();
            BaseHandler.commonResponse(req_p, {code:GameCode.SUCCESS},ws);
            room.storeAction("ready",{
                uid:uid,
            },uid)
        }
        else{
            Log.roomInfo(roomId,`user ${uid} ready ${roomId} not legal`);
            BaseHandler.commonResponse(req_p, {code:GameCode.ACTION_ROOM_ERROR,msg:`操作不合法！`},ws)
        }
    },

    //翻子
    flip: function(req_p, ws){
        let uid = req_p.rawData.uid;
        let roomId = req_p.rawData.roomId;
        let pId = req_p.rawData['pId'];
        Log.roomInfo(roomId,`flip receive ${JSON.stringify(req_p.rawData)}`);
        let room = this.roomActionLegal(uid,roomId);
        if(room && room.roomState === ROOM_STATE.ING){
            let result = room.flipPiece(pId,uid);
            if(result){
                Log.roomInfo(roomId,`${uid} flip error ${JSON.stringify(result)}`);
                BaseHandler.commonResponse(req_p,result,ws);
            }
        }
        else{
            Log.roomInfo(roomId,`room ${roomId} state ${room.roomState} user ${uid} flip ${pId} not legal`);
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
        Log.roomInfo(roomId,`move receive ${JSON.stringify(req_p.rawData)}`);
        if(room && room.roomState === ROOM_STATE.ING){
            let result = room.movePiece(pId, uid, x, y);
            if(result){
                Log.roomInfo(roomId,`${uid} move error ${JSON.stringify(result)}`);
                BaseHandler.commonResponse(req_p,result,ws);
            }
        }
        else{
            Log.roomInfo(roomId,`room ${roomId} state:${room.roomState} user ${uid} move ${pId} not legal`);
            BaseHandler.commonResponse(req_p, {code:GameCode.ACTION_ROOM_ERROR,msg:`操作不合法！`},ws)
        }
    },

    //行为动画结束
    actionAniEnd:function(req_p,ws){
        let round = req_p.rawData.round;
        let uid = req_p.rawData.uid;
        let roomId = req_p.rawData.roomId;
        let room = this.roomActionLegal(uid,roomId);
        Log.roomInfo(roomId,`actionAniEnd receive ${JSON.stringify(req_p.rawData)}`);
        if(room && room.roomState === ROOM_STATE.ING){
            room.storeAction("actionAniEnd",{
                uid:uid,
                round:round
            },uid);
            room.swapTurn(uid, end=>{
                if(end){
                    //game end romove room
                    this.cleanRoomInfo(roomId);
                }
            });
        }
        else{
            Log.roomInfo(roomId,`room ${roomId} state ${room.roomState} user ${uid} actionAniEnd not legal`);
            BaseHandler.commonResponse(req_p, {code:GameCode.ACTION_ROOM_ERROR,msg:`操作不合法！`},ws)
        }
    },

    //是否在房间中
    inRoom:function(req_p,ws){
        let uid = req_p.rawData.uid;
        let exist_room = this.isInRoom(uid);
        if(exist_room){
            BaseHandler.commonResponse(req_p, {code: GameCode.SUCCESS, roomInfo: exist_room.roomInfo(true)}, ws);
        }
        else{
            BaseHandler.commonResponse(req_p, {code: GameCode.SUCCESS}, ws);
        }
    },

    //恢复房间
    recoverRoom:function(req_p,ws){
        let uid = req_p.rawData.uid;
        let exist_room = this.isInRoom(uid);
        if(exist_room){
            BaseHandler.commonResponse(req_p, {code: GameCode.SUCCESS, roomInfo: exist_room.roomInfo(true)}, ws);
        }
        else{
            BaseHandler.commonResponse(req_p, {code: GameCode.ROOM_NOT_EXIST}, ws);
        }
    },

    //recover ready
    recoverReady:function(req_p,ws){
        let uid = req_p.rawData.uid;
        let exist_room = this.isInRoom(uid);
        if(exist_room){
            let round  = exist_room.round;
            let sql = new Command('select * from action where roomId = ? and round = ? order by id desc',
                [exist_room.roomId,round]);
            Executor.query(DBEnv, sql, (e,r)=> {
                if (!e) {
                    let hasAction = false;
                    let hasNotifyEnd = false;
                    for(let i = 0;i<r.length;i++){
                        let act = r[i];
                        if(act['action'] === "flip" || act['action'] === "move" ||
                            act["action"] === "atk"){
                            hasAction = true;break;
                        }

                        if(act['uid'] === uid && act['action'] === 'actionAniE'){
                            hasNotifyEnd = true;
                        }
                    }

                    if(hasAction && !hasNotifyEnd){
                        //设置恢复用户 end
                        exist_room.storeAction("actionAniEnd",{
                            uid:uid,
                            round:round
                        },uid);
                        exist_room.swapTurn(uid, end=>{
                            if(end){
                                //game end remove room
                                this.cleanRoomInfo(exist_room.roomId);
                            }
                        });
                    }
                }
                else {
                    Log.roomInfo(exist_room.roomId,`recover room error : ${e.toString()}`);
                    BaseHandler.commonResponse(req_p, {code: GameCode.RECOVER_ROOM_ERROR}, ws);
                }
            })
        }
        else{
            BaseHandler.commonResponse(req_p, {code: GameCode.ROOM_NOT_EXIST}, ws);
        }
    },

    //邀请好友
    inviteFriend:function(req_p,ws){
        let uid = req_p.rawData.uid;
        this.createRoom(uid, -1, false, room => {
            let rId = CryptoUtil.toSecret(room.roomId, CommonConf['roomId_key']);
            BaseHandler.commonResponse(req_p,{code:GameCode.SUCCESS,roomId:rId},ws);
        });
    },

    //进入好友房间
    joinFriendRoom:function(req_p,ws){
        try{
            let uid = req_p.rawData['uid'];
            let sRoomId = req_p.rawData['roomId'];
            let roomId = CryptoUtil.toBasic(sRoomId, CommonConf['roomId_key']);
            let r = this.rooms[roomId];
            if(r){
                if(r.p2.uid === -1){
                    r.joinRoom(uid);
                }
                else{
                    Log.error(`joinFriendRoom error room ${roomId} has been join uid ${r.p2.uid}!`);
                    BaseHandler.commonResponse(req_p,{code:GameCode.ROOM_HAS_BEEN_JOIN},ws);
                }
            }
            else{
                Log.error(`joinFriendRoom error room ${roomId} not exist!`);
                BaseHandler.commonResponse(req_p,{code:GameCode.JOIN_FRIEND_ROOM_ERROR},ws);
            }
        }
        catch (e) {
            Log.error(`joinFriendRoom error ${e.toString()}`);
            BaseHandler.commonResponse(req_p,{code:GameCode.JOIN_FRIEND_ROOM_ERROR},ws);
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
                    room.setChess(this);
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

    //realCreate
    realCreateRoom: function(p1_uid, p2_uid, pc, cb){
        let room = new Room(p1_uid, p2_uid, pc);
        room.setChess(this);
        let createAt =  ~~(new Date().getTime()/1000);
        room.createAt = createAt;
        let info = room.roomInfo(false);
        let sql = new Command('insert into room(p1_uid,p2_uid,pc,state,info,createAt) values(?,?,?,?,?,?)',[info.p1.uid, info.p2.uid
            ,info.pc,info.state,
            JSON.stringify(info),
            createAt]);
        Executor.query(DBEnv, sql, (e,r)=>{
            if(!e){
                let roomId = r['insertId'];
                room.roomId = roomId;
                this.rooms[roomId] = room;
                room.updateRoomInfoToDB();
                Log.roomInfo(roomId,`创建房间成功！p1:${p1_uid} p2:${p2_uid} roomId :${roomId}`);
                room.broadcast();
                cb&&cb(room);
            }
            else{
                Log.error(`create room db error : ${e.toString()}`);
            }
        })
    },

    //创建对局房间
    createRoom: function(p1_uid, p2_uid, pc, cb){
        let exist_room = this.isInRoom(p1_uid);
        if(!exist_room){
            this.realCreateRoom(p1_uid, p2_uid, pc, cb);
        }
        else {
            //todo 通知用户房间信息
            Log.error(`用户 ${p1_uid} 存在未结束的房间 room: ${exist_room.roomId}`);
            exist_room.broadcast();
            // let curDate = ~~(new Date().getTime()/1000);
            // let roomCreateAt = ~~(exist_room.createAt);
            // let timeoutDis = 60 * 30;
            // Log.error(`用户 ${p1_uid} 存在未结束的房间 room: ${exist_room.roomId} 当前时间${curDate} 房间创建时间 ${roomCreateAt}`);
            // if(curDate - roomCreateAt >= timeoutDis){
            //     //todo
            //     Log.info(`房间超时，创建新的房间`);
            //     exist_room.updateRoomInfoToDB(()=>{
            //         this.cleanRoomInfo(exist_room.roomId);
            //         this.realCreateRoom(p1_uid, p2_uid, pc, cb);
            //     },ROOM_STATE.END);
            // }
            // else{
            //     //todo 通知用户房间信息
            //     exist_room.broadcast();
            // }
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

    //清除房间
    cleanRoomInfo(roomId){
        delete this.rooms[roomId];
        Log.info(`从缓存中清理房间信息 ${roomId} 剩余房间为:`);
        Object.keys(this.rooms).forEach(function(rid){
            Log.info(rid);
        });
    },

    //force
    forceTurnUser(uid){
        let exist_room = this.isInRoom(uid);
        if(exist_room){
            Log.info(`force turn user ${exist_room.roomId} ${uid}`)
            exist_room.turnUser();
        }
    }
};