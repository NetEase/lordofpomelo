var _poolModule = require('generic-pool');
var mysql = require('mysql');

/*
 * Create mysql connection pool.
 */
var createMysqlPool = function(app){
	var mysqlConfig = app.get('mysql');
	const factory = {
		create: function(){
			return new Promise(function(resolve, reject){
				var client = mysql.createConnection({
					host: mysqlConfig.host,
					user: mysqlConfig.user,
					password: mysqlConfig.password,
					database: mysqlConfig.database
				});
				resolve(client);
			});
		},
		destroy: function(client){
			return new Promise(function(resolve){
				client.on('end', function(){
					resolve()
				});
				client.disconnect()
			});
		}
	}
  	return _poolModule.createPool(factory, {max:10, min:2});
};

exports.createMysqlPool = createMysqlPool;
