'use strict';
//The graph object draws the graph and interpolates its axis boundaries based on the data it is fed
function scatterPlot(argv) {
	scatterPlot.superClass.constructor.call(this, argv);
	this.mainSvg = this.canvasPtr;
	this.miniCanvasPtr = null;
	this.baseCSSClass = 'scatterPoint';
	this.fadeCSSClass = 'fadeOut';
	this.datumSvgs = 'points';
	this.xMax = argv.xMax || 3;
	this.xMin = argv.xMin || -3;
	this.yMax = argv.yMax || 3;
	this.yMin = argv.yMin || -3;
	this.minified = false;
	this.minifiedSize = argv.minifiedSize || 200;
	this.pointRadius = argv.pointRadius || 6;
	this.svgPoints = [];
}
extend(scatterPlot, graphObject);

//changes the value that is currently displayed (total tasks, seconds / task, delay / task, etc.) by modifying
//the data object that will ALWAYS be graphed
scatterPlot.prototype.setYAttr = function() {
	this.setAxes();
	this.firstTimeData = null;
	for (var i in this.data) {
		var cssClass;
		if (this.data[i].id == 'R')
			cssClass = 'c_rep';
		else if (this.data[i].id == 'D')
			cssClass = 'c_dem';
		else
			cssClass = 'c_ind';

		var nameSubStr = this.data[i].name.substring(0, this.data[i].name.length - 5);
		this.data[i].nameSubStr = nameSubStr
		this.data[i].scatterNdx = i;
		this.data[i].cssClass = cssClass;
		this.currentlyViewedData[i] = {
			'data': this.data[i],
			'id': nameSubStr + i + 'Point',
			'title': this.data[i].name,
			'party': this.data[i].id,
			'xVal': this.data[i].x,
			'yVal': this.data[i].y,
			'y': this.mapYValToGraph(this.data[i].y),
			'x': this.mapXValToGraph(this.data[i].x),
			'cssClass': this.baseCSSClass + ' ' + cssClass,
			'svgLabel': null
		};
	}
	if (this.minified)
		this.drawMinified();
	else
		this.draw();
};

scatterPlot.prototype.minify = function(minifiedSize) {
	if(!this.minified){
		this.minified = true;
		this.xLen = 3;
		this.yLen = 3;
		this.minifiedSize = minifiedSize;


		//create the new mini plot
		if (!this.miniCanvasPtr) {
		   this.miniCanvasPtr	= d3.select('#scatterMiniCanvas').append('svg')
				.attr('id', 'scatterMiniSvg');
		}
		this.miniCanvasPtr
			.style('height', this.minifiedSize)
			.style('width', this.minifiedSize)
			.attr('viewBox', '0 0 ' + (this.minifiedSize + 50) + ' ' + (this.minifiedSize + 45))
			.attr('preserveAspectRatio', 'xMidYMid');

		this.mainSvg = this.canvasPtr;
		this.canvasPtr	= this.miniCanvasPtr;
		this.pointRadius	= 3;
		this.height	= this.minifiedSize;
		this.width	= this.minifiedSize;
		this.y	= this.minifiedSize;
		this.x	= 40;
		//Destroy the large graph
		this.destroyAll();
		this.mainSvg.style('height', 0);

		this.mapXValToGraph(this.xMin);

		this.setYAttr();
	}

};

scatterPlot.prototype.drawMinified = function() {

	this.drawCenterLine();
	this.drawPoints();

	this.drawYAxis();
	this.drawXAxis();

};

scatterPlot.prototype.draw = function() {

	//	this.mouseOver = elementMouseOverClosure(this.x, this.y);
	//	this.mouseOut = elementMouseOutClosure();
	this.drawCenterLine();
	this.drawPoints();

	this.drawYAxisLabel();
	this.drawXAxisLabel();
	this.drawAxesLegends();
	this.drawYAxis();
	this.drawXAxis();
	this.drawTitle();
};


//------------------------------------------------------------------------------------------------------
//DRAW METHODS - Everything below handles the brunt of the D3 code and draws everything to the canvas
//------------------------------------------------------------------------------------------------------

//Creates the points
scatterPlot.prototype.drawPoints = function() {
	var rad = this.pointRadius;
	 this.svgElements['points'] = this.canvasPtr.selectAll('Points')
		.data(this.currentlyViewedData)
		.enter()
		.append('circle')
		.attr('class', function(d) {return d.cssClass;})
		.attr('shape-rendering', 'geometricPrecision')
		.attr('id', function(d) { return d.id;})
	//	.style("stroke-width", "2px")

	//	.style("fill", function(d) {return d.color})
	//	.style("stroke", function(d) {return d.color})
	//	.style("stroke-width", 0)
		.attr({
			cx: function(d) {
			   	d.svgPoint = this;
				return d.x;},
			cy: function(d) {return d.y;},
			r: rad//function(d) {return d.r;},
		});
	//	.on("mouseover", this.mouseOver)
	//	.on("mouseout", this.mouseOut);
};


scatterPlot.prototype.drawAxesLegends = function() {
	var xLabelPadding = 55;
	var yLabelPadding = 55;
	var textData = [
		{
		text: 'Liberal',
		x: this.x - yLabelPadding,
		y: this.y - this.height / 8,
		cssClass: 'demText',
		align: 'vertical'},
		{
		text: 'Conservative',
		x: this.x - yLabelPadding,
		y: this.y - this.height * 7 / 8,
		cssClass: 'repText',
		align: 'vertical'},
		{
		text: 'Liberal',
		x: this.x + this.width / 8,
		y: this.y + xLabelPadding,
		cssClass: 'demText',
		align: 'horizontal'},
		{
		text: 'Conservative',
		x: this.x + this.width * 7 / 8 ,
		y: this.y + xLabelPadding,
		cssClass: 'repText',
		align: 'horizontal'}
	];

	this.svgElements['axesLegends'] = this.canvasPtr.selectAll('axesLegend')
		.data(textData)
		.enter()
		.append('text')
		.attr('text-anchor', 'middle')
		.attr('alignment-baseline', 'middle')
		.attr({
			class: function(d) {return d.cssClass;},
			x: function(d) {return d.x;},
			y: function(d) {return d.y;},
			transform: function(d) {
				if (d.align == 'vertical')
					return 'rotate(-90 ' + d.x + ' ' + d.y + ')';
				return 'rotate(0 0 0)';
			},
			id: 'axesLegend'})
		.text(function(d) {return d.text});

	return this;
};

scatterPlot.prototype.drawCenterLine = function() {
	this.svgElements['centerLine'] = this.canvasPtr
		.append('line')
		.attr('x1', this.mapXValToGraph(this.xMin))
		.attr('y1', this.mapYValToGraph(this.yMin))
		.attr('x2', this.mapXValToGraph(this.xMax))
		.attr('y2', this.mapYValToGraph(this.yMax))
		.attr('stroke', '#000')
		.style('stroke-width', '3px')
		.style('opacity', 0.6);

};
