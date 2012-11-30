var dataApi = require('../../util/dataApi');
var Map = require('./../map/map');
var MobZone = require('./../map/mobzone');
var NPC = require('./../entity/npc');
var pomelo = require('pomelo');
var Queue = require('pomelo-collection').queue;
var ai = require('../../ai/ai');
var patrol = require('../../patrol/patrol');
var ActionManager = require('./../action/actionManager');
var aoiManager = require('pomelo-aoi');
var eventManager = require('./../event/eventManager');
var aoiEventManager = require('./../aoi/aoiEventManager');
var EntityType = require('../../consts/consts').EntityType;
var timer = require('./timer');
var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports;

var id = 0;
var level = 0;
var map = null;
var actionManager = null;
var aiManager = null;
var patrolManager = null;

//The map from player to entity
var players = {};
var users = {};
var entities = {};
var zones = {};
var items = {};
var channel = null;
var aoi = null;

/**
 * Init areas
 * @param {Object} opts
 * @api public
 */
exp.init = function(opts) {
	//Init Map
	id = opts.id;
	level = opts.level;

	opts.weightMap = true;
	map = new Map(opts);
	//Init AOI
	aoi = aoiManager.getService(opts);
	aoiEventManager.addEvent(aoi.aoi);

	//Init mob zones
	initMobZones(map.getMobZones());
	initNPCs(this);

	aiManager = ai.createManager();
	patrolManager = patrol.createManager({area:this});
	actionManager = new ActionManager();
	run();
};

/**
 * @api public
 */
function run() {
	aiManager.start();
	timer.run();
}

/**
 * Init npcs
 * @api private
 */
function initNPCs() {
	var npcs = map.getNPCs();

	for(var i = 0; i < npcs.length; i++) {
		var data = npcs[i];

		data.kindId = data.id;
		var npcInfo = dataApi.npc.findById(data.kindId);
		data.kindName = npcInfo.name;
		data.englishName = npcInfo.englishName;
		data.kindType = npcInfo.kindType;
		data.orientation = data.orientation;
		data.areaId = id;
		exp.addEntity(new NPC(data));
	}
}

function getChannel() {
	if(channel) {
		return channel;
	}

	channel = pomelo.app.get('channelService').getChannel('area_' + id, true);
	return channel;
}

/**
 * Init all zones in area
 * @api private
 */
function initMobZones(mobZones) {
	for(var i = 0; i < mobZones.length; i++) {
		var zone = new MobZone(mobZones[i]);
		zones[zone.zoneId] = zone;
	}
}

/**
 * Add entity to area
 * @param {Object} e Entity to add to the area.
 */
exp.addEntity = function(e) {
	if(!e || !e.entityId) {
		return false;
	}
	
	if(!!players[e.id]) {
		logger.error('add player twice! player : %j', e);
		return false;
	}

	entities[e.entityId] = e;
	eventManager.addEvent(e);
  
	if(e.type === EntityType.PLAYER) {
		getChannel().add(e.userId, e.serverId);
		aiManager.addCharacters([e]);
		
		aoi.addWatcher({id: e.entityId, type: e.type}, {x : e.x, y: e.y}, e.range);
		players[e.id] = e.entityId;
		users[e.userId] = e.id;
	}else if(e.type === EntityType.MOB) {
		aiManager.addCharacters([e]);
		
		aoi.addWatcher({id: e.entityId, type: e.type}, {x : e.x, y: e.y}, e.range);
	}else if(e.type === EntityType.NPC) {
		
	}else if(e.type === EntityType.ITEM) {
		items[e.entityId] = e.entityId;
	}else if(e.type === EntityType.EQUIPMENT) {
		items[e.entityId] = e.entityId;
	}

	aoi.addObject({id:e.entityId, type:e.type}, {x: e.x, y: e.y});
	return true;
};

/**
 * Remove Entity form area
 * @param {Number} entityId The entityId to remove
 * @return {boolean} remove result
 */
