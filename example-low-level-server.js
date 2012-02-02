var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);

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
//io.set('reconnection limit',1000);


io.sockets.on('connection',function (socket){
	socket.emit('refresh', initial);
});


var os = require('os');

var initial = {
	'snorlax':{
		'Memory usage':{
			max:os.totalmem()/(1024*1024),
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
		'Local time':{
		}
	}
}


setInterval(function(){
	var memUsage = Math.floor((os.totalmem()-os.freemem())/(1024*1024));
	var load = Math.floor(os.loadavg()[0]*100/os.cpus().length);
	var uptime = Math.floor(os.uptime()/(3600*24));
	var d = new Date();
	var time = d.getHours()+':'+d.getMinutes()+':'+d.getSeconds();

	var update = {};
	update.snorlax = {
		'Memory usage':memUsage,
		'Load average':load,
		'Uptime':uptime,
		'Local time':time
	}
	
	io.sockets.emit('update',update);
},1000);

