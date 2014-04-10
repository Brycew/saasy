var config = require('./../config/defaults');
module.exports = {
	logBoot : function(message) {
		if(config.isDebug) {
			console.log("DEBUG BOOTSTRAP: "+message);
		}
	},
	logInfo : function(message) {
		if(config.isDebug) {
			console.log("DEBUG INFO: "+message);
		}
	},
	logError : function(message) {
		if(config.isDebug) {
			console.log("ERROR INFO: "+message);
		}
	}
};