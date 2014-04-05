function controller(parent, req) {
	this.parent = parent;
	this.db = parent.models;
	this.inputs = req.body;
	
	this.needAuth = false;
	this.permissions = [];
};

//login by supplying the login token and login password
controller.prototype.postLoginbytoken = function() {
	var parent = this.parent;
	var db = this.db;
	
	//private function create session with static model and insert into server memory
	var createSession = function(loginID, loginToken, clientIP, cb) {
		db.AccessSessions.insertSessionHTTP(loginID, loginToken, clientIP, function(resp) {
			if(resp === null) {
				return cb({loginError:true,reason:500});
			}
			
			parent.sessionsHTTP[resp._id] = {
				id      : resp._id,
				loginID : resp.session_loginID,
				loginToken : resp.session_loginToken,
				ip      : resp.session_ip
				
			};
			
			return cb(resp);
		});
	};
	
	this.execute = function(cb) {	
		var searchObj = {
			'employee_status'         : 'ACTIVE',
			'employee_login_token'    : this.inputs.logintoken,
			'employee_login_password' : this.inputs.loginpassword
		};	
		this.db.Employees.getByLoginToken(searchObj, function(resp) {
			if(typeof resp === 'object' && resp !== null) {
 				createSession(resp._id,resp.employee_login_token,'127.0.0.1',function(session) {
 					return cb(session);
 				});
			} else {
				console.log("bad");
				return cb({loginError:true,reason:404});
			}
		});				
	}
};

module.exports = controller;
