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
        checkInRoom(this.token,ws);
        // matchPc(this.token,ws);
    }
    else if(obj.handler === "room" && obj.event === "info"){
        if(obj.rawData.roomState === 1){
            ready(this.token,obj.rawData.roomId,ws);
        }
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

function ready(token,roomId,ws){
    let param = {
        handler:'chess',
        event:'ready',
        rawData:{
            token:token,
            roomId:roomId
        }
    };
    send(param,ws);
}

function match(token,ws){
    let param = {
        handler:'chess',
        event:'match',
        rawData:{
            token:token
        }
    };
    send(param,ws);
}

function checkInRoom(token,ws){
    let param = {
        handler:'chess',
        event:'checkInRoom',
        rawData:{
            token:token
        }
    };
    send(param,ws);
}

function matchPc(token,ws){
    let param = {
        handler:'chess',
        event:'matchPc',
        rawData:{
            token:token
        }
    };
    send(param,ws);
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
