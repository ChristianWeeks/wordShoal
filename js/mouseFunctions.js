"use strict";
//Closure needed to have multiple svg-elements activate (highlight) when any one
//of them is highlighted
//Ex. Mousing over the label, line plot, or color legend for any single computer
/// user will cause the label to increase its font
//and the line to turn black and increase its stroke width.
function elementMouseOverClosure() {
	var elementMouseOver = function(d, i) {
		if (d.data.datum.state == global.activeStateFilter 
				|| global.activeStateFilter == 'None') {
			var senator = d.data;
			highlightSenator(senator);

			if(senator.datum.state != global.activeStateFilter){
				highlightState("#" + senator.datum.state + "_state");
			}
			//fill in the information bar at the side
			var sideBarTop = d3.select('#sideBar1')
				.attr('class','simpleBorder infoBox')
				.attr("align", "center");
			document.getElementById('sideBar1').innerHTML = 
				'<h3>' + d.data.name + '</h3><h3>' +
				d.data.datum.state + '</h3><h3>' +
				d.data.id + '</h3><br/>Total Debates:' +
				d.data.debateIDs.length;

			//Highlight all tickmarks on currently active debates
			for(var j = 0; j < senator.activeDebateTicks.length; j++){
				d3.select(senator.activeDebateTicks[j]).transition()
					.style('stroke-width', 2)
					.attr('r', function(d){
						d3.select('#debateSvg' + d.debateSvgNdx).transition()
							.style('border-color', d.strokeC);
						return 3;});
			}
		}
	};
	return elementMouseOver;
}

//Closure handling mouse out that reverts effects of the mouse-over closure
function elementMouseOutClosure() {
	var elementMouseOut = function(d, i) {
		if (d.data.datum.state == global.activeStateFilter 
				|| global.activeStateFilter == 'None') {
			var senator = d.data;
			//Do not change a node if it is currently selected
			if(senator != global.currentSenator){
				unhighlightSenator(senator);
			}
			if(senator.datum.state != global.activeStateFilter){
				unhighlightState("#" + senator.datum.state + "_state");
			}

			//unhighlight all tickmarks on currently active debates
			for(var j = 0; j < senator.activeDebateTicks.length; j++){
				d3.select(senator.activeDebateTicks[j]).transition()
					.style('stroke-width', function(d){return d.strokeW})
					.attr('r', function(d){
						d3.select('#debateSvg' + d.debateSvgNdx).transition()
							.style('border-color', 'white');
						return 3;})
			}
		}
	};
	return elementMouseOut;
}

//clicks will change the granularity to the senator level, add a small box to
//the side bar with senator information, and scrunch the top
function elementMouseClickClosure(setViewLevel) {

	var elementMouseClick = function(d, i) {
		//wipe the old senator's stored debate tick SVG pointers
		if(global.currentSenator){
			global.currentSenator.activeDebateTicks.length = 0;
			unhighlightSenator(global.currentSenator);
			unhighlightState(global.currentState);
		}
		global.currentState = d.data.datum.state;
		global.currentSenator = d.data;
		setViewLevel('senator');
		highlightSenator(global.currentSenator);
		//populate the permanent window
		d3.select('#selectedSenatorInfo')
			.attr('class','simpleBorder')
			.style('background', d.data.fillC)
			.attr("align", "center");
		document.getElementById('selectedSenatorInfo').innerHTML = 
			'<h3>' + d.data.name + '</h3><h3>' +
			d.data.datum.state + '</h3><h3>' +
			d.data.id + '</h3><br/>Total Debates:' +
			d.data.debateIDs.length;
		//scroll down to the debates
		$('html, body').animate({
			scrollTop: $("#debatesCanvas").offset().top + "px"
				}, 400);
	};
	return elementMouseClick;
}

//highlights all svgs associated with the senator
function highlightSenator(senator){
	d3.select(senator.svgPoint).moveToFront().transition()
		.attr('r', 5)
		.attr('class', function(d) {return d.cssClass + ' mOver'});
	d3.select(senator.svgConfidenceLine).transition()
		.style('stroke-width', 4);
	d3.select(senator.svgDotgram).moveToFront().transition()
		.style('stroke-width', 3);
	d3.select(senator.svgPointBox)
		.style("opacity", 1);
}

//unhighlights all svgs associated with the senator
function unhighlightSenator(senator){
	d3.select(senator.svgPoint).transition()
		.attr('r', function(d){return d.r;})
		.attr('class', function(d) {return d.cssClass});
	d3.select(senator.svgConfidenceLine).transition()
		.style('stroke-width', function(d){return d.strokeWidth;});
	d3.select(senator.svgPointBox).transition()
		.style("opacity", 0);
	d3.select(senator.svgDotgram).transition()
		.style('stroke-width', 0);
}

