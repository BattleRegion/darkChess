const WebSocket = require('ws');
const Log = require('./util/log');
const BaseHandler = require('./app/handler/base');
const port = 8888;
const server_opts = {
    port: port
};
const webSocketServer = new WebSocket.Server(server_opts);

Log.debug(`server listen ${port}`);

webSocketServer.on("connection", (ws, req)=>{
    Log.debug(`ws client ${ws._socket['remoteAddress']}:${ws._socket['remotePort']} connected`);
    ws.on("message", data=>{
        Log.debug(`ws client receive msg ${data}`);
        BaseHandler.parseReqPackage(data, ws);
        ws.send(data);
    });

    ws.on("close", (code, reason)=>{
        Log.debug(`ws client close code ${code} reason ${reason}`);
    });

    ws.on("error", e=>{
        Log.debug(`ws client error ${e}`);
    });
});

webSocketServer.on("error", error=>{
    Log.debug(`ws server error ${error}`);
});

webSocketServer.on("close", ()=>{
    Log.debug(`ws server close`);

});
