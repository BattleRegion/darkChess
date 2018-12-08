const DataAccess = require('dataAccess');
const Executor = DataAccess.executor;
const CryptoUtil = require('../../util/cryptoUtil');

module.exports = {
    debugLogin: function(req_p, ws) {
        let rawData = req_p.rawData;
        let uid = rawData['uid'];
        if(uid) {
            this.genToken(uid, (e,token) => {
                if(!e) {
                    ServerManager.bindUser(uid, ws);
                    Log.info(`用户:${uid} 登陆成功，token:${token}`);
                    let res_p = new ResPackage({
                        handler:req_p.handler,
                        event:req_p.event,
                        rawData:{
                            token: token
                        }
                    });
                    BaseHandler.sendToClient(res_p, ws);
                }
                else{
                    Log.error(`debugLogin genToken error，${e.toString()}`)
                }
            });
        }
        else {
            Log.error(`debugLogin，没有uid`)
        }
    },

    genToken: function(uid, callback){
        let token = CryptoUtil.toSecret(`${uid}_${new Date().getTime()}`,CommonConf['token_key']);
        Executor.redisSet(DBEnv, RedisPrefix['USER_TOKEN'] + ":" + uid, token, (e)=>{
            callback(e, token);
        });
    }
};