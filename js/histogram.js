'use strict';
//The graph object draws the graph and interpolates its axis boundaries based on the data it is fed
function histogram(argv) {
	histogram.superClass.constructor.call(this, argv);
	this.baseCSSClass = 'barBar';
	this.datumSvgs = 'bars';
	this.yMax = argv.yMax || 3.0;
	this.yMin = argv.yMin || 0;
	this.bins = argv.bins || 24;
	this.xTickFontSize = 10;
}
extend(histogram, graphObject);

//changes the value that is currently displayed (total tasks, seconds / task, delay / task, etc.) by modifying
//the data object that will ALWAYS be graphed
histogram.prototype.setYAttr = function() {
	this.destroyAll();
	//add 1 to the length so that the final value isn't on the very edge of the graph

	this.firstTimeData = null;
	this.xLen = this.bins + 1;
	this.xMax = 3.0;
	this.xMin = -3.0;
	this.x_step = this.width / this.xLen;
	this.barWidth = (this.x_step / 2) - 2;

	this.histogram_r = d3.layout.histogram()
		.range([-3.0, 3.0])
		.bins(this.bins)
		.value(function(d){
			if(d.id ==  'R'){
				return d.x;
			}
		})(this.data);

	this.histogram_d = d3.layout.histogram()
		.range([-3.0, 3.0])
		.bins(this.bins)
		.value(function(d){
			if(d.id ==  'D'){
				return d.x;
			}
		})(this.data);
	
	this.yMax = 0;
	for(var k = 0; k < this.histogram_r.length; k++){
		if(this.yMax < this.histogram_r[k].length){
			this.yMax = this.histogram_r[k].length
		}
	}
	for(var k = 0; k < this.histogram_d.length; k++){
		if(this.yMax < this.histogram_d[k].length){
			this.yMax = this.histogram_d[k].length
		}
	}

	this.setAxes();

	var count = 0;
	for (var i in this.histogram_r) {
		var nameSubStr = this.data[i].name.substring(0, this.data[i].name.length - 5);
		this.currentlyViewedData[i] = {
			'data': this.data[i],
			'id': nameSubStr + 'Bar',
			'title': this.data[i].name,
			'party': this.data[i].id,
			'name': nameSubStr,
			'xVal': i,
			'yVal': this.histogram_r[i].length,
			'width': this.barWidth,
			'yTop': this.mapYValToGraph(this.histogram_r[i].length),
			'yBot': this.mapYValToGraph(0),
			'x': this.mapXValToGraph(this.histogram_r[i].x) - (this.barWidth/2),
			'cssClass': this.baseCSSClass + ' ' + 'c_repBar',
			'svgBar': null
		};
		count++;
	}
	for (var i in this.histogram_d) {
		var nameSubStr = this.data[i].name.substring(0, this.data[i].name.length - 5);
		this.currentlyViewedData[count] = {
			'data': this.data[i],
			'id': nameSubStr + 'Bar',
			'title': this.data[i].name,
			'party': this.data[i].id,
			'name': nameSubStr,
			'xVal': i,
			'yVal': this.histogram_d[i].length,
			'width': this.barWidth,
			'yTop': this.mapYValToGraph(this.histogram_d[i].length),
			'yBot': this.mapYValToGraph(0),
			'x': this.mapXValToGraph(this.histogram_d[i].x) + (this.barWidth/2),
			'cssClass': this.baseCSSClass + ' ' + 'c_demBar',
			'svgBar': null
		};
		count++;
	}
	this.draw();

};

histogram.prototype.draw = function() {
	this.mouseOver = elementMouseOverClosure(this.x, this.y);
	this.mouseOut = elementMouseOutClosure();
	this.drawBars();

	this.drawYAxisLabel();
	this.drawYAxis();

	//Label the x axis for senators, but no need to draw the actual axis, as it isn't a measurement
	this.drawXAxisLabel();
	this.drawXAxis();
	this.drawTitle();
};

//------------------------------------------------------------------------------------------------------
//DRAW METHODS - Everything below handles the brunt of the D3 code and draws everything to the canvas
//------------------------------------------------------------------------------------------------------
//Creates the the bars in the bar graph view
histogram.prototype.drawBars = function() {
	 this.svgElements['bars'] = this.canvasPtr.selectAll('Bars')
		.data(this.currentlyViewedData)
		.enter()
		.append('rect')
		.attr('id', function(d) {return d.id})
		.attr('class', function(d) {return d.cssClass})
		.attr({
			x: function(d) {
				d.svgBar = this;
				return d.x - (d.width / 2);},
			y: function(d) {return d.yTop;},
			height: function(d) { return d.yBot - d.yTop},
			width: function(d) {return d.width}
		});
};
