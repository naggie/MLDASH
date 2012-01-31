//var app = require('express').createServer()
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);


app.listen(80);
app.use(
	express.static(__dirname + '/www')
);

io.set('log level',1);

var testData = {
	gravy:{
		carcass:{value:56},
		pigeon:{value:10,min:0,max:130,units:'',gradient:'positive'},
		rat:{value:50,min:0,max:100,units:'%',gradient:'positive'},
		kangaroo:{value:80,min:0,max:100,units:'%',gradient:'positive'},
	}
}

var testDataUpdate = function(){
	return {gravy: {
			pigeon:{max:150,value:(Math.floor(Math.random()*100))},
			rat:{max:150,value:(Math.floor(Math.random()*100))},
			kangaroo:{max:150,value:(Math.floor(Math.random()*100))}
		}
	};
}



io.sockets.on('connection',function (socket){
	io.sockets.emit('refresh', testData);
});

setInterval(function(){
	var update = testDataUpdate();
	io.sockets.emit('update',update);
},1000);


