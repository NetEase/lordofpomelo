
__resources__["/consts.js"] = {
  meta: {mimetype: "application/javascript"},
  data: function(exports, require, module, __filename, __dirname) {

    module.exports = {

      AnimationName: {
        LEFT_DIE: 'LeftDie',
        RIGHT_DIE: 'RightDie',

        LEFT_STAND: 'LeftStand',
        RIGHT_STAND: 'RightStand' ,

        LEFT_WALK: 'LeftWalk',
        RIGHT_WALK: 'RightWalk',

        LEFT_ATTACK: 'LeftAttack',
        RIGHT_ATTACK: 'RightAttack',

        LEFT_MAGIC: 'LeftMagic',
        RIGHT_MAGIC: 'RightMagic',

        LEFT_HIT: 'LeftHit',
        RIGHT_HIT: 'RightHit',

        LEFT_DEFEND: 'LeftDefend',
        RIGHT_DEFEND: 'RightDefend'
      },

      Orientation: {
        LEFT: 'Left',
        RIGHT: 'Right',
        LEFT_DOWN: 'Left_down',
        LEFT_UP: 'Left_up',
        RIGHT_DOWN: 'Right_down',
        RIGHT_UP: 'Right_up'
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
        PLAYER_NODE: 1,
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
