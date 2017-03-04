  var Emitter = require('emitter');
  window.EventEmitter = Emitter;

  var protocol = require('pomelo-protocol');
  window.Protocol = protocol;

  var protobuf = require('pomelo-protobuf');
  window.protobuf = protobuf;
  //todo 更改pomelo-jsclient-websocket 为 pomelo-nodejsclient-websocket
  var pomelo = require('pomelo-nodejsclient-websocket');
  window.pomelo = pomelo;

  var jquery = require('jquery');
  window.$ = jquery;
