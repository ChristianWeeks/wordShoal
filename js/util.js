//Random utility functions

//Moves an svg object to the front so it is not occluded by other svg items
d3.selection.prototype.moveToFront = function() {
	return this.each(function(){
		this.parentNode.appendChild(this);
	});
};

//Padding function taken from StackOverflow question 10073699
function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
//cloning for prototypal inheritance. Taken from Pro JavaScript Design Patterns by Ross Harmes and Dustin Diaz
function clone(object){
	function F() {};
	F.prototype = object;
	return new F;
}

//extending for classical inheritance. Taken from Pro JavaScript Design Patterns by Ross Harmes and Dustin Diaz
function extend(subClass, superClass){
	var F = function() {};
	F.prototype = superClass.prototype;
	subClass.prototype = new F();
	subClass.prototype.constructor = subClass;

	subClass.superClass = superClass.prototype;
	if(superClass.prototype.constructor == Object.prototype.constructor)
		superClass.prototype.constructor = superClass;
}
