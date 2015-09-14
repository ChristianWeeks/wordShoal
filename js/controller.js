'use strict';

var global = function() {};
function controller() {
	//graph size variables
	var _mainHeight = 900;

	//data stored from reading in CSV files
    var _senatorMap = {};
	var _senatorData;

    var _debateMap = {};
	var _debateData;

	var _BAR_GRAPH = null;
	var _SCATTER_PLOT = null;
	global.minified = false;

	//dynamically resizing the side bar.
	d3.select('#sideBar1').style('height', (_mainHeight / 2) + 'px');

	//--------------------------------------------------------------------------------------------------------------------
	//read in the data from a single year.  Even though this is in the "main()" namespace, it is effectively our MAIN 
	//function
	//--------------------------------------------------------------------------------------------------------------------
	function readSenatorCSV(year) {
		var fileName = !year ? 'data/US_Senate_104-113_senator_data.csv' : 'data/EstimatesSenate1' + year + '.csv';
		d3.csv(fileName, function(d) {
			return {
				//NOTE: The original CSV file headers contain periods in them (e.g., theta.est).
                speakerID: d.speakerID,
				name: d.name ? d.name : d['speaker.name'],
				speakerStr: d.speaker,
				state: d.state,
				party: d.party,
				v: +d['vote.score'],
				s: +d['speech.score'],
				votePos: +d['vote.score.normalized'],
				speechPos: +d['speech.score.normalized'],
			//	thetaCilb: +d.thetacilb,
			//	thetaCiub: +d.thetaciub
				};
			},
			function(error, senatorData) {

				if (error) console.error(error);

				_senatorData = configureSenatorData(senatorData);

				//now that senators are read in, read in the debate data
				readDebateCSV();
			});
	}
	//--------------------------------------------------------------------------------------------------------------------
	//Creates the year filter buttons for the top bar
	//Configure the senator data into a format that can be properly bounded to and represented by the graph
	//--------------------------------------------------------------------------------------------------------------------
	function configureSenatorData(data) {
		var graphData = new Array(data.length);
		var voteMin, voteMax, speechMin, speechMax;
		var speechMagnitude;
		var isRandom = 0;

		for (var i = 0; i < data.length; i++) {
			graphData[i] = {
				//store all of the imported datum for display purposes
				datum: data[i],
				//store data directly relevant to the graph in the first level
				name: data[i].name,
				id: data[i].party,
				x: data[i].speechPos,
				y: data[i].votePos,
				delta: data[i].speechPos - data[i].votePos,
				r: 5,
				shape: 'circle',
				debateIDs: new Array(),
				activeDebateTicks: new Array()
			};
            _senatorMap[graphData[i].datum.speakerID] = graphData[i];
		}
		//sort array to get vote ranking / percentage
		graphData.sort(function(a, b) {return a.x - b.x});
		for (var i = 0; i < graphData.length; i++) {
			graphData[i].votePercent = i / graphData.length;
		}
		//sort for speech ranking / percentage
		graphData.sort(function(a, b) {return a.y - b.y});
		for (var i = 0; i < graphData.length; i++) {
			graphData[i].speechPercent = i / graphData.length;
			graphData[i].speechVoteDelta = Math.abs(graphData[i].x - graphData[i].y);
		}
		graphData.sort(function(a, b) {return a.delta - b.delta});
		return graphData;
	}

	//--------------------------------------------------------------------------------------------------------------------
	//read in our debate data
    //--------------------------------------------------------------------------------------------------------------------
	function readDebateCSV() {
		var fileName = 'data/US_Senate_104-113_debate_data.csv';
		d3.csv(fileName, function(d) {
			return {
				debateID: d.debateID - 1,
                speakerID: d.speakerID,
				speakerCount: +d.speakersN,
				title: d.title,
				date: d.date,
                //Speaker score denotes the speech score for this entry's senator in this debate
                speakerScore: +d["speaker.score"],
                //Debate score denotes the importance / controversiality of this debate
                debateScore: +d["debate.score"] 
			};
		},
		function(error, debateData) {
			if (error) console.error(error);
			_debateData = configureDebateData(debateData);
			initMainGraph();
		});
	}

	//--------------------------------------------------------------------------------------------------------------------
	//Now configure it for our purposes
    //--------------------------------------------------------------------------------------------------------------------
	function configureDebateData(data) {

		var debateData = new Array();
        var speakerIndex;
		for (var i = 0; i < data.length; i++) {
			var debateCell = {};

			//if this debate is not yet in the table, put it in
			if (!debateData[data[i].debateID]) {
				debateCell = data[i];
                debateCell.speakerIndexCounter = 0;

                //Speakers and their scores will match indices in their respective arrays
				debateCell.speakerIDs = new Array();
                debateCell.speakerScores = new Array();

				debateCell.speakerIDs.push(data[i].speakerID);
                debateCell.speakerScores.push(data[i].speakerScore);
				debateData[data[i].debateID] = debateCell;
                debateCell.speakerIndexCounter = 1;
                _debateMap[debateCell.debateID] = debateCell;
			}

			//if the debate is in the table, add the new speaker and his score to that debate's lists
			else {
				debateData[data[i].debateID].speakerIDs.push(data[i].speakerID);
				debateData[data[i].debateID].speakerScores.push(data[i].speakerScore);
				debateData[data[i].debateID].speakerIndexCounter++;
			}
            speakerIndex = debateData[data[i].debateID].speakerScores.length - 1;
			//link the speaker and debateIDs
			var k = 0;
            //for every senator
//			for (k = 0; k < _senatorData.length; k++) {
                //link the debate with the senators
                _senatorMap[data[i].speakerID].debateIDs.push(data[i].debateID);
                //if the senator is the same as the current debate data's senator, then link them

/*				if (_senatorData[k].datum.speakerID == data[i].speakerID) {
					_senatorData[k].debateIDs.push(data[i].debateID);
                   // _senatorData[k].
					break;
				}
			}*/

		}
		return debateData;
	}
	//--------------------------------------------------------------------------------------------------------------------
	//Draws the general level bar graph
	//--------------------------------------------------------------------------------------------------------------------
	function initMainGraph() {
			var graphData = _senatorData;
			if (!_BAR_GRAPH) {
				_BAR_GRAPH = new histogram({
					title: 'Senator Speech Score Distribution',
					titleY: 'Number of Senators',
					titleX: 'Speech Score'
				});

				_BAR_GRAPH.initCanvas('barCanvas', 'barSvg');
				global._BAR_GRAPH = _BAR_GRAPH;
			}
			//remove all of the previous svgs when loading a new year
			else
				_BAR_GRAPH.destroyAll();

			if (!_SCATTER_PLOT) {
				_SCATTER_PLOT = new scatterPlot({
					title: 'Senatorial Speech vs. Voting Habits',
					titleY: 'Vote Score',
					titleX: 'Speech Score',
				});
				_SCATTER_PLOT.initCanvas('scatterCanvas', 'scatterPlot');
				global._SCATTER_PLOT = _SCATTER_PLOT;
			}
				//remove all of the previous svgs when loading a new year
			else
				_SCATTER_PLOT.destroyAll();

			_BAR_GRAPH.setData(graphData);
			_SCATTER_PLOT.setData(graphData);
			//_BAR_GRAPH.coupleMouseEvents('bars', _SCATTER_PLOT.x, _SCATTER_PLOT.y, setViewLevel);
			_SCATTER_PLOT.coupleMouseEvents('points', _SCATTER_PLOT.x, _SCATTER_PLOT.y, setViewLevel);
	}

	//--------------------------------------------------------------------------------------------------------------------
	//Minifies the main graph when moving into Senator view
	//--------------------------------------------------------------------------------------------------------------------
	function minifyMainGraph() {

			global.minified = true;

			_BAR_GRAPH.minify();
			_SCATTER_PLOT.minify(250);

			//_BAR_GRAPH.coupleMouseEvents('bars', 0, 0, setViewLevel);
			_SCATTER_PLOT.coupleMouseEvents('points', 0, 0, setViewLevel);
	}

	//--------------------------------------------------------------------------------------------------------------------
	//draws the timeline at the top.
	//--------------------------------------------------------------------------------------------------------------------
	function createYearButtons() {
		var yearButtonData = new Array(10);
		var i = 0;
		for (var year = 4; year < 14; i++, year++) {
			yearButtonData[i] = {'year': '2' + pad(year, 3), 'val': '' + pad(year, 2), 'id': i};
		}
		timeline({mainWidth: 900}, yearButtonData, 0, 60, readYearCSV());
	}

	//--------------------------------------------------------------------------------------------------------------------
	//closure that returns an individual function for each button on the timeline, so that year's click feature loads the proper data
	//--------------------------------------------------------------------------------------------------------------------
	function readYearCSV() {
		var readYearCSVClosure = function(d, i) {
			readSenatorCSV(d.val);
		};
		return readYearCSVClosure;
	}
	//--------------------------------------------------------------------------------------------------------------------
	//filters results on selecting different states
	//--------------------------------------------------------------------------------------------------------------------
	function setViewLevel(viewLevelStr) {

		if (viewLevelStr == 'general') {
			initMainGraph();
		}
		else if (viewLevelStr == 'senator') {
			//minify the bar graph
			minifyMainGraph();

			//populate the debates window
			populateDebateWindow(global.currentSenator);
		}
		else {
			console.error('Improper view level set: ' + viewLevelStr);
		}
	}

	function populateDebateWindow(senator) {
		var debateNumCap = 5;
        if(debateNumCap > senator.debateIDs.length)
            debateNumCap = senator.debateIDs.length;
		var i = 0;
		var htmlStr = '';
		var debateSvgHeight = 50;
		var tickLength = 8;
        //This is our table header 
		htmlStr +=
			"<div class='row'><div class='col-md-1'><h3>ID</h3></div>" +
			"<div class='col-md-3'><h3>Title</h3></div>" +
			"<div class='col-md-1'><h3>Date</h3></div>" +
			"<div class='col-md-1'><h3>DScore</h3></div>" +
			"<div class='col-md-6'><h3>Idealized Scores</h3></div></div>" +
			"<table><tbody>";

		//Populate the table with the debates this senator has participated in
		for (i = 0; i < debateNumCap; i++) {
			var currDebate = _debateData[senator.debateIDs[i]];
			htmlStr += "<tr class='row'>" +
							"<td class='col-md-1 td ID'>" + i + '</td>' +
							"<td class='col-md-3 td TITLE'>" + currDebate.title + '</td>' +
							"<td class='col-md-1 td DATE'>" + currDebate.date + '</td>' +
							"<td class='col-md-1 td DSCORE'>" + currDebate.debateScore.toFixed(3) + '</td>' +
							"<td class='col-md-6 td SCORE' id='debateCanvas" + i + "'></td>" +
						'</tr>';
		}
		htmlStr += '</tbody></table>';

        //debatesCanvas is in our main index.html file
		document.getElementById('debatesCanvas').innerHTML = htmlStr;

        //create the svg canvases for each debate entry in our table
		for (i = 0; i < debateNumCap; i++) {
            var currDebate = _debateData[senator.debateIDs[i]];
            var tickColor;
			//create the svg
			if(i == 0){
				d3.select('body').append('svg')
					.style('width', 500)
					.style('height', 500)
					.attr('id', 'debateSvg0');
			}
			else{
			d3.select('#debateCanvas' + i).append('svg')
				.attr('width', '100%')
				.attr('height', debateSvgHeight)
				.attr('id', 'debateSvg' + i);
			}
			//draw the main line
			d3.select('#debateSvg' + i).append('line')
				.attr('id', 'debateLine' + i)
				.attr('stroke-width', 2)
				.attr('stroke', 'black')
				.attr('x1', 0)
				.attr('x2', '100%')
				.attr('y1', debateSvgHeight / 2)
				.attr('y2', debateSvgHeight / 2);

            //go through all the speakers in this debate and draw their positions
			for (var j = 0; j < currDebate.speakerIDs.length; j++) {

				var currSenator = _senatorMap[currDebate.speakerIDs[j]];
                //determine party for the tick's color
                if(currSenator.datum.party == 'R')
                    tickColor = '#F66';
                else if(currSenator.datum.party == 'D')
                    tickColor = '#66F';
                else
                    tickColor = '#CAC';
                //Access that debate's data and draw each senator's score on the number line
                var speakerIndex = -1;
                for(var k = 0; k < currDebate.speakerIDs.length; k++){
                    if (currDebate.speakerIDs[k] == senator.datum.speakerID){
                        speakerIndex = k;
                        break;
                    }
                }
                var x = currDebate.speakerScores[j];
				var tickMark;
				var tempData = [{'1': 1}, {'2': 2}, {'3' :3}];
                if(speakerIndex == -1){
                    console.err("Error: No matching ID for speaker " + senator.datum.speakerID + " in debate " + currDebate.debateID);
                }
                else{
                    //convert the value from [-3.0, 3.0] to [0.0, 100.0]
                    x = x + 3.0;
                    x = x*100.0;
                    x = x/6.0;
                    x = Math.floor(x);
                    //if this is our senator, draw a circle.   Else, the other senators get less prominent line ticks
                    if(j == speakerIndex){
                        tickMark = d3.select('#debateSvg' + i).selectAll('TEMPNULL').data(tempData).enter().append('circle')
                            .attr('class', 'c_rep')
							.style('stroke-width', 5)
                            .attr('r', 7)
                            .attr('cx', String(x) + '%')
                            .attr('cy', debateSvgHeight / 2)
                            .attr('id', 'primarySenator' + j);
							//.on('mouseover', 4);
							tickMark.on('mouseover', function(d) { console.log(this);
								d3.select(this).style('stroke-width', 5);
								return this;
							})
							.on('mouseout', function(d) { d3.select(this).style('stroke-width', 2)});
                    }
                    else{ 
                        var xStr = String(x) + '%';
                        tickMark = d3.select('#debateSvg' + i).append('line')
                            .style('stroke-width', 2)
                            .style('stroke', tickColor)
                            .attr('x1', xStr)
                            .attr('x2', xStr)
                            .attr('y1', debateSvgHeight / 2 - tickLength)
                            .attr('y2', debateSvgHeight / 2 + tickLength)	
							.on('mouseover', function(d) { console.log(this);d3.select(this).style('stroke-width', 5)})
							.on('mouseout', function(d) { d3.select(this).style('stroke-width', 2)});
                    }
						currSenator.activeDebateTicks.push(tickMark);
		//	d3.select(currSenator.activeDebateTicks[0])[0][0].attr('stroke-width', 5);//.attr('stroke', 5); 
                }
			}
            d3.select('#' + 'primarySenator' + speakerIndex).moveToFront();
            d3.select('#debateLine0').moveToFront();
            d3.select('#debateSvg0').moveToFront();

			//instantiate the list for sorting
		}
	}




	//--------------------------------------------------------------------------------------------------------------------
	//filters results on selecting different states
	//--------------------------------------------------------------------------------------------------------------------
	function changeState() {
		global.activeStateFilter = '';
	//	_BAR_GRAPH.updateFilter();
		_SCATTER_PLOT.updateFilter();
	}

	global.activeStateFilter = 'None';
	createStateList('stateDropDown');
	createYearButtons();
	//--------------------------------------------------------------------------------------------------------------------
	//BEGIN OUR PROGRAM
	//--------------------------------------------------------------------------------------------------------------------
	readSenatorCSV();
}

controller();

function changeState(value) {
	global.activeStateFilter = value;
//	global._BAR_GRAPH.updateFilter(value);
	global._SCATTER_PLOT.updateFilter(value);
}
