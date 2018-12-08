const Room = require('../model/game/room');
const DataAccess = require('dataAccess');
const Executor = DataAccess.executor;
const Command = DataAccess.command;
const ROOM_STATE = require('../model/game/roomState');
const ResPackage = require('../model/net/resPackage');
module.exports = {

    rooms:{},

    initRooms:function(cb){
        let sql = new Command('select * from room where state != ?',[ROOM_STATE.END]);
        Executor.query(DBEnv, sql, (e,r)=>{

        })
    },

    checkInRoom: function(req_p, ws){
        let uid = req_p.rawData.uid;
        Log.info(`查询用户:${uid} 是否有存在的棋局`);
        this.hasPlaying(uid, (e,r)=>{
            if(!e){
                let info = null;
                if(r.length > 0){
                    let roomId = r[0].id;
                    let room = this.rooms[roomId];
                    if(room){
                        info = room.getClientInfo();
                    }
                    else{
                        Log.error(`数据库中存在 room ${roomId} 但是内存中不存在！`);
                    }
                }
                let res_p = new ResPackage({
                    handler:req_p.handler,
                    event:req_p.event,
                    rawData:{
                        info:info
                    }
                });
                BaseHandler.sendToClient(res_p, ws);
            }
            else{
                Log.error(`${uid} checkInRoom error ${e.toString()}`);
                BaseHandler.errorSend("checkInRoom", "db error!", ws);
            }
        })
    },

    matchPc: function(req_p, ws){
        let uid = req_p.rawData.uid;
        let pc_uid = `PC_${new Date().getTime()}`;
        Log.info(`用户:${uid} 尝试匹配 一个PC 对手 ${pc_uid}`);
        this.hasPlaying(uid, (e,r)=>{
            if(!e){
                if(r.length === 0){
                    let sql = new Command('insert into room(p1_uid,p2_uid,createAt) values(?,?,?)',[uid, pc_uid, ~~(new Date().getTime()/1000)]);
                    Executor.query(DBEnv, sql, (e,r)=>{
                        if(!e){
                            let roomId = r['insertId'];
                            let room = new Room(roomId, uid, pc_uid, true);
                            room.updateDBInfo((e)=>{
                                if(!e){
                                    this.rooms[roomId] = room;
                                    room.broadcastRoomInfo();
                                }
                                else{
                                    Log.error(`matchPc error : ${e.toString()}`);
                                }
                            })
                        }
                        else{
                            Log.error(`matchPc error : ${e.toString()}`);
                        }
                    })
                }
                else{
                    Log.error(`${uid} matchPc error : user has in room`);
                    BaseHandler.errorSend("matchPc", "user has in room", ws);
                }
            }
            else{
                Log.error(`matchPc error : ${e.toString()}`);
            }
        })
    },

    ready: function(req_p, ws){
        let uid = req_p.rawData.uid;
        let roomId = req_p.rawData.roomId;
        let r = this.rooms[roomId];
        if(r){
            r.userReady(uid);
        }
        else{
            Log.error(`${uid} ready error, room not exist`);
            BaseHandler.errorSend("ready","room not exist", ws);
        }
    },

    flip: function(req_p, ws){
        let uid = req_p.uid;
        let roomId = req_p.rawData.roomId;
        let pieceId = req_p['pieceId'];
        let r = this.rooms[roomId];
        if(r){
            r.flip(uid, pieceId);
        }
        else{
            Log.error(`${uid} ready error, room not exist`);
            BaseHandler.errorSend("ready","room not exist", ws);
        }
    },

    move: function(req_p, ws){

    },

    hasPlaying: function(uid, cb){
        let sql = new Command('select id,info from room where p1_uid = ? or p2_uid = ? and state != 3',[uid,uid]);
        Executor.query(DBEnv, sql ,cb)
    }
};