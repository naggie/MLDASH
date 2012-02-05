// Provides a basic JSON/HTTP aggregator service to broadcast updates to all clients
// 
// Assumes the first post is the initial state for each group, and subsequent
// posts are updates -- which are broadcasted regardless.
//
// Parts of this file may from an aggregator module in the future
//
// UPDATES MUST BE IN SHORTHAND

var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);

app.listen(80);

app.use(express.bodyParser());

app.post('/', function(req, res){
	// iterate over group
	for (var grp in req.body){
		if (!initial[grp])
			addGroup(grp,req.body[grp]);
		else
			updateGroup(grp,req.body[grp]);
	}
	res.end();
});

app.use(express.static(__dirname + '/www'));


io.set('log level',1);
io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
io.set('transports', [                    
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);


// format and future values
// longhand defining parameters of attributes
var initial = {};
// shorthand attribute values only
var update = {};


// new client
io.sockets.on('connection',function (socket){
	socket.emit('refresh',initial);
});


// Pushes shorthand updates to clients
setInterval(function(){
		io.sockets.emit('update',update);
},1000);


// add a new group, defining initial state
// will broadcast a refresh
var addGroup = function(name,attrs){
	// add the new group
	initial[name] = attrs;

	// refresh all clients with new layout
	io.sockets.emit('refresh',initial);
}

// update a group with shorthand attrs -- will not accept
// longhand
var updateGroup = function(group,attrs){
	if (!initial[group])
		console.log('group not defined:',group);

	// check for shorthand
	for (var attr in attrs){
		if (typeof attrs[attr] == 'object'){
			console.log('Update failed: Pre-existing group or updates must be shorthand');
			return;
		}

		if (!initial[group][attr])
			console.log('Update failed: Attribute to update not found in initial state:',attr);

	}
	update[group] = attrs;
}



var os = require('os');
var host = os.hostname();

var initAttrs = {
	'Memory usage':{
		max:Math.floor(os.totalmem()/(1024*1024)),
		units:'MB',
		gradient:'negative'
	},
	'Load average':{
		gradient:'negative',
		max:100,
		units:"%"
	},
	'Uptime':{
		units:' days'
	},
	'Local time':{}
}

addGroup(host,initAttrs);


setInterval(function(){
	var memUsage = Math.floor((os.totalmem()-os.freemem())/(1024*1024));
	var load = Math.floor(os.loadavg()[0]*100/os.cpus().length);
	var uptime = Math.floor(os.uptime()/(3600*24));
	var d = new Date();
	var time = d.getHours()+':'+d.getMinutes()+':'+d.getSeconds();

	var upd = {
		'Memory usage':memUsage,
		'Load average':load,
		'Uptime':uptime,
		'Local time':time
	}
	
	updateGroup(host,upd);
},1000);

