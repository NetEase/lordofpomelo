/**
 * Module dependencies
 */
var messageService = require('../../../domain/messageService');
var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../../../consts/consts');
var utils = require('../../../util/utils');
var dataApi = require('../../../util/dataApi');


module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
  this.teamNameArr = dataApi.team.all();
  this.teamNameArr.length = Object.keys(this.teamNameArr).length;
  // utils.myPrint('teamNameArr = ', JSON.stringify(this.teamNameArr));
};

/**
 * Player create a team, and response the result information : success(1)/failed(0)
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
Handler.prototype.createTeam = function(msg, session, next) {
  var area = session.area;
  var playerId = session.get('playerId');
  utils.myPrint('Handler ~ createTeam is running ... ~ playerId = ', playerId);
  var player = area.getPlayer(playerId);

  if(!player) {
    logger.warn('The request(createTeam) is illegal, the player is null : msg = %j.', msg);
    next();
    return;
  }

  // if the player is already in a team, can't create team
  if(player.teamId !== consts.TEAM.TEAM_ID_NONE) {
    logger.warn('The request(createTeam) is illegal, the player is already in a team : msg = %j.', msg);
    next();
    return;
  }

  var tmpIdx = Math.floor((Math.random() * this.teamNameArr.length) + 1);
  var teamName = this.teamNameArr[tmpIdx] ? this.teamNameArr[tmpIdx].teamName : consts.TEAM.DEFAULT_NAME;
  var backendServerId = this.app.getServerId();
  var result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
  var playerInfo = player.toJSON4TeamMember();
  var args = {teamName: teamName, playerId: playerId, areaId: area.areaId, userId: player.userId,
    serverId: player.serverId, backendServerId: backendServerId, playerInfo: playerInfo};
  this.app.rpc.manager.teamRemote.createTeam(session, args,
    function(err, ret) {
      utils.myPrint("ret.result = ", ret.result);
      utils.myPrint("typeof ret.result = ", typeof ret.result);
      result = ret.result;
      var teamId = ret.teamId;
      utils.myPrint("result = ", result);
      utils.myPrint("teamId = ", teamId);
      if(result === consts.TEAM.JOIN_TEAM_RET_CODE.OK && teamId > consts.TEAM.TEAM_ID_NONE) {
        if(!player.joinTeam(teamId)) {
          result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
        }
      }
      utils.myPrint("player.teamId = ", player.teamId);
      if(result === consts.TEAM.JOIN_TEAM_RET_CODE.OK && player.teamId > consts.TEAM.TEAM_ID_NONE) {
        player.isCaptain = consts.TEAM.YES;
        var ignoreList = {};
        messageService.pushMessageByAOI(area,
          {
            route: 'onTeamCaptainStatusChange',
            playerId: playerId,
            teamId: player.teamId,
            isCaptain: player.isCaptain,
            teamName: teamName
          },
          {x: player.x, y: player.y}, ignoreList);
      }

      next();
    });
};

/**
 * Captain disband the team, and response the result information : success(1)/failed(0)
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
Handler.prototype.disbandTeam = function(msg, session, next) {
  var area = session.area;
  var playerId = session.get('playerId');
  var player = area.getPlayer(playerId);

  if(!player) {
    logger.warn('The request(disbandTeam) is illegal, the player is null : msg = %j.', msg);
    next();
    return;
  }

  if(player.teamId <= consts.TEAM.TEAM_ID_NONE || msg.teamId !== player.teamId) {
    logger.warn('The request(disbandTeam) is illegal, the teamId is wrong : msg = %j.', msg);
    next();
    return;
  }

  utils.myPrint('playerId, IsInTeamInstance = ', playerId, player.isInTeamInstance);
  if (player.isInTeamInstance) {
    next();
    return;
  }

  if (!player.isCaptain) {
    logger.warn('The request(disbandTeam) is illegal, the player is not the captain : msg = %j.', msg);
    next();
    return;
  }

  var result = consts.TEAM.FAILED;

  var args = {playerId: playerId, teamId: player.teamId};
  this.app.rpc.manager.teamRemote.disbandTeamById(session, args,
    function(err, ret) {
      result = ret.result;
      utils.myPrint("1 ~ result = ", result);
      if(result === consts.TEAM.OK) {
        if (player.isCaptain) {
          player.isCaptain = consts.TEAM.NO;
          var ignoreList = {};
          messageService.pushMessageByAOI(area,
            {
              route: 'onTeamCaptainStatusChange',
              playerId: playerId,
              teamId: player.teamId,
              isCaptain: player.isCaptain,
              teamName: consts.TEAM.DEFAULT_NAME
            },
            {x: player.x, y: player.y}, ignoreList);
        }
      }
    });

  next();
};

/**
 * Notify: Captain invite a player to join the team, and push invitation to the invitee
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
Handler.prototype.inviteJoinTeam = function(msg, session, next) {
  var area = session.area;
  var captainId = session.get('playerId');
  var captainObj = area.getPlayer(captainId);

  if(!captainObj) {
    logger.warn('The request(inviteJoinTeam) is illegal, the player is null : msg = %j.', msg);
    next();
    return;
  }

  var inviteeObj = area.getPlayer(msg.inviteeId);
  if(!inviteeObj) {
    logger.warn('The request(inviteJoinTeam) is illegal, the invitee is null : msg = %j.', msg);
    next();
    return;
  }

  // send invitation to the invitee
  var args = {captainId: captainId, teamId: msg.teamId};
  this.app.rpc.manager.teamRemote.inviteJoinTeam(session, args, function(err, ret) {
    var result = ret.result;
    utils.myPrint("result = ", result);
    if(result === consts.TEAM.OK) {
      var captainInfo = captainObj.toJSON4Team();
      messageService.pushMessageToPlayer({uid : inviteeObj.userId, sid : inviteeObj.serverId},
        'onInviteJoinTeam', captainInfo);
    }
  });
  next();
};

/**
 * Request: invitee reply to join the team's captain, response the result, and push msg to the team members
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
Handler.prototype.inviteJoinTeamReply = function(msg, session, next) {
  var area = session.area;
  var inviteeId = session.get('playerId');
  var inviteeObj = area.getPlayer(inviteeId);

  if(!inviteeObj) {
    logger.warn('The request(inviteJoinTeamReply) is illegal, the player is null : msg = %j.', msg);
    next();
    return;
  }

  var captainObj = area.getPlayer(msg.captainId);
  if(!captainObj) {
    logger.warn('The request(inviteJoinTeamReply) is illegal, the captain is null : msg = %j.', msg);
    next();
    return;
  }

  if (msg.teamId !== captainObj.teamId) {
    logger.warn('The request(inviteJoinTeamReply) is illegal, the teamId is wrong : msg = %j.', msg);
    next();
    return;
  }

  var result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
  var backendServerId = this.app.getServerId();
  if(msg.reply === consts.TEAM.JOIN_TEAM_REPLY.ACCEPT) {
    var inviteeInfo = inviteeObj.toJSON4TeamMember();
    var args = {captainId: msg.captainId, teamId: msg.teamId,
      playerId: inviteeId, areaId: area.areaId, userId: inviteeObj.userId,
      serverId: inviteeObj.serverId, backendServerId: backendServerId,
      playerInfo: inviteeInfo};
    this.app.rpc.manager.teamRemote.acceptInviteJoinTeam(session, args, function(err, ret) {
      utils.myPrint('AcceptInviteJoinTeam ~ ret = ', JSON.stringify(ret));
      result = ret.result;
      if(result === consts.TEAM.JOIN_TEAM_RET_CODE.OK) {
        if(!inviteeObj.joinTeam(msg.teamId)) {
          result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
          messageService.pushMessageToPlayer({uid: captainObj.userId, sid: captainObj.serverId},
            'onInviteJoinTeamReply', {reply: result});
        } else {
          inviteeObj.isCaptain = consts.TEAM.NO;
          var ignoreList = {};
          messageService.pushMessageByAOI(area,
            {
              route: 'onTeamMemberStatusChange',
              playerId: inviteeId,
              teamId: inviteeObj.teamId,
              isCaptain: inviteeObj.isCaptain,
              teamName: ret.teamName
            },
            {x: inviteeObj.x, y: inviteeObj.y}, ignoreList);
        }
        utils.myPrint('invitee teamId = ', inviteeObj.teamId);
      } else {
        messageService.pushMessageToPlayer({uid: captainObj.userId, sid: captainObj.serverId},
          'onInviteJoinTeamReply', {reply: result});
      }
    });
  } else {
    // push msg to the inviter(the captain) that the invitee reject to join the team
    messageService.pushMessageToPlayer({uid: captainObj.userId, sid: captainObj.serverId},
      'onInviteJoinTeamReply', {reply: result});
  }
  next();
};

/**
 * Notify: applicant apply to join the team, and push the application to the captain
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
Handler.prototype.applyJoinTeam = function(msg, session, next) {
  utils.myPrint('ApplyJoinTeam ~ msg = ', JSON.stringify(msg));
  var area = session.area;
  var applicantId = session.get('playerId');
  var applicantObj = area.getPlayer(applicantId);

  if(!applicantObj) {
    logger.warn('The request(applyJoinTeam) is illegal, the player is null : msg = %j.', msg);
    next();
    return;
  }

  if(applicantObj.isInTeam()) {
    next();
    return;
  }

  var captainObj = area.getPlayer(msg.captainId);
  if(!captainObj) {
    logger.warn('The request(applyJoinTeam) is illegal, the captain is null : msg = %j.', msg);
    next();
    return;
  }

  if(captainObj.teamId !== msg.teamId) {
    logger.warn('The request(applyJoinTeam) is illegal, the teamId is wrong : msg = %j.', msg);
    next();
    return;
  }
  // send the application to the captain
  var args = {applicantId: applicantId, teamId: msg.teamId};
  this.app.rpc.manager.teamRemote.applyJoinTeam(session, args, function(err, ret) {
    var result = ret.result;
    utils.myPrint("result = ", result);
    if(result === consts.TEAM.OK) {
      var applicantInfo = applicantObj.toJSON4Team();
      messageService.pushMessageToPlayer({uid: captainObj.userId, sid: captainObj.serverId},
        'onApplyJoinTeam', applicantInfo);
    }
  });
  next();
};

/**
 * Notify: captain reply the application, and push msg to the team members(accept) or only the applicant(reject)
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
Handler.prototype.applyJoinTeamReply = function(msg, session, next) {
  var area = session.area;
  var playerId = session.get('playerId');
  var player = area.getPlayer(playerId);

  if(!player) {
    logger.warn('The request(applyJoinTeamReply) is illegal, the player is null : msg = %j.', msg);
    next();
    return;
  }

  if (!player.isCaptain || player.teamId !== msg.teamId) {
    logger.warn('The request(applyJoinTeamReply) is illegal, the teamId is wrong : msg = %j.', msg);
    next();
    return;
  }

  var applicantObj = area.getPlayer(msg.applicantId);
  if(!applicantObj) {
    logger.warn('The request(applyJoinTeamReply) is illegal, the applicantObj is null : msg = %j.', msg);
    next();
    return;
  }

  if(applicantObj.isInTeam()) {
    next();
    return;
  }

  if(msg.reply === consts.TEAM.JOIN_TEAM_REPLY.ACCEPT) {
    var result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
    var applicantInfo = applicantObj.toJSON4TeamMember();
    var backendServerId = this.app.getServerId();
    var args = {captainId: playerId, teamId: msg.teamId,
      playerId: msg.applicantId, areaId: area.areaId, userId: applicantObj.userId,
      serverId: applicantObj.serverId, backendServerId: backendServerId,
      playerInfo: applicantInfo};
    this.app.rpc.manager.teamRemote.acceptApplicantJoinTeam(session, args, function(err, ret) {
      utils.myPrint('ApplyJoinTeamReply ~ ret = ', JSON.stringify(ret));
      result = ret.result;
      if(result === consts.TEAM.JOIN_TEAM_RET_CODE.OK) {
        if(!applicantObj.joinTeam(msg.teamId)) {
          result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
          messageService.pushMessageToPlayer({uid: applicantObj.userId, sid: applicantObj.serverId},
            'onApplyJoinTeamReply', {reply: result});
        } else {
          applicantObj.isCaptain = consts.TEAM.NO;
          var ignoreList = {};
          messageService.pushMessageByAOI(area,
            {
              route: 'onTeamMemberStatusChange',
              playerId: msg.applicantId,
              teamId: applicantObj.teamId,
              isCaptain: applicantObj.isCaptain,
              teamName: ret.teamName
            },
            {x: applicantObj.x, y: applicantObj.y}, ignoreList);
        }
        utils.myPrint('applicantObj teamId = ', applicantObj.teamId);
      } else {
        messageService.pushMessageToPlayer({uid: applicantObj.userId, sid: applicantObj.serverId},
          'onApplyJoinTeamReply', {reply: ret.result});
      }
    });
  } else {
    // push tmpMsg to the applicant that the captain rejected
    messageService.pushMessageToPlayer({uid: applicantObj.userId, sid: applicantObj.serverId},
      'onApplyJoinTeamReply', {reply: consts.TEAM.JOIN_TEAM_REPLY.REJECT});
  }
  next();
};

/**
 * Captain kicks a team member, and push info to the kicked member and other members
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
Handler.prototype.kickOut = function(msg, session, next) {
  var area = session.area;
  var captainId = session.get('playerId');
  var captainObj = area.getPlayer(captainId);

  if(!captainObj) {
    logger.warn('The request(kickOut) is illegal, the captainObj is null : msg = %j.', msg);
    next();
    return;
  }

  if(captainId === msg.kickedPlayerId) {
    logger.warn('The request(kickOut) is illegal, the kickedPlayerId is captainId : msg = %j.', msg);
    next();
    return;
  }

  if(captainObj.teamId <= consts.TEAM.TEAM_ID_NONE || msg.teamId !== captainObj.teamId) {
    logger.warn('The request(kickOut) is illegal, the teamId is wrong : msg = %j.', msg);
    next();
    return;
  }

  utils.myPrint('captainId, IsInTeamInstance = ', captainId, captainObj.isInTeamInstance);
  if (captainObj.isInTeamInstance) {
    next();
    return;
  }

  var args = {captainId: captainId, teamId: msg.teamId, kickedPlayerId: msg.kickedPlayerId};
  this.app.rpc.manager.teamRemote.kickOut(session, args,
    function(err, ret) {
    });
  next();
};

/**
 * member leave the team voluntarily, and push info to other members
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
Handler.prototype.leaveTeam = function(msg, session, next) {
  var area = session.area;
  var playerId = session.get('playerId');
  var player = area.getPlayer(playerId);

  if(!player) {
    logger.warn('The request(leaveTeam) is illegal, the player is null: msg = %j.', msg);
    next();
    return;
  }

  utils.myPrint('playerId, IsInTeamInstance = ', playerId, player.isInTeamInstance);
  if (player.isInTeamInstance) {
    next();
    return;
  }

  var result = consts.TEAM.FAILED;

  utils.myPrint("player.teamId = ", player.teamId);
  utils.myPrint("typeof player.teamId = ", typeof player.teamId);

  utils.myPrint("msg.teamId = ", msg.teamId);
  utils.myPrint("typeof msg.teamId = ", typeof msg.teamId);

  if(player.teamId <= consts.TEAM.TEAM_ID_NONE || player.teamId !== msg.teamId) {
    logger.warn('The request(leaveTeam) is illegal, the teamId is wrong: msg = %j.', msg);
    next();
    return;
  }

  var args = {playerId: playerId, teamId: player.teamId};
  this.app.rpc.manager.teamRemote.leaveTeamById(session, args,
    function(err, ret) {
      result = ret.result;
      utils.myPrint("1 ~ result = ", result);
      if(result === consts.TEAM.OK && !player.leaveTeam()) {
        result = consts.TEAM.FAILED;
      }
      if (result === consts.TEAM.OK) {
        var route = 'onTeamMemberStatusChange';
        if(player.isCaptain) {
          route = 'onTeamCaptainStatusChange';
          player.isCaptain = consts.TEAM.NO;
        }
        var ignoreList = {};
        messageService.pushMessageByAOI(area,
          {
            route: route,
            playerId: playerId,
            teamId: player.teamId,
            isCaptain: player.isCaptain,
            teamName: consts.TEAM.DEFAULT_NAME
          },
          {x: player.x, y: player.y}, ignoreList);
      }

      utils.myPrint("teamId = ", player.teamId);
    });

  next();
};
