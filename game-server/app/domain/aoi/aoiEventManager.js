var messageService = require('../messageService');
var EntityType = require('../../consts/consts').EntityType;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../util/utils');

var exp = module.exports;

//Add event for aoi
exp.addEvent = function(area, aoi){
	aoi.on('add', function(params){
		params.area = area;
		switch(params.type){
			case EntityType.PLAYER:
				onPlayerAdd(params);
				break;
			case EntityType.MOB:
				onMobAdd(params);
				break;
		}
	});

	aoi.on('remove', function(params){
		params.area = area;
		switch(params.type){
			case EntityType.PLAYER:
				onPlayerRemove(params);
				break;
			case EntityType.MOB:
				break;
		}
	});

	aoi.on('update', function(params){
		params.area = area;
		switch(params.type){
			case EntityType.PLAYER:
				onObjectUpdate(params);
				break;
			case EntityType.MOB:
				onObjectUpdate(params);
				break;
		}
	});

	aoi.on('updateWatcher', function(params) {
		params.area = area;
		switch(params.type) {
			case EntityType.PLAYER:
				onPlayerUpdate(params);
				break;
		}
	});
};

/**
 * Handle player add event
 * @param {Object} params Params for add player, the content is : {watchers, id}
 * @return void
 * @api private
 */
function onPlayerAdd(params) {
	var area = params.area;
	var watchers = params.watchers;
	var entityId = params.id;
	var player = area.getEntity(entityId);

	if(!player) {
		return;
	}

	var uids = [], id;
	for(var type in watchers) {
		switch (type){
			case EntityType.PLAYER:
				for(id in watchers[type]) {
					var watcher = area.getEntity(watchers[type][id]);
					if(watcher && watcher.entityId !== entityId) {
						uids.push({sid: watcher.serverId, uid: watcher.userId});
					}
				}
				if(uids.length > 0){
					onAddEntity(uids, player);
				}
				break;
			case EntityType.MOB:
				for(id in watchers[type]) {
					var mob = area.getEntity(watchers[type][id]);
					if(mob) {
						mob.onPlayerCome(entityId);
					}
				}
				break;
		}
	}
}

/**
 * Handle mob add event
 * @param {Object} params Params for add mob, the content is : {watchers, id}
 * @return void
 * @api private
 */
function onMobAdd(params){
	var area = params.area;
	var watchers = params.watchers;
	var entityId = params.id;
	var mob = area.getEntity(entityId);

	if(!mob) {
		return;
	}

	var uids = [];
	for(var id in watchers[EntityType.PLAYER]) {
		var watcher = area.getEntity(watchers[EntityType.PLAYER][id]);
		if(watcher) {
			uids.push({sid: watcher.serverId, uid: watcher.userId});
		}
	}

	if(uids.length > 0) {
		onAddEntity(uids, mob);
	}

	var ids = area.aoi.getIdsByRange({x:mob.x, y:mob.y}, mob.range, [EntityType.PLAYER])[EntityType.PLAYER];
	if(!!ids && ids.length > 0 && !mob.target){
		for(var key in ids){
			mob.onPlayerCome(ids[key]);
		}
	}
}

/**
 * Handle player remove event
 * @param {Object} params Params for remove player, the content is : {watchers, id}
 * @return void
 * @api private
 */
function onPlayerRemove(params) {
	var area = params.area;
	var watchers = params.watchers;
	var entityId = params.id;

	var uids = [];

	for(var type in watchers) {
		switch (type){
			case EntityType.PLAYER:
				var watcher;
				for(var id in watchers[type]) {
					watcher = area.getEntity(watchers[type][id]);
					if(watcher && entityId !== watcher.entityId) {
						uids.push({sid: watcher.serverId, uid: watcher.userId});
					}
				}

				onRemoveEntity(uids, entityId);
				break;
		}
	}
}

/**
 * Handle object update event
 * @param {Object} params Params for add object, the content is : {oldWatchers, newWatchers, id}
 * @return void
 * @api private
 */
