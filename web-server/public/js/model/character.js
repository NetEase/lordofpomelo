__resources__["/character.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

  /**
   * Module dependencies
   */
  var Entity = require('entity');

  /**
   * Initialize a new 'Character' with the given 'opts'.
   * Character inherits Entity
   *
   * @param {Object} opts
   * @api public
   */
  var Character=function(opts){
    // Speeds
    this.level = opts.level;
    this.walkSpeed = opts.walkSpeed;

    // Health
    this.hp = opts.hp;
    this.maxHp = opts.maxHp;

    //magic
    this.mp = opts.mp;
    this.maxMp = opts.maxMp;
    //status
    this.died = false;
    Entity.call(this, opts);
  };

  /**
   * Expose 'Character' constructor.
   */
  module.exports = Character;

  Character.prototype = Object.create(Entity.prototype);

  /**
   * Reset the hp.
   *
   * @param {Number} maxHp
   * @api public
   */
  Character.prototype.resetHp = function(maxHp) {
    this.set('maxHp', maxHp);
    this.set('hp', this.maxHp);
  };

  /**
   * Check the fullHp.
   *
   * @api public
   */
  Character.prototype.hasFullHp = function() {
    return this.hp === this.maxHp;
  };

  /**
   * Recover the hp.
   *
   * @param {Number} hpValue
   * @api public
   */
  Character.prototype.recoverHp = function(hpValue) {
    if (this.hasFullHp()) {
      return ;
    }
    var curHp = this.hp,
      maxHp = this.maxHp;
    if(curHp + hpValue < maxHp) {
      this.set('hp', this.hp + hpValue);
    }else {
      this.set('hp', maxHp);
    }
  };

  /**
   * Check the fullHp.
   *
   * @api public
   */
  Character.prototype.hasFullMp = function(){
    return this.mp === this.maxMp;
  };

  /**
   * Reset the mp.
   *
   * @param {Number} maxMp
   * @api public
   */
  Character.prototype.resetMp = function(maxMp){
    this.set('maxMp', maxMp);
    this.set('mp', maxMp);
  };

  /**
   * Recover the mp.
   *
   * @param {Number} mpValue
   * @api public
   */
  Character.prototype.recoverMp = function(mpValue){
    if (this.hasFullMp()) {
      return ;
    }
    var curMp = this.mp,
      maxMp = this.maxMp;
    if (curMp + mpValue < maxMp) {
      this.set('mp', this.mp + mpValue);
    } else {
      this.set('mp', maxMp);
    }
  };

  //Set maxHp
  Character.prototype.setMaxHp = function(hp) {
    this.set('maxHp', hp);
    this.set('hp', hp);
  };

  //Set maxMp
  Character.prototype.setMaxMp = function(mp) {
    this.set('maxMp', mp);
    this.set('mp', mp);
  };

  //Update characher's data
  Character.prototype.update = function(msg) {
    var damage = msg.damage || 0;
    var mpUse = msg.mpUse || 0;
    this.set('hp', this.hp - damage);
    this.set('mp', this.mp - mpUse);
  };

}};
