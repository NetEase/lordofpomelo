var envConfig = require('./app/config/env.json');
var config = require('./app/config/' + envConfig.env + '/config');
var Robot = require('pomelo-robot').Robot;
var fs = require('fs');

var robot = new Robot(config);
var mode = 'master';

if (process.argv.length > 2){
    mode = process.argv[2];
}

console.log('mode: ', mode);

if (mode !== 'master' && mode !== 'client') {
	throw new Error(' mode must be master or client');
}

if (mode === 'master') {
    robot.runMaster(__filename);
} else {
    var script = (process.cwd() + envConfig.script);
    robot.runAgent(script);
}

process.on('uncaughtException', function(err) {
  /* temporary code */
	console.error(' Caught exception: ' + err.stack);
	if (!!robot && !!robot.agent){
		// robot.agent.socket.emit('crash', err.stack);
	}
	fs.appendFile('./log/.log', err.stack, function (err) {});
  /* temporary code */
});
