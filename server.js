const WebSocket = require('ws');
const Log = require('./util/log');
const BaseHandler = require('./app/handler/base');
const CommonConf = require('./conf/common.json');
const DataAccess = require('dataAccess');
const PORT = CommonConf['server_port'];
const DB_ENV = CommonConf['db_env'];
DataAccess.setPoolConfig(require('./conf/mysql'));
DataAccess.setRedisConfig(require('./conf/redis'));
global['Log'] = Log;
global['DBEnv'] = DB_ENV;

const server_opts = {
    port: PORT
};
const webSocketServer = new WebSocket.Server(server_opts);

Log.info(`server listen ${PORT}`);

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
});

webSocketServer.on("close", ()=>{
    Log.debug(`ws server close`);

});