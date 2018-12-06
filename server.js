const WebSocket = require('ws');
const BaseHandler = require('./app/handler/base');

module.exports = {

    curServer : null,

    userWs : {},

    beginServer : port =>{

        const server_opts = {
            port: port
        };

        const webSocketServer = new WebSocket.Server(server_opts);

        this.curServer = webSocketServer;

        Log.info(`server listen ${port}`);

        webSocketServer.on("connection", (ws)=>{
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
            this.curServer = null;

        });

        webSocketServer.on("close", ()=>{
            Log.debug(`ws server close`);
            this.curServer = null;

        });
    },

    bindUser : (uid, ws)=>{
        Log.info(`绑定用户 ${uid} 到 ws`);
        this.userWs[uid] = ws;
    },

    kickUser : (uid)=>{
        let ws = this.getWsByUid(uid);
        if(ws) {
            Log.info(`踢用户 ${uid} 下线`);
            ws.close();
            delete this.userWs[uid];
        }
    },

    getWsByUid : (uid) =>{
        return this.userWs[uid];
    }
};