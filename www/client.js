// MLDASH CLIENT
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


/*
Data format: group names -> attribute names -> attribute object
See ml.defaults for the attribute object format
Or use shorthand attribute format -- instead of object, set value.
This is useful for updates.

// TODO: enforce Number type in normaliser so that comparisons work correctly.
*/

// time allowed (in milliseconds) before a group is considered dormant
var dormant = 60*1000

var socket = io.connect(undefined,{
	'reconnection limit' : 4000,
	'max reconnection attempts': Infinity
})

var ml = {}


// nice noise
var ping = document.createElement('audio')
ping.src = 'ping.ogg'
ping.load()



// the defaults result in no bar graph -- set 'max' to make one
ml.defaults = {
	min:0,
	max:null,
	value:null,
	gradient:null,
	units:''
}

$(function(){
	$('#splash').show().text('Connecting...')
	socket.on('refresh',ml.refresh)
	socket.on('update',ml.update)
	socket.on('splash',ml.splash)

	socket.on('title',function(title) {
		$('#title').text(title)
		document.title = title
	})

	socket.on('disconnect',function(){
		$('#splash').show().text('Connection lost')
	})

	// look for dormant attributes to empty
	setInterval(function(){
		$('.group tr').each(function(){
			var updated = $(this).data('attr').updated.getTime()
			var min = (new Date()).getTime - dormant

			// not updated for a while, so blank
			if (updated < min)
				$('td',this).empty()
		})
	},dormant/2)

	alarm.init()
})

// initially (re)construct the groups, given a full state
ml.refresh = function(state,reason) {
	$('#splash').hide()
	var context = $('#stats').empty()

	if (!Object.keys(state).length)
		return $('#splash').show().text('No data available')

	state = ml.normalise(state)

	for (var ob in state)
		ml.addGroup(ob,state[ob],context)

	if (typeof reason != 'undefined')
		ml.splash(reason)

	ml.sort()
}

// timeout for message, used to clear
var splashTimeout
// make a splash message with a timeout that is active only if there is data
ml.splash = function(message) {
	$('#splash').show().text(message)

	ping.play()
	ping.currentTime = 0

	clearTimeout(splashTimeout)

	if ($('#stats .group').length == 0)
		return // no timeout needed, no data

	splashTimeout = setTimeout(function() {
		$('#splash').hide()
	},2000)
}

// update the DOM with the new delta-state, where anything can be omitted
// if unchanged
ml.update = function(state){
	state = ml.normalise(state)

	for (var ob in state)
		for (var attr in state[ob])
			ml.updateAttribute(state[ob][attr])
}

// converts from shorthand data format if needed, then
// adds an unique ID to each attribute, allowing the attribute to be linked to
// the DOM so that it can be easily updated
ml.normalise = function(state){
	// groups
	for (var ob in state)
		for (var attr in state[ob]){
			if (typeof state[ob][attr] != "object")
				state[ob][attr] = {value:state[ob][attr]}
			state[ob][attr].id = $.md5(ob+attr)
		}

	return state
}

// re-arranges groups by height so that they display using as much
// of the screen as possible
ml.sort = function(){
	$('.group').sort(function(a,b){
		return ($(a).height() > $(b).height())?1:-1
	}).appendTo('#stats')
}

// adds an group containing attributes given an group of attributes to DOM
// (body)
ml.addGroup = function(name,attrs,context){
	var ob = $('<div class="group" />').appendTo(context)
	$('<h1 />').appendTo(ob).text(name)

	var table = $('<table />').appendTo(ob)

	for (var i in attrs)
		ml.addAttribute(i,attrs[i],table)
}

// updates attribute row with changes from delta group given
// requires attr with id added by ml.getId()
// merges with previously known data group
ml.updateAttribute = function(attr){
	if (!attr.id)
		console.error('No ID found in attr. Use ml.addIDs()',attr)

	// find the attribute table row using id
	var tr = $('#'+attr.id)

	// compute new attr based on old+delta
	var prev = tr.data('attr')
	if (prev) attr = $.extend({},prev,attr)

	attr.updated = new Date()

	// save new attr
	tr.data('attr',attr)

	// update each field
	// HACK -- number should be either undefined or a number
	// but defaults to null at the moment
	if (attr.value == Number(attr.value))
		$('.value',tr).html(attr.value+attr.units)

	// optionally add the bar graph and limits
	if (attr.max){
		$('.value',tr).css('color', $.relateColour(attr) )

		if(attr.value == Number(attr.value))
			$('.bar',tr).magicBar(attr)

		$('.min',tr).html(attr.min+attr.units)
		$('.max',tr).html(attr.max+attr.units)

		// out of range condition (setting alarm class will also trigger alarm noise)
		// HACK -- same as previous use of Number()
		if (attr.alarm
			&& attr.value == Number(attr.value)
			&& (attr.value > attr.max
			|| attr.value < attr.min)
		){
			$(tr).addClass('alarm')
			$('.value',tr).append('!')
		}else
			$(tr).removeClass('alarm')
	}

}

// add a new attribute row to given table
ml.addAttribute = function(name,attr,table){
	if (!attr.id)
		console.error('No ID found in attr. Use ml.addIDs()',attr)

	// merge initial attr with anydefaults
	attr = $.extend({},ml.defaults,attr)

	var tr = $('<tr><th></th><td class="value"></td><td class="min limit"></td><td class="bar"></td><td class="max limit"></td></tr>')

	// assign the unique DOM ID so the element can be updated easily
	tr.attr('id',attr.id)

	$('th',tr).text(name)

	// add to table, THEN update it (must be on DOM)
	tr.appendTo(table)
	ml.updateAttribute(attr)
}

var alarm = {}
// set up the alarm to load the noise
// then periodically look for 'alarm' classes. If found, sounds alarm.
// and blinks the document red. Which is horrible.
alarm.init = function(){
	alarm.audio = document.createElement('audio')

	alarm.audio.src = 'alarm.ogg'
	alarm.audio.load()

	setInterval(function(){
		if (!$('.alarm').length) return

		alarm.audio.play()
		$('body').css('background','red')

		setTimeout(function(){
			$('body').css('background','black')
		},50)
	},4000)
}
