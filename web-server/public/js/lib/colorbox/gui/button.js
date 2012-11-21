
__resources__["/__builtin__/gui/button.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var KeyEventComponent = require("component").KeyEventComponent;
var MouseButtonEventComponent = require('component').MouseButtonEventComponent;
var BObject = require("base").BObject;
var util = require("util");
var model = require("model");


var createButton = function(gameScene, pipe, callbackFn, normalModel, clickModel, pressModel, releaseModel)
{
  if(normalModel == undefined)
  {
    console.log("give bad normalModel");
    return;
  }

  var node = gameScene.createNode({model:normalModel});
  
  function buttonCallbackFun(evt)
  {
    
    switch(evt.type)
    {
      case 'mouseClicked':
        if(clickModel != undefined)
          node.setModel(clickModel);
        break;
      case 'mousePressed':
        if(pressModel != undefined)
          node.setModel(pressModel);
        break;
      case 'mouseReleased':
        if(releaseModel != undefined)
          node.setModel(releaseModel);
        break;
      default:
        break;
    }
    
    callbackFn(evt);
  }
  
  var mouseComp = new MouseButtonEventComponent(
  {
    pipe:pipe, 
    decider:gameScene.queryDecider('mouseButtonDecider'), 
    callback:buttonCallbackFun
  });
  node.addComponent('mouseButtonComponent', mouseComp);
  
  return node;
}

module.exports.createButton = createButton;

}};