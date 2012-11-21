var patrol = require('../patrol');

/**
 * Loop mode: move the character around the path.
 *
 * @param opts
 *        opts.character {Character} current character
 *        opts.path {Array} pos array
 *        opts.rounds {Number} loop rounds. -1 stands for infinite loop
 *        opts.standTick {Number} rest tick after per step. 0 stands for no rest
 */
var Mode = function(opts) {
  this.character = opts.character;
  this.path = opts.path.slice(0);
  this.rounds = opts.rounds || 1;
  this.step = this.path.length;
  this.standTick = opts.standTick || 0;
  this.tick = this.standTick;
  this.started = false;
};

module.exports = Mode;

var pro = Mode.prototype;

pro.update = function() {
  if(this.path.length === 0 || this.rounds === 0) {
    //if path is empty or rounds is 0
    return patrol.RES_FINISH;
  }

  if(!this.started) {
    this.started = true;
    this.character.move(this.path[0].x, this.path[0].y, true);
    return patrol.RES_WAIT;
  }

  var dest = this.path[0];
  if(this.character.x !== dest.x || this.character.y !== dest.y) {
    //if i am on the road to dest
    return patrol.RES_WAIT;
  }

  if(this.tick > 0) {
    //well, we have finished a step and we can have a rest if necessary
    this.tick--;
    return patrol.RES_WAIT;
  }
  this.tick = this.standTick;

  if(this.rounds > 0) {
    //if we should count the steps and rounds
    this.step--;
    if(this.step === 0) {
      this.rounds--;
      if(this.rounds === 0) {
        return patrol.RES_FINISH;
      }
      this.step = this.path.length;
    }
  }

  if(this.path.length > 1) {
    this.path.push(this.path.shift());
  }

  //move to next destination
  this.character.move(this.path[0].x, this.path[0].y, true);
  return patrol.RES_WAIT;
};
