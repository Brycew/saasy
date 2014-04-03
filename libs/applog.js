module.exports = function(config) {
	var lib = {};
	
	lib.logBoot = function(message) {
		if(config.isDebug) {
			console.log("DEBUG BOOTSTRAP: "+message);
		}
	};
	
	lib.logInfo = function(message) {
		if(config.isDebug) {
			console.log("DEBUG INFO: "+message);
		}
	};
	
	lib.logError = function(message) {
		if(config.isDebug) {
			console.log("ERROR INFO: "+message);
		}
	}
	
	return lib;
};