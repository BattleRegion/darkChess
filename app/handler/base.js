const RequestPackage = require('../model/net/reqPackage');
const Log = require('../../util/log');
module.exports = {
    parseReqPackage: (data, ws) =>{
        let req_p = new RequestPackage(data);
        if(req_p['legal']){
            Log.info(`服务器收到正确数据包 : ${data}`)
        }
        else{
            Log.info(`服务器收到非法数据包 : ${data}`)
        }
    }
};