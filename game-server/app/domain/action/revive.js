var Action = require('./action');
var messageService = require('../messageService');
var util = require('util');

var Revive = function(opts){
	opts.type = 'revive';
	opts.id = opts.entity.entityId;
	opts.singleton = true;

	Action.call(this, opts);
	this.entity = opts.entity;
	this.area = this.entity.area;
	this.map = opts.map;
	this.time = opts.reviveTime;
	this.now = Date.now();
};

util.inherits(Revive, Action);

/**
 * Update revive time
 * @api public
 */
Revive.prototype.update = function(){
	var time = Date.now();

	this.time -= time - this.now;
	if(this.time <= 10){
		this.entity.died = false;
		this.entity.hp = this.entity.maxHp/2;

		var bornPlace = this.map.getBornPlace();

		var oldPos = {x : this.entity.x, y : this.entity.y};

		var newPos = {
			x : bornPlace.x + Math.floor(Math.random() * bornPlace.width),
			y : bornPlace.y + Math.floor(Math.random() * bornPlace.height)
		};

		var watcher = {id : this.entity.entityId, type : this.entity.type};
		this.area.timer.updateObject(watcher, oldPos, newPos);
		this.area.timer.updateWatcher(watcher, oldPos, newPos, this.entity.range, this.entity.range);

		this.entity.x = newPos.x;
		this.entity.y = newPos.y;

		messageService.pushMessageByAOI(
			this.area,
			{
				route: 'onRevive',
				entityId : this.entity.entityId,
				x: this.entity.x,
				y: this.entity.y,
				hp: this.entity.hp
			},
			{x : this.entity.x, y : this.entity.y});
		this.finished = true;
		this.entity.updateTeamMemberInfo();
	}
	this.now = time;
};

module.exports = Revive;
