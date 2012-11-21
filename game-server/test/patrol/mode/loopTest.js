var should = require('should');
var Loop = require('../../../app/patrol/mode/loop');
var mockData = require('../../util/mockData');
var patrol = require('../../../app/patrol/patrol');

describe('Loop test', function() {
  it('should loop the rounds and then return finish', function() {
    var mob = mockData.getMob();
    mob.x = 0;
    mob.y = 0;
    var path = [{x: 100, y: 100}, {x: 100, y: 150}];
    var rounds = 2;
    var loop = new Loop({
      character: mob, 
      path: path, 
      rounds: rounds
    });

    var res = loop.update();
    res.should.equal(patrol.RES_WAIT);

    //loop rounds
    var l = path.length * rounds;
    for(var i=0; i<l; i++) {
      var pos = path[i % path.length];
      mob.x = pos.x;
      mob.y = pos.y;
      var res = loop.update();

      if(i === l - 1) {
        res.should.equal(patrol.RES_FINISH);
      } else {
        res.should.equal(patrol.RES_WAIT);
      }
    }
  });

  it('should move around with the path in infinite loop if rounds is specified as negative', function() {
    var mob = mockData.getMob();
    mob.x = 0;
    mob.y = 0;
    var path = [{x: 100, y: 100}, {x: 200, y: 100}, {x: 200, y: 200}];
    var rounds = -1;
    var loop = new Loop({
      character: mob, 
      path: path, 
      rounds: rounds
    });

    var res = loop.update();
    res.should.equal(patrol.RES_WAIT);

    //loop some rounds to test infinite loop
    var l = path.length * 10;
    for(var i=0; i<l; i++) {
      var pos = path[i % path.length];
      mob.x = pos.x;
      mob.y = pos.y;
      var res = loop.update();
      res.should.equal(patrol.RES_WAIT);
    }
  });
});
