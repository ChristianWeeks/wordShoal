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
	this.svgElements.debateLineTicks = new Array();


}

debateTable.prototype.update = function(argv){
	this.mainSenator = argv.senator;
	this.debateNumCap = argv.debateNumCap || 10;
	this.drawnRows = 0;
	if(this.debateNumCap > this.mainSenator.debateIDs.length)
		this.debateNumCap = senator.debateIDs.length;
}


//------------------------------------------------------------------------------------------------------------
//This sorts the currently active senator's debateID's according to an attribute
//and then redraws accordingly
//------------------------------------------------------------------------------------------------------------
debateTable.prototype.sortBy = function(sortAttr){
	this.mainSenator.debateIDs.sort(
	function(a, b){
		return global.debateData[a][sortAttr] > global.debateData[b][sortAttr] ? -1 
		: global.debateData[a][sortAttr] < global.debateData[b][sortAttr] ? 1 : 0;
	});

}
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
debateTable.prototype.debateToHtml = function(i){
	var currDebate = this._debateDataPtr[this.mainSenator.debateIDs[i]];
	var row = document.createElement('tr');
	row.id = 'debateRow' + i;
	row.className = 'row';
	row.innerHTML = //"<td class='col-md-1 td'>" + i + '</td>' +
					"<td class='col-md-3 td'>" + currDebate.title + '</td>' +
					"<td class='col-md-1 td'>" + currDebate.date + '</td>' +
					"<td class='col-md-1 td'>" + currDebate.debateScore.toFixed(3) + '</td>' +
					"<td class='col-md-7 td' id='debateCanvas" + i + "'></td></tr>";
	return row;
}

//------------------------------------------------------------------------------------------------------------
//Creates the skeleton of our table and the svg canvases which will be populated with debate info
//------------------------------------------------------------------------------------------------------------
debateTable.prototype.createDebateTable = function(){

	this.sortBy('debateScore');
	var i = 0;
	var htmlStr = '';
	//This is our table header 
	htmlStr +=
		"<div id='debateTable'><div class='row'>" +
		//"<div class='col-md-1' id='tableIDHead'><h3>ID</h3></div>" +
		"<div class='col-md-3'>" +
			"<div class='col-md-6'><h3>Title</h3></div>" +
			"<div class='col-md-6' id='tableTitleSort'></div></div>" +
		"<div class='col-md-1' id='tableDateHead'><h3>Date</h3></div>" +
		"<div class='col-md-1' id='tableDScoreHead'><h3>DScore</h3></div>" +
		"<div class='col-md-6' id='tableScoresHead'><h3 style='text-align:center'>Idealized Scores</h3></div></div>" +
		"<table><tbody id='tableBody'>";

	htmlStr +="</tbody></table></div>";
	htmlStr += "<button id='paginateButton' class='pageButton simpleBorder' align='center'>Show More Results</button>";
	//debatesCanvas is in our main index.html file
	document.getElementById('debatesCanvas').innerHTML = htmlStr;
	document.getElementById('paginateButton').onclick = this.incrementTableClosure();

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
	//create the pagination button
	this.createSortButtons();
}

debateTable.prototype.incrementTableClosure = function(){
	var parentClass = this;
	var buttonClosure = function(){
		parentClass.increaseTableSize();
	}
	return buttonClosure;
}
		

