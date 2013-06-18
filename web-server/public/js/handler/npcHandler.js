__resources__["/npcHandler.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	var pomelo = window.pomelo;


	/**
	 * Execute the npc action
	 */
  function exec(type, params) {
    switch (type) {
      case 'changeArea': 
        changeArea(params);
        break;
    }
  }

	/**
	 * Change area action.
	 */
  function changeArea(params) {
    var areaId = pomelo.areaId, target = params.target;
    pomelo.request("area.playerHandler.changeArea", {
			uid:pomelo.uid,
			playerId: pomelo.playerId,
			areaId: areaId,
			target: target,
			triggerByPlayer: 1
		}, function(data) {
			pomelo.emit('onChangeArea', data);
    });
  }

  exports.exec = exec;
}};
