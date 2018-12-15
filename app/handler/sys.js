const ResPackage = require('../model/net/resPackage');
const BaseHandler = require('./base');
module.exports = {
    heartbreak:(req_p, ws) =>{
        let res_p = new ResPackage({
            handler:req_p.handler,
            event:req_p.event,
        });
        BaseHandler.sendToClient(res_p, ws);
    }
};