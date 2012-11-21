
var should = require('should');
var api = require('../../app/util/dataApi');


describe('JSON data api test', function() {
  var role = api.role;
  it('can findBy a attribute', function(){
    var item = role.findBy("career", "剑客");
    //item.should.be.an.instanceof(Array);
    item[0].career.should.equal("剑客");
    var r = item[2];
    r.should.have.property('id', 1020);
    r.should.have.property('hp', 54);
    r.should.have.property('mp', 48);
    r.name.should.equal("龙太子");
  });

  it('can list all item', function() {
     var list = role.all();
     //list.should.be.an.instanceof(Array);
     list.length.should.equal(12);

     list[0].name.should.equal('神天兵');
  });
});
