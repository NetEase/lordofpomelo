
__resources__["/__builtin__/base.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
/*
  copyed from coco2d-html v0.1.0 (http://cocos2d-javascript.org) under MIT license.
  changed by zhangping. 2012.06.06
*/

var util = require("util");

var BObject = function (){}

BObject.prototype = util.extend(BObject.prototype, {
  extend:function()
  {
    var newObj = function(){return this.init.apply(this, arguments);};

    /*
      /*
      var key,val;
      for (key in this)
      {
      val = this[key];
      if (val && this.hasOwnProperty(key))
      newObj[key] = this[key];
      }
    */
    
    newObj.__proto__ = this;

    newObj.prototype = util.beget(this.prototype);
    newObj.prototype.constructor = newObj;
    
    var args = []
      , i = 0;
    
    args.push(newObj.prototype);
    for (; i<arguments.length; i++)
      args.push(arguments[i]);
    
    util.extend.apply(null, args);
    
    newObj.superClass = this.prototype;
    
    return newObj;
  },
  
  init:function(){
    return;
  },
});

BObject.extend = BObject.prototype.extend;

exports.BObject = BObject;

}};