//var app = require('express').createServer()
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);
var os = require('os');
var mls = {};

app.listen(80);
app.use(
	express.static(__dirname + '/www')
);

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
io.set('reconnection limit',1000);


// full state of system, used for refresh and diff'd
// against for updates
mls.state = {};

io.sockets.on('connection',function (socket){
	io.sockets.emit('refresh', mls.state);
});


mls.state = {
	'snorlax':{
		'Memory usage':{
			max:os.totalmem()/(1024*1024),
			units:'MB',
			gradient:'negative'
		},
		'Load average':{
			gradient:'negative',
			max:100
		},
		'Uptime':{
			units:' days'
		}
	}
}


setInterval(function(){
	var memUsage = Math.floor((os.totalmem()-os.freemem())/(1024*1024));
	var load = Math.floor(os.loadavg()[0]*100/os.cpus().length);
	var uptime = Math.floor(os.uptime()/(3600*24));

	var update = {
		'snorlax':{
			'Memory usage':{
				value:memUsage
			},
			'Load average':{
				value:load
			},
			'Uptime':{
				value:uptime
			}
		}
	};	
	io.sockets.emit('update',update);
},1000);

