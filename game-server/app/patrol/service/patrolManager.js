var Single = require('../mode/single');
var Loop = require('../mode/loop');
var Composite = require('../mode/composite');
var Wait = require('../mode/wait');

var STAND_TICK = 50;

var Manager = function() {
  this.characters = {};
};

var pro = Manager.prototype;

/**
 * Add characters into patrol module and create patrol actions for them.
 *
 * @param cs {Array} array of character info.
 *        c.character {Character} character instance that with id and x, y stand for position of the character
 *        c.path {Array} array of position {x: x, y: y}
 */
pro.addCharacters = function(cs) {
  var c;
  for(var i=0, l=cs.length; i<l; i++) {
    c = cs[i];
    if(!this.characters[c.character.entityId]) {
      this.characters[c.character.entityId] = genAction(c.character, c.path);
    }
  }
};

/**
 * Remove character from patrol module by id
 */
pro.removeCharacter = function(id) {
  delete this.characters[id];
};

pro.update = function() {
	for(var id in this.characters) {
		this.characters[id].update();
	}
}; 

/**
 * Generate patrol actions for character.
 */
var genAction = function(character, path) {
  var start = path[0];
  var res = new Loop({
    character: character, 
    path: path, 
    rounds: -1, 
    standTick: STAND_TICK
  });

  return res;
};

module.exports = Manager;
