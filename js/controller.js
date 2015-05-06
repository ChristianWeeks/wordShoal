"use strict";

var global = function(){};
function controller(){
	var _mainWidth = 900;
	var _mainHeight = 900;
	var _barSvgHeight = 700;
	var _topBarHeight = 80;
	var _xPadding = 120;
	var _yPadding = 120;
	var _yBarPadding = 75;
	var _senatorData;
	var _minifiedBarSvgHeight = 120;

	var barWidth= _mainWidth - _xPadding; 
	var barHeight = _barSvgHeight - _yPadding; 
	var BAR_GRAPH = null;
	var yearButtons = new Array(10);
	
	//dynamically resizing the side bar.
	d3.select("#sideBar1").style("height", (_mainHeight/2) + "px");
	
	var barSvg = d3.select("#barCanvas").append("svg")
		.style("height", _barSvgHeight)
		.style("width", "100%")
		.style("height", "100%")
		.attr("id", "barSvg")
		.attr("viewBox", "0 0 " + _mainWidth + " " + _barSvgHeight)
		.attr("preserveAspectRatio", "xMidYMid");

	//top bar contains buttons for loading different years of data and will contain later features
	var topBar = d3.select("#topButtonsBar").append("svg")
		.style("height", _topBarHeight)
		.style("width", "100%")
		.attr("id", "topBar")
		.attr("viewBox", "0 0 " + _mainWidth + " " + _topBarHeight)
		.attr("preserveAspectRatio", "xMidYMid");

	var debatesSvg = d3.select("#debatesCanvas").append("svg").attr("id", "debatesSvg");

	//--------------------------------------------------------------------------------------------------------------------
	//Creates the year filter buttons for the top bar
	//Configure the senator data into a format that can be properly bounded to and represented by the graph
	//--------------------------------------------------------------------------------------------------------------------
	function configureData(data){
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

	//--------------------------------------------------------------------------------------------------------------------
	//read in the data from a single year.  Even though this is in the "main()" namespace, it is effectively our MAIN function
	//--------------------------------------------------------------------------------------------------------------------
	function readDataCSV(year){
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
				speechPos: +d["theta.est.z"],
			//	thetaCilb: +d.thetacilb,
			//	thetaCiub: +d.thetaciub	
				};
			},
			function(error, senatorData){

				if(error) console.error(error);
				_senatorData = configureData(senatorData);

				initMainGraph();
				//minifyMainGraph();

			});
	}

	//--------------------------------------------------------------------------------------------------------------------
	//Draws the general level bar graph
	//--------------------------------------------------------------------------------------------------------------------
	function initMainGraph(){
			var graphData = _senatorData; 

			if(!BAR_GRAPH){
				BAR_GRAPH = new barGraph(_xPadding * 2 / 3, _barSvgHeight-(_yPadding / 2) - 30, barWidth, barHeight, barSvg);
				BAR_GRAPH.setTitle("Difference between Speech and Vote Positions").setTitleY("Delta").setTitleX("Senator");
				global.BAR_GRAPH = BAR_GRAPH;
			}
			//remove all of the previous svgs when loading a new year
			else
				BAR_GRAPH.destroyAll();	

			BAR_GRAPH.setData(graphData);	
			BAR_GRAPH.coupleMouseEvents("bars", 0, 0, minifyMainGraph);
	}

	//--------------------------------------------------------------------------------------------------------------------
	//Minifies the main graph when moving into Senator view
	//--------------------------------------------------------------------------------------------------------------------
	function minifyMainGraph(){
			var graphData = _senatorData; 

			BAR_GRAPH.minify();

			d3.select("#barSvg")
				.style("height", _minifiedBarSvgHeight)
				.attr("viewBox", "0 0 " + _mainWidth + " " + _minifiedBarSvgHeight)

			d3.select("#debatesSvg")
				.style("height", _mainHeight - _minifiedBarSvgHeight)
				.style("width", "100%")
				.attr("id", "topBar")
				.attr("viewBox", "0 0 " + _mainWidth + " " + (_mainHeight - _minifiedBarSvgHeight))
				.attr("preserveAspectRatio", "xMidYMid");

			BAR_GRAPH.coupleMouseEvents("bars", 0, 0, minifyMainGraph);

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
		timeline(yearButtonData, 0, 60, topBar, readYearCSV());
	}
	
	//--------------------------------------------------------------------------------------------------------------------
	//closure that returns an individual function for each button on the timeline, so that year's click feature loads the proper data
	//--------------------------------------------------------------------------------------------------------------------
	function readYearCSV(){
		var readYearCSVClosure = function(d, i){
			readDataCSV(d.val);
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


		}
		else{
			console.error("Improper view level set: " + viewLevelStr);
		}

	}
	//--------------------------------------------------------------------------------------------------------------------
	//filters results on selecting different states
	//--------------------------------------------------------------------------------------------------------------------
	function changeState(){
		global.activeStateFilter = "";
		BAR_GRAPH.updateFilter();
	}

	global.activeStateFilter = "None";
	createStateList("stateDropDown");
	createYearButtons();
	readDataCSV();
}

controller();

function changeState(value){
	global.activeStateFilter = value;
	global.BAR_GRAPH.updateFilter(value);
}
