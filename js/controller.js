"use strict";



function main(){
	var mainWidth = 1200;
	var mainHeight = 700;
	var barSvgHeight = 500;
	var topBarHeight = 80;
	var xPadding = 150;
	var yPadding = 150;
	var yBarPadding = 75;
	var scatterWidth = mainWidth - xPadding; 
	var scatterHeight = mainHeight - yPadding; 

	var barWidth= mainWidth - xPadding; 
	var barHeight = barSvgHeight - yPadding; 
	var BAR_GRAPH = null;
	var SCATTER_PLOT = null;
	var yearButtons = new Array(10);
	
	//dynamically resizing the side bar.
	d3.select("#sideBar1").style("height", (mainHeight/2) + "px");
	
	//This is our primary SVG that will hold the graph
	var scatterSvg = d3.select("#scatterCanvas").append("svg")
		.style("height", mainHeight)
		.style("width", "100%")
		.style("height", "100%")
		.attr("id", "scatterPlot")
		.attr("viewBox", "0 0 " + mainWidth + " " + mainHeight)
		.attr("preserveAspectRatio", "xMidYMid");

	var barSvg = d3.select("#barCanvas").append("svg")
		.style("height", barSvgHeight)
		.style("width", "100%")
		.style("height", "100%")
		.attr("id", "barCanvas")
		.attr("viewBox", "0 0 " + mainWidth + " " + barSvgHeight)
		.attr("preserveAspectRatio", "xMidYMid");

	//top bar contains buttons for loading different years of data and will contain later features
	var topBar = d3.select("#topButtonsBar").append("svg")
		.style("height", topBarHeight)
		.style("width", "100%")
		.attr("id", "topBar")
		.attr("viewBox", "0 0 " + mainWidth + " " + topBarHeight)
		.attr("preserveAspectRatio", "xMidYMid");

	//Creates the year filter buttons for the top bar
	//Configure the senator data into a format that can be properly bounded to and represented by the graph
	function configureData(data){
		var graphData = new Array(data.length);
		var voteMin, voteMax, speechMin, speechMax;
		var voteMagnitude, speechMagnitude;
		var isRandom = 0;
		voteMin = voteMax = speechMin = speechMax = 0;
		console.log(speechMin);
		console.log(speechMax);
		
		//First we find the magnitude to normalize all the values between 0 and 1.
		for(var i = 0; i < data.length; i++){
		//console.log(speechMin);
			if(data[i].speechPos > speechMax)
		//		console.log(data[i].speechPos);
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
				x: normalVote, 
				//----------------------------------------------------------------------------------------------------------------------
				y: normalSpeech,
				delta: normalSpeech - normalVote,
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

	//read in the data from a single year.  Even though this is in the "main()" namespace, it is effectively our MAIN function
	function readDataCSV(year){
		var fileName = !year ? "data/Wordshoal_and_RC_positions.csv" : "data/EstimatesSenate1"+year+".csv";
		d3.csv(fileName, function(d){
			return {
				//NOTE: The original CSV file headers contain periods in them (e.g., theta.est).
				name: d.name ? d.name : d["member.name"],
				speaker: d.speaker,
				state: d.state,
				party: d.party,
				votePos: +d["ideal.est"],
				speechPos: +d["theta.est"],
			//	thetaCilb: +d.thetacilb,
			//	thetaCiub: +d.thetaciub	
				};
			},
			function(error, senateData){

				if(error) console.error(error);

				var graphData = configureData(senateData);
				//generate the graph if this is the first call.  Else, just redraw the points
				if(!SCATTER_PLOT){
					SCATTER_PLOT = new scatterPlot(xPadding * 2 / 3, mainHeight-(yPadding / 2) - 30, scatterWidth, scatterHeight, scatterSvg);
					SCATTER_PLOT.setTitleY("Speech Position").setTitleX("Vote Position");
				}
				//remove all of the previous svgs when loading a new year
				else
					SCATTER_PLOT.destroyAll();	

				if(!BAR_GRAPH){
					BAR_GRAPH = new barGraph(xPadding * 2 / 3, barSvgHeight-(yPadding / 2) - 30, barWidth, barHeight, barSvg);
					BAR_GRAPH.setTitle("Difference between Speech Position and Vote Position").setTitleY("Delta").setTitleX("Senator");
				}
				//remove all of the previous svgs when loading a new year
				else
					BAR_GRAPH.destroyAll();	
				SCATTER_PLOT.setData(graphData);	
				BAR_GRAPH.setData(graphData);	
				SCATTER_PLOT.coupleMouseEvents("points",SCATTER_PLOT.x, SCATTER_PLOT.y);
				BAR_GRAPH.coupleMouseEvents("bars", SCATTER_PLOT.x, SCATTER_PLOT.y);
			});
	}

	//draws the timeline at the top.
	function createYearButtons(){
		var yearButtonData = new Array(10);
		var i = 0;
		for(var year = 4; year< 14; i++, year++){
			yearButtonData[i] = {"year": "2" + pad(year, 3), "val": ""+pad(year,2), "id": i};
		}
		timeline(yearButtonData, 0, 60, topBar, readYearCSV());
	}
	
	//closure that returns an individual function for each button on the timeline, so that year's click feature loads the proper data
	function readYearCSV(){
		var readYearCSVClosure = function(d, i){
			readDataCSV(d.val);
		}
		return readYearCSVClosure;
	}
	createYearButtons();
	readDataCSV();
}
main();

