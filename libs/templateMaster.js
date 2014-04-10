var moment   = require('moment');
//var us       = require('underscore');
var config   = require('./../config/defaults');
var mongoose = require('mongoose');
var util     = require('util');
var appLog   = require('./../libs/applog');
var misc     = require('./../libs/misc');

var ObjectId = mongoose.Types.ObjectId;

function server(database, appCallback) {
	////////////////// Public Variables /////////////////	
	this.sessionsHTTP = {};
	this.sessionsSOCK = {};
	this.db           = database.connection;
	this.models       = {};
	
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
		
	///////////////// Domino Bootstrap /////////////////
	
	function init() {
		initSchemas(function() {
			return appCallback(true);
		});	
	};
	
	init();
	
};

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

server.prototype.routeHTTP = function(req,res,controller) {	

	var out = misc.prettyParams(req.method,req.params);
	//var isAuth = this.checkHTTPAuth(req);
	
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
	//console.log(this.sessionsHTTP);
	cont.execute(function(resp) {
		delete cont;
		return res.json({error:false, response:resp});
	});
};


// export the class
module.exports = server;