exp.removeEntity = function(entityId) {
	var e = entities[entityId];
	if(!e) {
		return true;
	}

	//If the entity belong to a subzone, remove it
	if(!!zones[e.zoneId]) {
		zones[e.zoneId].remove(entityId);
	}

	//If the entity is a player, remove it
	if(e.type === 'player') {
		getChannel().leave(e.userId, pomelo.app.get('serverId'));
		aiManager.removeCharacter(e.entityId);
		patrolManager.removeCharacter(e.entityId);
		aoi.removeObject({id:e.entityId, type: e.type}, {x: e.x, y: e.y});
		actionManager.abortAllAction(entityId);

		e.forEachEnemy(function(enemy) {
			enemy.forgetHater(e.entityId);
		});
	
		e.forEachHater(function(hater) {
			hater.forgetEnemy(e.entityId);
		});
	
		aoi.removeWatcher(e, {x : e.x, y: e.y}, e.range);
		delete players[e.id];
		delete users[e.userId];
	}else if(e.type === 'mob') {
		aiManager.removeCharacter(e.entityId);
		patrolManager.removeCharacter(e.entityId);
		aoi.removeObject({id: e.entityId, type: e.type}, {x: e.x, y: e.y});
		actionManager.abortAllAction(entityId);

		e.forEachEnemy(function(enemy) {
			enemy.forgetHater(e.entityId);
		});

		e.forEachHater(function(hater) {
			hater.forgetEnemy(e.entityId);
		});
	
		aoi.removeWatcher(e, {x : e.x, y: e.y}, e.range);
	}else if(e.type === EntityType.ITEM) {
		delete items[entityId];
	}else if(e.type === EntityType.EQUIPMENT) {
		delete items[entityId];
	}

	aoi.removeObject(e, {x: e.x, y: e.y});
	delete entities[entityId];
	return true;
};

/**
 * Get entity from area
 * @param {Number} entityId.
 */
exp.getEntity = function(entityId) {
	var entity = entities[entityId];
	if (!entity) {
		return null;
	}
	return entity;
};

/**
 * Get entities by given id list
 * @param {Array} The given entities' list.
 */
exp.getEntities = function(ids) {
	var result = [];
	for(var i = 0; i < ids.length; i++) {
		var entity = entities[ids[i]];
		if(!!entity) {
			result.push(entity);
		}
	}	
	
	return result;
};

exp.getAllPlayers = function() {
	var _players = [];
	for(var id in players) {
		_players.push(entities[players[id]]);
	}	
	
	return _players;
};

exp.getAllEntities = function() {
	return entities;
};

exp.getPlayer = function(playerId) {
	var entityId = players[playerId];

	if(!!entityId) {
		return entities[entityId];
	}
  
	return null;
};

exp.removePlayer = function(playerId) {
	var entityId = players[playerId];

	if(!!entityId) {
		delete players[playerId];
		this.removeEntity(entityId);
	}
};

exp.getPlayerByUid = function(uid){
	if(!!users[uid]){
		return this.getPlayer(users[uid]);
	}
	
	return null;
}

exp.removePlayerByUid = function(uid){
	var playerId = users[uid];
	
	if(!!playerId){
		delete users[uid];
		this.removePlayer(playerId);
	}
}

/**
 * Get area entities for given postion and range.
 * @param {Object} pos Given position, like {10,20}.
 * @param {Number} range The range of the view, is the circle radius.
 */
exp.getAreaInfo = function(pos, range) {
	var ids = aoi.getIdsByPos(pos, range);
	var entities = this.getEntities(ids);
	return {
		id: id,
		level: level,
		entities : entities,
		map : {
			name: map.name,
			width: map.width,
			height: map.height
		}
	};
};

/**
 * Get entities from area by given pos, types and range.
 * @param {Object} pos Given position, like {10,20}.
 * @param {Array} types The types of the object need to find.
 * @param {Number} range The range of the view, is the circle radius.
 */
exp.getEntitiesByPos = function(pos, types, range) {
	var idsMap = aoi.getIdsByRange(pos, range, types);
	var result = {};
	for(var type in idsMap) {
		if(!result[type]) {
			result[type] = [];
		}
		for(var i = 0; i < idsMap[type].length; i++) {
			var id = idsMap[type][i];
			if(!!entities[id]) {
				result[type].push(entities[id]);
			}else{
				logger.error('AOI data error ! type : %j, id : %j', type, id);
			}
		}
	}
	return result;
};

exp.id = function() {
	return id;
};

exp.channel = function () {
	return getChannel();
};

exp.entities = function () {
	return entities;
};

exp.items = function() {
	return items;
};

exp.zones = function() {
	return zones;
};

exp.actionManager = function() {
	return actionManager;
};

exp.aiManager = function() {
	return aiManager;
};

exp.patrolManager = function() {
	return patrolManager;
};

exp.aoi = function() {
	return aoi;
};

exp.timer = function() {
	return timer;
};

exp.map = function() {
	return map;
};
