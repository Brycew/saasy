//this never changes
function controller(dB, req) {
	this.dB = dB;
	this.inputs = req.body;
};


/**** CONTROLLER CODE ****/
controller.prototype.getEmployee = {

	needAuth : false,
	permissions : ["Employees.Default.View","Employees.Default.Edit"],
	
	init : function(cb) {
		return cb("twst");
	}
};

controller.prototype.postEmployee = {
	needAuth : false,
	permissions : ["Employees.Default.View","Employees.Default.Edit"],	
	init : function(cb) {
		return cb("twst");
	}
};

module.exports = controller;
