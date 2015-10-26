'use strict'

var debateTable = function(argv) {
	this._debateDataPtr = argv.debateData;
	this._senatorDataPtr = argv.senatorData;
	this._senatorMapPtr = argv.senatorMap;
	this._debateMapPtr = argv.debateMap;

	this.mouseOver = argv.mouseOver;
	this.mouseOut = argv.mouseOut;
	this.mouseClick = argv.mouseClick;
	this.svgElements = {};
	this.svgElements.svgCanvases = new Array();
	this.svgElements.debateLineTicks = new Array();
}

debateTable.prototype.update = function(argv){
	this.mainSenator = argv.senator;
	this.debateNumCap = argv.debateNumCap || 10;
	this.drawnRows = 0;
	if(this.debateNumCap > this.mainSenator.debateIDs.length)
		this.debateNumCap = this.mainSenator.debateIDs.length;
}

//------------------------------------------------------------------------------------------------------------
//Increases the amount of table rows drawn by 10
//------------------------------------------------------------------------------------------------------------
debateTable.prototype.increaseTableSize = function(){
	var totalDebates = this.mainSenator.debateIDs.length;
	if(this.debateNumCap + 10 > totalDebates)
		this.debateNumCap = totalDebates;
	else
		this.debateNumCap += 10;

	//don't redraw columns
	var i = this.drawnRows;
	for(i; i < this.debateNumCap; i++){
		var row = this.debateToHtml(i);
		document.getElementById('tableBody').appendChild(row);
	}
	//populate new debate lines
	for(i = this.drawnRows; i < this.debateNumCap; i++){
		var currDebate = this._debateDataPtr[this.mainSenator.debateIDs[i]];
		var debateCanvas = "#debateCanvas" + i;
		this.populateDebateLine(currDebate, debateCanvas, i);
		this.drawnRows +=1;
	}
}

//------------------------------------------------------------------------------------------------------------
//Creates html for the table rows
//------------------------------------------------------------------------------------------------------------
debateTable.prototype.debateToHtml = function(i){
	var currDebate = this._debateDataPtr[this.mainSenator.debateIDs[i]];
	var row = document.createElement('tr');
	row.id = 'debateRow' + i;
	row.innerHTML = //"<td class='col-md-1 td'>" + i + '</td>' +
					"<td class='col-md-3 td smallpad titleFont'>" + currDebate.title + '</td>' +
					"<td class='col-md-1 td nopad dateFont '>" + currDebate.date + '</td>' +
					"<td class='col-md-1 td nopad dateFont'>" + currDebate.debateScore.toFixed(3) + '</td>' +
					"<td class='col-md-1 td nopad dateFontSize'>" + 
                    "<span style='color: #88F'>" + currDebate.dCount + "</span><br/>" + 
                    "<span style='color: #F88'>" + currDebate.rCount + "</span><br/>" +
                    "<span style='color: #C6C'>" + currDebate.iCount + "</span><br/>" +
                    "<span class='titleFont'>" + (currDebate.speakerIDs.length) + '</span></td>' +
					"<td class='col-md-7 td smallpad' id='debateCanvas" + i + "'></td>";
	return row;
}


//------------------------------------------------------------------------------------------------------------
//Creates the skeleton of our table 
//------------------------------------------------------------------------------------------------------------
debateTable.prototype.createDebateTable= function(){

	var i = 0;
	var htmlStr = '';
	//This is our table header 
	htmlStr +=
		"<div id='debateTable'><table class='table table-striped'><thead class='tableHeader nopad'>" +
		//"<div class='col-md-1' id='tableIDHead'><h3>ID</h3></div>" +
		"<th class='col-md-3'>" +
			"<div class='col-md-8 nopad headerPad'>Debate Title</div>" +
			"<div class='col-md-4 nopad' id='tableTitleSort'></div></th>" +
		"<th class='col-md-1 nopad' id='tableDateHead'>" +
			"<div class='col-md-8 headerPad nopad'>Date</div>" +
			"<div class='col-md-4 nopad' id='tableDateSort'></div></th>" +
		"<th class='col-md-1 nopad' id='tableDScoreHead'>" +
			"<div class='col-md-8 nopad' style='font-size: 15px'>Polar-<br/>ization</div>" +
			"<div class='col-md-4 nopad' id='tableDScoreSort'></div></th>" +
		"<th class='col-md-1 nopad' id='tableSpeakerHead'>" +
			"<div class='col-md-11 nopad headerPad'>Speakers</div>" +
			"<div class='col-md-1 nopad' id='tableSpeakerSort'></div></th>" +
		"<th class='col-md-6 nopad' id='tableScoresHead'>" + 
		"<div class='col-md-8 nopad headerPad' style='text-align: center'>Idealized Scores</div>" +
		"<div class='col-md-4 nopad' id='tableSpeechSort'></div>" +
		"</th></thead>" +
		"<tbody id='tableBody'>";

	htmlStr +="</tbody></table></div>";
	htmlStr += "<button id='paginateButton' class='pageButton simpleBorder' align='center'>Show More Results</button>";
	//debatesCanvas is in our main index.html file
	document.getElementById('debatesCanvas').innerHTML = htmlStr;
	//create the pagination button
	document.getElementById('paginateButton').onclick = this.incrementTableClosure();
	this.fillTable();
	//create the sorting buttons
	this.createSortButtons();
}

