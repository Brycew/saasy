var fs = require('fs');

module.exports = function(config) {
	var obj = {};
	
	obj.init = function(cb) {
		fs.readdirSync(config.controller.dir).forEach(function (file) {
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
			
			obj[title] = require('../' + config.controller.dir + fileName);
			
		});
		return cb(true);
	};
		
	return obj;
};