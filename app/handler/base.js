const RequestPackage = require('../model/net/reqPackage');
module.exports = {
    parseReqPackage: (data, ws) =>{
        let req_p = new RequestPackage(data);
        if(req_p['legal']){
            Log.info(`服务器收到正确数据包 : ${JSON.stringify(req_p)}`);
            let handlerName = req_p.handler;
            try {
                let handler = require(`../../app/handler/${handlerName}`);
                let event = req_p.event;
                if(handler[event]){
                    handler[event](req_p, ws);
                }
                else{
                    Log.error(`不存在 客户端 ${ws._socket['remoteAddress']}:${ws._socket['remotePort']} 发送的 handler : ${handlerName} event: ${event}`);
                }
            }
            catch (e) {
                Log.error(`不存在 客户端 ${ws._socket['remoteAddress']}:${ws._socket['remotePort']} 发送的 handler : ${handlerName}`);
            }
        }
        else{
            Log.error(`服务器收到客户端 ${ws._socket['remoteAddress']}:${ws._socket['remotePort']} 非法数据包 : ${data}`);
        }
    },

    sendToClient : (resPackage, ws)=>{
        Log.info(`发送消息到客户端 ${ws._socket['remoteAddress']}:${ws._socket['remotePort']} 消息内容 : ${JSON.stringify(resPackage)}`);
        ws.send(JSON.stringify(resPackage));
    },
};