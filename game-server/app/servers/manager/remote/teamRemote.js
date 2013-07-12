var utils = require('../../../util/utils');
var teamManager = require('../../../services/teamManager');

module.exports = function(){
  return new TeamRemote();
};

var TeamRemote = function(){
};

// can a player create a game copy
TeamRemote.prototype.canCreateGameCopy = function(args, cb){
  var playerId = args.playerId;
  var teamId = args.teamId;

  var result = false;
  var teamObj = teamManager.getTeamById(teamId);
  if(teamObj) {
    result = teamObj.isCaptainById(playerId);
  }

  utils.invokeCallback(cb, null, result);
};

// create a new team
TeamRemote.prototype.createTeam = function(args, cb) {
  utils.myPrint('TeamRemote ~ createTeam is running ...typeof args = ', typeof args);
  utils.myPrint('args = ', args);
  utils.myPrint('playerInfo = ', JSON.stringify(args.playerInfo));
  var ret = teamManager.createTeam(args);

  utils.invokeCallback(cb, null, ret);
};

// disband a team
TeamRemote.prototype.disbandTeamById = function(args, cb){
  var playerId = args.playerId;
  var teamId = args.teamId;
  var ret = teamManager.disbandTeamById(playerId, teamId);
  utils.myPrint('TeamRemote ~ DisbandTeamById is running ~ ret = ', ret);
  utils.invokeCallback(cb, null, ret);
};

// leave a team
TeamRemote.prototype.leaveTeamById = function(args, cb){
  var playerId = args.playerId;
  var teamId = args.teamId;
  teamManager.leaveTeamById(playerId, teamId, cb);
};

// drag the team members to the game copy
TeamRemote.prototype.dragMember2gameCopy = function(args, cb) {
  utils.myPrint('1 ~ DragMember2gameCopy ~ args = ', JSON.stringify(args));
  teamManager.dragMember2gameCopy(args, cb);
};

// applicant apply to join the team
TeamRemote.prototype.applyJoinTeam = function(args, cb){
  utils.myPrint('ApplyJoinTeam is running ... args = ', JSON.stringify(args));
  var ret = teamManager.applyJoinTeam(args);
  utils.invokeCallback(cb, null, ret);
};

// accept applicant join team
TeamRemote.prototype.acceptApplicantJoinTeam = function(args, cb){
  utils.myPrint('AcceptApplicantJoinTeam is running ... args = ', JSON.stringify(args));
  var ret = teamManager.acceptApplicantJoinTeam(args);
  utils.myPrint('AcceptApplicantJoinTeam ~ ret = ', ret);
  utils.invokeCallback(cb, null, ret);
};

// captain invite a player to join the team
TeamRemote.prototype.inviteJoinTeam = function(args, cb){
  utils.myPrint('InviteJoinTeam is running ... args = ', JSON.stringify(args));
  var ret = teamManager.inviteJoinTeam(args);
  utils.invokeCallback(cb, null, ret);
};

// accept captain's invitation join team
TeamRemote.prototype.acceptInviteJoinTeam = function(args, cb){
  utils.myPrint('AcceptInviteJoinTeam is running ... args = ', JSON.stringify(args));
  var ret = teamManager.acceptInviteJoinTeam(args);
  utils.myPrint('AcceptInviteJoinTeam ~ ret = ', ret);
  utils.invokeCallback(cb, null, ret);
};

// update team member's new info
TeamRemote.prototype.updateMemberInfo = function(args, cb){
  utils.myPrint('UpdateMemberInfo is running ... args = ', JSON.stringify(args));
  var ret = teamManager.updateMemberInfo(args);
  utils.myPrint('UpdateMemberInfo ~ ret = ', JSON.stringify(ret));
  utils.invokeCallback(cb, null, ret);
};

// chat in team
TeamRemote.prototype.chatInTeam = function(args, cb){
  utils.myPrint('ChatInTeam is running ... args = ', JSON.stringify(args));
  var ret = teamManager.chatInTeam(args);
  utils.invokeCallback(cb, null, ret);
};

// leave a team
TeamRemote.prototype.kickOut = function(args, cb){
  teamManager.kickOut(args, cb);
};
