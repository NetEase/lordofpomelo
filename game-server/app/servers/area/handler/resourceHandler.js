/**
 * Module dependencies
 */

var app = require('pomelo').app;
var dataApi = require('../../../util/dataApi');
var EntityType = require('../../../consts/consts').EntityType;
var fs = require("fs");

var handler = module.exports;

/**
 * Get file'version
 *
 * @param {String} path, file path
 * @return {Number}
 * @api private
 */
var _getFileVersion = function(path) {
  return (new Date(fs.statSync(path).mtime)).getTime();
};

var version = {
  fightskill: _getFileVersion('./config/data/fightskill.json'),
  equipment:  _getFileVersion('./config/data/equipment.json'),
  item: _getFileVersion('./config/data/item.json'),
  character: _getFileVersion('./config/data/character.json'),
  npc: _getFileVersion('./config/data/npc.json'),
  animation:  _getFileVersion('./config/animation_json'),
  effect: _getFileVersion('./config/effect.json')
};

var animationFiles = [];

/**
 * Get animation data with the given path.
 *
 * @retun {Object}
 * @api public
 */

var _getAnimationJson = function() {
  var path = '../../../../config/animation_json/';
  var data = {};
  if (animationFiles.length === 0) {
    var dir = './config/animation_json';
    var name, reg = /\.json$/;
    fs.readdirSync(dir).forEach(function(file) {
      if (reg.test(file)) {
        name = file.replace(reg, '');
        animationFiles.push(name);
        data[name] = require(path + file);
      }
    });
  } else {
    animationFiles.forEach(function(name) {
      data[name] = require(path + name + '.json');
    });
  }

  return data;
};

/**
 * Load response of fightskill, equipment, item, animation, effect according to it's version
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.loadResource = function(msg, session, next) {
  var data = {};
  if (msg.version.fightskill !== version.fightskill) {
    data.fightskill = dataApi.fightskill.all();
  }
  if (msg.version.equipment !== version.equipment) {
    data.equipment = dataApi.equipment.all();
  }
  if (msg.version.item !== version.item) {
    data.item = dataApi.item.all();
  }
  if (msg.version.character !== version.character) {
    data.character = dataApi.character.all();
  }
  if (msg.version.npc !== version.npc) {
    data.npc = dataApi.npc.all();
  }
  if (msg.version.animation !== version.animation) {
    data.animation = _getAnimationJson();
  }
  if (msg.version.effect !== version.effect) {
    data.effect = require('../../../../config/effect.json');
  }

  next(null, {
    data: data,
    version: version
  });
};

/**
 * Load area response of entities, wich contains mobs, players, npcs, items and equipments.
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.loadAreaResource = function(msg, session, next) {
  var entities = session.area.getAllEntities();
  var players = {}, mobs = {}, npcs = {}, items = {}, equips = {};
  var i, e;
  for (i in entities) {
    e = entities[i];
    if (e.type === EntityType.PLAYER) {
      if (!players[e.kindId]) {
        players[e.kindId] = 1;
      }
    } else if(e.type === EntityType.MOB) {
      if (!mobs[e.kindId]) {
        mobs[e.kindId] = 1;
      }
    } else if(e.type === EntityType.NPC) {
      if (!npcs[e.kindId]) {
        npcs[e.kindId] = 1;
      }
    }else if (e.type === EntityType.ITEM) {
      if (!items[e.kindId]) {
        items[e.kindId] = 1;
      }
    }else if (e.type === EntityType.EQUIPMENT) {
      if (!equips[e.kindId]) {
        equips[e.kindId] = 1;
      }
    }
  }

  next(null, {
    players: Object.keys(players),
    mobs: Object.keys(mobs),
    npcs: Object.keys(npcs),
    items: Object.keys(items),
    equipments: Object.keys(equips),
    mapName: session.area.map.name
  });

};

