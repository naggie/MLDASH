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

var testData = {
	cheese:{foo:ml.defaults,bar:ml.defaults},
	gravy:{
		carcass:{value:56},
		pigeon:{value:10,min:0,max:130,units:'',gradient:'positive'},
		rat:{value:50,min:0,max:100,units:'%',gradient:'positive'},
		kangaroo:{value:80,min:0,max:100,units:'%',gradient:'positive'},
	}
}

var testDataUpdate = function(){
	return {gravy: {
			pigeon:{max:150,value:(Math.floor(Math.random()*100))}
			rat:{max:150,value:(Math.floor(Math.random()*100))}
			kangaroo:{max:150,value:(Math.floor(Math.random()*100))}
		}
	};
}


$(function(){
	for (var i in testData)
		ml.newObject(i,testData[i]).appendTo('body');

	ml.sort();
});


// re-arranges objects by height so that they display using as much
// of the screen as possible
ml.sort = function(){
	$('.object').sort(function(a,b){
		return ($(a).height() > $(b).height())?1:-1;
	}).appendTo('body');
}

// returns a new object containing attributes given an object of attributes
ml.newObject = function(name,attrs){
	var ob = $('<div class="object" />');
	$('<h1 />').appendTo(ob).text(name);

	var table = $('<table />').appendTo(ob);

	for (var i in attrs)
		ml.newAttribute(i,attrs[i]).appendTo(table);

	return ob;
}

// updates attribute row with changes from delta object given
// expected <tr /> jquery object or selector
// merges with previously known data object
ml.updateAttribute = function(tr,state){
	// ensure tr is *one* jquery object. Otherwise
	// values get mixed up badly.
	tr = $(tr).first();

	// compute new state based on old+delta
	var prev = tr.data('state');
	if (prev) state = $.extend({},prev,state);

	// save new state
	tr.data('state',state);

	// update each field
	$('.value',tr).html(state.value+state.units);
	$('.bar',tr).magicBar(state);
	$('.min',tr).html(state.min+state.units);
	$('.max',tr).html(state.max+state.units);
}

// return a jquery table row of a new attribute
ml.newAttribute = function(name,state){
	// merge initial state with anydefaults
	state = $.extend({},ml.defaults,state);

	var tr = $('<tr><th></th><td class="value"></td><td class="min limit"></td><td class="bar"></td><td class="max limit"></td></tr>');
	$('th',tr).text(name);
	ml.updateAttribute(tr,state);
	return tr;
}
