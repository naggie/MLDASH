//var app = require('express').createServer()
var io = require('socket.io').listen(8080);

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

	socket.on('disconnect', function () {
		console.log('user disconnected');
	});
});

setInterval(function(){
	var update = testDataUpdate();
	io.sockets.emit('update',update);
},80);


