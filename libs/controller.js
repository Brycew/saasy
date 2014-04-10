var fs     = require('fs');
var config = require('./../config/defaults');

module.exports = {
	initControllersApp : function(cb) {
		var Controllers = {};
		
		fs.readdirSync(config.controller.appPath).forEach(function (file) {
			if(file.indexOf(".js") === -1) {
				return false;
			}
			var fileName = file.substring(0, file.length - 3);
			Controllers[fileName] = require('../' + config.controller.appPath + fileName);
		});
		return cb(Controllers);
	},
	initControllersMaster : function(cb) {
		var Controllers = {};
		
		fs.readdirSync(config.controller.masterPath).forEach(function (file) {
			if(file.indexOf(".js") === -1) {
				return false;
			}
			var fileName = file.substring(0, file.length - 3);
			Controllers[fileName] = require('../' + config.controller.masterPath + fileName);
		});
		return cb(Controllers);
	}
};