var should = require('should');
var PlayerBrain = require('../../../app/ai/brain/player');
var dataApi = require('../../../app/util/dataApi');
var Blackboard = require('../../../app/ai/meta/blackboard');
var consts = require('../../../app/consts/consts');
var mockData = require('../../util/mockData');

describe('Auto fight brain test', function() {
  it('should attack the target with normal attack', function() {
    var mob = mockData.getMob();
    var player = mockData.getPlayer();
    player.target = mob;
    var area = {};
    var attackCount = 0;

    //mock skill
    var skill = {
      skillId: 1, 
      skillData: {
        distance: 1000
      }, 
      use: function(attacker, target) {
        attackCount++;
        attacker.should.equal(player);
        target.should.equal(mob);
        return {result: consts.AttackResult.SUCCESS};
      }
    };
    player.fightSkills[skill.skillId] = skill;

    var bb = Blackboard.create({
      curCharacter: player,
      area: area
    });
   
    var brain = AutoFightBrain.clone({blackboard: bb});
    brain.update();
    attackCount.should.equal(1);
  });

  it('should move to the target if the target is beyond the attack range', function() {
    var mob = mockData.getMob();
    var player = mockData.getPlayer();
    mob.x = 500;
    mob.y = 0;
    player.x = 100;
    player.y = 0;
    var moveCount = 0;
    var moveX = -1;
    var moveY = -1;
    var skill = mockData.getNormalAttack();
    player.fightSkills[skill.skillId] = skill;

    //mock move method
    player.move = function(x, y) {
      moveCount++;
      moveX = x;
      moveY = y;
    };
    player.target = mob;

    var bb = Blackboard.create({
      curCharacter: player
    });

    var brain = AutoFightBrain.clone({blackboard: bb});
    brain.update();
    moveCount.should.equal(1);
    moveX.should.equal(mob.x);
    moveY.should.equal(mob.y);
  });

  it('should attack the new target if the target has changed', function() {
    var mob1 = mockData.getMob();
    var player = mockData.getPlayer();
    mob1.id = 1;
    mob1.x = 0;
    mob1.y = 0;
    player.x = 100;
    player.y = 100;
    var moveCount = 0;
    var moveX = -1;
    var moveY = -1;
    var skill = mockData.getNormalAttack();
    player.fightSkills[skill.skillId] = skill;
    //mock move method
    player.move = function(x, y) {
      moveCount++;
      moveX = x;
      moveY = y;
    };
    player.target = mob1;
    var bb = Blackboard.create({
      curCharacter: player
    });

    var brain = AutoFightBrain.clone({blackboard: bb});
    brain.update();
    moveCount.should.equal(1);
    moveX.should.equal(mob1.x);
    moveY.should.equal(mob1.y);

    var mob2 = mockData.getMob();
    mob2.id = 2;
    mob2.x = 200;
    mob2.y = 300;
    //set new target
    player.target = mob2;
    brain.update();
    moveCount.should.equal(2);
    moveX.should.equal(mob2.x);
    moveY.should.equal(mob2.y);
  });
});
