/**
 * Module dependencies
 */

var util = require('util');
var Entity = require('./entity/entity');
var EntityType = require('../consts/consts').EntityType;
var Persistent = require('./persistent');
var Underscore = require('underscore');

/**
 * Initialize a new 'Equipments' with the given 'opts'.
 * Equipments inherits Persistent 
 *
 * @param {Object} opts
 * @api public
 */
var Equipments = function(opts) {
	Persistent.call(this, opts);
  this.playerId = opts.playerId;
  this.weapon = opts.weapon || 0;
  this.armor = opts.armor || 0;
  this.helmet = opts.helmet || 0;
  this.necklace = opts.necklace || 0;
  this.ring = opts.ring || 0;
  this.belt = opts.belt || 0;
  this.shoes = opts.shoes || 0;
  this.legguard = opts.legguard || 0;
  this.amulet = opts.amulet || 0;
};

util.inherits(Equipments, Persistent);

var dict = {
  '武器': 'weapon',
  '项链': 'necklace',
  '头盔': 'helmet',
  '护甲': 'armor' ,
  '腰带': 'belt',
  '护腿': 'legguard',
  '护符': 'amulet',
  '鞋': 'shoes',
  '戒指': 'ring'
};

var convertType = function (type) {
  if (/[\u4e00-\u9fa5]/.test(type)) {
    type = dict[type];
  } else {
    type = type.toLowerCase();
  }

  return type;
};

//Get equipment by type
Equipments.prototype.get = function(type) {
  return this[convertType(type)];
};

//Equip equipment by type and id
Equipments.prototype.equip = function(type, id) {
  this[convertType(type)] = id;
  this.save();
};

//Unequip equipment by type
Equipments.prototype.unEquip = function(type) {
  this[convertType(type)] = 0;
  this.save();
};

var EquipList = Underscore.values(dict);
Equipments.prototype.isEquipment = function(strEquip) {
  return Underscore.contains(EquipList, strEquip);
};

/**
 * Expose 'Equipments' constructor.
 */
module.exports = Equipments;

