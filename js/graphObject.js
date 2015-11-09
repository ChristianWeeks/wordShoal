'use strict';
//The graph object draws the graph and interpolates its axis boundaries based on the data it is fed

var graphObject = function(argv) {

    //graph formatting values
    this.canvasWidth    = argv.canvasWidth || 600;
    this.canvasHeight   = argv.canvasHeight || 600;
    this.topPadding = argv.topPadding || 0;
    this.botPadding = argv.botPadding || 0;
    this.leftPadding    = argv.leftPadding || 80;
    this.rightPadding   = argv.rightPadding || 50;
    this.width  = argv.width || this.canvasWidth - (this.leftPadding + this.rightPadding);
    this.height = argv.height || this.canvasHeight - (this.topPadding + this.botPadding);
    this.x  = argv.x || this.leftPadding;
    this.y  = argv.y || (this.canvasHeight - this.botPadding);

    this.title  = argv.title || 'Main Title';
    this.titleY = argv.titleY || 'Y Axis Title';
    this.titleX = argv.titleX || 'X Axis Title';
    this.titleFontSize = argv.titleFontSize || 25;
    this.xtickFontSize = argv.tickFontSize || 15;

    //yLen is the number of tick-mark steps on the y axis, including 0
    this.yLen   = 7;
    this.xLen   = 5;
    this.yMax   = 1;
    this.yMin   = 0;
    this.xMax   = 1;
    this.xMin   = 0;

    this.currentlyViewedData = null;
    this.canvasPtr  = null;

    this.x_step;
    this.y_step;

    this.minified = false;
    this.yAttr = false;

    //pointer to all data that is currently being graphed
    this.data = null;

    //this object contains all the SVG objects on the canvas
    this.svgElements = {};
};

graphObject.prototype.initCanvas = function(divID, canvasID) {
    if (this.canvasPtr == null) {
        this.canvasPtr = d3.select('#' + divID).append('svg');
    }
    this.canvasPtr.style('height', this.canvasHeight)
        .style('width', '100%')
        .style('height', '100%')
        //.style('background', '#FFDDDD')
        .style('border-style', 'solid')
        .style('border-width', 1)
        .style('border-radius', '5px')
        .style('border-color', '#CCC')
        .attr('id', canvasID)
        .attr('viewBox', '0 0 ' + this.canvasWidth + ' ' + this.canvasHeight)
        .attr('preserveAspectRatio', 'xMidYMid');

};

//maps from canvas space to graph space
graphObject.prototype.mapYValToGraph = function(yVal) {
    yVal -= this.yMin;
    return this.y - (yVal * (this.height - this.topPadding) / (this.yMax - this.yMin));
};
graphObject.prototype.mapXValToGraph = function(xVal) {
    xVal -= this.xMin;
    return this.x + (xVal * (this.width) / (this.xMax - this.xMin));
};

//sets the y axis
graphObject.prototype.setAxes = function() {

    this.yAxisData = [this.yLen];
    this.y_val_step = (this.yMax - this.yMin) / (this.yLen - 1);
    for (var i = 0; i < this.yLen; i++) {
        this.yAxisData[i] = {
            'value': ((i * this.y_val_step + this.yMin).toFixed(2)),
            'loc': this.mapYValToGraph(i * this.y_val_step + this.yMin)};
    }
    this.xAxisData = [this.xLen];
    this.x_val_step = (this.xMax - this.xMin) / (this.xLen - 1);
    for (var i = 0; i < this.xLen; i++) {
        this.xAxisData[i] = {
            'value': ((i * this.x_val_step + this.xMin).toFixed(2)),
            'x': this.mapXValToGraph(i * this.x_val_step + this.xMin), 'y': this.y};
    }
    return this;
};

