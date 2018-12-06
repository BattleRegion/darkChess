const ResPackage = require('../model/net/resPackage');
const BaseHandler = require('./base');
const DataAccess = require('dataAccess');
const Executor = DataAccess.executor;

module.exports = {
    debugLogin: (req_p, ws) =>{
        let rawData = req_p.rawData;
        let uid = rawData['uid'];
        ServerManager.bindUser(uid, ws);
    }
};