debateTable.prototype.fillTable = function(){
	var i = 0;
	//Populate the table with the debates this senator has participated in
	for (i = 0; i < this.debateNumCap; i++) {
		var row = this.debateToHtml(i);
		document.getElementById('tableBody').appendChild(row);
	}

	for(i = 0; i < this.debateNumCap; i++){
		var currDebate = this._debateDataPtr[this.mainSenator.debateIDs[i]];
		var debateCanvas = "#debateCanvas" + i;
		this.populateDebateLine(currDebate, debateCanvas, i);
		this.drawnRows +=1;
	}
}

debateTable.prototype.incrementTableClosure = function(){
	var parentClass = this;
	var buttonClosure = function(){
		parentClass.increaseTableSize();
	}
	return buttonClosure;
}
		

debateTable.prototype.populateDebateLine = function(debate, debateCanvas, i){

	var debateSvgHeight = 70;
	var debateSvgWidth = 500;
	var tickLength = 8;
	var sColor, fColor;
	d3.select(debateCanvas).append('svg')
		.attr('width', "100%")
		.attr('height', debateSvgHeight)
		.attr('id', 'debateSvg' + i)
		.style('border-style', 'solid')
		.style('border-color', 'white')
		.style('border-radius', '5px')
		.style('border-width', '1px')
		.attr('viewBox', '0 0 ' + debateSvgWidth + ' ' + debateSvgHeight)
		.attr('preserveAspectRatio', 'xMidYMid');
	//draw the main line
	var lineY = debateSvgHeight / 2;
	d3.select('#debateSvg' + i).append('line')
		.attr('id', 'debateLine' + i)
		.attr('stroke-width', 1)
		.attr('stroke', '#444')
		.attr('x1', 0)
		.attr('x2', '100%')
		.attr('y1', lineY)
		.attr('y2', lineY);
	var lineTickData = new Array(5);
	for(var w = 0; w < 5; w++)
		lineTickData[w] = {y1: lineY-5-5*((w+1)%2), y2: lineY+5+5*((w+1)%2), x: w*debateSvgWidth/4};
	lineTickData[0].x += 1;
	lineTickData[4].x -= 1;
	d3.select('#debateSvg' + i).selectAll('axisTicks').data(lineTickData).enter().append('line')
		.attr('stroke-width', 1)
		.attr('stroke', '#444')
		.attr('x1', function(d){return d.x})
		.attr('x2', function(d){return d.x})
		.attr('y1', function(d){return d.y1})
		.attr('y2', function(d){return d.y2});
	var labelData = [{text: 'Speech Score', x: debateSvgWidth / 2, y: debateSvgHeight - 4, xAlign: 'middle', yAlign: 'auto'}];


	d3.select('#debateSvg' + i).selectAll('labels').data(labelData).enter().append('text')
		.style('fill', '#777')
		.attr('x', function(d){return d.x})
		.attr('y', function(d){return d.y})
		.attr('text-anchor', function(d){return d.xAlign})
		.attr('alignment-baseline', 'baseline')
		.text(function(d){return d.text});



	var debateLineData = new Array();
	var histogramBins = new Array(100);
	for( var z= 0; z < 100; z++){
		histogramBins[z] = 0;
	}
	for (var j = 0; j < debate.speakerIDs.length; j++) {

		var currSenator = this._senatorMapPtr[debate.speakerIDs[j]];
		//determine party for the tick's color
		if(currSenator.datum.party == 'R'){
			fColor = '#F66';
			sColor = '#F22';
		}	
		else if(currSenator.datum.party == 'D'){
			fColor = '#66F';
			sColor = '#22F';
		}
		else{
			fColor = '#CAC';
			sColor = '#C6C';
		}
		//Access that debate's data and draw each senator's score on the number line
		var speakerIndex = -1;
		for(var k = 0; k < debate.speakerIDs.length; k++){
			if (debate.speakerIDs[k] == this.mainSenator.datum.speakerID){
				speakerIndex = k;
				break;
			}
		}
		var x = debate.speakerScores[j];
		//convert the value from [-3.0, 3.0] to [0.0, canvasWidth]
		var xPercent = Math.floor((x + 3.0)*100.0/6.0);
		x = (x + 3.0)*debateSvgWidth/6.0;
		
		var histIndex = (Math.floor(xPercent / 2.0));

		var tickMark;
		var xStr = String(x*2) + '%';
		var speakerLineLen = 0;
		var speakerLineW = 0;
		if(j == speakerIndex){
			speakerLineW = 2;
			//draw a line to highlight the speaker's position
			d3.select('#debateSvg' + i).append('line')
				.style('stroke-width', 8)
				.style('opacity', 0.3)
				.style('stroke', fColor)
				.attr('x1', x)
				.attr('x2', x)
				.attr('y1', 0)
				.attr('y2', debateSvgHeight);
			fColor = "#222";
		}
		var yPad = 0;
		if(histIndex%2)
			yPad = 4;
		
		debateLineData[j] = {
			data: currSenator,
			x: x,
			width: 5,
			y: (lineY) + (Math.pow(-1, histogramBins[histIndex]%2)) * (5+(tickLength)*(Math.floor(histogramBins[histIndex]/2))),
			height: tickLength,
			strokeW: 0 + speakerLineW,
			r: 3 + speakerLineW,
			strokeC: sColor,
			fill: fColor,
			debateSvgNdx: i
		};	
		histogramBins[histIndex]++;
		
	}
	var debateLineTicks = d3.select('#debateSvg' + i).selectAll('ticks')
		.data(debateLineData)
		.enter()
		.append('circle')
		//.attr('shape-rendering', 'geometricPrecision')
		.style('stroke-width', function(d){
			d.data.activeDebateTicks.push(this);
			return d.strokeW;})
		.style('stroke', function(d){return d.strokeC;})
		.style('fill', function(d){return d.fill;})
		.attr('cx', function(d){return d.x;})
		.attr('cy', function(d){return d.y;})
		.attr('r', function(d){return d.r;})
		.on('mouseover', this.mouseOver)
		.on('mouseout', this.mouseOut)
		.on('click', this.mouseClick);	
	d3.select('#' + 'primarySenator' + speakerIndex).moveToFront();
}

