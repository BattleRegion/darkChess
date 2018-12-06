const ResPackage = require('../model/net/resPackage');
const BaseHandler = require('./base');
module.exports = {
    t1:(req_p, ws) =>{
        let res_p = new ResPackage({
            handler:req_p.handler,
            event:req_p.event,
            rawData:{
                reqRawData:req_p.rawData
            }
        });
        BaseHandler.sendToClient(res_p, ws);
    }
};