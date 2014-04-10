var moment   = require('moment');
//var us       = require('underscore');
var config   = require('./../config/defaults');
var mongoose = require('mongoose');
var util     = require('util');
var appLog   = require('./../libs/applog');
var misc     = require('./../libs/misc');

var ObjectId = mongoose.Types.ObjectId;

function server(serverSlip, database, appCallback) {
	////////////////// Public Variables /////////////////	
	this.sessionsHTTP = {};
	this.sessionsSOCK = {};
	this.serverToken  = serverSlip.server_token;
	this.databaseID   = serverSlip.server_database_id;
	this.db           = database.connection.useDb(config.dbApp.prefix + this.databaseID);
	this.models       = {};
	this.accessGroups = {};
	
	var parent = this;
	
	
		
	/////////////////////////////////////////////////////
	///////////// Private Server Functions //////////////
	/////////////////////////////////////////////////////
	
	////////////// Bootstrap Functions //////////////////
	function initSchemas(cb) {
		for(var key in database.schema) {
			var Schema = database.schema[key];
			parent.models[key] = parent.db.model(key,Schema,key);
		}
		return cb(true);
	};
	
	function initAccessGroups(cb) {
		parent.models.AccessGroups.listActive(function(resp) {
			//if we couldn't load the access groups
			if(!resp) {
				appLog.logError('App Server #' + parent.databaseID + ' Failed To Load Access Groups - Killing BootProcess');
				return cb(false);
			} else {
				for(var key in resp) {
					var obj = resp[key];
					parent.accessGroups[obj._id] = obj.permissions;
				}
				return cb(true);
			}
		});
	};
	
	function initSessions(cb) {
		parent.models.AccessSessions.listActive(function(resp) {
			if(!resp) {
				return cb(false);
			}
			resp.forEach(function(session) {
				if(session.session_type === 'http') {
					parent.sessionsHTTP[session._id] = {
						session_loginID      : session.session_loginID,
						session_loginToken   : session.session_loginToken,
						session_ip           : session.session_ip,
						session_accessGroups : session.session_accessGroups,
						timestamp_lastuse    : session.timestamp_lastuse,
						timestamp_expires    : session.timestamp_expires							
					};
				}
			});
			return cb(true);
			
		});
		
	}
	
	/////////////////// House Keeping ///////////////////
	
	function cleanExpiredSessions(cb) {
		var now = moment();
		
		//loop thru http sessions and check if expired then purge
		for(var key in parent.sessionsHTTP) {
			var obj = parent.sessionsHTTP[key];	
			
			if(moment().isAfter(obj.timestamp_expires) ) {
				console.log(key);
				parent.models.AccessSessions.updateExpiredSession(key,function(resp) {
					if(resp) {
						appLog.logError('App Server #' + parent.databaseID + ' Session '+key+' Expired');
						delete parent.sessionsHTTP[key];
					}
					return true;
				});
				
			}
		}
		return cb();
		
	};
	
	function updateSessions(cb) {
		for(var key in parent.sessionsHTTP) {
			var obj = parent.sessionsHTTP[key];	
			
			console.log( getAccessSetting('Web.Auth.Timeout', obj.session_accessGroups) );
			
			//var isExpired = moment().isBefore(
			//console.log(unixTime);
		}
		houseKeeping.updateSessions(); 
	};
	
	
	
	var houseKeeping = {
		cleanExpiredSessions : function() {
			setTimeout( function() {
				cleanExpiredSessions(houseKeeping.cleanExpiredSessions);
			}, config.appServer.cleanExpiredSessions );
		},
		updateSessions : function() {
			setTimeout( function() {
				updateSessions(houseKeeping.updateSessions);
			}, config.appServer.updateSessions );		
		},
		kill : function() {
			
		},
		init : function() {
			//houseKeeping.updateSessions();
			houseKeeping.cleanExpiredSessions();
		}
	};
	
	
	//////////////// Security Functions ////////////////
	
	function getAccessSetting(setting, groups) {
		if(groups.length > 1) {
			var holder  = [];
			/*
				TODO 
				add suport for multiple settings via multi group
			
			*/
		} else {
			var group = parent.accessGroups[groups[0]];		
			function index(group,i) { return group[i] };
			
			return setting.split('.').reduce(index, group);
		}
	}
	
	function getAccessPermission(permission, groups) {
		if(groups.length > 1) {
			var holder  = [];
			/*
				TODO 
				add suport for multiple permissions via multi group
			
			*/
		} else {
			var group = parent.accessGroups[groups[0]];		
			function index(group,i) { return group[i] };
			
			return permission.split('.').reduce(index, group);
		}	
	}
	
	function authorizeMultiplePermissions(permissions, groups) {
		
		permissions.reduce(function(authorized){
			console.log("test");
		});
	}
	
	
		
	///////////////// Domino Bootstrap /////////////////
	
	function init() {
		//init housekeeping
		houseKeeping.init();
		
		initSchemas(function() { afterInitSchemas(); });	
	};
	
	function afterInitSchemas() {
		initAccessGroups(function(resp) {
			if(!resp) {
				return appCallback(false);
			} else {
				return initSessions(function(resp) { afterInitSessions(resp); } );
			}			
		});
	};
	
	function afterInitSessions(resp) {
		return appCallback({ dbID : serverSlip.server_database_id, token : serverSlip.server_token });	
	}

	init();
	
};


