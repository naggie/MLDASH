#!/usr/bin/env node
// Listens for hss-reporter clients
//
// Copyright 2012-2014 Callan Bryant <callan.bryant@gmail.com>
// http://callanbryant.co.uk/
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO: exceptions
// TODO: rdns fail handling

var key = process.env.KEY || process.argv[2] || 'banana'
console.log('API key is:',key)
console.log('Specify as argument or KEY environment variable to change')
console.log('IP and PORT can also be specified by env vars.')

// shared domain name for servers, or false if servers
// no not have a common domain name
var common_domain = false

var express = require('express')
var app = express()
var http = require('http')
var server = http.createServer(app)
var io = require('socket.io').listen(server)
var dns = require('dns')
var os = require('os')

// global installs are not allowed to modify files
//require('./compile-client').compile()

server.listen(process.env.PORT||80,process.env.IP)

// state to be synchronised with the client
var state = {}
var title = ''

// dict of IP -> {host,domain,fqdn}
var dnsCache = {}

// object, host -> date last updated
// to find dormant servers 
var updated = {}

// maximum time in seconds a server can go quiet for without
// removing it
var max_dormant = 10

app.use(express.bodyParser())

app.post('/init', function(req, res) {
	if (req.body.key != key)
		return res.json(403,{error:'Wrong API key'})
	else
		delete req.body.key

	var ip = req.connection.remoteAddress
	// remove cached DNS name
	delete dnsCache[ip]


	getFqdn(req,function(err,host) {
		if (err) return res.json(404,{error:"Could not find DNS hostname"})

		// replace with something clever FIXME TODO
		if (host.domain) {
			//title = host.domain
			io.sockets.emit('title',title)
		}

		state[host.name] = {
			Uptime : {
				units : ' days'
			},
			Load : {
				units : '%',
				max : 100,
				gradient : 'negative'
			},
			Storage : {
				units : 'GB',
				max : req.body.Storage,
				gradient : 'negative'
			},
			Memory : {
				units : 'MB',
				max : req.body.Memory,
				gradient : 'negative'
			},
			Temperature : {
				units : '&deg;C',
				max : 80,
				gradient : 'negative',
				min : 15,
				alarm :true
			},
			TX : {
				units : 'Mbps',
				max : 10
			},
			RX : {
				units : 'Mbps',
				max : 10
			}
		}

		io.sockets.emit('refresh',state,host.name+' connected')

		res.json({
			success  : "Initialised server to pool",
			hostname : host.name,
			domain   : host.domain,
		})
	})
})

	
app.post('/update', function(req, res){
	if (req.body.key != key)
		res.json({error:'Wrong API key'})
	else
		delete req.body.key

	getFqdn(req,function(err,host) {
		if (err) return res.json(404,{error:"Could not find DNS hostname"})

		var update = {}
		update[host.name] = {}

		updated[host.name] = new Date()

		// set new max values for RX and TX, and value
		state[host.name].TX.max = Math.max(state[host.name].TX.max,req.body.TX)
		state[host.name].RX.max = Math.max(state[host.name].RX.max,req.body.RX)

		// update the remaining
		// TODO: this all explicitly
		for (var attr in req.body)
			if (state[host.name][attr])
				state[host.name][attr].value = update[host.name][attr] = req.body[attr]
		
		// send new max values perhapswhynot
		// as long-hand update. Make it conditional later.
		update[host.name].TX = state[host.name].TX
		update[host.name].RX = state[host.name].RX

		io.sockets.emit('update',update)
		res.json({success:'Updated'})
	})
})

app.use(express.static(__dirname + '/www'))


io.set('log level',1)
io.enable('browser client minification')
io.enable('browser client etag')
io.enable('browser client gzip')
io.set('transports', ['websocket','flashsocket','htmlfile','xhr-polling','jsonp-polling'])


// longhand defining parameters of attributes
var initial = {}

// new client
io.sockets.on('connection',function (socket) {
	socket.emit('refresh',state)
	socket.emit('title',title)
})


// given a HTTP request object, callback with host, domain and fqdn
// uses DNS, falls back to relying on the client if not found
function getFqdn(req,cb) {
	var ip = req.connection.remoteAddress

	// cached?
	if (dnsCache[ip])
		return cb(null,dnsCache[ip])

	dns.reverse(ip,function(err,domains){
		if (err) return cb(err)	

		// proxy or local
		if (ip == '127.0.0.1')
			domains = [os.hostname()]
		else if (domains.length == 0)
			return cb(true)	

		var parts = domains[0].split('.')

		var host = {
			name : parts.shift() || null,
			domain : parts.join('.') || null,
			fqdn : domains[0],
		}

		// cache
		dnsCache[ip] = host

		cb(null,host)
	})
}


// look for dormant servers and remove them
setInterval(function(){
	for (var host in updated) {
		var min = (new Date()).getTime() - max_dormant*1000

		if ( updated[host].getTime() < min) {
			// remove host and tell clients
			delete state[host]
			delete updated[host]

			// remove the entry from the DNS cache
			for (var ip in dnsCache)
				if (dnsCache[0] == host)
					delete dnsCache[ip]

			io.sockets.emit('refresh',state,host+' disconnected')
		}
	}
},max_dormant*500)
