/**
 * Hello select view manager
 */
__resources__["/heroSelectView.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

  /**
   * default hero id
   */
  var roleId = 210;

   exports.getRoleId = function() {
     return roleId;
  };

  exports.init = function() {
    var roleIds = [210, 211];

    var $panel = $('#heroSelectPanel');
    var $role = $panel.find('.choose .role');
    var $targetRole = $panel.find('.choose .m-targetrole');
    var $targetRoleImg = $targetRole.find('.targetrole');
    $role.on('mouseover', function() {
      var left = this.offsetLeft;
      var top = this.offsetTop;
      this.style.backgroundPosition = (0 - left) + "px 0";
    }).on('mouseout', function() {
      this.style.backgroundPosition = "9999px 9999px";
    }).on('click', function() {
      var left = this.offsetLeft;
      var top = this.offsetTop;
      var index = left < 1 ? 0 : 1;
      $targetRoleImg[0].style.backgroundPosition = (index == 1 ? "-382px 0" : "0 0");
      $targetRole.css({left: left + "px", top: top + "px"});
      // hero index
      roleId = roleIds[index];
    });
  };
}};
