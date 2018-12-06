const WebSocket = require('ws');
const Log = require('./util/log');
const BaseHandler = require('./app/handler/base');
const port = 8888;
const server_opts = {
    port: port
};
const webSocketServer = new WebSocket.Server(server_opts);
global['Log'] = Log;

Log.info(`server listen ${port}`);

webSocketServer.on("connection", (ws, req)=>{
    Log.info(`客户端 ${ws._socket['remoteAddress']}:${ws._socket['remotePort']} 连接成功`);
    ws.on("message", data=>{
        Log.debug(`ws client receive msg ${data}`);
        BaseHandler.parseReqPackage(data, ws);
    });

    ws.on("close", (code, reason)=>{
        Log.info(`客户端 ${ws._socket['remoteAddress']}:${ws._socket['remotePort']} 断开 code ${code} reason ${reason}`);
    });

    ws.on("error", e=>{
        Log.error(`ws client error ${e}`);
    });
});

webSocketServer.on("error", error=>{
    Log.error(`ws server error ${error}`);
});

webSocketServer.on("close", ()=>{
    Log.debug(`ws server close`);

});

//
// let testObj = {
//     event:'test1',
//     rawData:'helloWorld'
// };
//
// const PACKAGE_SECRET = 'ead1e30473cd33ad4c2d6e634a2e94eae17460a7e725cb696f9e3b60e59ec66af05c0c893b8f9ac00ad13fd1ddcf58600e8fd5ccdff19da295336bbf684ecbe8';
// const CryptoUtil = require('./util/cryptoUtil');
// let crc = JSON.stringify(testObj) + "_" + PACKAGE_SECRET;
// testObj.crc = CryptoUtil.toMD5(crc);
//
// console.log(JSON.stringify(testObj));