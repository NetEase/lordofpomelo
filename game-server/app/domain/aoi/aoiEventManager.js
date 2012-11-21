var area = require('../area/area');
var messageService = require('../messageService');
var EntityType = require('../../consts/consts').EntityType;
var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports;

//Add event for aoi
exp.addEvent = function(aoi){
	aoi.on('add', function(params){
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
		switch(params.type){
			case EntityType.PLAYER: 
				onPlayerRemove(params);
				break;
			case EntityType.MOB: 
				break;
		}
	});
	
	aoi.on('update', function(params){
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
				onAddEntity(uids, entityId);
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
		onAddEntity(uids, entityId);
	};

	var ids = area.aoi().getIdsByRange({x:mob.x, y:mob.y}, mob.range, [EntityType.PLAYER])[EntityType.PLAYER];
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
				
//				if(type === 'player'){
//					var player = area.getEntity(id);
//					var pos = {x: Math.floor(player.x/300), y:Math.floor(player.y/300)};
//					if((Math.abs(params.newPos.x-pos.x) <=2) && (Math.abs(params.newPos.y-pos.y)<=2)){
//						logger.warn('remove watcher player by move , oldPos : %j, newPos : %j, player pos : %j, range : %j', params.oldPos, params.newPos, pos, player.range);
//						logger.warn('watchers : %j', area.aoi().getWatchers(params.newPos, ['player', 'mob']));
//					}
//				}
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
			onPlayerAdd({id:params.id, watchers:addWatchers});
			onPlayerRemove({id:params.id, watchers:removeWatchers});
			break;
		case EntityType.MOB: 
			onMobAdd({id:params.id, watchers:addWatchers});
			onMobRemove({id:params.id, watchers:removeWatchers});
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
	var player = area.getEntity(params.id);
	if(player.type !== EntityType.PLAYER) {
		return;
	}
	
	var route = {sid : player.serverId, uid : player.userId};
	
	if(params.removeObjs.length > 0) {
    messageService.pushMessageToPlayer(route, {
			route : 'removeEntities',
			entities : params.removeObjs
		});
	}
	
	if(params.addObjs.length > 0) {
		var entities = area.getEntities(params.addObjs);
		if(entities.length > 0) {
      messageService.pushMessageToPlayer(route, {
				route : 'addEntities',
				entities : entities
			});
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
function onAddEntity(uids, entityId) {
	var entity = area.getEntity(entityId);
	
	if(!entity || uids.length <= 0) {
		return;
	}
		
	var msg = {
		route : 'addEntities',
		entities : [entity]
	};
	
  messageService.pushMessageByUids(msg, uids);
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
		
	var msg = {
		route : 'removeEntities',
		entities : [entityId]
	};

    messageService.pushMessageByUids(msg, uids);
}