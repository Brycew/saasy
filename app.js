//external libs
var config         = require('./config/defaults');
var appLog         = require('./libs/applog');
var database       = require('./libs/database');
var controller     = require('./libs/controller');
var templateApp    = require('./libs/templateApp');
var templateMaster = require('./libs/templateMaster');
var encryption     = require('./libs/encryption');

//transport layers
var express   = require('express');
var http      = false;
var websocket = require('socket.io');
var net       = require('net');

var app = {
	databases : {
		master : {
			connection : false,
			schema     : false
		},
		pool   : {
			connection : false,
			schema     : false
			
		}
	},
	controllers : {
		master : false,
		app    : false
	},
	serverPool : {},
	masterServer : false,
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
	bootstrapDbMasterConnection();
};

function bootstrapDbMasterConnection() {
	database.initMasterConnection(function(resp){
		if(resp) {
			app.databases.master.connection = resp;
			appLog.logBoot('Master Database Connected');
			bootstrapDBPoolConnection();
		} else {
			appLog.logError('Master Database Unable To Connect. Terminating Bootstrap Process');
		}
	});
};

function bootstrapDBPoolConnection() {
	database.initPoolConnection(function(resp){
		if(resp) {
			app.databases.pool.connection = resp;
			appLog.logBoot('Pool Database Connected');
			bootstrapDBMasterSchema();
		} else {
			appLog.logError('Pool Database Unable To Connect. Terminating Bootstrap Process');
		}
	});
};

function bootstrapDBMasterSchema() {
	database.initMasterSchema(function(resp) {
		if(resp) {
			app.databases.master.schema = resp;
			appLog.logBoot('Master Database Schema Loaded Into Memory');
			bootstrapDBPoolSchema();
		} else {
			appLog.logError('Master Database Schema Failed To Load. Terminating Bootstrap Process');
		}
	});
};

function bootstrapDBPoolSchema() {
	database.initPoolSchema(function(resp) {
		if(resp) {
			app.databases.pool.schema = resp;
			appLog.logBoot('Pool Database Schema Loaded Into Memory');
			bootstrapControllerMaster();
		} else {
			appLog.logError('Pool Database Schema Failed To Load. Terminating Bootstrap Process');
		}
	});
};

function bootstrapControllerMaster() {
	controller.initControllersMaster(function(resp) {
		if(resp) {
			app.controllers.master = resp;
			appLog.logBoot('Master Controllers Loaded Into Memory');
			bootstrapControllerApp();
		} else {
			appLog.logError('Master Controllers Failed To Load. Terminating Bootstrap Process');
		}
	});
};

function bootstrapControllerApp() {
	controller.initControllersApp(function(resp) {
		if(resp) {
			app.controllers.app = resp;
			appLog.logBoot('App Controllers Loaded Into Memory');
			bootstrapMasterServer();
			
		} else {
			appLog.logError('App Controllers Failed To Load. Terminating Bootstrap Process');
		}
	});
};

function bootstrapMasterServer() {
	app.masterServer = new templateMaster(app.databases.master, function(resp) {
		if(resp) {
			appLog.logBoot('Master Server Loaded Into Memory');
			bootstrapAppServers();
		} else {
			appLog.logError('Master Server Failed To Load Into Memory For A Unkown Reason. Terminating Bootstrap Process');
		}
	});
};

function bootstrapAppServers() {
	app.databases.master.connection.models.AppServers.listActive(function(resp) {
		if(!resp) {
			return appLog.logError('Database Error - Unable To List Active Store Servers');
		} else {
			//init all our saasy servers
			resp.forEach(function(serverSlip) {
				var id = serverSlip.server_database_id;
	
				app.serverPool[id] = new templateApp(serverSlip, app.databases.pool, function(resp) {
					if(!resp) {
						appLog.logBoot('App Server #' + serverSlip.server_database_id + ' Failed To Load Into Memory');
						return false;
					} else {
						//add token entry to our server token map (maps to database id)
						app.tokenMap[resp.token] = resp.dbID;
						appLog.logBoot('App Server #' + resp.dbID + ' Loaded Into Memory');
						return true;		
					}
				});
			});
			
			appLog.logBoot('All App Servers Have Been Loaded');
			//we're done here - lets move on to transport layers
			initHttpServer();
			initTCPServer();
		}
	});
};

/////////////////////////////////////////////////////////////
////////////////////// Transport Layers /////////////////////
/////////////////////////////////////////////////////////////

//////////////////////   HTTP Server   //////////////////////

function routeHttpServer(req, res) {
	var serverToken = req.header('servertoken');
	
	//set our headers for json delivery
	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	res.setHeader('Expires', '-1');
	res.setHeader('Pragma', 'no-cache');
	
	//if our token doesnt exist let us know -- if we didnt supply a token route to master server
	//if we supplied a valid token, route to the appropriate app server
	if(!serverToken || serverToken === null) {
		console.log('test');
		app.masterServer.routeHTTP(req,res,app.controllers.master);		
		return true;
	} else if( isNaN(app.tokenMap[serverToken]) || !app.tokenMap[serverToken] ) {
		res.json({error:true, serverToken:404});
		return true;
	} else {
		var databaseID = app.tokenMap[serverToken];
		app.serverPool[databaseID].routeHTTP(req,res,app.controllers.app);
		return true;
	}
};

function initHttpServer() {
	http = express();
	
	http.use(express.json());
	http.use(express.urlencoded());

	http.get('/api*', routeHttpServer);
	http.post('/api*', routeHttpServer);
	
	http.listen(config.http.bindingPort, function(resp) {
		appLog.logBoot('Transport Layer HTTP Started On ' + config.http.bindingHost + ':' + config.http.bindingPort);
	});
};

//////////////////////   TCP SERVER   //////////////////////

function initTCPServer() {
	
	var server = net.createServer(function(connection) {
		var serverToken = false;
		var databaseID = false;
		
		connection.on('data', function(data) {
			//parse our incoming json into object
			try {
				var format = JSON.parse(data);
			} catch(err) {
				return false;
			}
			
			//are we handshaking?
			if(format.handshake) {
				//have we even set a servertoken yet?
				if(!serverToken || serverToken === null) {
					//if we weren't given a correct servertoken, ask for the token again
					if(!format.serverToken || isNaN(app.tokenMap[format.serverToken]) || !app.tokenMap[format.serverToken] ) {
						return connection.write(JSON.stringify({handshake:true,request:['servertoken']}) + '\n');
					}
					
					serverToken = format.serverToken;
					databaseID = app.tokenMap[format.serverToken];
				}
			} else {
				app.serverPool[databaseID].routeTCP(data, function(resp) {
					connection.write(JSON.stringify({resp : resp }) + '\n');
				});
			}
		});
		
		//write handshake
		connection.write(JSON.stringify({handshake:true,request:['servertoken']}) + '\n');
	});
	server.listen(config.tcp.bindingPort);

};

/////////////////////////////////////////////////////////////
//////////////////////// Boostrap End ///////////////////////
/////////////////////////////////////////////////////////////


//Let's run the domino boostrap
bootstrap();