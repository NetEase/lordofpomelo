var area = require('./area');
var messageService = require('./../messageService');
var EntityType = require('../../consts/consts').EntityType;
var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports;

exp.run = function () {
  setInterval(tick, 100);
};

function tick() {
  //Update mob zones
  for(var key in area.zones()) {
    area.zones()[key].update();
  }

  //Update all the items
  for(var id in area.items()) {
    var item = area.entities()[id];
    item.update();

    if(item.died) {
      messageService.pushMessage({route:'onRemoveItem', entityId:id});
      area.removeEntity(id);
    }
  }

  //run all the action
  area.actionManager().update();

  area.aiManager().update();

  area.patrolManager().update();
}

/**
 * Add action for area
 * @param action {Object} The action need to add
 * @return {Boolean}
 */
exp.addAction = function(action) {
  return area.actionManager().addAction(action);
};

/**
 * Abort action for area
 * @param type {Number} The type of the action
 * @param id {Id} The id of the action
 */
exp.abortAction = function(type, id) {
  return area.actionManager().abortAction(type, id);
};

/**
 * Abort all action for a given id in area
 * @param id {Number} 
 */
exp.abortAllAction = function(id) {
  area.actionManager().abortAllAction(id);
};

/**
 * Enter AI for given entity
 * @param entityId {Number} entityId
 */
exp.enterAI = function(entityId) {
  area.patrolManager().removeCharacter(entityId);
  exp.abortAction('move', entityId);
  if(!!area.entities()[entityId]) {
    area.aiManager().addCharacters([area.entities()[entityId]]);
  }
};

/**
 * Enter patrol for given entity
 * @param entityId {Number}
 */
exp.patrol = function(entityId) {
  area.aiManager().removeCharacter(entityId);

  if(!!area.entities()[entityId]) {
    area.patrolManager().addCharacters([{character: area.entities()[entityId], path: area.entities()[entityId].path}]);
  }
};

/**
 * Update object for aoi
 * @param obj {Object} Given object need to update.
 * @param oldPos {Object} Old position.
 * @param newPos {Object} New position.
 * @return {Boolean} If the update success.
 */
exp.updateObject = function(obj, oldPos, newPos) {
  return area.aoi().updateObject(obj, oldPos, newPos);
};

/**
 * Get all the watchers in aoi for given position.
 * @param pos {Object} Given position.
 * @param types {Array} The watchers types.
 * @param ignoreList {Array} The ignore watchers' list.
 * @return {Array} The qualified watchers id list.
 */
exp.getWatcherUids = function(pos, types, ignoreList) {
  var watchers = area.aoi().getWatchers(pos, types);
  var result = [];
  if(!!watchers && !! watchers[EntityType.PLAYER]) {
    var pWatchers = watchers[EntityType.PLAYER];
    for(var entityId in pWatchers) {
      var player = area.getEntity(entityId);
      if(!!player && !! player.userId && (!ignoreList || !ignoreList[player.userId])) {
        result.push({uid:player.userId, sid : player.serverId});
      }
    }
  }

  return result;
};

/**
 * Get watchers by given position and types, without ignore list.
 * @param pos {Object} Given position.
 * @param types {Array} Given watcher types.
 * @return {Array} Watchers find by given parameters.
 */
exp.getWatchers = function(pos, types) {
  return area.aoi().getWatchers(pos, types);
};

/**
 * Update given watcher.
 * @param watcher {Object} The watcher need to update.
 * @param oldPos {Object} The old position of the watcher.
 * @param newPos {Ojbect} The new position of the watcher.
 * @param oldRange {Number} The old range of the watcher.
 * @param newRange {Number} The new range of the watcher.
 * @return Boolean If the update is success.
 */
exp.updateWatcher = function(watcher, oldPos, newPos, oldRange, newRange) {
  return area.aoi().updateWatcher(watcher, oldPos, newPos, oldRange, newRange);
};
