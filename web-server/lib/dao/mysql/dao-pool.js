var _poolModule = require('generic-pool');
var mysqlConfig = require('../../../../shared/config/mysql');
console.log(mysqlConfig);

var env = process.env.NODE_ENV || 'development';
if(mysqlConfig[env]) {
  mysqlConfig = mysqlConfig[env];
}

/*
 * Create mysql connection pool.
 */
var createMysqlPool = function(){
  return _poolModule.Pool({
    name     : 'mysql',
    create   : function(callback) {
      var mysql = require('mysql');
      var client = mysql.createConnection({
        host: mysqlConfig.host,
        user: mysqlConfig.user,
        password: mysqlConfig.password,
        database: mysqlConfig.database,
        port: mysqlConfig.port
      });
      callback(null, client);
    },
    destroy  : function(client) { client.end(); },
    max      : 10,
    idleTimeoutMillis : 30000,
    log : false
  });
};

exports.createMysqlPool = createMysqlPool;
