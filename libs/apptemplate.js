var moment   = require('moment');
//var us       = require('underscore');
var config   = require('./../config/defaults');
var mongoose = require('mongoose');
var util     = require('util');
var appLog   = require('./../libs/applog')(config);
var misc     = require('./../libs/misc');

var ObjectId = mongoose.Types.ObjectId;

function server(serverSlip, database, schemas, appCallback) {
	////////////////// Public Variables /////////////////	
	this.sessionsHTTP = {};
	this.sessionsSOCK = {};
	this.serverToken  = serverSlip.server_token;
	this.databaseID   = serverSlip.server_database_id;
	this.db           = database.useDb(config.dbApp.prefix + this.databaseID);
	this.models       = {};
	this.accessGroups = {};
	
	var parent = this;
	
	

		
	/////////////////////////////////////////////////////
	///////////// Private Server Functions //////////////
	/////////////////////////////////////////////////////
	
	////////////// Bootstrap Functions //////////////////
	function initSchemas(cb) {
		for(var key in schemas) {
			var obj = schemas[key];
			parent.models[obj.title] = parent.db.model(obj.title,obj.schema,obj.title);
		}
		return cb(true);
	}
	
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
	
	/////////////////// House Keeping ///////////////////
	
	function cleanExpiredSessions(cb) {
		var now = moment();
		
		//loop thru http sessions and check if expired then purge
		for(var key in parent.sessionsHTTP) {
			var obj = parent.sessionsHTTP[key];	
			if(obj.expires <= now) {
				delete parent.sessionsHTTP[key];
				console.log('purged');
			}
		}
		return cb();
	};
	
	function updateSessions(cb) {
		/*
		for(var key in parent.sessionsHTTP) {
			var obj = parent.sessionsHTTP[key];	
			
			var isExpired = moment().isBefore(
			console.log(unixTime);
		}
		houseKeeping.updateSessions(); */
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
			houseKeeping.updateSessions();
			houseKeeping.cleanExpiredSessions();
		}
	};	
		
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
					/*
					var newGroup = new parent.models.EmployeeGroups({group_title:'Administrator',group_desc:'Root Security Rights'});
					newGroup.save(function(err,resp) {
						console.log(err);
						console.log(resp);
					});*/
					
					/*
					parent.models.Employees.findOne({'_id': ObjectId('533cb26895745c770a3641ba')}, function (err, doc) {
						if(err || !doc || doc === null) {
							return appCallback({ dbID : serverSlip.server_database_id, token : serverSlip.server_token });
						}


						doc.access_group_id = ObjectId('5341fdd3ff1126c1385c0c22');
						doc.save(function(err,resp) {
							console.log(resp);
							return appCallback({ dbID : serverSlip.server_database_id, token : serverSlip.server_token });
						});

					});
					
					*/
					/*
					
					parent.models.Employees.findOne({'_id': ObjectId('533cb26895745c770a3641ba')}).populate('employee_group_id').exec(function(err,doc) {
						if(doc === null) {
							return true;
						}
					
						parent.models.EmployeeGroups.populate(doc, {path   : 'employee_group_id.access_groups',
																	model  : 'AccessGroups',
																	select : 'permissions'},
							function(err,resp) {
								console.log(util.inspect(resp, { showHidden: true, depth: null }));
							}
						);
							

						/*
						doc.employee_group_id.populate('access_groups', function(err,resp) {
							console.log(resp);
						});
					});
					*/
					
					
					return appCallback({ dbID : serverSlip.server_database_id, token : serverSlip.server_token });
					
					
			
				
			}			
		});
	};

	init();
	
};

//update sessions lastuse timestamp to extend expirey
server.prototype.updateHTTPSession = function(sessionID) {
	this.sessionsHTTP[sessionID].timestamp_lastuse = moment();
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
	} else if(this.sessionsHTTP[sessionID].loginToken != loginToken) {
		return 'session-404-logintoken';
	} else if(this.sessionsHTTP[sessionID].expires <= moment() ) {
		return 'session-timeout';
	} else if(this.sessionsHTTP[sessionID].ip != ip) {
		/* TODO !!!!!!
		
		Log this IP for attempting to use a sessionid on another ip.
		Maybe blacklist the ip after a few
		
		*/
		return 'session-404-ip';
	} else {
		return true;
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
	if(cont.needAuth && isAuth !== true) {
		return res.json({error:true, routing:401, route:out.func});
	}
	//check if we maintain the basic permissions to run this function
	
	console.log(this.sessionsHTTP);
	cont.execute(function(resp) {
		//delete instance
		delete cont;
		return res.json({error:false, response:resp});
	});
};


// export the class
module.exports = server;