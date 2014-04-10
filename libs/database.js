var mongoose = require('mongoose');
var config   = require('./../config/defaults');
var fs = require('fs');

module.exports = {
	initMasterConnection : function(cb) {
		var db = mongoose.createConnection(config.dbGlobal.connectionUrl, function(resp) {
			if(!resp) {
				return cb(db);
			} else {
				return cb(false);
			}
		});
	},
	initPoolConnection : function(cb) {
		var db = mongoose.createConnection(config.dbApp.connectionUrl, function(resp) {
			if(!resp) {
				return cb(db);
			} else {
				return cb(false);
			}
		});
	},
	initMasterSchema : function(cb) {
		var Schema = {};
		fs.readdirSync(config.dbGlobal.modelDir).forEach(function (file) {
			if(file.indexOf(".js") === -1) {
				return false;
			}
			var fileName = file.substring(0, file.length - 3);
			Schema[fileName] = require('../' + config.dbGlobal.modelDir + fileName);
		});
		return cb(Schema);
	},
	initPoolSchema : function(cb) {
		var Schema = {};
		fs.readdirSync(config.dbApp.modelDir).forEach(function (file) {
			if(file.indexOf(".js") === -1) {
				return false;
			}
			var fileName = file.substring(0, file.length - 3);
			Schema[fileName] = require('../' + config.dbApp.modelDir + fileName);
		});
		return cb(Schema);
	}
};	