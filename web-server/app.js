var express = require('express');
var Token = require('../shared/token');
var secret = require('../shared/config/session').secret;
var userDao = require('./lib/dao/userDao');
var app = express.createServer();
var mysql = require('./lib/dao/mysql/mysql');
var everyauth = require('./lib/oauth');

var publicPath = __dirname +  '/public';

app.configure(function() {
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "keyboard cat" }));
  app.use(everyauth.middleware());
  app.use(app.router);
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');
  app.set('view options', {layout: false});
  app.set('basepath', publicPath);
});

app.configure('development', function(){
  app.use(express.static(publicPath));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  var oneYear = 31557600000;
  app.use(express.static(publicPath, { maxAge: oneYear }));
  app.use(express.errorHandler());
});

app.get('/auth_success', function(req, res) {
  if (req.session.userId) {
    var token = Token.create(req.session.userId, Date.now(), secret);
    res.render('auth', {code: 200, token: token, uid: req.session.userId});
  } else {
    res.render('auth', {code: 500});
  }
});

app.post('/login', function(req, res) {
  var msg = req.body;

  var username = msg.username;
  var pwd = msg.password;
  if (!username || !pwd) {
    res.send({code: 500});
    return;
  }

  userDao.getUserByName(username, function(err, user) {
    if (err || !user) {
      console.log('username not exist!');
      res.send({code: 500});
      return;
    }
    if (pwd !== user.password) {
      // TODO code
      // password is wrong
      console.log('password incorrect!');
      res.send({code: 501});
      return;
    }

    console.log(username + ' login!');
    res.send({code: 200, token: Token.create(user.id, Date.now(), secret), uid: user.id});
  });
});

app.post('/register', function(req, res) {
  //console.log('req.params');
  var msg = req.body;
  if (!msg.name || !msg.password) {
    res.send({code: 500});
    return;
  }

  userDao.createUser(msg.name, msg.password, '', function(err, user) {
    if (err || !user) {
      console.error(err);
      if (err && err.code === 1062) {
        res.send({code: 501});
      } else {
        res.send({code: 500});
      }
    } else {
      console.log('A new user was created! --' + msg.name);
      res.send({code: 200, token: Token.create(user.id, Date.now(), secret), uid: user.id});
    }
  });
});

//Init mysql
mysql.init();

app.listen(3001);

// Uncaught exception handler
process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
});

console.log("Web server has started.\n Please log on http://127.0.0.1:3001/");
