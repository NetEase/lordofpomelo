var PatrolManager = require('./service/patrolManager');
var exp = module.exports;

exp.RES_FINISH = 0;
exp.RES_WAIT = 1;

exp.createManager = function() {
	return new PatrolManager();
};