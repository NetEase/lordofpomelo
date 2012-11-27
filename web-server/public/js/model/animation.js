__resources__["/animation.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

	/**
	 * Module dependencies
	 */

	var FrameAnimation = require('frameanimation').FrameAnimation;
	var EntityType = require('consts').EntityType;
	var imgAndJsonUrl = require('config').IMAGE_URL;
	var dataApi = require('dataApi');
	var app = require('app');
	var aniOrientation = require('consts').Orientation;

	/**
	 * Initialize a new 'Animation' with the given 'opts'
	 * 
	 * @param {Object} opts
	 * @api public
	 */

	var Animation = function(opts) {
		this.kindId = opts.kindId;
		this.type = opts.type;
		this.name = opts.name;
	};

	/**
	 * Create animation, each node owns four basic animations
	 * standAnimation, walkAnimation, diedAnimation and attackAnimation
	 *
	 * @api public
	 */
	Animation.prototype.create = function() {
		var animationData = this.getJsonData();
		var width = animationData.width;
		var height = animationData.height;
		var totalFrames = animationData.totalFrames;

		var img = this.getImage();

		var ani = new FrameAnimation({
			image : img,
			w : width,
			h : height,
			totalTime : totalFrames * 80,
			interval : 80
		});
		// test for new animation
		if (this.type === EntityType.PLAYER) {
			ani = new FrameAnimation({
				image: img,
				w: width,
				h: height,
				totalTime: totalFrames * 50,
				interval: 50,
				XSpan: width,
				VSpan: height + 25
			});
		}

		ani.name = this.name;
		return ani;
	};

	/**
	 * Get animation's jsonData.
	 *
	 * @api public
	 */
	Animation.prototype.getJsonData= function() {
		var id = this.kindId, type = this.type, name = this.name, data;
		if (type === EntityType.PLAYER || type === EntityType.MOB) {
			data = dataApi.animation.get(id)[name];

			//test for new animation
			if (type === EntityType.PLAYER) {
				data = {
					width:500,
					height: 400,
					totalFrames: 8
				};
			}

		} else if (type === EntityType.NPC) {
			data = {
				width: 250,
				height: 100,
				totalFrames:1
			};
		}
		if (data) {
			return data;
		} else {
			console.error('the jsonData :'+id+'/'+name+'.json is not exist!');
		}
	};

	/**
	 * Get animation's iamge.
	 *
	 * @api public
	 */
	Animation.prototype.getImage = function() {
		var id = this.kindId, type = this.type, name = this.name;
		var aniIamgeUrl;
		if (type === EntityType.PLAYER || type === EntityType.MOB) {
			aniIamgeUrl = imgAndJsonUrl+'animation/character/'+id+'/'+name+'.png';

			//test for new animation
			if (type === EntityType.PLAYER) {
				aniIamgeUrl = imgAndJsonUrl + 'pomeloArt/animation/Angle/RightDownWalk.png'
			}

		} else if(type === EntityType.NPC) {
			if (name === aniOrientation.LEFT) {
				aniIamgeUrl = imgAndJsonUrl+'npc/'+id+'/stand/frame_0.png';
			} else {
				aniIamgeUrl = imgAndJsonUrl+'npc/'+id+'/stand/frame_15.png';
			}
		}

		var ResMgr = app.getResMgr();
		var img = ResMgr.loadImage(aniIamgeUrl);
		if(img) {
			return img;
		}else {
			console.error('the iamge :'+id+'/'+name+'.PNG is not exist!');
		}
	};

	module.exports = Animation;
}};
