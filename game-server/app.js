var pomelo = require('pomelo');
var world = require('./app/domain/world');
var area = require('./app/domain/area/area');
var dataApi = require('./app/util/dataApi');
var routeUtil = require('./app/util/routeUtil');
var playerFilter = require('./app/servers/area/filter/playerFilter');
var ChatService = require('./app/services/chatService');

/**
 * Init app for client
 */
var app = pomelo.createApp();
app.set('name', 'lord of pomelo');

// Configure for production enviroment
app.configure('production', function() {
	// enable the system monitor modules
	app.enable('systemMonitor');
});

// configure for global
app.configure('production|development', function() {
	var sceneInfo = require('./app/modules/sceneInfo');
	var onlineUser = require('./app/modules/onlineUser');
	if(typeof app.registerAdmin === 'function'){
		app.registerAdmin(sceneInfo, {app: app});
		app.registerAdmin(onlineUser, {app: app});
	}
	//Set areasIdMap, a map from area id to serverId.
	if (app.serverType !== 'master') {
		var areas = app.get('servers').area;
		var areaIdMap = {};
		for(var id in areas){
			areaIdMap[areas[id].area] = areas[id].id;
		}
		app.set('areaIdMap', areaIdMap);
	}
	// proxy configures
	app.set('proxyConfig', {
		cacheMsg: true, 
		interval: 30, 
		lazyConnection: true, 
		enableRpcLog: true
	});

	// remote configures
	app.set('remoteConfig', {
		cacheMsg: true, 
		interval: 30
	});

	// route configures
	app.route('area', routeUtil.area);
	app.route('connector', routeUtil.connector);

	app.loadConfig('mysql', app.getBase() + '/../shared/config/mysql.json');
	app.filter(pomelo.timeout());
});

// Configure for auth server
app.configure('production|development', 'auth', function() {
	// load session congfigures
	app.set('session', require('./config/session.json'));
});

// Configure for area server
app.configure('production|development', 'area', function(){
	app.filter(pomelo.filters.serial());
	app.before(playerFilter());
	
	var areaId = app.get('curServer').area;
	if(!areaId || areaId < 0) {
		throw new Error('load area config failed');
	}
	world.init(dataApi.area.all());
	area.init(dataApi.area.findById(areaId));
});

// Configure database
app.configure('production|development', 'area|auth|connector|master', function() {
	var dbclient = require('./app/dao/mysql/mysql').init(app);
	app.set('dbclient', dbclient);
	app.load(pomelo.sync, {path:__dirname + '/app/dao/mapping', dbclient: dbclient});
});

// Configure for chat server
app.configure('production|development', 'chat', function() {
	app.set('chatService', new ChatService(app));
});

//start
app.start();

// Uncaught exception handler
process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
});
