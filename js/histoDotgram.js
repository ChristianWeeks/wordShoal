'use strict';
//The graph object draws the graph and interpolates its axis boundaries based on the data it is fed
function histoDotgram(argv) {
	histoDotgram.superClass.constructor.call(this, argv);
	this.baseCSSClass = 'barBar';
	this.filterableSvgs = ['dots'];
	this.yMax = argv.yMax || 3.0;
	this.yMin = argv.yMin || 0;
	this.bins = argv.bins || 24;
	this.xTickFontSize = 10;
}
extend(histoDotgram, graphObject);

//changes the value that is currently displayed (total tasks, seconds / task, delay / task, etc.) by modifying
//the data object that will ALWAYS be graphed
histoDotgram.prototype.setYAttr = function() {
	console.log(this);
	this.destroyAll();

	this.firstTimeData = null;
	this.xMax = 3.0;
	this.xMin = -3.0;

	var lineY = this.height / 2;
	var lineTickData = new Array(5);
	for(var w = 0; w < 5; w++)
		lineTickData[w] = {y1: lineY-5-5*((w+1)%2), y2: lineY+5+5*((w+1)%2), x: w*this.width/4};
	lineTickData[0].x += 1;
	lineTickData[4].x -= 1;

	//initialize our histoDotgram bins to 0
	this.debateLineData = new Array();
	this.histogramBins = new Array(100);
	var fColor, sColor;
	for( var z= 0; z < 100; z++){
		this.histogramBins[z] = 0;
	}
	for(var j = 0; j < this.data.length; j++){
		var cssClass;
		var currSenator = this.data[j];
		if(currSenator.datum.party == 'R'){
			cssClass='c_rep';	
			fColor = '#F66';
			sColor = '#F22';
		}	
		else if(currSenator.datum.party == 'D'){
			cssClass='c_dem';	
			fColor = '#66F';
			sColor = '#22F';
		}
		else{
			cssClass='c_ind';	
			fColor = '#CAC';
			sColor = '#C6C';
		}
		var x = currSenator.datum.s;	
		//convert the value from [-2.0, 2.0] to [0.0, canvasWidth]
		var xPercent = Math.floor((x + this.xMax)*100.0/(this.xMax*2.0));
		x = (x + this.xMax)*this.width/(this.xMax*2.0);
		
		var histIndex = (Math.floor(xPercent / 2.0));

		var tickLength = 12;
		var xStr = String(x*2) + '%';

		var yPad = 0;
		if(histIndex%2)
			yPad = 4;
		
		this.debateLineData[j] = {
			data: currSenator,
			cssClass: cssClass,
			x: this.mapXValToGraph(currSenator.speechScore),
			width: 5,
			//alternate between putting points above and below the line
			y: (lineY) + (Math.pow(-1, this.histogramBins[histIndex]%2)) * (tickLength+(tickLength)*(Math.floor(this.histogramBins[histIndex]/2))),
			height: tickLength,
			strokeW: 0,
			r: 3.5,
			strokeC: sColor,
			fill: fColor,
		};	
		this.histogramBins[histIndex]++;
	}
	
	this.yMax = 15;
	this.yMin = -15;

	this.setAxes();

	this.draw();

};

histoDotgram.prototype.draw = function() {
	this.mouseOver = elementMouseOverClosure(this.x, this.y);
	this.mouseOut = elementMouseOutClosure();
	var xLabelPadding = 30;
	var axisLabelData = [{
		text: 'Liberal',
		x: this.x,
		y: this.y/2 + xLabelPadding,
		cssClass: 'demText',
		align: 'start'},
		{
		text: 'Conservative',
		x: this.x + this.width,
		y: this.y/2 + xLabelPadding,
		cssClass: 'repText',
		align: 'end'}
	];
	//this.drawBackgroundGradient();
	this.drawTextLabel(axisLabelData);
	this.drawMainLine()
	this.drawDotgram();
};

//------------------------------------------------------------------------------------------------------
//DRAW METHODS - Everything below handles the brunt of the D3 code and draws everything to the canvas
//------------------------------------------------------------------------------------------------------
histoDotgram.prototype.drawDotgram = function(){

	this.svgElements['dots'] = this.canvasPtr.selectAll('ticks')
		.data(this.debateLineData)
		.enter()
		.append('circle')
		//.attr('shape-rendering', 'geometricPrecision')
		.style('stroke-width', function(d){
			d.data.svgDotgram = this;
			return d.strokeW;})
		.style('stroke', function(d){return d.strokeC;})
		.style('fill', function(d){return d.fill;})
		.style('opacity', 1.0)
		.attr('cx', function(d){return d.x;})
		.attr('cy', function(d){return d.y;})
		.attr('r', function(d){return d.r;})
		.on('mouseover', this.mouseOver)
		.on('mouseout', this.mouseOut)
		.on('click', this.mouseClick);	
}

histoDotgram.prototype.drawMainLine = function() {
	var lineY = this.height / 2;
	var lineTickData = new Array(5);
	for(var w = 0; w < 5; w++)
		lineTickData[w] = {
			y1: lineY-5-5*((w+1)%2),
		    y2: lineY+5+5*((w+1)%2),
			x: w*this.width/4 + this.leftPadding};
	lineTickData[0].x += 1;
	lineTickData[4].x -= 1;
	this.canvasPtr.append('line')
		.attr('id', 'debateLine')
		.attr('stroke-width', 1)
		.attr('stroke', '#444')
		.attr('x1', this.leftPadding)
		.attr('x2', this.leftPadding + this.width)
		.attr('y1', lineY)
		.attr('y2', lineY);
	this.canvasPtr.selectAll('axisTicks').data(lineTickData).enter().append('line')
		.attr('stroke-width', 1)
		.attr('stroke', '#444')
		.attr('x1', function(d){return d.x})
		.attr('x2', function(d){return d.x})
		.attr('y1', function(d){return d.y1})
		.attr('y2', function(d){return d.y2});
}
