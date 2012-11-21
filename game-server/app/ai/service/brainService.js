var Service = function() {
	this.brains = {};
};

module.exports = Service;

var pro = Service.prototype;

pro.getBrain = function(type, blackboard) {
	//TODO: mock data
	if(type !== 'autoFight' && type !== 'player') {
		type = 'tiger';
	}
	var brain = this.brains[type];
	if(brain) {
		return brain.clone({blackboard: blackboard});
	}
	return null;
};

pro.registerBrain = function(type, brain) {
	this.brains[type] = brain;
};