function highlightState(state){
	d3.select(state).moveToFront()
		.style("stroke", "black")
		.style("stroke-width", 2)
		.style("opacity", 1.0);
}

function unhighlightState(state){
	d3.select(state)
		.style("stroke", "#333")
		.style("stroke-width", 1)
		.style("opacity", 0.7);
}
function speechHelpMouseClick(){
	if(!global.speechHelpClicked){
	$('#speechHelp').addClass('row simpleBorder').css(
	{'height': '400px', 
	'overflow': 'visible',
	'margin-bottom': '20px',
	'margin-top': '10px',
	'padding': '15px'});
	var textColumn = d3.select('#speechHelp').append('div')
		.attr('class', 'col-md-6')
		.attr('align', 'left')
	textColumn.append('h3').text('Speech Score Distribution');
	textColumn.append('p').attr('class', 'helpText').text(
	"This plot shows the sorted speech value for every senator.  The horizontal " +
	"lines are confidence lines that show the margin of error for that particular " +
	"senator.");
	textColumn.append('p').attr('class', 'helpText').text(
	"For instance, let's look at Senator Sheila Frahm of Kansas.  Senator Frahm was " +
	"only in office for 4 months. In her short tenure, she only participated in 3" +
	"debates, so there isn't enough data to calculate a very confident score.");
	textColumn.append('p').attr('class', 'helpText').text(
	"Senator Harry Reid, on the other hand, has been in office for over 20" +
    "years and has participated in 1983 debates, so our speech estimate for him "+
   	"is much more confident.");

	textColumn.append('p')
		.attr('class', 'helpText')
		.style('font-weight', 'bold')
		.text(
	"Click on a senator to reveal all of the debates they participated "+
	"in that make up their overall score");
	var svgColumn = d3.select('#speechHelp').append('div')
		.attr('class', 'col-md-5')
		.attr('align', 'center')
		.attr('id', 'speechHelpCanvas');
	var buttonColumn = d3.select('#speechHelp').append('div')
		.attr('class', 'col-md-1');
	buttonColumn.append('svg')
		.attr('id', 'speechHelpX')
		.attr('width', 50)
		.attr('height', 50);

	//document.getElementById('speechHelp').innerHTML = helpText; 
	drawHelpBubble(d3.select('#speechHelpX'), 'speechX', 'X', 25, 25, closeSpeechHelp);
	//creating the example scatter canvas for explanations
	//We don't want to draw every point.  We have to find our example senators
	//and remove the rest above and below
	var reidIndex = 133;
	var frahmIndex = 109;	
	var diff = reidIndex - frahmIndex;
	var clippedArray = [reidIndex - frahmIndex +10]
	for(var i = 0; i < diff+10; i++){
		clippedArray[i] = global.senatorData[frahmIndex - 5 + i];
	}

	var examplePlot = new scatterDist({
		title: '',
		titleX: '',
		stateDataPtr: global.stateData,
		canvasWidth: 300,
		canvasHeight: 360,
		leftPadding: 20,
		rightPadding: 20,
		botPadding: 40,
		topPadding: 10
	});
	examplePlot.initCanvas('speechHelpCanvas', 'speechHelpSvg');
	examplePlot.canvasPtr.style('width', 300).style('height', 360);
	examplePlot.radius = 4;
	examplePlot.strokeWidth = 2;
	examplePlot.setData(clippedArray);
	//draw some rects to fade out ever element except Reid and Frahm
	var elementPadding = 400 / clippedArray.length;
	var blockersData = [{x: 20, y: 0, width: 300, height: elementPadding*4},
		{x: 20, y: elementPadding*4.8, width: 300, height: elementPadding*(diff-6.6)},
		{x: 20, y: elementPadding*(diff-0.9), width: 300, height: elementPadding*4.0}];
	
	examplePlot.canvasPtr.selectAll('Blockers').data(blockersData).enter().append('rect')
		.attr('x', function(d){return d.x})
		.attr('y', function(d){return d.y})
		.attr('width', function(d){return d.width})
		.attr('height', function(d){return d.height})
		.style('fill', '#ffffff')
		.style('opacity', 0.7);
	examplePlot.canvasPtr.append('text')
		.attr('x', 20)
		.attr('y', elementPadding*4.5)
		.attr('fill', '#88F')
		.text('Senator Reid');
	examplePlot.canvasPtr.append('text')
		.attr('x', 20)
		.attr('y', elementPadding*(diff-1.5))
		.attr('fill', '#F88')
		.text('Senator Frahm');
		global.speechHelpClicked = 1;
	}
}

