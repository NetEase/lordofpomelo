var Area = require('./area');

var Instance = function(opts){
  this.id = opts.instanceId;
  this.area = new Area(opts);
  this.lifeTime = opts.lifeTime || 1800000;
};

module.exports = Instance;

Instance.prototype.start = function(){
  this.area.start();
};

Instance.prototype.close = function(){
  this.area.close();
};

Instance.prototype.getArea = function(){
  return this.area;
};

Instance.prototype.isAlive = function(){
  if(this.area.isEmpty()){
    if((Date.now() - this.area.emptyTime) > this.lifeTime){
      return false;
    }
  }
  return true;
};