function onObjectUpdate(params) {
	var area = params.area;
	var entityId = params.id;
	var entity = area.getEntity(entityId);

	if(!entity) {
		return;
	}

	var oldWatchers = params.oldWatchers;
	var newWatchers = params.newWatchers;
	var removeWatchers = {}, addWatchers = {}, type, w1, w2, id;
	for(type in oldWatchers) {
		if(!newWatchers[type]) {
			removeWatchers[type] = oldWatchers[type];
			continue;
		}
		w1 = oldWatchers[type];
		w2 = newWatchers[type];
		removeWatchers[type] = {};
		for(id in w1) {
			if(!w2[id]) {
				removeWatchers[type][id] = w1[id];
			}
		}
	}

	for(type in newWatchers) {
		if(!oldWatchers[type]) {
			addWatchers[type] = newWatchers[type];
			continue;
		}

		w1 = oldWatchers[type];
		w2 = newWatchers[type];
		addWatchers[type] = {};
		for(id in w2) {
			if(!w1[id]) {
				addWatchers[type][id] = w2[id];
			}
		}
	}


	switch(params.type) {
		case EntityType.PLAYER:
			onPlayerAdd({area:area, id:params.id, watchers:addWatchers});
			onPlayerRemove({area:area, id:params.id, watchers:removeWatchers});
			break;
		case EntityType.MOB:
			onMobAdd({area:area, id:params.id, watchers:addWatchers});
			onMobRemove({area:area, id:params.id, watchers:removeWatchers});
			break;
	}
}

/**
 * Handle player update event
 * @param {Object} params Params for player update, the content is : {watchers, id}
 * @return void
 * @api private
 */
function onPlayerUpdate(params) {
	var area = params.area;
	var player = area.getEntity(params.id);
	if(player.type !== EntityType.PLAYER) {
		return;
	}

	var uid = {sid : player.serverId, uid : player.userId};

	if(params.removeObjs.length > 0) {
    messageService.pushMessageToPlayer(uid, 'onRemoveEntities', {'entities' : params.removeObjs});
	}

	if(params.addObjs.length > 0) {
		var entities = area.getEntities(params.addObjs);
		if(entities.length > 0) {
      messageService.pushMessageToPlayer(uid, 'onAddEntities', entities);
		}
	}
}

/**
 * Handle mob remove event
 * @param {Object} params Params for remove mob, the content is : {watchers, id}
 * @return void
 * @api private
 */
function onMobRemove(params) {
	var area = params.area;
	var watchers = params.watchers;
	var entityId = params.id;
	var uids = [];

	for(var type in watchers) {
		switch (type){
			case EntityType.PLAYER:
				for(var id in watchers[type]) {
					var watcher = area.getEntity(watchers[type][id]);
					if(watcher) {
						uids.push({sid: watcher.serverId, uid : watcher.userId});
					}
				}
				onRemoveEntity(uids, entityId);
			break;
		}
	}
}

/**
 * Push message for add entities
 * @param {Array} uids The users to notify
 * @param {Number} entityId The entityId to add
 * @api private
 */
function onAddEntity(uids, entity) {
	var entities = {};
	entities[entity.type] = [entity];

  messageService.pushMessageByUids(uids, 'onAddEntities', entities);

	if (entity.type === EntityType.PLAYER) {
		utils.myPrint('entities = ', JSON.stringify(entities));
		utils.myPrint('teamId = ', JSON.stringify(entities[entity.type][0].teamId));
		utils.myPrint('isCaptain = ', JSON.stringify(entities[entity.type][0].isCaptain));
	}
}

/**
 * Push message for remove entities
 * @param {Array} uids The users to notify
 * @param {Number} entityId The entityId to remove
 * @api private
 */
function onRemoveEntity(uids, entityId) {
	if(uids.length <= 0) {
		return;
	}

  messageService.pushMessageByUids(uids, 'onRemoveEntities',{entities : [entityId]}, uids);
}