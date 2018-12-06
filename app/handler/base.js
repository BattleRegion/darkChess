const RequestPackage = require('../model/net/reqPackage');
const Log = require('../../util/log');
module.exports = {
    parseReqPackage: (data, ws) =>{
        let req_p = new RequestPackage(JSON.parse(data));
        if(req_p['legal']){
            Log.info(`服务器收到正确数据包 : ${JSON.stringify(req_p)}`);
            let event = req_p.event;
            try {
                let handler = require(`../../app/handler/${event}`);
                handler.dealReqPackage(req_p, ws);
            }
            catch (e) {
                Log.error(`不存在 客户端 ${ws._socket['remoteAddress']}:${ws._socket['remotePort']} 发送的 event : ${event} 对应的 handler`);
            }
        }
        else{
            Log.error(`服务器收到客户端 ${ws._socket['remoteAddress']}:${ws._socket['remotePort']} 非法数据包 : ${data}`);
        }
    }
};