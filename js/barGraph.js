"use strict";
//The graph object draws the graph and interpolates its axis boundaries based on the data it is fed
function barGraph(x, y, width, height, svg){
	barGraph.superClass.constructor.call(this, x, y, width, height, svg);
	this.yMax = 0.5;
	this.yMin = -0.5;
}
extend(barGraph, graphObject);

//changes the value that is currently displayed (total tasks, seconds / task, delay / task, etc.) by modifying
//the data object that will ALWAYS be graphed
barGraph.prototype.setYAttr = function (){
	this.destroyAll();
	//add 1 to the length so that the final value isn't on the very edge of the graph
	var count = 0;
	//calculating the maximum value in the new set
	var queueIndex = 0;

	this.setAxes();
	this.firstTimeData = null;
	this.x_step = this.width / (this.data.length + 1);
	this.barWidth = this.x_step;
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
			"id": nameSubStr + "Bar",
			"title": this.data[i].name,
			"party": this.data[i].id,
			"name": nameSubStr,
			"xVal": this.data[i].x,
			"yVal": this.data[i].y,
			"width": this.barWidth,
			"yTop": (this.data[i].delta > 0) ? this.mapYValToGraph(this.data[i].delta) : this.mapYValToGraph(0),
			"yBot": (this.data[i].delta <= 0) ? this.mapYValToGraph(this.data[i].delta) : this.mapYValToGraph(0),
			"x": this.x + (this.x_step / 2) + (count * this.x_step),
			"cssClass": cssClass,
			"svgBar": null,
		};
		//	console.log(this.mapYValToGraph(this.data[i].y));
		//	console.log(this.mapXValToGraph(this.data[i].x));
		count++;
	}
	this.draw()
		//setTimeout(this.draw(), 5000);

}
	
barGraph.prototype.draw = function(){	
	this.mouseOver = elementMouseOverClosure(this.x, this.y);
	this.mouseOut = elementMouseOutClosure();
	this.drawBars();

	this.drawYAxisLabel();
	this.drawYAxis();

	//Label the x axis for senators, but no need to draw the actual axis, as it isn't a measurement
	this.drawXAxisLabel();
	this.drawTitle();
}

//------------------------------------------------------------------------------------------------------
//DRAW METHODS - Everything below handles the brunt of the D3 code and draws everything to the canvas
//------------------------------------------------------------------------------------------------------
//Creates the the bars in the bar graph view
barGraph.prototype.drawBars = function(){
	 this.svgElements["bars"] = this.svgPointer.selectAll("Bars")
		.data(this.currentlyViewedData)
		.enter()
		.append("rect")	
		.attr("id", function(d){return d.id})
		.attr("class", function(d){return d.cssClass})
		.style("stroke-width", "2px")
		.attr({
			x: function(d) { 
				d.svgBar = this;
				return d.x - (d.width / 2);},
			y: function(d) {return d.yTop;},
			height: function(d){ return d.yBot - d.yTop}, 
			width: function(d){return d.width} 
		});
}
