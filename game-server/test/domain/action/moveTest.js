var Move = require('../../../app/domain/action/move');

function test(){
	var player = {x:100, y:100, save:function(){}};
	var opts = {player:player, path:[{x:100, y:100},{x:200, y:200}, {x:315, y:1000}, {x:123,y:11},{x:2322,y:1}], speed:100};
	
	var move = new Move(opts);
	
	
	var interval = setInterval(function(){
		move.update();
		console.error(move.pos);
		if(move.finish)
			clearInterval(interval);
	}, 200);
}

test();