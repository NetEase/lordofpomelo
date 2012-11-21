var patrol = require('../patrol');

/**
 * Wait mode: wait ticks and then return finish.
 */
var Mode = function(opts) {
  this.tick = opts.tick||1;
};

module.exports = Mode;

var pro = Mode.prototype;

pro.update = function() {
  if(!this.tick) {
    return patrol.RES_FINISH;
  }

  this.tick--;
  return patrol.RES_WAIT;
};
