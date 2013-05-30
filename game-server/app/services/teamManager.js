/**
 * Module dependencies
 */
var Team = require('../domain/entity/team');
var consts = require('../consts/consts');

var exp = module.exports;

// global team container(teamId:teamObj)
var gTeamObjDict = {};
// global team id
var gTeamId = 0;

// create new team, add the player(captain) to the team
exp.createTeam = function(playerId) {
  var teamObj = new Team(++gTeamId);
  var result = teamObj.addPlayer(playerId);
  if(result === consts.TEAM.JOIN_TEAM_RET_CODE.OK) {
    teamObj.setCaptainId(playerId);
    gTeamObjDict[teamObj.teamId] = teamObj;
  }
	return result;
};

exp.getTeamById = function(teamId) {
  var teamObj = gTeamObjDict[teamId];
	return teamObj || null;
};

exp.disbandTeamById = function(teamId) {
  var result = false;
  var teamObj = gTeamObjDict[teamId];
	if(!teamObj) {
		return result;
	}
  result = teamObj.disbandTeam();
  if(result) {
    delete gTeamObjDict[teamId];
  }
	return result;
};

// check member num when a member leaves the team,
// if there is no member in the team,
// disband the team automatically
exp.try2DisbandTeam = function(teamObj) {
  if(!teamObj.isTeamHasMember()) {
    delete gTeamObjDict[teamObj.teamId];
  }
};

