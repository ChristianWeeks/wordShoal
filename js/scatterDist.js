'use strict';
//The graph object draws the graph and interpolates its axis boundaries based on the data it is fed
function scatterDist(argv) {
	scatterDist.superClass.constructor.call(this, argv);
	this.mainSvg = this.canvasPtr;
	this.miniCanvasPtr = null;
	this.baseCSSClass = 'scatterPoint';
	this.fadeCSSClass = 'fadeOut';
	this.filterableSvgs = ['confidenceLines', 'points'];
	this.xMax = argv.xMax || 3;
	this.xMin = argv.xMin || -3;
	this.yMax = argv.yMax || 3;
	this.yMin = argv.yMin || -3;
	this.minified = false;
	this.minifiedSize = argv.minifiedSize || 200;
	this.pointRadius = argv.pointRadius || 2;
	this.svgPoints = [];
}
extend(scatterDist, graphObject);

//changes the value that is currently displayed (total tasks, seconds / task, delay / task, etc.) by modifying
//the data object that will ALWAYS be graphed
scatterDist.prototype.setYAttr = function() {
	this.setAxes();
	this.firstTimeData = null;
	//sort the data by speech score
	var sortFunc = function(a, b){
		return a.speechScore > b.speechScore ? 1 : a.speechScore < b.speechScore ? -1 : 0;
	}
	this.data.sort(sortFunc);
	this.elementPadding = this.height / this.data.length;
	for (var i in this.data) {
		var nameSubStr = this.data[i].name.substring(0, this.data[i].name.length - 5);
		this.data[i].nameSubStr = nameSubStr
		this.data[i].scatterNdx = i;
		this.currentlyViewedData[i] = {
			'data': this.data[i],
			'id': nameSubStr + i + 'Point',
			'title': this.data[i].name,
			'party': this.data[i].id,
			'xVal': this.data[i].speechScore,
			'yVal': this.data[i].y,
			'y': this.y - this.elementPadding*i - 5,
			'x': this.mapXValToGraph(this.data[i].speechScore),
            'lowerBound': this.data[i].datum.lowerBound,
            'lowerBoundX': this.mapXValToGraph(this.data[i].datum.lowerBound),
            'upperBound': this.data[i].datum.upperBound,
            'upperBoundX': this.mapXValToGraph(this.data[i].datum.upperBound),
			'cssClass': this.baseCSSClass + ' ' + this.data[i].cssClass,
			'strokeWidth': this.strokeWidth || 1,
			'r': this.radius || 2,
			'fill': this.data[i].fillC,
			'stroke': this.data[i].strokeC,
			'svgLabel': null
		};
	}
	this.draw();
};

scatterDist.prototype.draw = function() {
	var xLabelPadding = 25;
	var axisLabelData = [{
		text: 'Liberal',
		x: this.x,
		y: this.y + xLabelPadding,
		cssClass: 'demText',
		align: 'start'},
		{
		text: 'Conservative',
		x: this.x + this.width,
		y: this.y + xLabelPadding,
		cssClass: 'repText',
		align: 'end'}
	];
	//this.drawBackgroundGradient();
	this.drawTextLabel(axisLabelData);
	this.drawVerticalGridLines();
	this.drawBoxes();
    this.drawConfidenceLines();
	this.drawPoints();
	this.drawXAxis();
};

//------------------------------------------------------------------------------------------------------
//DRAW METHODS - Everything below handles the brunt of the D3 code and draws everything to the canvas
//------------------------------------------------------------------------------------------------------

//Creates the points
scatterDist.prototype.drawPoints = function() {
	var rad = this.pointRadius;

	 this.svgElements['points'] = this.canvasPtr.selectAll('Points')
		.data(this.currentlyViewedData)
		.enter()
		.append('circle')
		.attr('class', function(d) {return d.cssClass;})
		.attr('id', function(d) { return d.id;})
		.attr({
			cx: function(d) {
				if(!d.data.svgPoint)
					d.data.svgPoint = this;
				return d.x;},
			cy: function(d) {return d.y;},
			r:  function(d) {return d.r;}//function(d) {return d.r;},
		});
};

scatterDist.prototype.drawBoxes = function(){
	var boxHeight = this.elementPadding;
	var xStart = this.x;
	this.svgElements['pointBox'] = this.canvasPtr.selectAll("pointBox")
		.data(this.currentlyViewedData)
		.enter()
		.append("rect")
		.style('fill', '#F5F5F5')
		.style('stroke', '#CCC')
		.style('stroke-width', 1)
		.style('opacity', 0)
		.style('cursor', 'pointer')
		.attr({
			x: xStart,
			y: function(d){
				if(!d.data.svgPointBox)
					d.data.svgPointBox = this;
				return d.y - boxHeight / 2;},
			width: this.width,
			height: boxHeight});

}

scatterDist.prototype.drawConfidenceLines = function(){
    this.svgElements['confidenceLines'] = this.canvasPtr.selectAll('confidence')
        .data(this.currentlyViewedData)
        .enter()
        .append('line')
		.style('stroke', function(d){return d.stroke;}) 
		.style('stroke-width', function(d){return d.strokeWidth;})
		.style('cursor', 'pointer')
		.attr({
			x1: function(d) {
				if(!d.data.svgConfidenceLine)
					d.data.svgConfidenceLine = this;
				return d.lowerBoundX;},
            x2: function(d) {return d.upperBoundX;},
			y1: function(d) {return d.y;},
			y2: function(d) {return d.y;}
		});
}

scatterDist.prototype.drawAxesLegends = function() {
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

scatterDist.prototype.drawCenterLine = function() {
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
