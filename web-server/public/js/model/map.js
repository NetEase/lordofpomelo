__resources__["/map.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

	var helper = require("helper");
	var model = require('model');
	var animate = require('animate');
	var utils = require('utils');
	var app = require('app');
	var url = require('config').IMAGE_URL;
	var buildFinder = require('pathfinding').buildFinder;

	var Map = function(opts){
		var map = opts.map;
		this.data = null;
		this.node = null;
		this.name = map.name;
		this.scene = opts.scene;
		this.initPos = opts.pos || {x: 0, y: 0};
		this.width = map.width;
		this.height = map.height;
		this.moveAnimation = null;
		this.weightMap = null;
		this.initMapData(opts);
		this.loadMap();
		this.cache = {};
	};

	var pro = Map.prototype;

	/**
	* init mapData for pathfinding
	* @param {Object} data
	*/
	pro.initMapData = function(opts) {
		this.tileW = opts.map.tileW||10;
		this.tileH = opts.map.tileH||10;
		this.rectW = Math.ceil(this.width/this.tileW);
		this.rectH = Math.ceil(this.height/this.tileH);

		this.weightMap = this.getWeightMap(opts.map.weightMap);
		this.pfinder = buildFinder(this);
	};

	pro.loadMap = function(){
		var pos = this.initPos;
		var mapUrl = url + 'map/' + this.name + ".jpg";
		var mapImage = helper.loadImage(mapUrl);

		var imgModel = new model.ImageModel({
			image: mapImage
		});

		imgModel.image.style = "-webkit-transform:translate3d(0,0,0)";
		var node = this.scene.createNode({
			model: imgModel
		});

		node.exec('translate', -pos.x, -pos.y, -1);

		this.scene.addNode(node);
		this.node = node;
	};

	pro.getWeight = function(x, y) {
		return this.weightMap[x][y];
	};

	pro.getWeightMap = function(weightMap){
		var map = [];
		var x, y;
		for(x = 0; x < this.rectW; x++) {
			map[x] = [];
			for(y = 0; y < this.rectH; y++) {
				map[x][y] = 1;
			}
		}

		for(x = 0; x < weightMap.length; x++){
			var array = weightMap[x].collisions;
			if(!array){
				continue;
			}
			for(var j = 0; j < array.length; j++){
				var c = array[j];
				for(var k = 0; k < c.length; k++){
					map[x][c.start+k] = Infinity;
				}
			}
		}

		return map;
	};

	pro.isReachable = function(x, y) {
		var x1 = Math.floor(x/this.tileW);
		var y1 = Math.floor(y/this.tileH);

		if(x1 < 0 || y1 < 0 || x1 > this.rectW || y1 > this.rectH || !this.weightMap[x1]) {
			return false;
		}
		return this.weightMap[x1][y1] === 1;
	};

	pro._checkLinePath = function(x1, y1, x2, y2) {
		var px = x2 - x1;
		var py = y2 - y1;
		var tile = this.tileW / 2;
		if(px === 0) {
			while(x1 < x2) {
				x1 += tile;
				if(!this.isReachable(x1, y1)) {
					return false;
				}
			}
			return true;
		}

		if(py === 0) {
			while(y1 < y2) {
				y1 += tile;
				if(!this.isReachable(x1, y1)) {
					return false;
				}
			}
			return true;
		}

		var dis = utils.distance(x1, y1, x2, y2);
		var rx = (x2 - x1) / dis, ry = (y2 - y1) / dis;
		var dx = tile * rx, dy = tile * ry;
		var x0 = x1, y0 = y1;
		x1 += dx;
  	y1 += dy;

		while((dx > 0 && x1 < x2) || (dx < 0 && x1 > x2)) {
			if(!this._testLine(x0, y0, x1, y1)) {
				return false;
			}

			x0 = x1;
			y0 = y1;
			x1 += dx;
			y1 += dy;
		}
		return true;
	};

	pro._testLine = function(x, y, x1, y1) {
		if(!this.isReachable(x, y) || !this.isReachable(x1, y1)) {
			return false;
		}

		var dx = x1 - x, dy = y1 - y;
		var tileX = Math.floor(x/this.tileW);
		var tileY = Math.floor(y/this.tileW);
		var tileX1 = Math.floor(x1/this.tileW);
		var tileY1 = Math.floor(y1/this.tileW);

		if(tileX === tileX1 || tileY === tileY1) {
			return true;
		}

		var minY = y < y1 ? y : y1;
		var maxTileY = (tileY > tileY1 ? tileY : tileY1) * this.tileW;

		if((maxTileY - minY) === 0){
			return true;
		}

		var y0 = maxTileY;
		var x0 = x + dx / dy * (y0 - y);
		var maxTileX = (tileX > tileX1 ? tileX : tileX1) * this.tileW;
		var x3 = (x0 + maxTileX) / 2, y3 = y + dy / dx * (x3 - x);

		if(this.isReachable(x3, y3)){
			if(!this._checkLinePath1(x, y, x1, y1)) {
				console.error('check error');
			}
			return true;
		}
		return false;
	};

	pro._checkLinePath1 = function(x1, y1, x2, y2) {
		var px = x2 - x1;
		var py = y2 - y1;
		var tile = 1;
		if(px === 0) {
			while(x1 < x2) {
				x1 += tile;
				if(!this.isReachable(x1, y1)) {
					return false;
				}
			}
			return true;
		}

		if(py === 0) {
			while(y1 < y2) {
				y1 += tile;
				if(!this.isReachable(x1, y1)) {
					return false;
				}
			}
			return true;
		}

		var dis = utils.distance(x1, y1, x2, y2);
		var rx = (x2 - x1) / dis, ry = (y2 - y1) / dis;
		var dx = tile * rx, dy = tile * ry;

		while((dx > 0 && x1 < x2) || (dx < 0 && x1 > x2)) {
			x1 += dx;
			y1 += dy;
			if(!this.isReachable(x1, y1)) {
				return false;
			}
		}
		return true;
	};

	pro._findPos = function(x1, y1, x2, y2) {
		var px = x2 - x1, py = y2 - y1;
		var tile = this.tileW / 2;
		if(px === 0) {
			while(x1 < x2) {
				x1 += tile;
				if(!this.isReachable(x1, y1)) {
					return false;
				}
			}
			return true;
		}

		if(py === 0) {
			while(y1 < y2) {
				y1 += tile;
				if(!this.isReachable(x1, y1)) {
					return false;
				}
			}
			return true;
		}

		var dis = utils.distance(x1, y1, x2, y2);
		var rx = (x2 - x1) / dis, ry = (y2 - y1) / dis;
		var dx = tile * rx, dy = tile * ry;

		while((dx > 0 && x1 < x2) || (dx < 0 && x1 > x2)) {
			x1 += dx;
			y1 += dy;
			if(!this.isReachable(x1, y1)) {
				return false;
			}
		}
		return true;
	};

	function computeCost(path){
		var cost = 0;
		for(var i = 1; i < path.length; i++){
			var start = path[i-1];
			var end = path[i];
			cost += utils.distance(start.x, start.y, end.x, end.y);
		}

		return cost;
	}

	pro.compressPath2= function(tilePath){
		var oldPos = tilePath[0];
		var path = [oldPos];

		for(var i = 1; i < (tilePath.length - 1); i++){
			var pos = tilePath[i];
			var nextPos = tilePath[i + 1];

			if(!isLine(oldPos, pos, nextPos)){
				path.push(pos);
			}

			oldPos = pos;
			pos = nextPos;
		}

		path.push(tilePath[tilePath.length - 1]);
		return path;
	};

	function isLine(p0, p1, p2){
		return ((p1.x-p0.x)===(p2.x-p1.x)) && ((p1.y-p0.y) === (p2.y-p1.y));
	}

	pro.compressPath1 = function(path, loopTime){
		var newPath;

		for(var k = 0; k < loopTime; k++){
			var start;
			var end;
			newPath = [path[0]];

			for(var i = 0, j = 2; j < path.length;){
				start = path[i];
				end = path[j];

				if(this._checkLinePath(start.x, start.y, end.x, end.y)){
					newPath.push(end);
					i = j;
					j += 2;
				}else{
					newPath.push(path[i + 1]);
					i++;
					j++;
				}

				if(j >= path.length){
					if((i + 2) === path.length){
						newPath.push(path[i + 1]);
					}
				}
			}
			path = newPath;
		}

		return newPath;
	};

	pro.forAllReachable = function(x, y, processReachable) {
		var x1 = x - 1, x2 = x + 1;
		var y1 = y - 1, y2 = y + 1;

		x1 = x1 < 0 ? 0 : x1;
		y1 = y1 < 0 ? 0 : y1;
		x2 = x2 >= this.rectW ? (this.rectW - 1) : x2;
		y2 = y2 >= this.rectH ? (this.rectH - 1) : y2;
		if(y>0) {
			processReachable(x, y - 1, this.weightMap[x][y - 1]);
		}
		if((y+1) < this.rectH) {
			processReachable(x, y + 1, this.weightMap[x][y + 1]);
		}
		if(x>0) {
			processReachable(x - 1, y, this.weightMap[x - 1][y]);
		}
		if((x+1) < this.rectW) {
			processReachable(x + 1, y, this.weightMap[x + 1][y]);
		}
	};

	function transPos(pos, tileW, tileH){
		var newPos = {};
		newPos.x = pos.x*tileW + tileW/2;
		newPos.y = pos.y*tileH + tileH/2;

		return newPos;
	}


	pro.findPath = function(x, y, x1, y1){
		if( x < 0 || x > this.width || y < 0 || y > this.height || x1 < 0 || x1 > this.width || y1 < 0 || y1 > this.height){
			return null;
		}

		if(!this.isReachable(x, y) || !this.isReachable(x1, y1)){
			return null;
		}

		if(this._checkLinePath(x, y, x1, y1)) {
			return {path: [{x: x, y: y}, {x: x1, y: y1}], cost: utils.distance(x, y, x1, y1)};
		}

		var tx1 = Math.floor(x/this.tileW);
		var ty1 = Math.floor(y/this.tileH);
		var tx2 = Math.floor(x1/this.tileW);
		var ty2 = Math.floor(y1/this.tileH);

		var path = this.pfinder(tx1, ty1, tx2, ty2);
		if(!path || !path.paths){
			console.error('can not find path');
			return null;
		}

		var result = {};
		var paths = [{x:x, y:y}];

		for(var i = 1; i < path.paths.length; i++){
			paths.push(transPos(path.paths[i], this.tileW, this.tileH));
		}

		paths.push({x: x1, y: y1});

		paths = this.compressPath2(paths);
		if(paths.length > 2){
			paths = this.compressPath1(paths, 3);
			paths = this.compressPath2(paths);
			if(!this.check(paths)){
				console.log('illegal path!!!');
				return null;
			}
		}

		result.path = paths;
		result.cost = computeCost(paths);
		return result;
	};

	pro.check = function(path){
		for(var i = 1; i < path.length; i++){
			var p0 = path[i-1];
			var p1 = path[i];
			if(!this._checkLinePath(p0.x, p0.y, p1.x, p1.y)){
				//console.log('error ! i, p0, p1', i, p0, p1);
				return false;
			}
		}

		return true;
	};

	pro.move = function(distX, distY, speed) {
		if(!this.node) {
			return;
		}
		this.stopMove();
		var position = this.position();
		var endX = position.x + distX;
		var endY = position.y + distY;

		var distance = Math.sqrt(distX * distX + distY * distY);
		var timeNum = (distance / speed) * 1000;
		this.moveAnimation = new animate.MoveTo(
			[0, {x: position.x, y: position.y}, 'linear'],
			[timeNum, {x: endX, y: endY}, 'linear']
		);

		var self = this;
		this.moveAnimation.onFrameEnd = function(t, dt) {
			var pos = self.position();
			var success = self.checkMapBoundary(distX, distY, pos);
			if (success || self.moveAnimation.isDone()) {
				self.stopMove();
			}
		};
		this.node.exec('addAnimation', this.moveAnimation);
	};

	pro.isMove = function() {
		return !!this.moveAnimation;
	};

	pro.centerTo = function(x, y) {
		if(!this.node) {
			return;
		}
		var width = getScreenWidth();
		var height = getScreenHeight();
		var maxX = this.width - width - 10;
		var maxY = this.height - height - 10;
		x = x - width / 2;
		y = y - height / 2;
		if(x < 0) {
			x = 0;
		} else if(x > maxX) {
			x = maxX;
		}
		if(y < 0) {
			y = 0;
		} else if(y > maxY) {
			y = maxY;
		}
		this.node.exec('translate', -x, -y, -1);
	};

	/**
	 * Move the background with the current player sprite.
	 *
	 * @param sdist {Object} sprite move distination {x, y}
	 * @param time {Number} sprite move time
	 */
	pro.moveBackground = function(sdist, time) {
		if(!this.node) {
			return;
		}
		this._checkPosition(sdist, time);
	};

	/**
	 * Move the background in the x direction
	 *
	 * @param dx {Number} move distance. positive: to right, negative: to left
	 * @param time {Number} move time
	 * @param sdist {Object} sprite distination {x, y}
	 */
	pro._moveX = function(dx, time, sdist) {
		this.stopMove();

		var position = this.position();
		var ex = position.x + dx;
		var ey = position.y;
		var self = this;

		this._move(position.x, position.y, ex, ey, time, function(t, dt) {
			self._checkPosition(sdist, time - self.moveAnimation.elapsed(), true, false);
		});
	};

	/**
	 * Move the background in the y direction
	 *
	 * @param dy {Number} move distance. positive: to bottom, negative: to top
	 * @param time {Number} move time
	 * @param sdist {Object} sprite distination {x, y}
	 */
	pro._moveY = function(dy, time, sdist) {
		this.stopMove();

		var position = this.position();
		var ex = position.x;
		var ey = position.y + dy;
		var self = this;

		this._move(position.x, position.y, ex, ey, time, function(t, dt) {
			self._checkPosition(sdist, time - self.moveAnimation.elapsed(), false, true);
		});
	};

	/**
	 * Move the background in both x and y directions and the same time
	 *
	 * @param dx {Number} move distance. positive: to right, negative: to left
	 * @param dy {Number} move distance. positive: to bottom, negative: to top
	 * @param time {Number} move time
	 * @param sdist {Object} sprite distination {x, y}
	 */
	pro._moveAll = function(dx, dy, time, sdist) {
		this.stopMove();

		var position = this.position();
		var ex = position.x + dx;
		var ey = position.y + dy;
		var self = this;

		this._move(position.x, position.y, ex, ey, time, function(t, dt) {
			self._checkPosition(sdist, time - self.moveAnimation.elapsed(), true, true);
		});
	};

	/**
	 * The background keep still and just wait the frame end callback
	 *
	 * @param time {Number} move time
	 * @param sdist {Object} sprite distination {x, y}
	 */
	pro._stand = function(time, sdist) {
		this.stopMove();

		var mpos = this.position();
		var self = this;

		this._move(mpos.x, mpos.y, mpos.x, mpos.y, time, function(t, dt) {
			self._checkPosition(sdist, time - self.moveAnimation.elapsed(), false, false);
		});
	};

	/**
	 * Move the background from {sx, sy} to {ex, ey} within the time
	 *
	 * @param sx {Number} start x
	 * @param sy {Number} start y
	 * @param ex {Number} end x
	 * @param ey {Number} end y
	 * @param time {Number} move time
	 * @param onFrameEnd {Function} callback for each frame end
	 */
	pro._move = function(sx, sy, ex, ey, time, onFrameEnd) {
		this.moveAnimation = new animate.MoveTo(
			[0, {x: sx, y: sy}, 'linear'],
			[time, {x: ex, y: ey}, 'linear']
		);

		if(onFrameEnd) {
			this.moveAnimation.onFrameEnd = onFrameEnd;
		}

		this.node.exec('addAnimation', this.moveAnimation);
	};

	/**
	 * Check the position of sprite and map and deside whether to move the background
	 *
	 * @param sdist {Object} sprite distination {x, y}
	 * @param time {Number} move time
	 * @param osx {Boolean} old should move x flag
	 * @param osy {Boolean} old should move y flag
	 */
	pro._checkPosition = function(sdist, time, osx, osy) {
		var mpos = this.position();
		var spos = getCurPlayer().getSprite().getPosition();
		var dx = spos.x - sdist.x;
		var dy = spos.y - sdist.y;

		var sx = shouldMoveX(spos, mpos, dx, this.width);
		var sy = shouldMoveY(spos, mpos, dy, this.height);

		if(osx === sx && osy === sy) {
			// if the status is the same the origin one then nothing need to change
			return;
		}

		if(sx && sy) {
			// we should move both in x and y direction
			this._moveAll(dx, dy, time, sdist);
			return;
		}

		if(!sx && !sy) {
			// just stand
			this._stand(time, sdist);
			return;
		}

		if(sx) {
			// move in x direction
			this._moveX(dx, time, sdist);
			return;
		}

		// move in y direction
		this._moveY(dy, time, sdist);
	};

	/**
	 * Check whether the map can move in x direction
	 *
	 * @param pos {Object} map position {x, y}
	 * @param dx {Number} move direction. position means map move to the right and negative means move to the left and zero means no need to move in x direction.
	 */
	var canMoveX = function(pos, dx, width) {
		if(dx === 0) {
			return false;
		}

		if(dx > 0) {
			return !mapInLeft(pos, width);
		}

		return !mapInRight(pos, width, getScreenWidth());
	};

	/**
	 * Check whether the map can move in y direction
	 *
	 * @param pos {Object} map position {x, y}
	 * @param dy {Number} move direction. position means map move to the bottom and negative means move to the top and zero means no need to move in y direction.
	 */
	var canMoveY = function(pos, dy, height) {
		if(dy === 0) {
			return false;
		}

		if(dy > 0) {
			return !mapInTop(pos, height);
		}

		return !mapInBottom(pos, height, getScreenHeight());
	};

	/**
	 * Check whether the map should move in x direction. If the spite not in the middle of the screen and the map can move then it should move.
	 *
	 * @param spritePos {Object} sprite position {x, y}
	 * @param mapPos {Object} map position {x, y}
	 * @param dx {Number} map move direction. position means map move to the right and negative means move to the left and zero means no need to move in x direction.
	 */
	var shouldMoveX = function(spritePos, mapPos, dx, mapWidth) {
		var cx = canMoveX(mapPos, dx, mapWidth);
		if(!cx) {
			return false;
		}

		if(dx > 0) {
			return !spriteInRight(spritePos, mapPos, mapWidth);
		} else {
			return !spriteInLeft(spritePos, mapPos, mapWidth);
		}
	};

	/**
	 * Check whether the map should move in y direction. If the spite not in the middle of the screen and the map can move then it should move.
	 *
	 * @param spritePos {Object} sprite position {x, y}
	 * @param mapPos {Object} map position {x, y}
	 * @param dy {Number} map move direction. position means map move to the bottom and negative means move to the top and zero means no need to move in y direction.
	 */
	var shouldMoveY = function(spritePos, mapPos, dy, mapHeight) {
		var cy = canMoveY(mapPos, dy, mapHeight);
		if(!cy) {
			return false;
		}

		if(dy > 0) {
			return !spriteInBottom(spritePos, mapPos, mapHeight);
		} else {
			return !spriteInTop(spritePos, mapPos, mapHeight);
		}
	};

	pro.stopMove = function() {
		if (this.isMove()) {
			this.node.exec('removeAnimation', this.moveAnimation.identifier);
		}
	};

	pro.position = function(){
		if (this.node) {
			return this.node._component.matrix._matrix._position;
		} else {
			return {
				x: 0,
				y: 0,
				z: 0
			};
		}
	};

	//checkout the gameMap out of screen or not
	pro.checkMapBoundary = function(distX, distY, position) {
		var moveFlag = false;
		var width = parseInt(getComputedStyle(document.getElementById("m-main")).width, 10);
		var height = parseInt(getComputedStyle(document.getElementById("m-main")).height, 10);
		var maxWidth = this.width - width;
		var maxHeight = this.height - height;

		if (distX >= 0 && distY >= 0) {// 2
			if (position.x > 0 || position.y > 0) {
				moveFlag = true;
			}
		} else if (distX >= 0 && distY < 0) {//3
			if (position.x > 0 || position.y < -maxHeight) {
				moveFlag = true;
			}
		} else if (distX < 0 && distY >= 0) {//1
			if (position.y > 0 ||position.x < - maxWidth) {
				moveFlag = true;
			}
		} else if (distX < 0 && distY < 0) {//4
			if (position.x < -maxWidth || position.y < -maxHeight) {
				moveFlag = true;
			}
		}
		return moveFlag;
	};

	var getScreenWidth = function() {
		return parseInt(getComputedStyle(document.getElementById("m-main")).width, 10);
	};

	var getScreenHeight = function() {
		return parseInt(getComputedStyle(document.getElementById("m-main")).height, 10);
	};

	var mapInTop = function(mapPos, height) {
		return mapPos.y >= -10;
	};

	var mapInLeft = function(mapPos, width) {
		return mapPos.x >= -10;
	};

	var mapInBottom = function(mapPos, mapHeight, screenHeight) {
		return (mapHeight + mapPos.y - screenHeight) <= 10;
	};

	var mapInRight = function(mapPos, mapWidth, screenWidth) {
		return (mapWidth + mapPos.x - screenWidth) <= 10;
	};

	var spriteInTop = function(spritePos, mapPos) {
		return ((spritePos.y + mapPos.y) * 2 < getScreenHeight());
	};

	var spriteInLeft = function(spritePos, mapPos) {
		return ((spritePos.x + mapPos.x) * 2 < getScreenWidth());
	};

	var spriteInBottom = function(spritePos, mapPos) {
		return ((spritePos.y + mapPos.y) * 2 > getScreenHeight());
	};

	var spriteInRight = function(spritePos, mapPos) {
		return ((spritePos.x + mapPos.x) * 2 > getScreenWidth());
	};

	var getCurPlayer = function() {
		return app.getCurArea().getCurPlayer();
	};

	module.exports = Map;
}};