//////////////// Security Functions ////////////////

server.prototype.getAccessSetting = function(setting, groups) {
	if(groups.length > 1) {
		var holder  = [];
		/*
			TODO 
			add suport for multiple settings via multi group
		
		*/
	} else {
		var group = parent.accessGroups[groups[0]];		
		function index(group,i) { return group[i] };
		
		return setting.split('.').reduce(index, group);
	}
}

server.prototype.getAccessPermission = function(permission, groups) {
	
	if(groups.length > 1) {
		var holder  = [];
		/*
			TODO 
			add suport for multiple permissions via multi group
		
		*/
	} else {
		var group = this.accessGroups[groups[0]];		
		function index(group,i) { return group[i] };
		
		try {
			return permission.split('.').reduce(index, group);
			throw err;
		} catch (err) {
    		return false;
    	}
		
	}
	
}

server.prototype.authorizeMultiplePermissions = function(permissions, groups) {
	var parent = this;
	var authorized = true;
	
	permissions.forEach(function(permission) {
		var check = parent.getAccessPermission(permission,groups);
		if(!check || check === null || check === false) {
			authorized = false;
		}
	});
	
	return authorized;
}












//update sessions lastuse timestamp to extend expirey
server.prototype.updateHTTPSession = function(sessionID) {
	this.sessionsHTTP[sessionID].timestamp_lastuse = moment();
	//var time = 
	console.log(getAccessSetting);
	//this.sessionsHTTP[sessionID].timestamp_expires = 
};


server.prototype.checkHTTPAuth = function(req) {
	var sessionID = req.header('sessionid');
	var loginToken = req.header('logintoken');
	var ip = req.ip;
	
	//if no such session exists w/ the supplied id	
	if(!sessionID || !loginToken) {
		return 'session-not-found';
	} else if(typeof this.sessionsHTTP[sessionID] === 'undefined') {
		return 'session-not-found';
	} else if(this.sessionsHTTP[sessionID].session_loginToken !== loginToken) {
		return 'session-404-logintoken';
	} else if(moment().isAfter(this.sessionsHTTP[sessionID].timestamp_expires) ) {
		return 'session-timeout';
	} else if(this.sessionsHTTP[sessionID].session_ip !== ip) {
		/* TODO !!!!!!
		
		Log this IP for attempting to use a sessionid on another ip.
		Maybe blacklist the ip after a few
		
		*/
		return 'session-404-ip';
	} else {
		return this.sessionsHTTP[sessionID];
	}	
};

server.prototype.routeHTTP = function(req,res, controller) {
	var out = misc.prettyParams(req.method,req.params);
	var isAuth = this.checkHTTPAuth(req);
	
	//check if controller and action exist
	if(typeof controller[out.controller] !== 'function') {
		return res.json({error:true, routing:404, issue:'controller',route:out.func});
	}
	
	//now that we've confirmed valid controller set it
	var cont = new controller[out.controller](this, req);

	//check if action is valid
	if(typeof cont[out.func] !== 'function' ){
		return res.json({error:true, routing:404, issue:'action',route:out.func});
	}
	//load controller into init
	cont[out.func]();
	//check if this action requires us to be logged in
	if(cont.needAuth && typeof isAuth !== 'object') {
		return res.json({error:true, routing:401, route:out.func});
	}
	//check if we maintain the basic permissions to run this function
	if(cont.permissions.length >= 1) {
		if(!this.authorizeMultiplePermissions(cont.permissions,isAuth.session_accessGroups) ) {
			return res.json({error:true, routing:4012, route:out.func});	
		}
	}
	
	//console.log(this.sessionsHTTP);
	cont.execute(function(resp) {
		//delete instance
		delete cont;
		return res.json({error:false, response:resp});
	});
};


// export the class
module.exports = server;