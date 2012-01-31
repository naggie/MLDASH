/*

Data format: object names -> attribute names -> attribute object
See ml.defaults for the attribute object format

*/


var ml = {};

ml.defaults = {
	min:0,
	max:100,
	value:0,
	gradient:null,
	units:'%'
}

$(function(){
	var socket = io.connect('http://localhost:8080');
	$('body').text('Connecting...');
	socket.on('refresh',ml.refresh);
	socket.on('update',ml.update);

	socket.on('disconnect',function(){
		$('body').html('<div class="error">Network connection compromised</div>');
	});
});

// initially (re)construct the objects, given a full state
ml.refresh = function(state){
	var context = $('body').empty();

	state = ml.addIds(state);

	for (var ob in state)
		ml.addObject(ob,state[ob],context);

	ml.sort();
}

// update the DOM with the new delta-state, where anything can be omitted
// if unchanged
ml.update = function(state){
	state = ml.addIds(state);

	for (var ob in state)
		for (var attr in state[ob])
			ml.updateAttribute(state[ob][attr]);
}

// adds an unique ID to each attribute, allowing the attribute to be linked to
// the DOM so that it can be easily updated
ml.addIds = function(state){
	// objects
	for (var ob in state)
		for (var attr in state[ob])
			state[ob][attr].id = $.md5(ob+attr);

	return state;
}

// re-arranges objects by height so that they display using as much
// of the screen as possible
ml.sort = function(){
	$('.object').sort(function(a,b){
		return ($(a).height() > $(b).height())?1:-1;
	}).appendTo('body');
}

// adds an object containing attributes given an object of attributes to DOM
// (body)
ml.addObject = function(name,attrs,context){
	var ob = $('<div class="object" />').appendTo(context);
	$('<h1 />').appendTo(ob).text(name);

	var table = $('<table />').appendTo(ob);

	for (var i in attrs)
		ml.addAttribute(i,attrs[i],table);
}

// updates attribute row with changes from delta object given
// requires attr with id added by ml.getId()
// merges with previously known data object
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
	$('.bar',tr).magicBar(attr);
	$('.min',tr).html(attr.min+attr.units);
	$('.max',tr).html(attr.max+attr.units);
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
