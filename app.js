//external libs
var config      = require('./config/defaults');
var appLog      = require('./libs/applog')(config);
var dB          = require('./libs/database')(config);
var controller  = require('./libs/controller')(config);
var appTemplate = require('./libs/apptemplate');
var express     = require('express');

//transport layers
var http      = express();
var websocket = require('socket.io');
var socket    = {};


var app = {
	serverPool : {},
	tokenMap : {}
};




/////////////////////////////////////////////////////////////
////////////////////// Boostrap Process /////////////////////
//////////// Runs Downwards, No Nested Callbacks ////////////
/////////////////////////////////////////////////////////////
function bootstrap() {

	//change our process information a bit
	process.title = config.process.title;

	console.log('Runtime    : ' + config.runtime.name);
	console.log('Version    : ' + config.runtime.version);
	console.log('Baby Daddy : ' + config.runtime.babydaddy);
	console.log('Alright - Lets Bootstrap This Rodeo');
	

	//let's init our controllers, then roll into our master db connection
	appLog.logBoot('Importing Controllers');
	controller.init(initGlobalConnection);
};

//Phone Home To The Saasy MotherShip
function initGlobalConnection() {
	dB.initGlobal(function(resp){
		if(!resp) {	
			appLog.logBoot('Master Database Connected');
			initPoolConnection();
			
		} else {
			appLog.logError(resp);
			appLog.logError('Master Database Unable To Connect. Terminating Bootstrap Process');
			
			return false;		
		}
	});	
};

//
function initPoolConnection() {
	dB.initPoolConnection(function(resp) {
		if(!resp) {	
			appLog.logBoot('App Database Pool Connected');
			initPoolSchema();
			
		} else {
			appLog.logError(resp);
			appLog.logError('App Database Pool Connection Couldnt Start. Terminating Bootstrap Process');
			
			return false;		
		}
	});
};

function initPoolSchema() {
	dB.initPoolSchema(function(resp) {
		if(resp) {
			appLog.logBoot('App Pool Schema Loaded Into Memory');
			listAppServers();
		} else {
			appLog.logError('App Pool Schema Failed To Load. Terminating Bootstrap Process');
			
			return false;
		}
	});	
};
//query the global db and return all active app servers
//we're going against our domino bootstrap here, we'll skip over the Build function after
function listAppServers() {

	dB.global.AppServers.listActive(function(resp) {
		if(!resp) {
			return appLog.logError('Database Error - Unable To List Active Store Servers');
		} else {
			//init all our saasy servers
			resp.forEach(buildEachServer);
			appLog.logBoot('All App Servers Have Been Loaded');
			//we're done here - lets move on to transport layers
			initHttpServer();
		}
	});
};

//Forge a unique server app object out of our basic template using the serverslip info
//Use the preloaded schema and birth a model for this app's db connection
function buildEachServer(serverSlip) {
	var id = serverSlip.server_database_id;
	
	app.serverPool[id] = new appTemplate(serverSlip, dB.pool, dB.poolSchema, function(resp) {
		if(!resp) {
			appLog.logBoot('App Server #' + serverSlip.server_database_id + ' Failed To Load Into Memory');
			return false;
		} else {
			//add token entry to our server token map (maps to database id)
			app.tokenMap[serverSlip.server_token] = serverSlip.server_database_id;
			
			appLog.logBoot('App Server #' + serverSlip.server_database_id + ' Loaded Into Memory');
			
			return true;		
		}
	});	
};



/////////////////////////////////////////////////////////////
////////////////////// Transport Layers /////////////////////
/////////////////////////////////////////////////////////////


function routeHttpServer(req, res) {
	var serverToken = req.header('servertoken');
	var sessionID = req.header('sessionid');
	var sessionIP = req.ip;
	
	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	res.setHeader('Expires', '-1');
	res.setHeader('Pragma', 'no-cache');
	
	//check to see if the token supplied via header matches to a live app server - otherwise return error
	if(!serverToken || isNaN(app.tokenMap[serverToken]) || !app.tokenMap[serverToken] ) {
		res.json({error:true, servertoken:404});
		return true;
	} else {
		var databaseID = app.tokenMap[serverToken];
		app.serverPool[databaseID].routeHTTP(req,res,controller);
		return true;
	}
	
};

function initHttpServer() {

	http.use(express.json());
	http.use(express.urlencoded());
	
	

	http.get('/api*', routeHttpServer);
	http.post('/api*', routeHttpServer);
	
	http.listen(config.http.bindingPort, function(resp) {
		appLog.logBoot('Transport Layer HTTP Started On ' + config.http.bindingHost + ':' + config.http.bindingPort);
	});
};


/*****
	TODO SOCKET LAYER
 */







/////////////////////////////////////////////////////////////
//////////////////////// Boostrap End ///////////////////////
/////////////////////////////////////////////////////////////


//Let's run the domino boostrap
bootstrap();