//this creates all of the clickable sorting buttons
debateTable.prototype.createSortButtons = function(){

    function buttonMouseOver(d, i) {
        d3.select(this).transition().style('stroke', '#555')
            .style('fill', '#faa');
    }
    function buttonMouseOut(d, i) {
        d3.select(this).transition().style('stroke', '#aaa')
            .style('fill', '#fff');
    }
    function createSortButton(canvas){

        var ascPathData = [ {'x': 1, 'y': canvHeight/2 - 2}, {'x': canvWidth - 1, 'y': canvHeight/2 - 2},
                            {'x': canvWidth/2, 'y': 1}, {'x': 1, 'y': canvHeight/2 - 2},
							{'x': canvWidth - 1, 'y': canvHeight/2 - 2}];

        var descPathData = [ {'x': 1, 'y': canvHeight/2 + 2}, {'x': canvWidth - 1, 'y': canvHeight/2 + 2},
                            {'x': canvWidth/2, 'y': canvHeight - 1}, {'x': 1, 'y': canvHeight/2 + 2},
							{'x': canvWidth - 1, 'y': canvHeight/2 + 2}];

        var ascPtr = canvas.append('path')
            .style('stroke', '#aaa')
            .style('stroke-width', 2)
            .style('stroke-radius', 2)
            .style('fill', 'white')
            .attr('d', lineFunction(ascPathData)) 
            .on('mouseover', buttonMouseOver)
            .on('mouseout', buttonMouseOut);
        var descPtr = canvas.append('path')
            .style('stroke', '#aaa')
            .style('stroke-width', 2)
            .style('stroke-radius', 2)
            .style('fill', 'white')
            .attr('d', lineFunction(descPathData))
            .on('mouseover', buttonMouseOver)
            .on('mouseout', buttonMouseOut);
		return {'ascending': ascPtr, 'descending': descPtr};
    }

    var canvWidth = 20;
    var canvHeight = 40;
    var lineFunction = d3.svg.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
        .interpolate("linear");
 
	var titleSortCanvas = d3.select('#tableTitleSort').append('svg')
		.attr('width', canvWidth)
		.attr('height', canvHeight);
    var dateSortCanvas = d3.select('#tableDateSort').append('svg')
		.attr('width', canvWidth)
		.attr('height', canvHeight);
    var dScoreSortCanvas = d3.select('#tableDScoreSort').append('svg')
		.attr('width', canvWidth)
		.attr('height', canvHeight);
    var speakerSortCanvas = d3.select('#tableSpeakerSort').append('svg')
		.attr('width', canvWidth)
		.attr('height', canvHeight);
    var speechSortCanvas = d3.select('#tableSpeechSort').append('svg')
		.attr('width', canvWidth)
		.attr('height', canvHeight);

	this.titleDescButton = 0;
	var sortObj;
    sortObj = createSortButton(titleSortCanvas, this.titleAscButton, this.titleDescButton);
	this.titleAscButton = sortObj.ascending;
	this.titleDescButton = sortObj.descending;
	this.titleAscButton.on('click', this.sortButtonClosure('title', 'ascending'));
	this.titleDescButton.on('click', this.sortButtonClosure('title', 'descending'));

    sortObj = createSortButton(dateSortCanvas, this.dateAscButton, this.dateDescButton);
	this.dateAscButton = sortObj.ascending;
	this.dateDescButton = sortObj.descending;
	this.dateAscButton.on('click', this.sortButtonClosure('date', 'ascending'));
	this.dateDescButton.on('click', this.sortButtonClosure('date', 'descending'));

    sortObj = createSortButton(dScoreSortCanvas, this.dScoreAscButton, this.dScoreDescButton);
	this.dScoreAscButton = sortObj.ascending;
	this.dScoreDescButton = sortObj.descending;
	this.dScoreAscButton.on('click', this.sortButtonClosure('debateScore', 'ascending'));
	this.dScoreDescButton.on('click', this.sortButtonClosure('debateScore', 'descending'));

    sortObj = createSortButton(speakerSortCanvas, this.speakerAscButton, this.speakerDescButton);
	this.speakerAscButton = sortObj.ascending;
	this.speakerDescButton = sortObj.descending;
	this.speakerAscButton.on('click', this.sortButtonClosure('speakerIndexCounter', 'ascending'));
	this.speakerDescButton.on('click', this.sortButtonClosure('speakerIndexCounter', 'descending'));

	sortObj = createSortButton(speechSortCanvas, this.speechAscButton, this.speechDescButton);
	this.speechAscButton = sortObj.ascending;
	this.speechDescButton = sortObj.descending;
	this.speechAscButton.on('click', this.sortButtonClosure('speech', 'ascending'));
	this.speechDescButton.on('click', this.sortButtonClosure('speech', 'descending'));
    //createSortButton(dateSortCanvas, this.dateAscButton, this.dateDescButton);
}

