/**
 * Module dependencies
 */
var Team = require('../domain/entity/team');
var consts = require('../consts/consts');
var utils = require('../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports;

// global team container(teamId:teamObj)
var gTeamObjDict = {};
// global team id
var gTeamId = 0;

// create new team, add the player(captain) to the team
exp.createTeam = function(data) {
  var teamObj = new Team(++gTeamId);
  var result = teamObj.addPlayer(data, true);
  if(result === consts.TEAM.JOIN_TEAM_RET_CODE.OK) {
    teamObj.setCaptainId(data.playerId);
    gTeamObjDict[teamObj.teamId] = teamObj;
  }
  return {result: result, teamId: teamObj.teamId};
};

exp.getTeamById = function(teamId) {
  var teamObj = gTeamObjDict[teamId];
  return teamObj || null;
};

exp.disbandTeamById = function(playerId, teamId) {
  var teamObj = gTeamObjDict[teamId];
  if(!teamObj || !teamObj.isCaptainById(playerId)) {
    return {result: consts.TEAM.FAILED};
  }

  var ret = teamObj.disbandTeam();
  if(ret.result) {
    delete gTeamObjDict[teamId];
  }
  return ret;
};

// check member num when a member leaves the team,
// if there is no member in the team,
// disband the team automatically
exp.try2DisbandTeam = function(teamObj) {
  if(!teamObj.isTeamHasMember()) {
    delete gTeamObjDict[teamObj.teamId];
  }
};

exp.leaveTeamById = function(playerId, teamId, cb) {
  var teamObj = gTeamObjDict[teamId];
  if(!teamObj) {
    utils.invokeCallback(cb, null, {result: consts.TEAM.FAILED});
    return;
  }

  var needDisband = teamObj.removePlayer(playerId, function(err, ret) {
    utils.invokeCallback(cb, null, ret);
  });
  if (needDisband) {
    utils.myPrint('delete gTeamObjDict[teamId] ...');
    delete gTeamObjDict[teamId];
  }
};

exp.dragMember2gameCopy = function(args, cb) {
  utils.myPrint('2 ~ DragMember2gameCopy ~ args = ', JSON.stringify(args));
  var teamId = args.teamId;
  if (!teamId) {
    utils.invokeCallback(cb, 'No teamId! %j', args);
    return;
  }
  var teamObj = gTeamObjDict[teamId];
  if(!teamObj) {
    utils.invokeCallback(cb, 'No teamObj! %j', args);
    return;
  }
  teamObj.dragMember2gameCopy(args, cb);
};

exp.applyJoinTeam = function(args) {
  var result = consts.TEAM.FAILED;
  if (!args || !args.teamId) {
    return {result: result};
  }
  var teamId = args.teamId;
  var teamObj = gTeamObjDict[teamId];
  if (teamObj) {
    if (teamObj.isTeamHasPosition() && !teamObj.isPlayerInTeam(args.applicantId)) {
      result = consts.TEAM.OK;
    }
  }

  return {result: result};
};

exp.acceptApplicantJoinTeam = function(args) {
  var result = consts.TEAM.FAILED;
  var teamName = consts.TEAM.DEFAULT_NAME;
  if (!args || !args.teamId) {
    return {result: result};
  }
  var teamId = args.teamId;
  var teamObj = gTeamObjDict[teamId];
  if (teamObj) {
    if(!teamObj.isCaptainById(args.captainId)) {
      return {result: result};
    }
    result = teamObj.addPlayer(args);
    teamName = teamObj.teamName;
  }
  return {result: result, teamName: teamName};
};

exp.inviteJoinTeam = function(args) {
  var result = consts.TEAM.FAILED;
  if (!args || !args.teamId) {
    return {result: result};
  }
  var teamId = args.teamId;
  var teamObj = gTeamObjDict[teamId];
  if (teamObj) {
    if (teamObj.isTeamHasPosition() && teamObj.isCaptainById(args.captainId)) {
      result = consts.TEAM.OK;
    }
  }

  return {result: result};
};

exp.acceptInviteJoinTeam = function(args) {
  var result = consts.TEAM.FAILED;
  var teamName = consts.TEAM.DEFAULT_NAME;
  if (!args || !args.teamId) {
    return {result: result};
  }
  var teamId = args.teamId;
  var teamObj = gTeamObjDict[teamId];
  if (teamObj) {
    if(!teamObj.isCaptainById(args.captainId)) {
      return {result: result};
    }
    result = teamObj.addPlayer(args);
    teamName = teamObj.teamName;
  }
  return {result: result, teamName: teamName};
};

exp.updateMemberInfo = function(args) {
  var result = consts.TEAM.FAILED;
  if (!args || !args.playerData.teamId) {
    return {result: result};
  }
  var teamId = args.playerData.teamId;
  var teamObj = gTeamObjDict[teamId];
  if (teamObj && teamObj.updateMemberInfo(args)) {
    result = consts.TEAM.OK;
  }

  return {result: result};
};

exp.chatInTeam = function(args) {
  var result = consts.TEAM.FAILED;
  if (!args || !args.teamId) {
    return {result: result};
  }
  var teamId = args.teamId;
  var teamObj = gTeamObjDict[teamId];
  utils.myPrint('args = ', JSON.stringify(args));
  utils.myPrint('teamObj = ', teamObj);
  if (teamObj && teamObj.pushChatMsg2All(args.content)) {
    result = consts.TEAM.OK;
  }

  return {result: result};
};


exp.kickOut = function(args, cb) {
  if (!args || !args.teamId) {
    utils.invokeCallback(cb, null, {result: consts.TEAM.FAILED});
    return;
  }
  var teamId = args.teamId;
  var teamObj = gTeamObjDict[teamId];
  if (teamObj) {
    if(!teamObj.isCaptainById(args.captainId)) {
      logger.warn('The request(kickOut) is illegal, the captainId is wrong : args = %j.', args);
      utils.invokeCallback(cb, null, {result: consts.TEAM.FAILED});
      return;
    }
    teamObj.removePlayer(args.kickedPlayerId, function(err, ret) {
      utils.invokeCallback(cb, null, ret);
    });
  }
};
