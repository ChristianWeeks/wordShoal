"use strict";
//The graph object draws the graph and interpolates its axis boundaries based on the data it is fed

var graphObject = function(x, y, width, newHeight, svg){
	//standard graph values
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = newHeight;
	this.svgPointer = svg;
	this.x_step;
	this.y_step;
	//yLen is the number of steps on the y axis, including 0
	this.yLen = 7;
	this.xLen = 5;
	this.yMax = 1;
	this.yMin = 0;
	this.xMax = 1; 
	this.xMin = 0;
	this.topPadding = 30 
	this.currentlyViewedData = null;

	this.minified = false;
	this.yAttr = false;

	//pointer to all data that is currently being graphed
	this.data = null;

	//initializing all svg containers
	this.svgElements = {};
}

//maps from canvas space to graph space
graphObject.prototype.mapYValToGraph = function(yVal){
	yVal -= this.yMin;
	return this.y - (yVal * (this.height - this.topPadding) / (this.yMax - this.yMin));
}
graphObject.prototype.mapXValToGraph = function(xVal){
	xVal -= this.xMin;
	return this.x + (xVal * (this.width) / (this.xMax - this.xMin));
}

//sets the y axis
graphObject.prototype.setAxes = function(){

	this.yAxisData = new Array(this.yLen);
	this.y_val_step = (this.yMax - this.yMin) / (this.yLen - 1);
	for(var i = 0; i < this.yLen; i++){
		this.yAxisData[i] = {"value": ((i*this.y_val_step + this.yMin).toFixed(2)), "loc": this.mapYValToGraph(i*this.y_val_step + this.yMin)} ;
	}
	this.xAxisData = new Array(this.xLen);
	this.x_val_step = (this.xMax - this.xMin) / (this.xLen - 1);
	for(var i = 0; i < this.xLen; i++){
		this.xAxisData[i] = {"value": ((i*this.x_val_step + this.xMin).toFixed(2)), "x": this.mapXValToGraph(i*this.x_val_step + this.xMin), "y": this.y} ;
	}
	return this;
}
graphObject.prototype.setTitle = function(titleStr){
	this.title = titleStr;
	return this;
}

graphObject.prototype.setTitleY = function(titleStr){
	this.titleY = titleStr;
	return this;
}

graphObject.prototype.setTitleX = function(titleStr){
	this.titleX = titleStr;
	return this;
}
	
//assigns the data that will be currently displayed
graphObject.prototype.setData = function(dataObject){
	//removing previous svg elements
	this.destroyAll();

	this.data = dataObject;
	//allocating space for the new x-axis values
	this.currentlyViewedData = new Array(this.xLen);
	if(this.yAttr == false){
		this.yAttr = "speechPos"
	}
	this.setYAttr();
}

//Removes all svg elements from the graph
graphObject.prototype.destroyAll = function(){
	for(var key in this.svgElements)
		this.destroyElement(this.svgElements[key]);

};
//Destroys an element
graphObject.prototype.destroyElement = function(svgElement){
	if(svgElement != null) svgElement.remove();
};

//------------------------------------------------------------------------------------------------------
//DRAW METHODS - Everything below handles the brunt of the D3 code and draws everything to the canvas
//------------------------------------------------------------------------------------------------------

//Creates the labels for the axes and the main title
graphObject.prototype.drawTitle = function(){
	this.svgElements["title"] = this.svgPointer.append("text")
		.attr("class", "axisTitle")
		.style("font-size", 40)
		.attr("text-anchor", "middle")
		.attr({
			x: this.x + this.width/2,
			y: this.y - this.height
		})
		.text(this.title ? this.title : (this.titleY + " by " + this.titleX));
}

//label for the y axis
graphObject.prototype.drawYAxisLabel = function(){
	this.svgElements["yAxisLabel"] = this.svgPointer.append("text")
		.attr("class", "axisTitle")
		.attr("text-anchor", "middle")
		.attr({
			x: this.x/3,
			y: this.y - this.height / 2
		})
		.attr("transform", "rotate(-90 " + (this.x/3) + ", " + (this.y - this.height / 2) + ")")
		.text(this.titleY);
}

