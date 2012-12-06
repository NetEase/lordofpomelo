
__resources__["/consts.js"] = {
  meta: {mimetype: "application/javascript"},
  data: function(exports, require, module, __filename, __dirname) {

    module.exports = {

			aniOrientation:{
				LEFT_DOWN: 'LeftDown',
				LEFT_UP: 'LeftUp',
				RIGHT_DOWN: 'RightDown',
				RIGHT_UP: 'RightUp'
			},

			TaskState: {
				COMPLETED:2,
				COMPLETED_NOT_DELIVERY:1,
				NOT_COMPLETED:0,
				NOT_START:-1
			},

      Border: {
				LEFT: 'left',
				RIGHT: 'right',
				TOP: 'top',
				BOTTOM: 'bottom'
			},

      EntityType: {
        PLAYER: 'player',
        NPC: 'npc',
        MOB: 'mob',
        EQUIPMENT: 'equipment',
        ITEM: 'item'
      },

			SpecialCharacter: {
				Angle: '210' 
			},

			MESSAGE: {
				RES: 200,
				ERR: 500,
				PUSH: 600
			}, 

      AttackResult: {
        SUCCESS: 1,
        KILLED : 2,
        MISS: 3,
        NOT_IN_RANGE: 4,
        NO_ENOUGH_MP: 5,
        NOT_COOLDOWN: 6,
        ATTACKER_CONFUSED: 7
      },

      NodeCoordinate: {
        MAP_NODE: 0,
				CURPLAY_NODE: 0.1,
        PLAYER_NODE: 0.5,
        MOB_NODE: 1,
        NPC_NODE: 1,
        ITEM_NODE: 1,
        RED_BLOOD_NODE: 1.5,
        BLACK_BLOOD_NODE: 1.2,
        NAME_NODE: 1.5,
        UPDATE_NODE: 2,
        NUMBER_NODE: 2
      },

      CacheType: {
        IMAGE: 'image',
        FRAME_ANIM: 'frame_animation'
      },

      buttonContent: {
        YES: 'OK',
        NO: 'Cancel',
        GIVE_UP: 'Give Up',
        ACCEPT: 'Accept',
        DELIVER: 'Deliver'
      }
    };
  }};