//assigns the data that will be currently displayed
graphObject.prototype.setData = function(dataObject) {
    //removing previous svg elements
    this.destroyAll();

    this.data = dataObject;
    //allocating space for the new x-axis values
    this.currentlyViewedData = new Array(this.xLen);
    if (this.yAttr == false) {
        this.yAttr = 'speechPos';
    }
    this.setYAttr();
};

//Removes all svg elements from the graph
graphObject.prototype.destroyAll = function() {
    for (var key in this.svgElements)
        this.destroyElement(this.svgElements[key]);

};
//Destroys an element
graphObject.prototype.destroyElement = function(svgElement) {
    if (svgElement != null) svgElement.remove();
};

//------------------------------------------------------------------------------------------------------
//DRAW METHODS - Everything below handles the brunt of the D3 code and draws everything to the canvas
//------------------------------------------------------------------------------------------------------

//Creates the labels for the axes and the main title
graphObject.prototype.drawTitle = function() {
    this.svgElements['title'] = this.canvasPtr.append('text')
        .attr('class', 'axisTitle')
        .style('font-size', this.titleFontSize)
        .attr('text-anchor', 'middle')
        .attr({
            x: this.x + this.width / 2,
            y: this.y - this.height
        })
        .text(this.title ? this.title : (this.titleY + ' by ' + this.titleX));
};

//label for the y axis
graphObject.prototype.drawYAxisLabel = function() {
    this.svgElements['yAxisLabel'] = this.canvasPtr.append('text')
        .attr('class', 'axisTitle')
        .attr('text-anchor', 'middle')
        .attr({
            x: this.x / 2,
            y: this.y - this.height / 2
        })
        .attr('transform', 'rotate(-90 ' + (this.x / 3) + ', ' + (this.y - this.height / 2) + ')')
        .text(this.titleY);
};

//label for the x axis
graphObject.prototype.drawXAxisLabel = function() {
    this.svgElements['xAxisLabel'] = this.canvasPtr.append('text')
        .attr('class', 'axisTitle')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'baseline')
        .attr({
            x: this.x + this.width / 2,
            y: this.canvasHeight - 5
        })
        .text(this.titleX);
};

//creates the black lines that make the x and y axes
graphObject.prototype.drawXAxis = function() {
     this.svgElements['x_axis'] = this.canvasPtr.append('line')
        .attr({
            x1: this.x,
            y1: this.y,
            x2: this.x + this.width,
            y2: this.y,
            stroke: '#000'
        });
    //Creates the tick marks for the x-axis based on the total number of x values.  Does not create vertical grid lines.
    //Drawing the tick marks and labels for the x axis
     this.svgElements['xTickMarks'] = this.canvasPtr.selectAll('xTickMarksBar')
        .data(this.xAxisData)
        .enter()
        .append('line')
        .attr({
            x1: function(d, i) { return d.x},
            y1: this.y,
            x2: function(d, i) { return d.x},
            y2: this.y + 10,
            stroke: '#000'
        });
}
graphObject.prototype.drawXAxisLabels = function(){
     this.svgElements['xTickLabels'] = this.canvasPtr.selectAll('xDataLabel')
        .data(this.xAxisData)
        .enter()
        .append('text')
        .attr('id', 'xDataLabel')
        .attr('text-anchor', 'end')
        .style('font-size', this.xTickFontSize)
        .style('opacity', 1)
        .attr('transform', function(d) {
            d.svgLabel = this;
            return 'rotate(-45 ' + d.x + ',' + d.y + ')'})
        .style('fill', 'black')
        .attr({
            x: function(d) { return d.x - 10},
            y: this.y + 20
        })
        .text(function(d) { return d.value});
};

