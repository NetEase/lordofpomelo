var should = require('should');
var Single = require('../../../app/patrol/mode/single');
var mockData = require('../../util/mockData');
var patrol = require('../../../app/patrol/patrol');

describe('Single test', function() {
  it('should move to the destination and then return finish', function() {
    var mob = mockData.getMob();
    mob.x = 0;
    mob.y = 0;
    var path = [{x: 100, y: 100}];
    var single = new Single({
      character: mob, 
      path: path
    });

    var res = single.update();
    res.should.equal(patrol.RES_WAIT);

    //move the mob to some middle position
    mob.x = 50;
    mob.y = 50;
    res = single.update();
    res.should.equal(patrol.RES_WAIT);

    //move the mob to the destination
    mob.x = 100;
    mob.y = 100;
    res = single.update();
    res.should.equal(patrol.RES_FINISH);

    res = single.update();
    res.should.equal(patrol.RES_FINISH);
  });

  it('should move around with the path', function() {
    var mob = mockData.getMob();
    mob.x = 0;
    mob.y = 0;
    var path = [{x: 100, y: 100}, {x: 200, y: 100}, {x: 200, y: 200}];
    var single = new Single({
      character: mob, 
      path: path
    });

    var res = single.update();
    res.should.equal(patrol.RES_WAIT);

    //move the mob around with the path nodes
    for(var i=0, l=path.length; i<l; i++) {
      mob.x = path[i].x;
      mob.y = path[i].y;
      res = single.update();
      if(i === l-1) {
        res.should.equal(patrol.RES_FINISH);
      } else {
        res.should.equal(patrol.RES_WAIT);
      }
    }
  });
});
