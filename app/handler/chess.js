const Room = require('../model/game/room');
module.exports = {

    matchPool:[],

    rooms:[],

    match: function(req_p){
        let uid = req_p.rawData.uid;
        Log.info(`用户:${uid} 准备匹配对手 当前等待匹配的用户数:${this.matchPool.length}`);
        if(this.matchPool.length > 0) {
            if(!this.matchPool.includes(uid)){
                let index = Math.floor(Math.random()*this.matchPool.length);
                let oppUid = this.matchPool[index];
                Log.info(`用户 ${uid} 匹配到对手 ${oppUid}`);
                this.matchPool.splice(index, 1);
                this.rooms.push(this.createRoom(uid, oppUid));
            }
        }
        else{
            this.matchPool.push(uid);
        }
    },

    matchPc: function(req_p){
        let uid = req_p.rawData.uid;
        Log.info(`用户:${uid} 匹配 一个PC 对手`);
        let pcUid = `PC_${new Date().getTime()}`;
        this.rooms.push(this.createRoom(uid, pcUid));
    },

    createRoom: function(p1_uid, p2_uid){
        Log.info(`创建房间 p1:${p1_uid} p2:${p2_uid}`);
        return new Room(p1_uid, p2_uid);
    },

    inRoom: function(uid){

    }
};