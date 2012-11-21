/**
 * Hello select view manager
 */
__resources__["/heroSelectView.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

  /**
   * default hero id
   */
  var roleId = "1022";

   exports.getRoleId = function() {
     return roleId;
  };

  exports.init = function() {
    var roleIds = [1029, 1007, 1024, 1031, 1028, 1030, 1025, 1001, 1020, 1027, 1022, 1026];

    var $panel = $('#heroSelectPanel');
    var $role = $panel.find('.choose .role');
    var $targetRole = $panel.find('.choose .m-targetrole');
    var $targetRoleImg = $targetRole.find('.targetrolecnt');
    $role.on('mouseover', function() {
      var left = this.offsetLeft;
      var top = this.offsetTop;
      this.style.backgroundPosition = (0 - left) + "px " + (20 - top) + "px";
    }).on('mouseout', function() {
      this.style.backgroundPosition = "9999px 9999px";
    }).on('click', function(){
      var left = this.offsetLeft;
      var top = this.offsetTop;
      $targetRoleImg[0].style.backgroundPosition = (0 - left) + "px " + (20 - top) + "px";
      $targetRole.css({left: left + "px", top: top + "px"});
      // hero index
      var index = 6 * (top === 20 ? 0 : 1) + (left / 173);
      roleId = roleIds[index];
    });
  };
}};
