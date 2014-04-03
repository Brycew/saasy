var mongoose = require('mongoose');
var fs = require('fs');
	

module.exports = function(config) {
	var obj = {};
	obj.global = false;
	obj.pool = false;
	
	obj.poolSchema = [];
	
	obj.initGlobal = function(cb) {
		obj.global = mongoose.createConnection(config.dbGlobal.connectionUrl, function(resp) {
			//deal with the error and terminate this function
			if(resp) {
				return cb(resp);
			}
			fs.readdirSync(config.dbGlobal.modelDir).forEach(function (file) {
				if(file.indexOf(".js") === -1) {
					return false;
				}
				var fileName = file.substring(0, file.length - 3);
				var arr = file.match(/(.*)\.[^.]+$/)[1].split(/\s|_/);
			    for(var i=0,l=arr.length; i<l; i++) {
			        arr[i] = arr[i].substr(0,1).toUpperCase() + 
			                 (arr[i].length > 1 ? arr[i].substr(1).toLowerCase() : "");
			    }
			    var title = arr.join("");
				
				obj.global.model(fileName, require('../' + config.dbGlobal.modelDir + fileName)(mongoose) );
				obj.global[title] = obj.global.models[fileName];
				
			});
			
			return cb(resp);			
			
			
		});
	};
	
	obj.initPoolConnection = function(cb) {
		obj.pool = mongoose.createConnection(config.dbApp.connectionUrl, cb);
	};
	
	
	obj.initPoolSchema = function(cb) {
		fs.readdirSync(config.dbApp.modelDir).forEach(function (file) {
			if(file.indexOf(".js") === -1) {
				return false;
			}
			var fileName = file.substring(0, file.length - 3);
			var arr = file.match(/(.*)\.[^.]+$/)[1].split(/\s|_/);
		    for(var i=0,l=arr.length; i<l; i++) {
		        arr[i] = arr[i].substr(0,1).toUpperCase() + 
		                 (arr[i].length > 1 ? arr[i].substr(1).toLowerCase() : "");
		    }
		    var title = arr.join("");
			
			var schema = {
				title  : title,
				table  : fileName,
				schema : require('../' + config.dbApp.modelDir + fileName)(mongoose)
			};
			obj.poolSchema.push(schema);		
		});
		
		return cb(true);
		
	};
	
	return obj;
};