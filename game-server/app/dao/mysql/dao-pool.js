var _poolModule = require('generic-pool');

/*
 * Create mysql connection pool.
 */
var createMysqlPool = function(app) {
	var mysqlConfig = app.get('mysql');
	var host = process.env.LORD_MYSQL_HOST || mysqlConfig.host;
	var port = process.env.LORD_MYSQL_PORT || mysqlConfig.port;
	var user = process.env.LORD_MYSQL_USER || mysqlConfig.user;
	var password = process.env.LORD_MYSQL_PASSWORD || mysqlConfig.password;
	var database = process.env.LORD_MYSQL_DATABASE || mysqlConfig.database;

	return _poolModule.Pool({
		name: 'mysql',
		create: function(callback) {
			var mysql = require('mysql');
			var client = mysql.createConnection({
				host: host,
				user: user,
				password: password,
				database: database,
				port: port
			});
			callback(null, client);
		},
		destroy: function(client) {
			client.end();
		},
		max: 10,
		idleTimeoutMillis : 30000,
		log : false
	});
};

exports.createMysqlPool = createMysqlPool;
