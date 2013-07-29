/**
 * Module dependencies
 */
var util = require('util');
var Entity = require('./entity');
var EntityType = require('../../consts/consts').EntityType;

/**
 * Initialize a new 'Equipment' with the given 'opts'.
 * Equipment inherits Entity
 *
 * @class ChannelService
 * @constructor
 * @param {Object} opts
 * @api public
 */
var Equipment = function(opts) {
  Entity.call(this, opts);
  this.type = EntityType.EQUIPMENT;
  this.name = opts.name;
  this.desc = opts.desc;
  this.englishDesc = opts.englishDesc;
  this.kind = opts.kind;
  this.attackValue = Number(opts.attackValue);
  this.defenceValue = Number(opts.defenceValue);
  this.price = opts.price;
  this.color = opts.color;
  this.heroLevel = opts.heroLevel;
  this.imgId = opts.imgId;
  this.playerId = opts.playerId;

  this.lifetime = 30000;
  this.time = Date.now();
  this.died = false;
};

util.inherits(Equipment, Entity);

/**
 * Expose 'Equipment' constructor.
 */
module.exports = Equipment;

/**
 * Equipment refresh every 'lifetime' millisecond
 *
 * @api public
 */
Equipment.prototype.update = function(){
  var next = Date.now();
  this.lifetime -= (next - this.time);

  this.time = next;
  if(this.lifetime <= 0) {
    this.died = true;
  }
};

Equipment.prototype.toJSON = function() {
  return {
    entityId: this.entityId,
    kindId: this.kindId,
    x: this.x,
    y: this.y,
    playerId: this.playerId,
    type: this.type
  };
};
