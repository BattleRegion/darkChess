// const WebSocket = require('ws');
//
// const ws = new WebSocket('ws://127.0.0.1:8888');
//
// ws.on('open', function open() {
//     debugLogin(2,ws);
// });
//
// ws.on('message', function incoming(data) {
//     console.log(`收到数据:${data}`);
//     let obj = JSON.parse(data);
//     if(obj.handler === "user" && obj.event === "debugLogin") {
//         this.token = obj.rawData.token;
//         match(this.token,ws);
//
//         setTimeout(()=>{
//             cancel(this.token,true, ws);
//         },1000);
//     }
//     if(obj.handler === "chess" && obj.event === "roomInfo") {
//         // ready(this.token,1,ws)
//         move(this.token,1,1,0,4,ws);
//     }
// });
//
// ws.on('close', function() {
//    console.log('close')
// });
//
// const CryptoUtil = require('./util/cryptoUtil');
// const sign = 'ead1e30473cd33ad4c2d6e634a2e94eae17460a7e725cb696f9e3b60e59ec66af05c0c893b8f9ac00ad13fd1ddcf58600e8fd5ccdff19da295336bbf684ecbe8';
//
// function debugLogin(uid,ws){
//     let param = {
//         handler:'user',
//         event:'debugLogin',
//         rawData:{
//             uid:uid
//         }
//     };
//     send(param, ws);
// }
//
// function move(token,roomId,pieceId,x,y,ws){
//     let p = {
//         handler:'chess',
//         event:'move',
//         rawData: {
//             token:token,
//             roomId:roomId,
//             pId:pieceId,
//             x:x,
//             y:y
//         }
//     };
//     send(p, ws)
// }
//
// function flip(token,roomId,pieceId,ws){
//     let p = {
//         handler:'chess',
//         event:'flip',
//         rawData: {
//             token:token,
//             roomId:roomId,
//             pId:pieceId
//         }
//     };
//     send(p, ws)
// }
//
// function ready(token,roomId,ws) {
//     let p = {
//         handler:'chess',
//         event:'ready',
//         rawData: {
//             token:token,
//             roomId:roomId
//         }
//     };
//     send(p, ws)
// }
//
// function match(token, ws){
//     let p = {
//         handler:'chess',
//         event:'match',
//         rawData: {
//             token:token
//         }
//     };
//     send(p, ws)
// }
//
// function cancel(token,needPC, ws){
//     let p = {
//         handler:'chess',
//         event:'cancelMatch',
//         rawData: {
//             token:token,
//             needPC:needPC
//         }
//     };
//     send(p, ws)
// }
//
// function forceQuit(token,roomId,ws){
//     let p = {
//         handler:'chess',
//         event:'quitRoom',
//         rawData: {
//             token:token,
//             roomId:roomId
//         }
//     };
//     send(p, ws)
// }
//
// function send(param, ws){
//     let objStr = Object.keys(param).filter(k => {
//         if(param[k]){
//             return k;
//         }
//         return null;
//     }).sort().map(key => {
//         return encodeURIComponent(key) + '=' + encodeURIComponent(param[key])
//     }).join('&');
//     let md5Str = `${objStr}_${sign}`;
//     let crc = CryptoUtil.toMD5(md5Str);
//     param.crc = crc;
//     ws.send(JSON.stringify(param));
// }
// const log = require('./util/log');
//
// log.roomInfo(1,"测试");

const DataAccess = require('dataAccess');
DataAccess.setPoolConfig(require('./conf/mysql'));
const Command = DataAccess.command;
const Executor = DataAccess.executor;
const PlayerType = require('./app/model/game/playerType');

function calculate_ELO(win,lose,pc,cb){
    let basicScore = 1000;
    let k = 50;
    if(pc){
        let eloOff = 10;
        let playerUid = win.uid;
        if(win.type === PlayerType.PC){
            eloOff = -10;
            playerUid = lose.uid;
        }
        let sql = new Command('select elo from rank where id = ?',[playerUid]);
        Executor.query("local",sql,(e,r)=>{
            if(!e){
                let sql1 = new Command('update rank set elo = elo + ? where id = ?',[eloOff, playerUid]);
                if(r.length === 0){
                    sql1 = new Command('insert into rank(id, elo) values(?,?)',[playerUid, basicScore + eloOff]);
                }
                Executor.query('local', sql1, cb)
            }
            else{
                cb(e, {})
            }
        })
    }
    else{
        let sql = new Command('select elo from rank where id = ?',[winPlayer.uid]);
        let sql1 = new Command('select elo from rank where id = ?',[losePlayer.uid]);
        let sqls = [sql,sql1];

        Executor.transaction("local",sqls,(e,r)=>{
            if(!e){
                let RA = r[0]&&r[0][0]?r[0][0]['elo']:basicScore; //win
                let RB = r[1]&&r[1][0]?r[1][0]['elo']:basicScore;//lose

                let EA = 1/(1 + Math.pow(10, (RB - RA)/400));
                let EB = 1/(1 + Math.pow(10, (RA - RB)/400));

                let WINSA = 1;
                let LOSESA = 0;

                let RA1 = RA + k * (WINSA - EA);
                let RB1 = RB + k * (LOSESA - EB);
                console.log(`winPlayer RA :${RA} SA ${WINSA} EA ${EA} RA1 ${RA1}`);
                console.log(`losePlayer RB :${RB} RB ${LOSESA} EB ${EB} RB1 ${RB1}`);

                let winSql = new Command('replace rank(id, elo) values(?,?)',[winPlayer.uid, RA1]);
                let loseSql = new Command('replace rank(id, elo) values(?,?)',[losePlayer.uid, RB1]);
                Executor.transaction('local',[winSql,loseSql],cb);
            }
        })
    }
}

let winPlayer = {
    uid:1,
    type:PlayerType.USER
};

let losePlayer = {
    uid:2,
    type:PlayerType.USER
};

calculate_ELO(losePlayer, winPlayer, false, (e,r)=>{
    console.log(e);
    console.log(r);
});