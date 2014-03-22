/**
 * Module dependencies
 */
var messageService = require('../../../domain/messageService');
var areaService = require('../../../services/areaService');
var userDao = require('../../../dao/userDao');
var bagDao = require('../../../dao/bagDao');
var equipmentsDao = require('../../../dao/equipmentsDao');
var taskDao = require('../../../dao/taskDao');
var Move = require('../../../domain/action/move');
var actionManager = require('../../../domain/action/actionManager');
var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var consts = require('../../../consts/consts');
var dataApi = require('../../../util/dataApi');
var channelUtil = require('../../../util/channelUtil');
var utils = require('../../../util/utils');

var handler = module.exports;

/**
 * Player enter scene, and response the related information such as
 * playerInfo, areaInfo and mapData to client.
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.enterScene = function(msg, session, next) {
  var area = session.area;
  var playerId = session.get('playerId');
  var areaId = session.get('areaId');
	var teamId = session.get('teamId') || consts.TEAM.TEAM_ID_NONE;
	var isCaptain = session.get('isCaptain');
	var isInTeamInstance = session.get('isInTeamInstance');
	var instanceId = session.get('instanceId');
	utils.myPrint("1 ~ EnterScene: areaId = ", areaId);
	utils.myPrint("1 ~ EnterScene: playerId = ", playerId);
	utils.myPrint("1 ~ EnterScene: teamId = ", teamId);

  userDao.getPlayerAllInfo(playerId, function(err, player) {
    if (err || !player) {
      logger.error('Get user for userDao failed! ' + err.stack);
      next(new Error('fail to get user from dao'), {
        route: msg.route,
        code: consts.MESSAGE.ERR
      });

      return;
    }

    player.serverId = session.frontendId;
		player.teamId = teamId;
		player.isCaptain = isCaptain;
		player.isInTeamInstance = isInTeamInstance;
		player.instanceId = instanceId;
		areaId = player.areaId;
		utils.myPrint("2 ~ GetPlayerAllInfo: player.instanceId = ", player.instanceId);

    pomelo.app.rpc.chat.chatRemote.add(session, session.uid,
			player.name, channelUtil.getAreaChannelName(areaId), null);
		var map = area.map;

    // temporary code
    //Reset the player's position if current pos is unreachable
		if(!map.isReachable(player.x, player.y)) {
    // {
			var pos = map.getBornPoint();
			player.x = pos.x;
			player.y = pos.y;
		}
    // temporary code

		var data = {
        entities: area.getAreaInfo({x: player.x, y: player.y}, player.range),
        curPlayer: player.getInfo(),
        map: {
          name : map.name,
          width: map.width,
          height: map.height,
          tileW : map.tileW,
          tileH : map.tileH,
          weightMap: map.collisions
        }
    };
		// utils.myPrint("1.5 ~ GetPlayerAllInfo data = ", JSON.stringify(data));
		next(null, data);

		utils.myPrint("2 ~ GetPlayerAllInfo player.teamId = ", player.teamId);
		utils.myPrint("2 ~ GetPlayerAllInfo player.isCaptain = ", player.isCaptain);
		if (!area.addEntity(player)) {
      logger.error("Add player to area faild! areaId : " + player.areaId);
      next(new Error('fail to add user into area'), {
       route: msg.route,
       code: consts.MESSAGE.ERR
      });
      return;
    }

		if (player.teamId > consts.TEAM.TEAM_ID_NONE) {
			// send player's new info to the manager server(team manager)
			var memberInfo = player.toJSON4TeamMember();
			memberInfo.backendServerId = pomelo.app.getServerId();
			pomelo.app.rpc.manager.teamRemote.updateMemberInfo(session, memberInfo,
				function(err, ret) {
				});
		}

  });
};

/**
 * Change player's view.
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.changeView = function(msg, session, next){
  var timer = session.area.timer;

	var playerId = session.get('playerId');
	var width = msg.width;
	var height = msg.height;

	var radius = width>height ? width : height;

	var range = Math.ceil(radius / 600);
	var player = session.area.getPlayer(playerId);

	if(range < 0 || !player){
		next(new Error('invalid range or player'));
		return;
	}

	if(player.range !== range){
    timer.updateWatcher({id:player.entityId, type:player.type}, player, player, player.range, range);
		player.range = range;
	}

	next();
};

/**
 * Player moves. Player requests move with the given movePath.
 * Handle the request from client, and response result to client
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.move = function(msg, session, next) {
  var area = session.area;
  var timer = area.timer;

  var path = msg.path;
  var playerId = session.get('playerId');
  var player = area.getPlayer(playerId);
  var speed = player.walkSpeed;

  player.target = null;

  if(!area.map.verifyPath(path)){
    logger.warn('The path is illegal!! The path is: %j', msg.path);
    next(null, {
      route: msg.route,
      code: consts.MESSAGE.ERR
    });

    return;
  }

  var action = new Move({
    entity: player,
    path: path,
    speed: speed
  });

	var ignoreList = {};
	ignoreList[player.userId] = true;
  if (timer.addAction(action)) {
			player.isMoving = true;
			//Update state
			if(player.x !== path[0].x || player.y !== path[0].y){
					timer.updateObject({id:player.entityId, type:consts.EntityType.PLAYER}, {x : player.x, y : player.y}, path[0]);
          timer.updateWatcher({id:player.entityId, type:consts.EntityType.PLAYER}, {x : player.x, y : player.y}, path[0], player.range, player.range);
			}

      messageService.pushMessageByAOI(area, {
      route: 'onMove',
      entityId: player.entityId,
      path: path,
      speed: speed
    }, path[0], ignoreList);
    next(null, {
      route: msg.route,
      code: consts.MESSAGE.RES
    });

    // next();
  }
  next(null, {});
};

//drop equipment or item
handler.dropItem = function(msg, session, next) {
  var player = session.area.getPlayer(session.get('playerId'));

  player.bag.removeItem(msg.index);

  next(null, {status: true});
};

//add equipment or item
handler.addItem = function(msg, session, next) {
  var player = session.area.getPlayer(session.get('playerId'));

  var bagIndex = player.bag.addItem(msg.item);

  next(null, {bagIndex: bagIndex});
};

//Change area
handler.changeArea = function(msg, session, next) {
	var playerId = session.get('playerId');
	var areaId = msg.areaId;
	var target = msg.target;

	utils.myPrint('areaId, target = ', areaId, target);
	if (areaId === target) {
		next(null, {success: false});
		return;
	}
	utils.myPrint('playerId = ', playerId);
	var player = session.area.getPlayer(playerId);
	if (!player) {
		next(null, {success: false});
		return;
	}

  // save player's data immediately
  userDao.updatePlayer(player);
  bagDao.update(player.bag);
  equipmentsDao.update(player.equipments);
  taskDao.tasksUpdate(player.curTasks);

	var teamId = player.teamId;
	var isCaptain = player.isCaptain;

	var req = {
    areaId: areaId,
    target: target,
    uid: session.uid,
    playerId: playerId,
    frontendId: session.frontendId
  };

	utils.myPrint('teamId, isCaptain = ', teamId, isCaptain);
	utils.myPrint('msg.triggerByPlayer = ', msg.triggerByPlayer);
  utils.myPrint('changeArea is running ...');
  areaService.changeArea(req, session, function(err) {
    var args = {areaId: areaId, target: target, success: true};
    next(null, args);
  });
};

//Use item
handler.useItem = function(msg, session, next) {
  var player = session.area.getPlayer(session.get('playerId'));

  var status = player.useItem(msg.index);

  next(null, {code: consts.MESSAGE.RES, status: status});
};

handler.npcTalk = function(msg, session, next) {
  var player = session.area.getPlayer(session.get('playerId'));
  player.target = msg.targetId;
  next();
};

/**
 * Player pick up item.
 * Handle the request from client, and set player's target
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.pickItem = function(msg, session, next) {
  var area = session.area;

  var player = area.getPlayer(session.get('playerId'));
  var target = area.getEntity(msg.targetId);
  if(!player || !target || (target.type !== consts.EntityType.ITEM && target.type !== consts.EntityType.EQUIPMENT)){
    next(null, {
      route: msg.route,
      code: consts.MESSAGE.ERR
    });
    return;
  }

  player.target = target.entityId;

  // next();
  next(null, {});
};

//Player  learn skill
handler.learnSkill = function(msg, session, next) {
  var player = session.area.getPlayer(session.get('playerId'));
  var status = player.learnSkill(msg.skillId);

  next(null, {status: status, skill: player.fightSkills[msg.skillId]});
};

//Player upgrade skill
handler.upgradeSkill = function(msg, session, next) {
  var player = session.area.getPlayer(session.get('playerId'));
  var status = player.upgradeSkill(msg.skillId);

  next(null, {status: status});
};