//label for the x axis
graphObject.prototype.drawXAxisLabel = function(){
	this.svgElements["xAxisLabel"] = this.svgPointer.append("text")
		.attr("class", "axisTitle")
		.attr("text-anchor", "middle")
		.attr("alignment-baseline", "middle")
		.attr({
			x: this.x  + this.width / 2,
			y: this.y  + 60 
		})
		.text(this.titleX);	
}

//creates the black lines that make the x and y axes
graphObject.prototype.drawXAxis = function() {
	 this.svgElements["x_axis"] = this.svgPointer.append("line")
		.attr({
			x1: this.x,
			y1: this.y,
			x2: this.x + this.width,
			y2: this.y,
			stroke: '#000'
		});
	//Creates the tick marks for the x-axis based on the total number of x values.  Does not create vertical grid lines.
	//Drawing the tick marks and labels for the x axis
	 this.svgElements["xTickMarks"] = this.svgPointer.selectAll("xTickMarksBar")
		.data(this.xAxisData)
		.enter()
		.append("line")
		.attr({
			x1: function(d, i) { return d.x},
			y1: this.y,
			x2: function(d, i) { return d.x},
			y2: this.y + 10,
			stroke: '#000'
		});

	 this.svgElements["xTickLabels"] = this.svgPointer.selectAll("xDataLabel")
		.data(this.xAxisData)
		.enter()
		.append("text")
		.attr("id", "xDataLabel")
		.attr("text-anchor", "end")
		.style("opacity", 1)
		.attr("transform", function(d) { 
			d.svgLabel = this; 
			return "rotate(-45 " + d.x + "," + d.y + ")"})
		.style("fill", "black")
		.attr({
			x: function(d) { return d.x - 10},
			y: this.y + 20,
		})
		.text(function(d) { return d.value});
}

graphObject.prototype.drawYAxis = function(){
	//drawing the tick marks, labels, and grid lines for the Y axis	
	 this.svgElements["yTickMarks"] = this.svgPointer.selectAll("yTickMarks")
		.data(this.yAxisData)
		.enter()
		.append("line")
		.attr({
			y1: function(d, i) { return d.loc},
			x1: this.x,
			y2: function(d, i) { return d.loc},
			x2: this.x - 10,
			stroke: '#000'
		})
	 this.svgElements["yGridLines"] = this.svgPointer.selectAll("yGridLines")
		.data(this.yAxisData)
		.enter()
		.append("line")
		.attr({
			y1: function(d, i) { return d.loc},
			x1: this.x,
			y2: function(d, i) { return d.loc},
			x2: this.x + this.width,
			stroke: '#DDD'
		});
	 this.svgElements["yTickLabels"] = this.svgPointer.selectAll("yTickLabels")
		.data(this.yAxisData)
		.enter()
		.append("text")
		.attr("text-anchor", "end")
		.attr("alignment-baseline", "middle")
		.style("fill", "black")
		.attr({
			x: this.x - 12,
			y: function(d){ return d.loc}
		})
		.text(function(d){ return d.value;});
	 this.svgElements["y_axis"] = this.svgPointer.append("line")
		.attr({
			x1: this.x,
			y1: this.y,
			x2: this.x,
			y2: this.y - this.height,
			stroke: '#000'
		});
}


//Couples the mousevents for the scatterplot and the bargraph, so they can effect eachother
graphObject.prototype.coupleMouseEvents = function(elementStr, x, y, setViewLevelFunc){

	this.mouseOver = elementMouseOverClosure(x, y);
	this.mouseOut = elementMouseOutClosure();
	this.mouseClick = elementMouseClickClosure(setViewLevelFunc);

	this.svgElements[elementStr]
		.on("mouseover", this.mouseOver)
		.on("mouseout", this.mouseOut)
		.on("click", this.mouseClick);
}

//updates the filter so only the filtered data elements show up
graphObject.prototype.updateFilter = function(filterStr){
	this.svgElements[this.datumSvgs].transition()
		.attr("class", function(d){
			console.log(d.data.datum.state);
			if(d.data.datum.state == global.activeStateFilter || global.activeStateFilter == "None"){
				d3.select(this).moveToFront();		
				return d.cssClass;
			}
			else{
				return d.cssClass + " fadeOut"
			}
		});
}

