global['CommonConf'] = require('./conf/common.json');
global['Log'] = require('./util/log');
global['DBEnv'] = CommonConf['db_env'];
global['RedisPrefix'] = require('./conf/redisPrefix');
global['ResPackage'] = require('./app/model/net/resPackage');
global['BaseHandler'] = require('./app/handler/base');
global['ErrorPackage'] = require('./app/model/net/errorPackage');

const DataAccess = require('dataAccess');
DataAccess.setPoolConfig(require('./conf/mysql'));
DataAccess.setRedisConfig(require('./conf/redis'));

const PORT = process.argv[2]?process.argv[2]:CommonConf['server_port'];
const Server = require('./server');
global['ServerManager'] = Server;
Server.beginServer(PORT);