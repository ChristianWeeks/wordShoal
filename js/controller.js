"use strict";

var global = function(){};
function controller(){
	//graph size variables
	var _mainWidth = 900;
	var _mainHeight = 900;
	var _barSvgHeight = 700;
	var _topBarHeight = 80;
	var _xPadding = 120;
	var _yPadding = 120;
	var _yBarPadding = 75;
	var _barWidth= _mainWidth - _xPadding; 
	var _barHeight = _barSvgHeight - _yPadding; 
	var _minifiedBarSvgHeight = 120;

	//data stored from reading in CSV files
	var _senatorData;
	var _debateData;

	var _BAR_GRAPH = null;
	var _SCATTER_PLOT = null;
	global.minified = false;
	
	//dynamically resizing the side bar.
	d3.select("#sideBar1").style("height", (_mainHeight/2) + "px");
	
	var _barSvg = d3.select("#barCanvas").append("svg")
		.style("height", _barSvgHeight)
		.style("width", "100%")
		.style("height", "100%")
		.attr("id", "barSvg")
		.attr("viewBox", "0 0 " + _mainWidth + " " + _barSvgHeight)
		.attr("preserveAspectRatio", "xMidYMid");
	var _scatterSvg = d3.select("#scatterCanvas").append("svg")
		.style("height", _mainHeight)
		.style("width", "100%")
		.style("height", "100%")
		.attr("id", "scatterPlot")
		.attr("viewBox", "0 0 " + _mainWidth + " " + _mainHeight)
		.attr("preserveAspectRatio", "xMidYMid");

	var _scatterMiniSvg = d3.select("#scatterMiniCanvas").append("svg")
		.attr("id", "scatterMiniSvg");

	//top bar contains buttons for loading different years of data and will contain later features
	var _topBar = d3.select("#topButtonsBar").append("svg")
		.style("height", _topBarHeight)
		.style("width", "100%")
		.attr("id", "topBar")
		.attr("viewBox", "0 0 " + _mainWidth + " " + _topBarHeight)
		.attr("preserveAspectRatio", "xMidYMid");

//	var _debatesSvg = d3.select("#debatesCanvas").append("svg").attr("id", "debatesSvg");

	//--------------------------------------------------------------------------------------------------------------------
	//Creates the year filter buttons for the top bar
	//Configure the senator data into a format that can be properly bounded to and represented by the graph
	//--------------------------------------------------------------------------------------------------------------------
	function configureSenatorData(data){
		var graphData = new Array(data.length);
		var voteMin, voteMax, speechMin, speechMax;
		var voteMagnitude, speechMagnitude;
		var isRandom = 0;
		voteMin = voteMax = speechMin = speechMax = 0;
		
		//First we find the magnitude to normalize all the values between 0 and 1.
		for(var i = 0; i < data.length; i++){
			//calculating the max and mins
			if(data[i].speechPos > speechMax)
				speechMax = data[i].speechPos;
			if(data[i].speechPos < speechMin)
				speechMin = data[i].speechPos;
			//----------------------------------------------------------------------------------------------------------------------
			//temporary random() while votePos is being calculated for all years
			if(!data[i].votePos){
				data[i].votePos = Math.random();
				isRandom = 1;
			}	
			else{
			//----------------------------------------------------------------------------------------------------------------------
				if(data[i].votePos > voteMax)
					voteMax = data[i].votePos;	
				if(data[i].votePos < voteMin)
					voteMin = data[i].votePos;	
			}
		}
		speechMagnitude = speechMax - speechMin;
		if(isRandom)
			voteMagnitude = 1;
		else
			voteMagnitude = voteMax - voteMin;
				
		var normalVote, normalSpeech;

		for(var i = 0; i < data.length; i++){
			normalVote = (data[i].votePos-voteMin) / voteMagnitude, 
			normalSpeech = (data[i].speechPos-speechMin) / speechMagnitude,
			graphData[i] = {
				//store all of the imported datum for display purposes
				datum: data[i],
				//store data directly relevant to the graph in the first level
				name: data[i].name,
				id: data[i].party,
				//----------------------------------------------------------------------------------------------------------------------
				//temporary random() while votePos is being calculated for all years
				x: data[i].votePos, 
				//----------------------------------------------------------------------------------------------------------------------
				y: data[i].speechPos,
				delta: data[i].speechPos - data[i].votePos,
				r: 5, 
				shape: "circle",
				debateIDs: new Array()
			};
		}
		//sort array to get vote ranking / percentage
		graphData.sort(function(a, b){return a.x - b.x});
		for(var i = 0; i < graphData.length; i++){
			graphData[i].votePercent = i / graphData.length;
		}
		//sort for speech ranking / percentage
		graphData.sort(function(a, b){return a.y - b.y});
		for(var i = 0; i < graphData.length; i++){
			graphData[i].speechPercent = i / graphData.length;
			graphData[i].speechVoteDelta = Math.abs(graphData[i].x - graphData[i].y);
		}
		graphData.sort(function(a, b){return a.delta - b.delta});
		return graphData;
	}

	function configureDebateData(data){
		var debateData = new Array();

		for(var i = 0; i < data.length; i++){
			var debateCell = {}
			//if this debate is not yet in the table, put it in
			if(!debateData[data[i].debateID]){
				debateCell = data[i];
				debateCell.speakers = new Array(data[i].speakerCount);
				debateCell.speakers[0] = data[i].speaker;
				debateData.push(debateCell);
			}
			//if the debate is in the table, add only the new speaker
			else{
				
				debateData[data[i].debateID].speakers.push(data[i].speaker);
			}
			//link the speaker and debateIDs 
			var k = 0;
			for(k = 0; k < _senatorData.length; k++){
				if(_senatorData[k].name == data[i].speaker){
					_senatorData[k].debateIDs.push(data[i].debateID);
					break;
				}
			}

		}
		return debateData;
	}

	//--------------------------------------------------------------------------------------------------------------------
	//read in the data from a single year.  Even though this is in the "main()" namespace, it is effectively our MAIN function
	//--------------------------------------------------------------------------------------------------------------------
	function readSenatorCSV(year){
		var fileName = !year ? "data/Wordshoal_and_RC_positions_normalized.csv" : "data/EstimatesSenate1"+year+".csv";
		d3.csv(fileName, function(d){
			return {
				//NOTE: The original CSV file headers contain periods in them (e.g., theta.est).
				name: d.name ? d.name : d["member.name"],
				speaker: d.speaker,
				state: d.state,
				party: d.party,
				v: +d["ideal.est"],
				s: +d["theta.est"],
				votePos: +d["ideal.est.z"],
				speechPos: +d["theta.est.z"]
			//	thetaCilb: +d.thetacilb,
			//	thetaCiub: +d.thetaciub	
				};
			},
			function(error, senatorData){

				if(error) console.error(error);

				_senatorData = configureSenatorData(senatorData);

				//now that senators are read in, read in the debate data
				readDebateCSV();


			});
	}

	function readDebateCSV(){
		var fileName = "data/table_debateSpeaker_data.csv";
		d3.csv(fileName, function(d){
			return {
				debateID: d.debateID-1,
				speakerCount: +d.speakersN,
				congress: +d.congress,
				title: d.title,
				date: d.date,
				speaker: d["speaker.name"]
			}
		},
		function(error, debateData){
			if(error) console.error(error);
			_debateData = configureDebateData(debateData);
			initMainGraph();

		});

	}
	//--------------------------------------------------------------------------------------------------------------------
	//Draws the general level bar graph
	//--------------------------------------------------------------------------------------------------------------------
	function initMainGraph(){
			var graphData = _senatorData; 
			if(!_SCATTER_PLOT){
					_SCATTER_PLOT = new scatterPlot(_xPadding * 2 / 3, _mainHeight-(_yPadding / 2) - 30, 700, 700, _scatterSvg);
					_SCATTER_PLOT.setTitleY("Speech Position").setTitleX("Vote Position");
					global._SCATTER_PLOT = _SCATTER_PLOT;
				}
				//remove all of the previous svgs when loading a new year
			else
				_SCATTER_PLOT.destroyAll();	

			if(!_BAR_GRAPH){
				_BAR_GRAPH = new barGraph(_xPadding * 2 / 3, _barSvgHeight-(_yPadding / 2) - 30, _barWidth, _barHeight, _barSvg);
				_BAR_GRAPH.setTitle("Difference between Speech and Vote Positions").setTitleY("Delta").setTitleX("Senator");
				global._BAR_GRAPH = _BAR_GRAPH;
			}
			//remove all of the previous svgs when loading a new year
			else
				_BAR_GRAPH.destroyAll();	

			_BAR_GRAPH.setData(graphData);	
			_SCATTER_PLOT.setData(graphData);
			_BAR_GRAPH.coupleMouseEvents("bars", 0, 0, setViewLevel);
			_SCATTER_PLOT.coupleMouseEvents("points", 0, 0, setViewLevel);
	}

	//--------------------------------------------------------------------------------------------------------------------
	//Minifies the main graph when moving into Senator view
	//--------------------------------------------------------------------------------------------------------------------
	function minifyMainGraph(){
			var graphData = _senatorData; 
			var minifiedScatterSize = 250;
			global.minified = true;
			_BAR_GRAPH.minify();
			var miniScatter = d3.select("#scatterMiniSvg")
				.style("height", minifiedScatterSize)
				.style("width", minifiedScatterSize)
				.attr("viewBox", "0 0 " + (minifiedScatterSize + 50) + " " + (minifiedScatterSize+ 45))
				.attr("preserveAspectRatio", "xMidYMid");

			_scatterSvg.style("height", 0)

			_SCATTER_PLOT.minify(minifiedScatterSize);

			d3.select("#barSvg")
				.style("height", _minifiedBarSvgHeight)
				.attr("viewBox", "0 0 " + _mainWidth + " " + _minifiedBarSvgHeight)

			d3.select("#debatesSvg")
				.style("height", _mainHeight - _minifiedBarSvgHeight)
				.style("width", "100%")
				.attr("id", "topBar")
				.attr("viewBox", "0 0 " + _mainWidth + " " + (_mainHeight - _minifiedBarSvgHeight))
				.attr("preserveAspectRatio", "xMidYMid");

			_BAR_GRAPH.coupleMouseEvents("bars", 0, 0, setViewLevel);
			_SCATTER_PLOT.coupleMouseEvents("points", 0, 0, setViewLevel);

	}

	//--------------------------------------------------------------------------------------------------------------------
	//draws the timeline at the top.
	//--------------------------------------------------------------------------------------------------------------------
	function createYearButtons(){
		var yearButtonData = new Array(10);
		var i = 0;
		for(var year = 4; year< 14; i++, year++){
			yearButtonData[i] = {"year": "2" + pad(year, 3), "val": ""+pad(year,2), "id": i};
		}
		timeline(yearButtonData, 0, 60, _topBar, readYearCSV());
	}
	
	//--------------------------------------------------------------------------------------------------------------------
	//closure that returns an individual function for each button on the timeline, so that year's click feature loads the proper data
	//--------------------------------------------------------------------------------------------------------------------
	function readYearCSV(){
		var readYearCSVClosure = function(d, i){
			readSenatorCSV(d.val);
		}
		return readYearCSVClosure;
	}
	//--------------------------------------------------------------------------------------------------------------------
	//filters results on selecting different states
	//--------------------------------------------------------------------------------------------------------------------
	function setViewLevel(viewLevelStr){

		if(viewLevelStr == "general"){
			initMainGraph()
		}
		else if(viewLevelStr == "senator"){
			//minify the bar graph
			minifyMainGraph();
			
			//populate the debates window
			populateDebateWindow(global.currentSenator);

		}
		else{
			console.error("Improper view level set: " + viewLevelStr);
		}

	}

	function populateDebateWindow(senator){
		var debateNumCap = 20;
		var i = 0;
		var htmlStr = "";
		var debateSvgHeight = 50;
		var tickLength = 8;
		htmlStr += "<button class='sort' data-sort='ID'>Sort By ID</button>" + 
			"<button class='sort' data-sort='TITLE'>Sort By Title</button>" + 
			"<button class='sort' data-sort='DATE'>Sort By Date</button>" + 
			"<div class='row'><div class='col-md-1'><h3>ID</h3></div>" +
			"<div class='col-md-3'><h3>Title</h3></div>" +
			"<div class='col-md-2'><h3>Date</h3></div>" + 
			"<div class='col-md-6'><h3>Idealized Scores</h3></div>" +
			"<table><tbody class='list'>";
		//create a table displaying the debates this senator has participated in
		for(i = 0; i < debateNumCap; i++){
			var currDebate = _debateData[senator.debateIDs[i]];
			htmlStr += "<tr class='row'>" +
							"<td class='col-md-1 td ID'>" + i + "</td>" + 
							"<td class='col-md-3 td TITLE'>" + currDebate.title + "</td>" +
							"<td class='col-md-2 td DATE'>" + currDebate.date + "</td>" + 
							"<td class='col-md-6 td SCORE' id='debateCanvas" + i + "'></td>" +
						"</tr>";	
		}
		htmlStr += "</tbody></table>";
		document.getElementById("debatesCanvas").innerHTML = htmlStr; 
		for(i = 0; i < debateNumCap; i++){
			//create the svg
			d3.select("#debateCanvas" + i).append("svg")
				.attr("width", "100%")
				.attr("height", debateSvgHeight)
				.attr("id", "debateSvg" + i);
			//draw the main line
			d3.select("#debateSvg" + i).append("line")
				.attr("stroke-width", 2)
				.attr("stroke", "black")
				.attr("x1", 0)
				.attr("x2", "100%")
				.attr("y1", debateSvgHeight/2)
				.attr("y2", debateSvgHeight/2);
			var j;
			

			for(j = 0; j < _debateData[senator.debateIDs[i]].speakerCount; j++){
				var randomPos = Math.floor(Math.random() * 100); 
				//drawing the (temporarily) random positions representing senators calculated scores per debate
				d3.select("#debateSvg" + i).append("line")
					.attr("stroke-width", 2)
					.attr("stroke", "black")
					.attr("x1", String(randomPos) + "%")
					.attr("x2", String(randomPos) + "%")
					.attr("y1", debateSvgHeight/2 - tickLength)
					.attr("y2", debateSvgHeight/2 + tickLength);

			}
			var randomPos = Math.floor(Math.random() * 100); 
			d3.select("#debateSvg" + i).append("circle")
				.attr("class", "c_rep scatterPoint")
				.attr("r", 10)
				.attr("cx", String(randomPos) + "%")
				.attr("cy", debateSvgHeight/2);


			//instantiate the list for sorting
			var options = {
				valueNames: [ 'ID', 'TITLE', 'DATE', 'SCORE']
			}
			var userList = new List('debatesCanvas', options);
		}
	}



	
	//--------------------------------------------------------------------------------------------------------------------
	//filters results on selecting different states
	//--------------------------------------------------------------------------------------------------------------------
	function changeState(){
		global.activeStateFilter = "";
		_BAR_GRAPH.updateFilter();
	}

	global.activeStateFilter = "None";
	createStateList("stateDropDown");
	createYearButtons();
	readSenatorCSV();
}

controller();

function changeState(value){
	global.activeStateFilter = value;
	global._BAR_GRAPH.updateFilter(value);
}