//Closure needed to have multiple svg-elements activate (highlight) when any one of them is highlighted
//Ex. Mousing over the label, line plot, or color legend for any single computer / user will cause the label to increase its font
//and the line to turn black and increase its stroke width.
function elementMouseOverClosure(graphX, graphY, barSvgs, pointSvgs){
	var elementMouseOver = function(d, i){
		if(d.data.datum.state == global.activeStateFilter || global.activeStateFilter == "None"){
			//draw lines extending to x and y axes
			var barKey = "#" + d.name + "Bar";
			var pointKey = "#" + d.name + "Point";
			var barKey = "#" + d.name + "Bar";
			var traceX = d3.select(pointKey)[0][0].cx.baseVal.value;
			var traceY = d3.select(pointKey)[0][0].cy.baseVal.value;
			d.svgXTrace = d3.select("#scatterPlot").append("line").attr({
				x1: traceX,
				y1: traceY,
				x2: traceX,
				y2: graphY,
				class: d.cssClass
			})
			.style("opacity", 0)
			.style("stroke-width", "0px");
			d.svgYTrace = d3.select("#scatterPlot").append("line").attr({
				x1: traceX,
				y1: traceY,
				x2: graphX,
				y2: traceY,
				class: d.cssClass,
			})
			.style("opacity", 0)
			.style("stroke-width", "0px");

			
			d3.select(pointKey).moveToFront();
			d3.select(pointKey).transition()
				.attr("r", 15)
				.attr("class", function(d){return d.cssClass + " mOver"});
			//highlight the nodes
			d3.select(barKey).moveToFront();
			d3.select(barKey).transition()
				.attr("class", function(d){return d.cssClass + " mOverBar"});
			d.svgXTrace.transition().style("opacity",1).style("stroke-width", "3px");
			d.svgYTrace.transition().style("opacity",1).style("stroke-width", "3px");

			//fill in the information bar at the side
			var sideBarTop = d3.select("#sideBar1").attr("class", d.cssClass +"Box sideBox");
			document.getElementById("sideBar1").innerHTML = "<h2>" + d.title + "</h2><h3>Years in Office</h3><h3>" + d.party + "</h3><br/>Total Debates:" + d.data.debateIDs.length + "</h3>";
			document.getElementById("category").innerHTML = "<h3>Vote:<br/>Speech:</h3>"; 
			document.getElementById("value").innerHTML = "<h3>" + d.xVal.toFixed(2) + "<br/>" + d.yVal.toFixed(2) + "</h3>";
			document.getElementById("percent").innerHTML = "<h3>" + Math.floor(100*d.data.votePercent) + "<br/>" + Math.floor(100*d.data.speechPercent) + "</h3>";
		}
		//	+"<h2>Personal information</h2><h2>Wikipedia Link</h2><p>???Vote History???</p><p>???Speech History???</p>";
	}
	return elementMouseOver;
}

//Closure handling mouse out that reverts effects of the mouse-over closure
function elementMouseOutClosure(){
	var elementMouseOut = function(d, i){
		if(d.data.datum.state == global.activeStateFilter || global.activeStateFilter == "None"){
			var rad;
			if(global.minified)
				rad = 3;
			else
				rad = 8;

			var pointKey = "#" + d.name + "Point";
			var barKey = "#" + d.name + "Bar";
			d3.select(pointKey).transition()
				.attr("r", rad)
				.attr("class", function(d){return d.cssClass});
			d3.select(barKey).transition()
				.attr("class", function(d){return d.cssClass});
			d.svgXTrace.transition().style("opacity",0);
			d.svgYTrace.transition().style("opacity",0);
			d.svgXTrace.remove();
			d.svgYTrace.remove();
		}	
	}
	return elementMouseOut;
}

//clicks will change the granularity to the senator level, add a small box to the side bar with senator information, and scrunch the top
function elementMouseClickClosure(setViewLevel){

	var elementMouseClick = function(d, i){
		global.currentSenator = d.data;
		setViewLevel("senator");	
		document.getElementById("senatorViewBox").innerHTML = "<h2>" + d.title + "</h2><h3>Years in Office<br/>" + d.party + "<br/>Total Debates:" + d.data.debateIDs.length + "</h3>";
		document.getElementById("sideBar1").innerHTML = "";
		document.getElementById("category").innerHTML = "";
		document.getElementById("value").innerHTML = "";
		document.getElementById("percent").innerHTML = "";


	}
	return elementMouseClick;

}
