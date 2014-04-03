function controller(database, req) {
	this.db = database;
	this.inputs = req.body;
	
	this.needAuth = false;
	this.permissions = [];
};


//login by supplying the login token and login password
controller.prototype.postLoginbytoken = function() {
	

	this.execute = function(cb) {	
		var searchObj = {
			'employee_status'         : 'ACTIVE',
			'employee_login_token'    : this.inputs.logintoken,
			'employee_login_password' : this.inputs.loginpassword
		};	
		this.db.Employees.getByLoginToken(searchObj, function(resp) {
			test();
			return cb(resp);
		});				
	}
};

module.exports = controller;
