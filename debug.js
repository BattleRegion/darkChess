const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:8888');

ws.on('open', function open() {
    debugLogin(2,ws);
});

ws.on('message', function incoming(data) {
    console.log(`收到数据:${data}`);
    let obj = JSON.parse(data);
    if(obj.handler === "user" && obj.event === "debugLogin") {
        this.token = obj.rawData.token;
        match(this.token,ws);

        setTimeout(()=>{
            cancel(this.token,true, ws);
        },1000);
    }
    if(obj.handler === "chess" && obj.event === "roomInfo") {
        // ready(this.token,1,ws)
        move(this.token,1,1,0,4,ws);
    }
});

ws.on('close', function() {
   console.log('close')
});

const CryptoUtil = require('./util/cryptoUtil');
const sign = 'ead1e30473cd33ad4c2d6e634a2e94eae17460a7e725cb696f9e3b60e59ec66af05c0c893b8f9ac00ad13fd1ddcf58600e8fd5ccdff19da295336bbf684ecbe8';

function debugLogin(uid,ws){
    let param = {
        handler:'user',
        event:'debugLogin',
        rawData:{
            uid:uid
        }
    };
    send(param, ws);
}

function move(token,roomId,pieceId,x,y,ws){
    let p = {
        handler:'chess',
        event:'move',
        rawData: {
            token:token,
            roomId:roomId,
            pId:pieceId,
            x:x,
            y:y
        }
    };
    send(p, ws)
}

function flip(token,roomId,pieceId,ws){
    let p = {
        handler:'chess',
        event:'flip',
        rawData: {
            token:token,
            roomId:roomId,
            pId:pieceId
        }
    };
    send(p, ws)
}

function ready(token,roomId,ws) {
    let p = {
        handler:'chess',
        event:'ready',
        rawData: {
            token:token,
            roomId:roomId
        }
    };
    send(p, ws)
}

function match(token, ws){
    let p = {
        handler:'chess',
        event:'match',
        rawData: {
            token:token
        }
    };
    send(p, ws)
}

function cancel(token,needPC, ws){
    let p = {
        handler:'chess',
        event:'cancelMatch',
        rawData: {
            token:token,
            needPC:needPC
        }
    };
    send(p, ws)
}

function forceQuit(token,roomId,ws){
    let p = {
        handler:'chess',
        event:'quitRoom',
        rawData: {
            token:token,
            roomId:roomId
        }
    };
    send(p, ws)
}

function send(param, ws){
    let objStr = Object.keys(param).filter(k => {
        if(param[k]){
            return k;
        }
        return null;
    }).sort().map(key => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(param[key])
    }).join('&');
    let md5Str = `${objStr}_${sign}`;
    let crc = CryptoUtil.toMD5(md5Str);
    param.crc = crc;
    ws.send(JSON.stringify(param));
}
