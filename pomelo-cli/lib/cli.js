var readline = require('readline');
var adminClient = require('pomelo-admin').adminClient;
var command = require('./command')();
var consts = require('./consts');
var util = require('./util');
var argv = require('optimist').argv;

var username = argv['u'] = argv['u'] || 'monitor';
var password = argv['p'] = argv['p'] || 'monitor';
var host = argv['h'] = argv['h'] || 'localhost';
var port = argv['P'] = argv['P'] || 3005;
var context = 'all';
var client = null;

module.exports = doConnect;

function doConnect() {
  client = new adminClient({
    username: username,
    password: password,
    md5: true
  });
  var id = 'pomelo_cli_' + Date.now();
  client.connect(id, host, port, function(err) {
    if (err) {
      util.log('\n' + err + '\n');
      process.exit(0);
    } else {
      var ASCII_LOGO = consts.ASCII_LOGO;
      for (var i = 0; i < ASCII_LOGO.length; i++) {
        util.log(ASCII_LOGO[i]);
      }

      var WELCOME_INFO = consts.WELCOME_INFO;
      for (var i = 0, l = WELCOME_INFO.length; i < l; i++) {
        util.log(WELCOME_INFO[i]);
      }
      startCli();
    }
  });
  client.on('close', function() {
    client.socket.disconnect();
    util.log('\ndisconnect from master');
    process.exit(0);
  });
}

function startCli() {
  var rl = readline.createInterface(process.stdin, process.stdout, completer);
  var PROMPT = username + consts.PROMPT + context + '>';
  rl.setPrompt(PROMPT);
  rl.prompt();

  rl.on('line', function(line) {
    var key = line.trim();
    if (!key) {
      util.help();
      rl.prompt();
      return;
    }
    switch (key) {
      case 'help':
        util.help();
        rl.prompt();
        break;
      case '?':
        util.help();
        rl.prompt();
        break;
      case 'quit':
        command.quit(rl);
        break;
      case 'kill':
        command.kill(rl, client);
        break;
      default:
        command.handle(key, {
          user: username
        }, rl, client);
        break;
    }
  }).on('close', function() {
    util.log('bye ' + username);
    process.exit(0);
  });
}

function completer(line) {
  line = line.trim();
  var completions = consts.COMANDS_COMPLETE;
  var hits = [];
  // commands tab for infos 
  if (consts.COMPLETE_TWO[line]) {
    if (line === "show") {
      for (var k in consts.SHOW_COMMAND) {
        hits.push(k);
      }
    } else if (line === "help") {
      for (var k in consts.COMANDS_COMPLETE_INFO) {
        hits.push(k);
      }
    } else if (line === "enable" || line === "disable") {
      hits.push("app");
      hits.push("module");
    } else if (line === "dump") {
      hits.push("memory");
      hits.push("cpu");
    }
  }

  hits = util.tabComplete(hits, line, consts.COMANDS_COMPLETE_INFO, "complete");
  hits = util.tabComplete(hits, line, consts.COMANDS_COMPLETE_INFO, "help");
  hits = util.tabComplete(hits, line, consts.SHOW_COMMAND, "show");
  hits = util.tabComplete(hits, line, null, "enable");
  hits = util.tabComplete(hits, line, null, "disable");
  hits = util.tabComplete(hits, line, null, "disable");
  hits = util.tabComplete(hits, line, null, "dump");
  hits = util.tabComplete(hits, line, null, "use");
  hits = util.tabComplete(hits, line, null, "stop");
   
  // show all completions if none found
  return [hits.length ? hits : completions, line];
}