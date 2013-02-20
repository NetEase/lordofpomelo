
__resources__["/utils.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

  var aniOrientation = require('consts').aniOrientation;
  var dataApi = require('dataApi');

  module.exports.distance = function(sx, sy, ex, ey) {
    var dx = ex - sx;
    var dy = ey - sy;

    return Math.sqrt(dx * dx + dy * dy);
  };

	module.exports.totalDistance = function(path) {
    if(!path || path.length < 2) {
      return 0;
    }

    var distance = 0;
    for(var i=0, l=path.length-1; i<l; i++) {
      distance += this.distance(path[i].x, path[i].y, path[i + 1].x, path[i + 1].y);
    }

    return distance;
	};

	/**
   * amend the path of addressing
   * @param {Object} path   the path of addressing
   * @return {Object} path the path modified
   */
	module.exports.pathAmend = function(sprite, path) {
		var position = sprite.getPosition();
		path[0] = {
			x: position.x,
			y: position.y
		};
		if (path.length > 2) {
			path.splice(1, 1);
		}
		return path;
	};

	module.exports.getPoolName = function(kindId, name) {
		return kindId + '_' + name;
	};

  module.exports.invokeCallback = function(cb) {
    if(cb && typeof cb === 'function') {
      cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
  };

  /**
  * calculate the direction
  * if move, x1, y1 are the startPosition, x2, y2 are the endPosotion
  * else, x1, y1 are the curNode position, x2, y2 are the target position
  */
  module.exports.calculateDirection = function(x1, y1, x2, y2) {
    var distX = x2 - x1
			, distY = y2 - y1
			, orientation;

    if (distX >= 0 && distY < 0) {//quadrant 1

			orientation = aniOrientation.RIGHT_UP;

    } else if (distX < 0 && distY < 0) {//quadrant 2

			orientation = aniOrientation.LEFT_UP;

    } else if (distX <0 && distY >= 0) {//quadrant 3

			orientation = aniOrientation.LEFT_DOWN;

    } else {//quadrant 4

			orientation = aniOrientation.RIGHT_DOWN;
    }
		return orientation;
  };

  /**
	 * clone an object
	 */
	module.exports.clone = function(origin) {
		if(!origin) {
			return;
		}

		var obj = {};
		for(var f in origin) {
			if(origin.hasOwnProperty(f)) {
				obj[f] = origin[f];
			}
		}
		return obj;
	};

  module.exports.buildEntity = function(type, data){
    var entity = {};

    var index = type;
    if(type === 'mob' || type === 'player'){
      index = 'character';
    }
    //Build entity from original data
    if(!!dataApi[index]){
      entity = this.clone(dataApi[index].findById(data.kindId));
    }else{
      return null;
    }

    for(var key in data){
      entity[key] = data[key];
    }

    entity.type = type;
    return entity;
  };

  function buildItem(type, data){
    var item;
    var api;

    if(type === 'item'){
      item = module.exports.clone(dataApi.item.findById(data.kindId));
    }else{
      item = module.exports.clone(dataApi.equipment.findById(data.kindId));
    }

    item.x = data.x;
    item.y = data.y;
    item.entityId = data.entityId;
    item.playerId = data.playerId;
    item.type = data.type;

    return item;
  }
}};
