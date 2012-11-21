var patrol = require('../patrol');

/**
 * Composite mode: compose children and invoke them one by one.
 */
var Mode = function() {
  this.children = [];
  this.index = 0;
};

module.exports = Mode;

var pro = Mode.prototype;

pro.add = function(mode) {
  this.children.push(mode);
};

pro.update = function() {
  if(this.index >= this.children.length) {
    return patrol.RES_FINISH;
  }

  var child = this.children[this.index];
  var res = child.update();
  if(res === patrol.RES_WAIT) {
    return res;
  }

  this.index++;
  return this.update();
};