function debateHelpMouseClick(){
	if(!global.debateHelpClicked){
	$('#debatesHelp').addClass('row simpleBorder').css(
	{'height': '400px', 
	'overflow': 'visible',
	'margin-bottom': '20px',
	'margin-top': '10px',
	'padding': '15px'});
	var textColumn = d3.select('#debatesHelp').append('div')
		.attr('class', 'col-md-6')
		.attr('align', 'left')
	textColumn.append('h3').text('Debate Lines');
	textColumn.append('p').attr('class', 'helpText').text(
	"For every debate, every word spoken is analyzed and a speech score assigned"+
	" to every senator.  The final score, given above, is then a composite of " +
	"these individual scores and the polarization of the debates.  This feature "+
	"allows us to see how senators spoke on specific issues, and how consistent "+
	"that speech is with how they regularly speak.");
	textColumn.append('h3').text('Polarization');
	textColumn.append('p').attr('class', 'helpText').text(
	"Polarization is a measure of how partisan the speech in a particular debate"+
	" is.  If senators of the same party consistently use similar speech patterns"+
	", we can conclude the topic is polarized.  Sometimes, though, there is "+
	"little correlation between party and speech.  The results from these debates "+
	"are weighted less when calculating a senator's final speech score.");
	var debatesColumn= d3.select('#debatesHelp').append('div')
		.attr('class', 'col-md-6')
		.attr('align', 'left')
	var debateSvgXDiv = debatesColumn.append('div').attr('align', 'right');	
	debateSvgXDiv.append('svg')
		.attr('id', 'debateHelpX')
		.style('align', 'right')
		.attr('width', 50)
		.attr('height', 50);

	debatesColumn.append('p').attr('class', 'helpText').attr('align', 'center')
		.style('padding', '5px')
		.text("A debate with high polarization");
	debatesColumn.append('img').attr('src', 'img/debate1.png');
	debatesColumn.append('p').attr('class', 'helpText').attr('align', 'center')
		.style('margin', '20px')
		.text("A debate with low polarization");
	debatesColumn.append('img').attr('src', 'img/debate2.png');
	//document.getElementById('speechHelp').innerHTML = helpText; 
	drawHelpBubble(d3.select('#debateHelpX'), 'debateX', 'X', 25, 25, closeDebateHelp);
	global.debateHelpClicked = 1;
	}
}

function closeDebateHelp(){
	$('#debatesHelp').removeClass('row simpleBorder').css(
	{'height': 0, 
	'overflow': 'visible',
	'padding': 0,
	'margin-bottom': '0px',
	'margin-top': '0px'});
	document.getElementById('debatesHelp').innerHTML = '';
	global.debateHelpClicked = 0;
}
function closeSpeechHelp(){
	$('#speechHelp').removeClass('row simpleBorder').css(
	{'height': 0, 
	'overflow': 'visible',
	'padding': 0,
	'margin-bottom': '0px',
	'margin-top': '0px'});
	document.getElementById('speechHelp').innerHTML = '';
	global.speechHelpClicked = 0;
}
function drawHelpBubble(svg, id, text, x, y, mouseClickFunc){
	function mouseOver(d, i){
		d3.select("#" + id + "HelpButton").moveToFront().transition()
			.attr("r", 25);
		d3.select("#" + id + "HelpText").moveToFront().transition();
	}
	function mouseOut(d,i){
		d3.select("#" + id + "HelpButton").transition()
			.attr("r", 20);
		d3.select("#" + id + "HelpText").moveToFront().transition()
	}
	
	svg.append("circle")
		.attr("r", 20)
		.attr("cx", x)
		.attr("cy", y)
		.attr("id", id + "HelpButton")
		.style("cursor", "pointer")
		.style("fill", "#88F")
		.on("mouseover", mouseOver)
		.on("mouseout", mouseOut)
		.on("click", mouseClickFunc);

	svg.append("text")
		.attr("class", "helpQuestionMark")
		.attr("id", id + "HelpText")
		.attr("x", x)
		.attr("y", y + 15)
		.style("cursor", "pointer")
		.style("stroke", "black")
		.style("stroke-width", 0)
		.attr('text-anchor', 'middle')
		.text(text)
		.on("mouseover", mouseOver)
		.on("mouseout", mouseOut)
		.on("click", mouseClickFunc);
}

