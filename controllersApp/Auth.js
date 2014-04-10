var moment = require('moment');
var config = require('./../config/defaults.js');


function controller(parent, req) {
	this.parent = parent;
	this.db = parent.models;
	this.inputs = req.body;
	
	this.sessionID = req.header('sessionid');
	
	this.needAuth = false;
	this.permissions = [];
};

//login by supplying the login token and login password
controller.prototype.postLoginbytoken = function() {
	var parent = this.parent;
	var db = this.db;
	
	//private function create session with static model and insert into server memory
	var createSession = function(loginID, loginToken, clientIP, AccessGroups, cb) {
		db.AccessSessions.insertSessionHTTP(loginID, loginToken, clientIP, AccessGroups, function(resp) {
			if(resp === null) {
				return cb({loginError:true,reason:500});
			}
			
			parent.sessionsHTTP[resp._id] = {
				session_loginID      : resp.session_loginID,
				session_loginToken   : resp.session_loginToken,
				session_ip           : resp.session_ip,
				session_accessGroups : resp.session_accessGroups,
				timestamp_lastuse    : resp.timestamp_lastuse,
				timestamp_expires    : resp.timestamp_expires				
			};
			
			
			return cb(resp);
		});
	};
	
	this.execute = function(cb) {	
		var searchObj = {
			employee_status         : 'ACTIVE',
			employee_login_token    : this.inputs.logintoken,
			employee_login_password : this.inputs.loginpassword
		};
		this.db.Employees.getByLoginToken(searchObj, function(resp) {
			if(typeof resp === 'object' && resp !== null) {
 				createSession(resp._id,resp.employee_login_token,'127.0.0.1',resp.employee_group_id.access_groups,function(session) {
 					var obj = {
	 					sessionID    : session._id,
	 					sessionToken : session.session_loginToken
 					};
 					return cb(obj);
 				});
			} else {
				return cb({loginError:true,reason:404});
			}
		});				
	}
};

controller.prototype.getLogout = function() {
	this.needAuth = true;
	
	var parent = this;
	this.execute = function(cb) {
		this.db.AccessSessions.terminateSession(this.sessionID, function(resp) {
			if(!resp) {
				return cb(false);
			} else {
				delete parent.parent.sessionsHTTP[parent.sessionID];
				return cb(true);
			}
			
		});
	}
}

module.exports = controller;
