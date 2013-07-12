
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
        NUMBER_NODE: 2,
        CAPTAIN_FLAG_NODE: 1.5,
        TEAM_MEMBER_FLAG_NODE: 1.5
      },

      Team: {
        TEAM_ID_NONE: 0, // player without team(not in any team)

        YES: 1,
        NO: 0,

        JOIN_TEAM_REPLY: {
          REJECT: 0,
          ACCEPT: 1
        }, // player's replying code

        DEFAULT_NAME: ''
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
      },

      BtnAction4Player: {
        CREATE_TEAM: 'CreateTeam',
        LEAVE_TEAM: 'LeaveTeam',
        DISBAND_TEAM: 'DisbandTeam',
        ATTACK_PLAYER: 'AttackPlayer',
        APPLY_JOIN_TEAM: 'ApplyJoinTeam',
        INVITE_JOIN_TEAM: 'InviteJoinTeam',
        ACCEPT_APPLICANT_JOIN_TEAM: 'AcceptApplicantJoinTeam',
        ACCEPT_JOIN_INVITER_TEAM: 'AcceptJoinInviterTeam',
        KICK_OUT: 'KickOut'
      }
    };
  }};
