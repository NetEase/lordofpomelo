var util = require('util');
var Entity = require('./entity/entity');
var EntityType = require('../consts/consts').EntityType;
var Persistent = require('./persistent');
var logger = require('pomelo-logger').getLogger(__filename);

/**
 * Initialize a new 'Bag' with the given 'opts'
 * Bag inherits Persistent
 *
 * @param {Object} opts
 * @api public
 */
var Bag = function(opts) {
  Persistent.call(this, opts);
  this.itemCount = opts.itemCount || 20;
  this.items = opts.items || {};
};

util.inherits(Bag, Persistent);

module.exports = Bag;

Bag.prototype.get = function(index) {
  return this.items[index];
};

Bag.prototype.getData = function() {
  var data = {};

  data.id = this.id;
  data.itemCount = this.itemCount;

  data.items = [];
  for(var key in this.items){
    var item = {
      key : Number(key),
      id : this.items[key].id,
      type : this.items[key].type
    };
    data.items.push(item);
  }

  return data;
};

/**
 * add item
 *
 * @param {obj} item {id: 123, type: 'item'}
 * @return {number}
 * @api public
 */
Bag.prototype.addItem = function(item) {
  var index = -1;

  if (!item || !item.id || !item.type || !item.type.match(/item|equipment/)) {
    return index;
  }

  for (var i = 1; i <= this.itemCount; i ++) {
    if (!this.items[i]) {
      this.items[i] = {id: item.id, type: item.type};
      index = i;
      break;
    }
  }

  if (index > 0) {
    this.save();
  }

  return index;
};


/**
 * remove item
 *
 * @param {number} index
 * @return {Boolean}
 * @api public
 */
Bag.prototype.removeItem = function(index) {
  var status = false;
  if (this.items[index]) {
    delete this.items[index];
    this.save();
    status = true;
  }

  return status;
};

//Check out item by id and type
Bag.prototype.checkItem = function(id, type) {
  var result = null, i, item;
  for (i in this.items) {
    item = this.items[i];
    if (item.id == id && item.type === type) {
      result = i;
      break;
    }
  }

  return result;
};

//Get all the items
Bag.prototype.all = function() {
  return this.items;
};