graphObject.prototype.drawBackgroundGradient = function(){

    this.svgElements['bgGradient'] = this.canvasPtr.append("linearGradient")
        .attr("id", "bgGradient")
        .attr("gradientUnits", "objectBoundingBox")
        .selectAll("stop")
        .data([
            {offset: "0%", color: "#ddddff"},
            {offset: "50%", color: "#ffffff"},
            {offset: "100%", color: "#ffdddd"}
            ])
        .enter().append("stop")
        .attr("offset", function(d) { return d.offset; })
        .attr("stop-color", function(d) { return d.color; });

    this.svgElements['bg'] = this.canvasPtr.append("rect")
        .attr({
            x: 0,
            width: this.x + this.width + this.rightPadding,
            y: 0,
            height: this.y
        })
        .style("fill", "url(#bgGradient)");
}

graphObject.prototype.drawTextLabel = function(axisLabelData){
    this.svgElements['axesLegends'] = this.canvasPtr.selectAll('axesLegend')
        .data(axisLabelData)
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr({
            class: function(d) {return d.cssClass;},
            x: function(d) {return d.x;},
            y: function(d) {return d.y;},
            id: 'axesLegend',
            "text-anchor": function(d) {return d.align;}})
        .text(function(d) {return d.text});
}
graphObject.prototype.drawVerticalGridLines = function(){
     this.svgElements['yTickMarks'] = this.canvasPtr.selectAll('yTickMarks')
        .data(this.xAxisData)
        .enter()
        .append('line')
        .attr({
            x1: function(d, i) { return d.x},
            y1: 0,
            x2: function(d, i) { return d.x},
            y2: this.y,
            stroke: function(d,i){
				if(i != 0 && i != 4)
					return'#BBB'
				return "#FFF";}
        });
}
graphObject.prototype.drawYAxis = function() {
    //drawing the tick marks, labels, and grid lines for the Y axis
     this.svgElements['yTickMarks'] = this.canvasPtr.selectAll('yTickMarks')
        .data(this.yAxisData)
        .enter()
        .append('line')
        .attr({
            y1: function(d, i) { return d.loc},
            x1: this.x,
            y2: function(d, i) { return d.loc},
            x2: this.x - 10,
            stroke: '#000'
        });
     this.svgElements['yGridLines'] = this.canvasPtr.selectAll('yGridLines')
        .data(this.yAxisData)
        .enter()
        .append('line')
        .attr({
            y1: function(d, i) { return d.loc},
            x1: this.x,
            y2: function(d, i) { return d.loc},
            x2: this.x + this.width,
            stroke: '#DDD'
        });
     this.svgElements['yTickLabels'] = this.canvasPtr.selectAll('yTickLabels')
        .data(this.yAxisData)
        .enter()
        .append('text')
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle')
        .style('fill', 'black')
        .attr({
            x: this.x - 12,
            y: function(d) { return d.loc}
        })
        .text(function(d) { return d.value;});
     this.svgElements['y_axis'] = this.canvasPtr.append('line')
        .attr({
            x1: this.x,
            y1: this.y,
            x2: this.x,
            y2: this.y - this.height,
            stroke: '#000'
        });
};


//Couples the mousevents for the scatterplot and the bargraph, so they can effect eachother
graphObject.prototype.coupleMouseEvents = function(elementStr, setViewLevelFunc) {

    this.mouseOver = elementMouseOverClosure();
    this.mouseOut = elementMouseOutClosure();
    this.mouseClick = elementMouseClickClosure(setViewLevelFunc);

    this.svgElements[elementStr]
        .on('mouseover', this.mouseOver)
        .on('mouseout', this.mouseOut)
        .on('click', this.mouseClick);
};

//updates the filter so only the filtered data elements show up
graphObject.prototype.updateFilter = function(filterStr) {
    //each graph has an array of indices that denote which svg elements should fade out when the filter
    //is changed
    for(var i = 0; i < this.filterableSvgs.length; i++){
        this.svgElements[this.filterableSvgs[i]].transition()
            .style('opacity', function(d) {
                if (d.data.datum.state == global.activeStateFilter || global.activeStateFilter == 'None') {
                    d3.select(this).moveToFront();
                    return 1;
                }
                else {
                    return 0.2;
                }
            });
    }
};


