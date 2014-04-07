var moment = require('moment');
var config = require('./../config/defaults.js');


function controller(parent, req) {
	this.parent = parent;
	this.db = parent.models;
	this.inputs = req.body;
	
	this.needAuth = true;
	this.permissions = [];
};

//login by supplying the login token and login password
controller.prototype.getActive = function() {
	
	this.permissions = ["Web.Employees.View","Web.Employees.Edit"];
	this.execute = function(cb) {
		return cb({res:'blah'});			
	}
};

module.exports = controller;