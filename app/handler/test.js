const ResPackage = require('../model/net/resPackage');
module.exports = {
    dealReqPackage : (req_p,ws) =>{
        let res_p = new ResPackage({
            event:req_p.event,
            rawData:{
                reqRawData:req_p.rawData
            }
        });
        ws.send(JSON.stringify(res_p));
    }
};