module.exports = {
	AttackResult: {
		SUCCESS: 1,
		KILLED : 2,
		MISS: 3,
		NOT_IN_RANGE: 4,
		NO_ENOUGH_MP: 5,
		NOT_COOLDOWN: 6,
		ATTACKER_CONFUSED: 7,
		ERROR: -1
	}, 

	RES_CODE : {
		SUC_OK						: 1,		// success
		ERR_FAIL					: -1,		// Failded without specific reason
		ERR_USER_NOT_LOGINED		: -2,		// User not login
		ERR_CHANNEL_DESTROYED		: -10,		// channel has been destroyed
		ERR_SESSION_NOT_EXIST		: -11,		// session not exist
		ERR_CHANNEL_DUPLICATE		: -12,		// channel duplicated
		ERR_CHANNEL_NOT_EXIST		: -13		// channel not exist
	}, 

	MYSQL : {
		ERROR_DUP_ENTRY	: 1062
	}, 

  PLAYER : {
    initAreaId : 1,
    level : 1,
    reviveTime : 5000,
    RECOVER_WAIT : 10000,    //You must wait for at lest 10s to start recover hp.
    RECOVER_TIME : 10000     //You need 10s to recover hp from 0 to full.
  },
  BornPlace : {
    x : 346,
    y : 81,
    width : 126,
    height : 129
  }, 

	MESSAGE: {
		RES: 200,
		ERR: 500,
		PUSH: 600
	}, 

	EntityType: {
		PLAYER: 'player',
		NPC: 'npc',
		MOB: 'mob',
		EQUIPMENT: 'equipment',
		ITEM: 'item',
		BAG: 'bag'
	}, 

	Pick: {
		SUCCESS: 1,
		VANISH:	2,
		NOT_IN_RANGE: 3, 
		BAG_FULL: 4
	}, 

	NPC: {
		SUCCESS: 1,
		NOT_IN_RANGE: 2
	}, 

	TaskState: {
		COMPLETED:2,
		COMPLETED_NOT_DELIVERY:1,
		NOT_COMPLETED:0,
		NOT_START:-1
	}, 

	TaskType: {
		KILL_MOB: 0,
		KILL_PLAYER: 1
	}, 

	NpcType: {
		TALK_NPC: '0',
		TRAVERSE_NPC: '1'
	}, 

	Event:{
		chat:'onChat'
	}, 

	/**
	 * Traverse npc, the key is the npc id, the value is the taret's area id.
	 */
	TraverseNpc: {
		301 : 2,
		305 : 1,
		306 : 3,
		309 : 2
	}, 
	
	/**
	 * Traverse task, the key is traverse npc's id, the value is task id.
	 */
	TraverseTask: {
		//3008: 3
	},

	/**
	 * check a entity that whether can be picked.
	 */
	 isPickable: function(entity) {
		return entity && (entity.type === module.exports.EntityType.EQUIPMENT || entity.type === module.exports.EntityType.ITEM);
	},

	/**
	 * check a entity that whether can be attacked.
	 */
	 isAttackable: function(entity) {
		return entity && (entity.type === module.exports.EntityType.PLAYER || entity.type === module.exports.EntityType.MOB);
	}
};
