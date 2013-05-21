var Blackboard = require('../meta/blackboard');

var exp = module.exports;

var Manager = function(opts) {
	this.brainService = opts.brainService;
	this.area = opts.area;
	this.players = {};
	this.mobs = {};
};

module.exports = Manager;

var pro = Manager.prototype;

pro.start = function() {
	this.started = true;
};

pro.stop = function() {
	this.closed = true;
};

/**
 * Add a character into ai manager.
 * Add a brain to the character if the type is mob.
 * Start the tick if it has not started yet.
 */
pro.addCharacters = function(cs) {
	if(!this.started || this.closed) {
		return;
	}

	if(!cs || !cs.length) {
		return;
	}

	//create brain for the character.
	//TODO: add a brain pool?
	var c;
	for(var i=0, l=cs.length; i<l; i++) {
		c = cs[i];
		var brain;
		if(c.type === 'player') {
			if(this.players[c.entityId]) {
				continue;
			}

			brain = this.brainService.getBrain('player', Blackboard.create({
				manager: this,
				area: this.area,
				curCharacter: c
			}));
			this.players[c.entityId] = brain;
		} else {
			if(this.mobs[c.entityId]) {
				continue;
			}

			brain = this.brainService.getBrain(c.characterName, Blackboard.create({
				manager: this,
				area: this.area,
				curCharacter: c
			}));
			this.mobs[c.entityId] = brain;
		}
	}
};

/**
 * remove a character by id from ai manager
 */
pro.removeCharacter = function(id) {
	if(!this.started || this.closed) {
		return;
	}

	delete this.players[id];
	delete this.mobs[id];
};

/**
 * Update all the managed characters.
 * Stop the tick if there is no ai mobs.
 */
pro.update = function() {
	if(!this.started || this.closed) {
		return;
	}
	var id;
	for(id in this.players) {
		if(typeof this.players[id].update === 'function') {
			this.players[id].update();
		}
	}
	for(id in this.mobs) {
		if(typeof this.mobs[id].update === 'function') {
			this.mobs[id].update();
		}
	}
};

