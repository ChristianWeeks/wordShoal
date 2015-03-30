"use strict";
//The graph object draws the graph and interpolates its axis boundaries based on the data it is fed
function scatterPlot(x, y, width, height, svg){
	scatterPlot.superClass.constructor.call(this, x, y, width, height, svg);
	console.log(this.x);
	this.svgPoints = [];
}
extend(scatterPlot, graphObject);

//changes the value that is currently displayed (total tasks, seconds / task, delay / task, etc.) by modifying
//the data object that will ALWAYS be graphed
scatterPlot.prototype.setYAttr = function (){
	//add 1 to the length so that the final value isn't on the very edge of the graph
	var count = 0;
	//calculating the maximum value in the new set
	var queueIndex = 0;

	this.setAxes();
	this.firstTimeData = null;
	for (var i in this.data){
		var cssClass;
		if(this.data[i].id == "R")
			cssClass = "rep";
		else if(this.data[i].id == "D")
			cssClass = "dem";
		else
			cssClass = "ind";

		var nameSubStr = this.data[i].name.substring(0, this.data[i].name.length - 5);
		this.currentlyViewedData[i] = {
			"data": this.data[i],
			"id": nameSubStr + "Point",
			"title": this.data[i].name,
			"party": this.data[i].id,
			"name": nameSubStr,
			"xVal": this.data[i].x,
			"yVal": this.data[i].y,
			"y": this.mapYValToGraph(this.data[i].y),
			"x": this.mapXValToGraph(this.data[i].x),
			"cssClass": cssClass,
			"svgLabel": null,
		};
	}
	this.draw()
}
	
scatterPlot.prototype.draw = function(){
	
//	this.mouseOver = elementMouseOverClosure(this.x, this.y);
//	this.mouseOut = elementMouseOutClosure();
	this.drawPoints();

	this.drawYAxisLabel();
	this.drawXAxisLabel();
	this.drawAxesLegends();
	this.drawYAxis();
	this.drawXAxis();
	this.drawTitle();
}


//------------------------------------------------------------------------------------------------------
//DRAW METHODS - Everything below handles the brunt of the D3 code and draws everything to the canvas
//------------------------------------------------------------------------------------------------------

//Creates the points 
scatterPlot.prototype.drawPoints= function(){
	 this.svgElements["points"] = this.svgPointer.selectAll("Points")
		.data(this.currentlyViewedData)
		.enter()
		.append("circle")	
		.attr("class", function(d){return d.cssClass;})
		.attr("id", function(d){ return d.id;})
		.style("stroke-width", "2px")

	//	.style("fill", function(d) {return d.color})
	//	.style("stroke", function(d) {return d.color})
	//	.style("stroke-width", 0)
		.attr({
			cx: function(d) {
			   	d.svgPoint = this;
				return d.x;},
			cy: function(d) {return d.y;},
			r: 8,//function(d) {return d.r;},
		});
//		.on("mouseover", this.mouseOver)
//		.on("mouseout", this.mouseOut);
}


scatterPlot.prototype.drawAxesLegends = function() {
	var xLabelPadding = 55;
	var yLabelPadding = 55;
	var textData = [
		{
		text: "Liberal", 
		x: this.x - yLabelPadding,
		y: this.y - this.height/8,
		cssClass: "demText",
		align: "vertical"},
		{
		text: "Conservative",
		x: this.x - yLabelPadding,
		y: this.y - this.height*7/8,
		cssClass: "repText",
		align: "vertical"},
		{
		text: "Liberal",
		x: this.x + this.width/8,
		y: this.y + xLabelPadding,
		cssClass: "demText",
		align: "horizontal"},
		{
		text: "Conservative",
		x: this.x + this.width*7/8 ,
		y: this.y + xLabelPadding,
		cssClass: "repText",
		align: "horizontal"},
	];

	this.svgElements["axesLegends"] = this.svgPointer.selectAll("axesLegend")
		.data(textData)
		.enter()
		.append("text")
		.attr("text-anchor", "middle")
		.attr("alignment-baseline", "middle")
		.attr({ 
			class: function(d){return d.cssClass;},
			x: function(d){return d.x;},
			y: function(d){return d.y;},
			transform: function(d){
				if (d.align == "vertical")
					return "rotate(-90 " + d.x + " " + d.y + ")";
				return "rotate(0 0 0)";
			},
			id: "axesLegend"})
		.text(function(d){return d.text});
	console.log("HELLO");
		
	return this;
}
