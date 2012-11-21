var should = require('should');
var dataApi = require('../../app/util/dataApi');
var Bag = require('../../app/domain/bag');


describe('Bag domain test', function() {

  var bag; 

  beforeEach(function() {
    bag = new Bag({id: 1, itemCount: 8});
    var s1 = bag.addItem({id: '1001', type: 'equipment'});
    var s2 = bag.addItem({id: '1002', type: 'item'});
    var s3 = bag.addItem({id: '1003', type: 'item'});
  });

	it('can add a item to bag', function() {
    var s4 = bag.addItem({id: '1001', type: 'equipment'});
    var s5 = bag.addItem({id: '1001', type: 'item'});
    var s6 = bag.addItem({id: '1002', type: 'item'});

    var items = bag.all();
    items.should.be.a('object');

    s4.should.be.ok;
    s5.should.be.ok;
    s6.should.be.ok;

    items[1].should.eql({id: '1001', type: 'equipment'});
    items[2].should.eql({id: '1002', type: 'item'});
    items[4].should.eql({id: '1001', type: 'equipment'});

    should.exist(items[3]);
    should.not.exist(items[7]);

    var s7 = bag.addItem({id: '1001', type: 'item'});
    var s8 = bag.addItem({id: '1002', type: 'item'});
    var s9 = bag.addItem({id: '1002', type: 'item'});

    s7.should.be.ok;
    s8.should.be.ok;
    s9.should.not.be.ok;
    should.exist(items[7]);
    should.not.exist(items[9]);
  });

  it('can remove a item from a bag', function() {
    //var bag = new Bag({id: 1});
    //var status = bag.addItem({id: '1001', type: 'equipment'});
    var s2 = bag.removeItem(2);
    s2.should.be.ok;
    var items = bag.all();
    should.not.exist(items[2]);
    should.exist(items[1]);
    should.exist(items[3]);
  });

  it("can change item's position", function() {
    var s1 = bag.changePosition(1, 5);
    var s2 = bag.changePosition(2, 3)
    s1.should.be.ok;
    s2.should.be.ok;

    var items = bag.all();
    should.not.exist(items[1]);
    items[5].should.eql({id: '1001', type: 'equipment'});
    items[2].should.eql({id: '1003', type: 'item'});
    items[3].should.eql({id: '1002', type: 'item'});
  });

});
