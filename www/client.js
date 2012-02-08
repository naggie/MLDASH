/*
Data format: group names -> attribute names -> attribute object
See ml.defaults for the attribute object format
Or use shorthand attribute format -- instead of object, set value.
This is useful for updates.

// TODO: enforce Number type in normaliser so that comparisons work correctly.
*/

var socket = io.connect();
var ml = {};

// the defaults result in no bar graph -- set 'max' to make one
ml.defaults = {
	min:0,
	max:null,
	value:0,
	gradient:null,
	units:''
}

$(function(){
	$('body').html('<div class="message">Connecting...</div>');
	socket.on('refresh',ml.refresh);
	socket.on('update',ml.update);

	socket.on('disconnect',function(){
		$('body').html('<div class="message">Network connection compromised</div>');
	});

	socket.on('reconnect_failed',function(){
		$('body').html('<div class="message">Reconnect failed</div>');
	});	

	socket.on('reconnect',function(){
		$('body').html('<div class="message">Reconnecting...</div>');
	});

	alarm.init();
});

// initially (re)construct the groups, given a full state
ml.refresh = function(state){
	var context = $('body').empty();

	state = ml.normalise(state);

	for (var ob in state)
		ml.addObject(ob,state[ob],context);

	ml.sort();
}

// update the DOM with the new delta-state, where anything can be omitted
// if unchanged
ml.update = function(state){
	state = ml.normalise(state);

	for (var ob in state)
		for (var attr in state[ob])
			ml.updateAttribute(state[ob][attr]);
}

// converts from shorthand data format if needed, then
// adds an unique ID to each attribute, allowing the attribute to be linked to
// the DOM so that it can be easily updated
ml.normalise = function(state){
	// groups
	for (var ob in state)
		for (var attr in state[ob]){
			if (typeof state[ob][attr] != "object")
				state[ob][attr] = {value:state[ob][attr]};
			state[ob][attr].id = $.md5(ob+attr);
		}

	return state;
}

// re-arranges groups by height so that they display using as much
// of the screen as possible
ml.sort = function(){
	$('.group').sort(function(a,b){
		return ($(a).height() > $(b).height())?1:-1;
	}).appendTo('body');
}

// adds an group containing attributes given an group of attributes to DOM
// (body)
ml.addObject = function(name,attrs,context){
	var ob = $('<div class="group" />').appendTo(context);
	$('<h1 />').appendTo(ob).text(name);

	var table = $('<table />').appendTo(ob);

	for (var i in attrs)
		ml.addAttribute(i,attrs[i],table);
}

// updates attribute row with changes from delta group given
// requires attr with id added by ml.getId()
// merges with previously known data group
ml.updateAttribute = function(attr){
	if (!attr.id)
		console.error('No ID found in attr. Use ml.addIDs()',attr);

	// find the attribute table row using id
	var tr = $('#'+attr.id);

	// compute new attr based on old+delta
	var prev = tr.data('attr');
	if (prev) attr = $.extend({},prev,attr);

	// save new attr
	tr.data('attr',attr);

	// update each field
	$('.value',tr).html(attr.value+attr.units);

	// optionally add the bar graph and limits
	if (attr.max){
		$('.value',tr).css('color', $.relateColour(attr) );
		$('.bar',tr).magicBar(attr);
		$('.min',tr).html(attr.min+attr.units);
		$('.max',tr).html(attr.max+attr.units);
	}

	// out of range condition (setting alarm class will also trigger alarm noise)
	// HACK: convert to Number type to avoid string comparison causing an error
	// triggering alarm falsely. Will be fixed with enforcing -- see header.
	if (attr.max && Number(attr.value) > Number(attr.max)){
		$('th',tr).addClass('alarm');
		$('.value',tr).append('!');
	}else
		$('th',tr).removeClass('alarm');
}

// add a new attribute row to given table
ml.addAttribute = function(name,attr,table){
	if (!attr.id)
		console.error('No ID found in attr. Use ml.addIDs()',attr);

	// merge initial attr with anydefaults
	attr = $.extend({},ml.defaults,attr);

	var tr = $('<tr><th></th><td class="value"></td><td class="min limit"></td><td class="bar"></td><td class="max limit"></td></tr>');

	// assign the unique DOM ID so the element can be updated easily
	tr.attr('id',attr.id);

	$('th',tr).text(name);

	// add to table, THEN update it (must be on DOM)
	tr.appendTo(table);
	ml.updateAttribute(attr);
}

var alarm = {};
// set up the alarm to load the noise
// then periodically look for 'alarm' classes. If found, sounds alarm.
alarm.init = function(){
	alarm.audio = document.createElement('audio');

	alarm.audio.src = 'alarm.wav';
	alarm.audio.load();

	setInterval(function(){
		if ($('.alarm').length)
			alarm.audio.play();
	},330);
}
