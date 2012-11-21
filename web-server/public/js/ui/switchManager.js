__resources__["/switchManager.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
    
/**
 * Default view
 */
var curViewNameId = "loginPanel";

exports.selectView = selectView;

/**
 * Swtich game views
 */
function selectView(viewNameId){
  if (!viewNameId || curViewNameId === viewNameId) {
    return;
  }

  var oldView = $('#' + curViewNameId);
  var newView = $('#' + viewNameId);

  oldView.addClass('f-dn');
  newView.removeClass('f-dn');

  if (viewNameId === 'gemePanel') {
    $('body').addClass('f-hidbg');
  } else {
    $('body').removeClass('f-hidbg');
  }

  curViewNameId = viewNameId;
}

function getCurrentView(){
  return curViewNameId;
}

exports.getCurrentView = getCurrentView;

}};
