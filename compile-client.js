#!/usr/bin/env node

uglifyjs = require('uglify-js')
fs = require('fs')

console.log('Compiling client...')
var result = uglifyjs.minify([
	__dirname+"/www/jquery-1.8.0.min.js", // upgrade me
	__dirname+"/www/jquery-ui-1.8.23.custom.min.js",
	__dirname+"/www/jquery.magicBar.js",
	__dirname+"/www/jquery.md5.js",
	__dirname+"/www/socket.io.js",
	__dirname+"/www/client.js"
])

fs.writeFileSync(
	__dirname+"/www/build.js",
	result.code,
	{
		encoding:'utf8'
	}
)
console.log('Done.')
