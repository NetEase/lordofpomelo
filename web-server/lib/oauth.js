var everyauth = require('everyauth');
var oauth = require('../config/oauth');
var userDao = require('./dao/userDao');

// facebook oauth
everyauth.facebook
  .appId(oauth.facebook.appId)
  .appSecret(oauth.facebook.appSecret)
  .popup(true)
  .myHostname(oauth.hostname)
  .handleAuthCallbackError(function (req, res) {
    res.render('auth', {status: 'fail'});
  })
  .findOrCreateUser(function (session, accessToken, accessTokExtra, fbUserMetadata) {
    var p = this.Promise();
    findOrCreateUser(session, fbUserMetadata.id, 'facebook', p);
    return p;
  })
  .redirectPath(oauth.redirectPath);


//github oauth
everyauth.github
  .appId(oauth.github.appId)
  .appSecret(oauth.github.appSecret)
  .myHostname(oauth.hostname)
  .findOrCreateUser(function (session, accessToken, accessTokExtra, githubUserMetadata) {
    var p = this.Promise();
    findOrCreateUser(session, githubUserMetadata.login, 'github', p);
    return p;
  })
  .redirectPath(oauth.redirectPath);

// twitter oauth
everyauth.twitter
  .consumerKey(oauth.twitter.consumerKey)
  .consumerSecret(oauth.twitter.consumerSecret)
  .myHostname(oauth.hostname)
  .findOrCreateUser(function (session, accessToken, accessTokExtra, userData) {
    var p = this.Promise();
    // console.log(userData);
    findOrCreateUser(session, userData.email, 'google', p);
    return p;
  })
  .redirectPath(oauth.redirectPath);


// google oauth
everyauth.google
  .appId(oauth.google.clientId)
  .appSecret(oauth.google.clientSecret)
  .myHostname(oauth.hostname)
  .scope('https://www.googleapis.com/auth/userinfo.email')
  .findOrCreateUser(function (session, accessToken, accessTokExtra, userData) {
    var p = this.Promise();
    console.error(userData);
    findOrCreateUser(session, userData.email, 'google', p);
    return p;
  })
  .redirectPath(oauth.redirectPath);

//weibo oauth
everyauth.weibo
  .appId(oauth.weibo.appId)
  .appSecret(oauth.weibo.appSecret)
  .myHostname(oauth.hostname)
  .findOrCreateUser(function (session, accessToken, accessTokExtra, weiboUserMetadata) {
    var p = this.Promise();
    findOrCreateUser(session, weiboUserMetadata.screen_name, 'weibo', p);
    return p;
  })
  .redirectPath(oauth.redirectPath);


everyauth.everymodule.findUserById(function (req, id, callback) {
  callback();
});

var findOrCreateUser = function (session, authId, from, p) {
  var username = authId + '@' + from;
  userDao.getUserByName(username, function (err, user) {
    if (err || !user) {
      userDao.createUser(username, '', from, function (err, user) {
        if (!err) {
          session.userId = user.id;
          p.fulfill(user);
        }
      });
    } else {
      session.userId = user.id;
      p.fulfill(user);
    }
  });
};

module.exports = everyauth;
