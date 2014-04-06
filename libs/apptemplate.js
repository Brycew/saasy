var moment   = require('moment');
var us       = require('underscore');
var config   = require('./../config/defaults');
var mongoose = require('mongoose');
var util     = require('util');
var appLog   = require('./../libs/applog')(config);

moment().format();


function server(serverSlip, database, schemas, cb) {
	this.sessionsHTTP = {};
	this.sessionsSOCK = {};
	this.serverToken  = serverSlip.server_token;
	this.databaseID   = serverSlip.server_database_id;
	this.db           = database.useDb(config.dbApp.prefix + this.databaseID);
	this.models       = {};
	
	this.accessGroups = {};
	
	
	for(var key in schemas) {
		var obj = schemas[key];
		this.models[obj.title] = this.db.model(obj.table,obj.schema);
	}
	
	
	/*
	var authObj = {
		sessionID : "12345",
		loginToken : "535235",
		ip : '127.0.0.1',
		expires : moment() + 20000,
		permissions : ['Employees.Default.View','Employees.Default.Edit']
	};
	this.sessionsHTTP["12345"] = authObj;
	*/
	
	/*
	var group1 = this.models.AccessGroups({group_title : 'default 2', group_description : 'blah blah blah'});
	group1.save(function(err,resp) {
		if(err) {
			console.log(err);
		} else {
			console.log(resp);
		}
	});
	*/
	
	//init the housekeeping tasks
	houseKeeping.init();
	
	initAccessGroups(this,function(resp) {
		if(!resp) {
			console.log("kill process due to access group fail");
			return cb(false);
		} else {
			return cb(true);
		}
	});


	

}



/////////////////////////////////////////////////////////////
////////////////// Private Server Functions /////////////////
/////////////////////////////////////////////////////////////

//////////////////// Bootstrap Functions ////////////////////


function initAccessGroups(parent, cb) {
	parent.models.AccessGroups.listActive(function(resp) {
		//if we couldn't load the access groups
		if(!resp) {
			appLog.logError('App Server #' + this.databaseID + ' Failed To Load Access Groups - Killing BootProcess');
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




/////////////////////// House Keeping ///////////////////////

function cleanExpiredSessions(cb) {
	var now = moment();
	
	//loop thru http sessions and check if expired then purge
	for(var key in this.sessionsHTTP) {
		var obj = this.sessionsHTTP[key];	
		if(obj.expires <= now) {
			delete this.sessionsHTTP[key];
			console.log('purged');
		}
	}
	return cb();
};

function updateSessions(cb) {
	console.log("updatesessions");
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






//format our url into our function to call
//sample url using method GET /api/employees/employee/id/123
function prettyParams(meth,text) {
	var split = text[0].split('/');
	
	var controller = split[1].charAt(0).toUpperCase() + split[1].slice(1);
	var action = split[2].charAt(0).toUpperCase() + split[2].slice(1);
	var method = (meth+"").toLowerCase();
	
	var passingVars = {};
	//let's grab our variables to pass to the controller
	if(split.length > 3) {
		//get a base count (remove the controller and action from the count)
		var base = 3;
		var count = (split.length) - base;
				
		for(x=0;x<count;x++) {
			var countThis = parseInt(base+x);
			passingVars[split[countThis]] = split[countThis+1];
			//skip ahead since the next is this's vars
			x++;
		}
	}
	
	//
	
	
	return {
		controller:controller,
		func:(method+""+action),
		vars:passingVars
		
	};
};

function checkHTTPAuth(req) {
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

/*test */

server.prototype.routeHTTP = function(req,res, controller) {	

	var out = prettyParams(req.method,req.params);
	var isAuth = checkHTTPAuth(req);
	
	console.log(this.accessGroups);
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
	
	
	cont.execute(function(resp) {
		//delete instance
		delete cont;
		return res.json({error:false, response:resp});
	});
};


// export the class
module.exports = server;