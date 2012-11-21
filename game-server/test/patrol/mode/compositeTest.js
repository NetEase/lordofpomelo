var should = require('should');
var Single = require('../../../app/patrol/mode/single');
var Loop = require('../../../app/patrol/mode/loop');
var Composite = require('../../../app/patrol/mode/composite');
var mockData = require('../../util/mockData');
var patrol = require('../../../app/patrol/patrol');

describe('Composite test', function() {
  it('should invoke children one by one', function() {
    var mob = mockData.getMob();
    mob.x = 0;
    mob.y = 0;
    var path1 = [{x: 100, y: 100}, {x: 100, y: 150}];
    var single = new Single({
      character: mob, 
      path: path1 
    });

    var path2 = [{x: 100, y: 100}, {x: 200, y: 100}, {x: 200, y: 200}];
    var rounds = 2;
    var loop = new Loop({
      character: mob, 
      path: path2, 
      rounds: rounds
    });

    var composite = new Composite();
    composite.add(single);
    composite.add(loop);

    var res = composite.update();
    res.should.equal(patrol.RES_WAIT);

    //loop rounds
    var l = path1.length;
    var res;
    for(var i=0; i<l; i++) {
      var pos = path1[i];
      mob.x = pos.x;
      mob.y = pos.y;
      res = composite.update();
      res.should.equal(patrol.RES_WAIT);
    }

    l = path2.length * rounds;
    for(var i=0; i<l; i++) {
      var pos = path2[i % path2.length];
      mob.x = pos.x;
      mob.y = pos.y;
      res = composite.update();
      if(i === l-1) {
        res.should.equal(patrol.RES_FINISH);
      } else {
        res.should.equal(patrol.RES_WAIT);
      }
    }
  });
});
