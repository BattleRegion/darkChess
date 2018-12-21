const DataAccess = require('dataAccess');
const Executor = DataAccess.executor;
const CryptoUtil = require('../../util/cryptoUtil');

module.exports = {

    bindUser: function(req_p, ws){
        let rawData = req_p.rawData;
        let uid = rawData['uid'].toString();
        ServerManager.bindUser(uid, ws);
        Log.info(`用户:${uid} 绑定成功`);
        BaseHandler.commonResponse(req_p, {
            code: GameCode.SUCCESS,
        },ws)
    },

    debugLogin: function(req_p, ws) {
        let rawData = req_p.rawData;
        let uid = rawData['uid'].toString();
        if(uid) {
            this.genToken(uid, (e,token) => {
                if(!e) {
                    ServerManager.bindUser(uid, ws);
                    Log.info(`用户:${uid} 登陆成功，token:${token}`);
                    BaseHandler.commonResponse(req_p, {
                        code: GameCode.SUCCESS,
                        token: token
                    },ws)
                }
                else{
                    Log.error(`debugLogin genToken error，${e.toString()}`)
                    BaseHandler.commonResponse(req_p, {
                        code: GameCode.GEN_TOKEN_ERROR,
                    },ws)
                }
            });
        }
        else {
            Log.error(`debugLogin，没有uid`);
            BaseHandler.commonResponse(req_p, {
                code: GameCode.GEN_TOKEN_ERROR,
            },ws)
        }
    },

    genToken: function(uid, callback){
        let origin = `${uid}_${new Date().getTime()}`;
        Log.info(`gentoken :${origin}`);
        let token = CryptoUtil.toSecret(`${origin}`,CommonConf['token_key']);
        Executor.redisSet(DBEnv, RedisPrefix['USER_TOKEN'] + ":" + uid, token, (e)=>{
            callback(e, token);
        });
    }
};