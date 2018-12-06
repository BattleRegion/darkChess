const Log = require('./util/log');
const CommonConf = require('./conf/common.json');
global['CommonConf'] = CommonConf;
global['Log'] = Log;
global['DBEnv'] = CommonConf['db_env'];
global['RedisPrefix'] = require('./conf/redisPrefix');
global['ResPackage'] = require('./app/model/net/resPackage');
global['BaseHandler'] = require('./app/handler/base');

const DataAccess = require('dataAccess');
DataAccess.setPoolConfig(require('./conf/mysql'));
DataAccess.setRedisConfig(require('./conf/redis'));

const PORT = CommonConf['server_port'];
const Server = require('./server');
global['ServerManager'] = Server;
Server.beginServer(PORT);