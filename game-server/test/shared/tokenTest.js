var should = require('should');
var token = require('../../shared/token');

describe('Token service test', function() {

	it('should create and parse the token successully with the same password', function() {
		var pwd = 'pomelo_session_secret';
		var uid = '123456';
		var timestamp = Date.now();
		var t = token.create(uid, timestamp, pwd);
		should.exist(t);
		var res = token.parse(t, pwd);
		should.exist(res);
		uid.should.equal(res.uid);
		timestamp.should.equal(res.timestamp);
	});

	it('should fail if use invalid password to parse the token', function() {
		var pwd = 'pomelo_session_secret';
		var invalidPwd = 'invalid_session_secret';
		var uid = '123456';
		var timestamp = Date.now();
		var t = token.create(uid, timestamp, pwd);
		should.exist(t);
		var res = token.parse(t, invalidPwd);
		should.not.exist(res);
	});
});