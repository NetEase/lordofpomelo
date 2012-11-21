var patrol = require('../patrol');

/**
 * Single mode: move the character on the path given once.
 *
 * @param opts
 *        opts.character {Character} current character
 *        opts.path {Array} pos array
 */
var Mode = function(opts) {
  this.character = opts.character;
  this.path = opts.path.slice(0);
  this.started = false;
};

module.exports = Mode;

var pro = Mode.prototype;

pro.update = function() {
  if(this.path.length === 0) {
    //if path is empty
    return patrol.RES_FINISH;
  }

  if(!this.started) {
    this.character.move(this.path[0].x, this.path[0].y);
    this.started = true;
    return patrol.RES_WAIT;
  }

  var dest = this.path[0];
  if(this.character.x !== dest.x || this.character.y !== dest.y) {
    //if i am on the road to dest
    return patrol.RES_WAIT;
  }

  this.path.shift();

  if(this.path.length === 0) {
    return patrol.RES_FINISH;
  }

  //move to next destination
  this.character.move(this.path[0].x, this.path[0].y);
  return patrol.RES_WAIT;
};
