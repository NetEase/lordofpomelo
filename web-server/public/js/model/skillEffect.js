__resources__["/skillEffect.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	/**
	 * Module dependencies.
	 */
	var app = require('app');
	var dataApi = require('dataApi');
	var imgAndJsonUrl = require('config').IMAGE_URL;
	var FrameAnimation = require('frameanimation').FrameAnimation;

	/**
	 * SkillEffect animation, which is created by skillId and player
	 * 
	 * @param {Object} opts, contains skillId, player and position
	 * @api public
	 */
	var SkillEffect = function(opts) {
		this.id = opts.id;
		this.player = opts.player;
		this.position = opts.position;
	};

	/**
	 * Create effect animation.
	 */
	SkillEffect.prototype.createEffectAni = function() {
		if (this.id === 1) {
			return;
		}
		var animationData = dataApi.effect.findById(this.id);
		var width = animationData.width;
		var height = animationData.height;
		var totalFrames = animationData.totalFrames; 
		var img = getImageByName(animationData.className);

		var ani = new FrameAnimation({
			image : img,
			w : width,
			h : height,
			totalTime : totalFrames * 50,
			interval : 50
		});
		this._initNode(ani);
	};

	/**
	 * Init node for effect by animation
	 *
	 * @param {FrameAnimation} animation, a instance of FrameAnimation
	 * @api private
	 */
	SkillEffect.prototype._initNode = function(animation) {
		var scene = this.player.scene;
		var sprite = this.player.getSprite();
		var effectModel = animation.target();
		var effectNode = scene.createNode({
			model: effectModel
		});
		effectModel.set('ratioAnchorPoint', {
			x: 0.5,
			y: 0.8
		});
		effectNode.exec('addAnimation', animation);
		scene.addNode(effectNode, sprite.curNode);
		effectNode.exec('translate', this.position.x, this.position.y, 0.5);
		animation.onFrameEnd = function(t, dt) { 
			if (animation.isDone()) {
				sprite.curNode.removeChild(effectNode);
			}
		};
	};

	/*
	 * Get image by name, the image is sequence frame
	 *
	 * @param {String} name
	 * @return {Image} img
	 * @api private
	 */
	var getImageByName = function(name) {
		var aniIamgeUrl = imgAndJsonUrl+'effect/'+name+'.png';
		var ResMgr = app.getResMgr();
		var img = ResMgr.loadImage(aniIamgeUrl);
		if(img) {
			return img;
		}else {
			console.error('the iamge is not exist!');
		}
	};

	module.exports = SkillEffect;
}};
