// require json files
var area = require('./json/area');
var character = require('./json/character');
var equipment = require('./json/equipment');
var experience = require('./json/experience');
var npc = require('./json/npc');
var role = require('./json/role');
var talk = require('./json/talk');
var item = require('./json/item');
var fightskill = require('./json/fightskill');


/**
 * Data model `new Data()`
 *
 * @param {Array}
 *
 */
var Data = function(data) {
  var fields = {};
  data[1].forEach(function(i, k) {
    fields[i] = k;
  });
  data.splice(0, 2);

  var result = [];
  data.forEach(function(k) {
    result.push(mapData(fields, k));
  });

  this.data = result;
};

/**
 * map the array data to object
 *
 * @param {Object}
 * @param {Array}
 * @return {Object} result
 * @api private
 */
var mapData = function(fields, item) {
  var obj = {};
  for (var k in fields) {
    obj[k] = item[fields[k]];
  }
  return obj;
};

/**
 * find items by attribute
 *
 * @param {String} attribute name
 * @param {String|Number} the value of the attribute
 * @return {Array} result
 * @api public
 */
Data.prototype.findBy = function(attr, value) {
  var result = [];
  //console.log(' findBy ' + attr + '  value:' + value + '  index: ' + index);
  this.data.forEach(function(k) {
    if (k[attr] == value) {
      result.push(k);
    }
  });
  return result;
};

Data.prototype.findBigger = function(attr, value) {
  var result = [];
  //console.log(' findBy ' + attr + '  value:' + value + '  index: ' + index);
  this.data.forEach(function(k) {
    if (Number(k[attr]) >= Number(value)) {
      result.push(k);
    }
  });
  return result;
};

Data.prototype.findSmaller = function(attr, value) {
  var result = [];
  //console.log(' findBy ' + attr + '  value:' + value + '  index: ' + index);
  this.data.forEach(function(k) {
    if (Number(k[attr]) <= Number(value)) {
      result.push(k);
    }
  });
  return result;
};
/**
 * find item by id
 *
 * @param id
 * @return {Obj}
 * @api public
 */
Data.prototype.findById = function(id) {
  var result;

  for (var i = 0, l = this.data.length; i < l; i ++) {
    if (this.data[i].id == id) {
      result = this.data[i];
      break;
    }
  }

  return result;
};

/**
 * find all item
 *
 * @return {array}
 * @api public
 */
Data.prototype.all = function() {
  return this.data;
};

module.exports = {
  area: new Data(area),
  character: new Data(character),
  equipment: new Data(equipment),
  experience: new Data(experience),
  npc: new Data(npc),
  role: new Data(role),
  talk: new Data(talk),
  item: new Data(item),
  fightskill: new Data(fightskill)
};

//Data(talk);