debateTable.prototype.populateDebateLine = function(debate, debateCanvas, i){

	var debateSvgHeight = 50;
	var tickLength = 8;
	var tickColor;
	d3.select(debateCanvas).append('svg')
		.attr('width', '100%')
		.attr('height', debateSvgHeight)
		.attr('id', 'debateSvg' + i)
		.style('border-style', 'solid')
		.style('border-color', 'white')
		.style('border-radius', '5px')
		.style('border-width', '1px');
	//draw the main line
	d3.select('#debateSvg' + i).append('line')
		.attr('id', 'debateLine' + i)
		.attr('stroke-width', 2)
		.attr('stroke', 'black')
		.attr('x1', 0)
		.attr('x2', '100%')
		.attr('y1', debateSvgHeight / 2)
		.attr('y2', debateSvgHeight / 2);

	var debateLineData = new Array();

	for (var j = 0; j < debate.speakerIDs.length; j++) {

		var currSenator = this._senatorMapPtr[debate.speakerIDs[j]];
		//determine party for the tick's color
		if(currSenator.datum.party == 'R')
			tickColor = '#F66';
		else if(currSenator.datum.party == 'D')
			tickColor = '#66F';
		else
			tickColor = '#CAC';
		//Access that debate's data and draw each senator's score on the number line
		var speakerIndex = -1;
		for(var k = 0; k < debate.speakerIDs.length; k++){
			if (debate.speakerIDs[k] == this.mainSenator.datum.speakerID){
				speakerIndex = k;
				break;
			}
		}
		var x = debate.speakerScores[j];
		//convert the value from [-3.0, 3.0] to [0.0, 100.0]
		x = Math.floor((x + 3.0)*100.0/6.0);
		var tickMark;
		var xStr = String(x) + '%';
		var speakerLineLen = 0;
		var speakerLineW = 0;
		if(j == speakerIndex){
			speakerLineLen = 15;
			speakerLineW = 1;
		}
		debateLineData[j] = {
			data: currSenator,
			x: xStr,
			y1: debateSvgHeight / 2 - tickLength - speakerLineLen,
			y2: debateSvgHeight / 2 + tickLength + speakerLineLen,
			strokeW: 2 + speakerLineW,
			strokeC: tickColor,
			debateSvgNdx: i
		};	
		//if this is our senator, draw a circle.   Else, the other senators get less prominent line ticks
		/*if(j == speakerIndex){
			tickMark = d3.select('#debateSvg' + i).append('circle')
				.attr('class', 'c_rep')
				.style('stroke-width', 5)
				.attr('r', 7)
				.attr('cx', String(x) + '%')
				.attr('cy', debateSvgHeight / 2)
				.attr('id', 'primarySenator' + j)
				.on('mouseover', function(d) {d3.select(this).style('stroke-width', 5);})
				.on('mouseout', function(d) { d3.select(this).style('stroke-width', 2);});
		}
		else{ 
			var xStr = String(x) + '%';
			tickMark = d3.select('#debateSvg' + i)
				.append('line')
				.style('stroke-width', 2)
				.style('stroke', tickColor)
				.attr('x1', xStr)
				.attr('x2', xStr)
				.attr('y1', debateSvgHeight / 2 - tickLength)
				.attr('y2', debateSvgHeight / 2 + tickLength)	
				.on('mouseover', function(d) {d3.select(this).style('stroke-width', 5);})
				.on('mouseout', function(d) { d3.select(this).style('stroke-width', 2);});
		}*/
		var debateLineTicks = d3.select('#debateSvg' + i).selectAll('ticks').data(debateLineData).enter()
			.append('line')
			.style('stroke-width', function(d){
				d.data.activeDebateTicks.push(this);
				return d.strokeW;})
			.style('stroke', function(d){return d.strokeC;})
			.attr('x1', function(d){return d.x;})
			.attr('x2', function(d){return d.x;})
			.attr('y1', function(d){return d.y1;})
			.attr('y2', function(d){return d.y2;})
			.on('mouseover', this.mouseOver)
			.on('mouseout', this.mouseOut)
			.on('click', this.mouseClick);
	//	d3.select(currSenator.activeDebateTicks[0])[0][0].attr('stroke-width', 5);//.attr('stroke', 5); 
		
		
	}
	d3.select('#' + 'primarySenator' + speakerIndex).moveToFront();
}

//this creates all of the clickable sorting buttons
debateTable.prototype.createSortButtons = function(){
	//this.svgElements['dateSortCanvas'] =
	//	d3.select
	var dateSortCanvas = d3.select('#tableTitleSort').append('svg')
		.attr('width', 25)
		.attr('height', 50)
		.style('background', 'red');
}
