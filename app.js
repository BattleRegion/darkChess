const Log = require('./util/log');
const CommonConf = require('./conf/common.json');
const DataAccess = require('dataAccess');
const DB_ENV = CommonConf['db_env'];
DataAccess.setPoolConfig(require('./conf/mysql'));
DataAccess.setRedisConfig(require('./conf/redis'));

global['Log'] = Log;
global['DBEnv'] = DB_ENV;
global['RedisPrefix'] = require('./conf/redisPrefix');

const PORT = CommonConf['server_port'];
const Server = require('./server');
global['ServerManager'] = Server;
Server.beginServer(PORT);