//------------------------------------------------------------------------------------------------------------
//This sorts the currently active senator's debateID's according to an attribute
//and then redraws accordingly
//------------------------------------------------------------------------------------------------------------
debateTable.prototype.sortBy = function(sortAttr, type){
	//sorting by speaker scores requires different logic because it isn't 1:1 in the debate data
	if(sortAttr == 'speech'){
		var senator = this.mainSenator;
		var ascendingSort = function(a, b){
			return senator.speechScores[a] < senator.speechScores[b] ? -1 
			: senator.speechScores[a] > senator.speechScores[b] ? 1 : 0;
		};

		var descendingSort = function(a, b){
			return senator.speechScores[a] > senator.speechScores[b] ? -1 
			: senator.speechScores[a] < senator.speechScores[b] ? 1 : 0;
		};
	}
	//all other attributes can be sorted with simpler logic
	else{
		var ascendingSort = function(a, b){
			return global.debateData[a][sortAttr] < global.debateData[b][sortAttr] ? -1 
			: global.debateData[a][sortAttr] > global.debateData[b][sortAttr] ? 1 : 0;
		};

		var descendingSort = function(a, b){
			return global.debateData[a][sortAttr] > global.debateData[b][sortAttr] ? -1 
			: global.debateData[a][sortAttr] < global.debateData[b][sortAttr] ? 1 : 0;
		};
	}
	var sortFunc;
	if(type == 'ascending')
		sortFunc = ascendingSort;
	else
		sortFunc = descendingSort;

	this.mainSenator.debateIDs.sort(sortFunc);
}

debateTable.prototype.sortButtonClosure = function(sortAttr, type){
	var parentCl = this;
	var sortFunc = function(){
		document.getElementById('tableBody').innerHTML = '';
		parentCl.drawnRows = 0;
		parentCl.sortBy(sortAttr, type);	
		parentCl.fillTable();
	}
	return sortFunc;
}
