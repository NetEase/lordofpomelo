var should = require('should');
var TigerBrain = require('../../../app/ai/brain/tiger');
var dataApi = require('../../../app/util/dataApi');
var Blackboard = require('../../../app/ai/meta/blackboard');
var consts = require('../../../app/consts/consts');
var mockData = require('../../util/mockData');
var ai = require('../../../app/ai/ai');

describe('Tiger brain test', function() {
  it('should patrol if it could not find a target', function() {
		var mob = mockData.getMob();
    var patrolCount = 0;
    var area = {
      patrol: function() {
        patrolCount++;
      }, 
      getEntitiesByPos: function() {
      }
    };
    var bb = Blackboard.create({
      curCharacter: mob,
      area: area
    });
    var brain = TigerBrain.clone({blackboard: bb});
    brain.update();
    patrolCount.should.equal(1);
  });

  it('should try to find a target if it does not have one yet', function() {
    var mob = mockData.getMob();
    var target = mockData.getPlayer();
    var getEntityCount = 0;
    var area = {
      getEntitiesByPos: function(pos, types, range) {
        getEntityCount++;
        return [target];
      }
    };
    var bb = Blackboard.create({
      curCharacter: mob,
      area: area
    });
    var brain = TigerBrain.clone({blackboard: bb});
    brain.update();
    getEntityCount.should.equal(1);
    mob.target.should.equal(target);
  });

  it('should attack the target with normal attack', function() {
    var mob = mockData.getMob();
    var target = mockData.getPlayer();
    mob.increaseHateFor(target, 5);
    var area = {};
    var attackCount = 0;
    //mock attack method
    mob.attack = function() {
      attackCount++;
      return {result: consts.AttackResult.SUCCESS};
    };
    var bb = Blackboard.create({
      curCharacter: mob,
      area: area
    });
   
    var brain = TigerBrain.clone({blackboard: bb});
    brain.update();
    attackCount.should.equal(1);
  });

  it('should move to the target if the target is beyond the attack range', function() {
    var mob = mockData.getMob();
    var target = mockData.getPlayer();
    mob.x = 0;
    mob.y = 0;
    target.x = 100;
    target.y = 100;
    var moveCount = 0;
    var moveX = -1;
    var moveY = -1;
    //mock move method
    mob.move = function(x, y) {
      moveCount++;
      moveX = x;
      moveY = y;
    };
    //mock skill
    var skill = {
      skillId: 1, 
      skillData: {
        distance: 1
      }, 
      use: function(attacker, target) {
        return {result: consts.AttackResult.NOT_IN_RANGE};
      }
    };
    mob.fightSkills[skill.skillId] = skill;

    mob.increaseHateFor(target, 5);
    var bb = Blackboard.create({
      curCharacter: mob
    });

    var brain = TigerBrain.clone({blackboard: bb});
    brain.update();
    moveCount.should.equal(1);
    moveX.should.equal(target.x);
    moveY.should.equal(target.y);
  });

  it('should attack the new target if the target has changed', function() {
    var mob = mockData.getMob();
    var target1 = mockData.getPlayer();
    target1.id = 1;
    mob.x = 0;
    mob.y = 0;
    target1.x = 100;
    target1.y = 100;
    var moveCount = 0;
    var moveX = -1;
    var moveY = -1;
    //mock move method
    mob.move = function(x, y) {
      moveCount++;
      moveX = x;
      moveY = y;
    };
    //mock skill
    var skill = {
      skillId: 1, 
      skillData: {
        distance: 1
      }, 
      use: function(attacker, target) {
        return {result: consts.AttackResult.NOT_IN_RANGE};
      }
    };
    mob.fightSkills[skill.skillId] = skill;

    mob.increaseHateFor(target1, 5);
    var bb = Blackboard.create({
      curCharacter: mob
    });

    var brain = TigerBrain.clone({blackboard: bb});
    brain.update();
    moveCount.should.equal(1);
    moveX.should.equal(target1.x);
    moveY.should.equal(target1.y);

    var target2 = mockData.getPlayer();
    target2.id = 2;
    target2.x = 200;
    target2.y = 300;
    //add new hater
    mob.increaseHateFor(target2, 10);
    mob.target.should.equal(target2);
    var res = brain.update();
    res.should.equal(ai.RES_SUCCESS);
    res = brain.update();
    res.should.equal(ai.RES_WAIT);
    moveCount.should.equal(2);
    moveX.should.equal(target2.x);
    moveY.should.equal(target2.y);
  });

  it('should invoke move again if the target position changed', function() {
    var mob = mockData.getMob();
    var target = mockData.getPlayer();
    target.id = 1;
    mob.x = 0;
    mob.y = 0;
    target.x = 100;
    target.y = 100;
    var moveCount = 0;
    var moveX = -1;
    var moveY = -1;
    //mock move method
    mob.move = function(x, y) {
      moveCount++;
      moveX = x;
      moveY = y;
    };
    //mock skill
    var skill = {
      skillId: 1, 
      skillData: {
        distance: 1
      }, 
      use: function(attacker, target) {
        return {result: consts.AttackResult.NOT_IN_RANGE};
      }
    };
    mob.fightSkills[skill.skillId] = skill;

    mob.increaseHateFor(target, 5);
    var bb = Blackboard.create({
      curCharacter: mob
    });

    var brain = TigerBrain.clone({blackboard: bb});
    brain.update();
    moveCount.should.equal(1);
    moveX.should.equal(target.x);
    moveY.should.equal(target.y);

    //change target position
    target.x += 100;
    target.y += 200;

    brain.update();
    moveCount.should.equal(2);
    moveX.should.equal(target.x);
    moveY.should.equal(target.y);
  });

  it('should not invoke move if the target position not changed', function() {
    var mob = mockData.getMob();
    var target = mockData.getPlayer();
    target.id = 1;
    mob.x = 0;
    mob.y = 0;
    target.x = 100;
    target.y = 100;
    var moveCount = 0;
    var moveX = -1;
    var moveY = -1;
    //mock move method
    mob.move = function(x, y) {
      moveCount++;
      moveX = x;
      moveY = y;
    };
    //mock skill
    var skill = {
      skillId: 1, 
      skillData: {
        distance: 1
      }, 
      use: function(attacker, target) {
        return {result: consts.AttackResult.NOT_IN_RANGE};
      }
    };
    mob.fightSkills[skill.skillId] = skill;

    mob.increaseHateFor(target, 5);
    var bb = Blackboard.create({
      curCharacter: mob
    });

    var brain = TigerBrain.clone({blackboard: bb});
    brain.update();
    moveCount.should.equal(1);
    moveX.should.equal(target.x);
    moveY.should.equal(target.y);

    brain.update();
    moveCount.should.equal(1);
    moveX.should.equal(target.x);
    moveY.should.equal(target.y);
  });

});
