var Queue = require('../../app/util/queue');
var should = require('should');

function benchMark(){
	var limit = 100000;
	
	
	var arr1 = new Array();
	var arr2 = new Array();
	
	console.log('length1 : ' + arr1.length + ' length2 : ' + arr2.length)
	for(var i = 0; i < limit; i++){
		arr1[i] = i;
		arr2[i] = i;
	}
	
	var start = Date.now();
	for(var i = 0; i < limit; i++)
		arr1.pop();
	var end = Date.now();
	for(var i = 0; i < limit; i++)
		arr2.shift();
	var end2 = Date.now();
	
	console.log("first time " + (end - start));
	console.log("seconde time " + (end2- end));
}

describe('Queue test', function(){
	var limit = 10000;
	var queue = new Queue(limit);
	
	queue.should.have.property('limit');
	
	var array = new Array(limit);
	
	for(var i = 0; i < limit; i++)
		queue.push(i);
	
	queue.length.should.equal(limit);
	(queue.push(1)).should.equal(false);
	
	for(var i = 0; i < limit; i++){
		var tmp = queue.pop();
		
		tmp.should.equal(i);
	}	
});