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

    var _stateDataMap = {};
    var _stateData;

    var _BAR_GRAPH = null;
    var _SCATTER_PLOT = null;
    var _DEBATE_TABLE = null;
    var _USA_MAP = null;
    global.currentSenator = null;
    global.currentState = null;

    //dynamically resizing the side bar.
    d3.select('#sideBar1').style('height', (_mainHeight / 2) + 'px');

    //--------------------------------------------------------------------------------------------------------------------
    //Read in our senator data
    //--------------------------------------------------------------------------------------------------------------------
    function readSenatorCSV(year) {
        var fileName = !year ? 'data/US_Senate_104-113_senator_data.csv' : 'data/EstimatesSenate1' + year + '.csv';
        d3.csv(fileName, function(d) {
            return {
                //NOTE: The original CSV file headers contain periods in them (e.g., theta.est).
                speakerID: d.speakerID,
                name: d['first.name'] + ' ' + d['last.name'],
                speakerStr: d.speaker,
                state: d.state,
                party: d.party,
                v: +d['vote.score'],
                s: +d['speech.score'],
                upperBound: +d['speech.score.upper'],
                lowerBound: +d['speech.score.lower'],
                votePos: +d['vote.score.normalized'],
                speechPos: +d['speech.score.normalized']
                };
            },
            function(error, senatorData) {

                if (error) console.error(error);

                _senatorData = configureSenatorData(senatorData);

                //now that senators are read in, read in the debate data
                readStates();
                readDebateCSV();
            });
    }

    //--------------------------------------------------------------------------------------------------------------------
    //Configure the senator data into a format that can be properly bounded to and represented by the graph
    //--------------------------------------------------------------------------------------------------------------------
    function configureSenatorData(data) {
        var graphData = new Array(data.length);
        var voteMin, voteMax, speechMin, speechMax;
        var speechMagnitude;
        var isRandom = 0;
        var _fillC, _strokeC, _cssClass;
        for (var i = 0; i < data.length; i++) {
            //assign our colors
            if (data[i].party == 'R'){
                _cssClass = 'c_rep';
                _fillC = "#F99";
                _strokeC = "#F22";
            }
            else if (data[i].party == 'D'){
                _cssClass = 'c_dem';
                _fillC = "#99F";
                _strokeC = "#22F";
            }
            else{
                _cssClass = 'c_ind';
                _fillC = "#C8C";
                _strokeC = "#636";
            }
            graphData[i] = {
                //store all of the imported datum for display purposes
                datum: data[i],
                //store data directly relevant to the graph in the first level
                name: data[i].name,
                id: data[i].party,
                speechScore: data[i].s,
                r: 5,
                shape: 'circle',
                fillC: _fillC,
                strokeC: _strokeC,
                cssClass: _cssClass,
                debateIDs: new Array(),
                speechScores: {},
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
    //Read in our state data
    //--------------------------------------------------------------------------------------------------------------------
    function readStates(){
        d3.json("data/mapData/US_States.json", function(error, data){
            if(error) return console.error(error);
            _stateData = data;
            configureStateData();
        _USA_MAP = new usaMap(_stateData);
        });
    }

    //--------------------------------------------------------------------------------------------------------------------
    //Configure state data by linking it to senators and giving it the proper color
    //--------------------------------------------------------------------------------------------------------------------
    function configureStateData(){
        var dataPtr = _stateData.objects.states.geometries;

        for(var j = 0; j < dataPtr.length; j++){
            dataPtr[j].properties.senators = new Array();
            dataPtr[j].properties.scoreAvg = 0;
        }
        for(var i = 0; i < _senatorData.length; i++){
            for(var j = 0; j < dataPtr.length; j++){
                if(_senatorData[i].datum.state == dataPtr[j].properties.postal){
                    dataPtr[j].properties.senators.push(_senatorData[i]);
                    dataPtr[j].properties.scoreAvg += _senatorData[i].speechScore;
                }
            }
        }
        var colorScale = d3.scale.pow()
            .domain([-1.6, 0.0, 1.6])
            .range(["#1111ff", "#fff0ff", "#ff1111"])
        for(var j = 0; j < dataPtr.length; j++){
            dataPtr[j].properties.scoreAvg /= dataPtr[j].properties.senators.length;
            dataPtr[j].properties.color = colorScale(dataPtr[j].properties.scoreAvg);
        }
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
                rCount: 0,
                dCount: 0,
                iCount: 0,
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
            var party = _senatorMap[data[i].speakerID].id;
            if(party == 'R')
                debateData[data[i].debateID].rCount += 1;
            else if(party == 'D')
                debateData[data[i].debateID].dCount += 1;
            else
                debateData[data[i].debateID].iCount += 1;
            speakerIndex = debateData[data[i].debateID].speakerScores.length - 1;
            //link the speaker and debateIDs
            _senatorMap[data[i].speakerID].debateIDs.push(data[i].debateID);
            _senatorMap[data[i].speakerID].speechScores[data[i].debateID] = data[i].speakerScore;

        }
        return debateData;
    }
    //--------------------------------------------------------------------------------------------------------------------
    //Draws the general level bar graph
    //--------------------------------------------------------------------------------------------------------------------
    function initMainGraph() {
            var graphData = _senatorData;
            if (!_BAR_GRAPH) {
                _BAR_GRAPH = new histoDotgram({
                    title: 'Senator Speech Score Distribution',
                    titleY: 'Number of Senators',
                    titleX: 'Speech Score',
                    canvasWidth: 600,
                    canvasHeight: 300,
                    topPadding: 0,
                    botPadding: 0,
                    leftPadding: 20,
                    rightPadding: 20
                });

                _BAR_GRAPH.initCanvas('barCanvas', 'barSvg');
                global._BAR_GRAPH = _BAR_GRAPH;
            }
            //remove all of the previous svgs when loading a new year
            else
                _BAR_GRAPH.destroyAll();

            if (!_SCATTER_PLOT) {
                _SCATTER_PLOT = new scatterDist({
                    title: 'Senatorial Speech Scores',
                    titleX: 'Speech Score',
                    stateDataPtr: _stateData,
                    canvasWidth: 400,
                    canvasHeight: 850,
                    leftPadding: 20,
                    rightPadding: 20,
                    botPadding: 40,
                    topPadding: 10
                });
                _SCATTER_PLOT.initCanvas('scatterDist', 'scatterDistCanvas');
                global._SCATTER_PLOT = _SCATTER_PLOT;
            }
                //remove all of the previous svgs when loading a new year
            else
                _SCATTER_PLOT.destroyAll();

            global.senatorData = _senatorData;
            global.debateData = _debateData;
            global.senatorMap = _senatorMap;
            global.debateMap = _debateMap;
            global.stateData = _stateData;

            //give the graphs the data
            _BAR_GRAPH.setData(graphData);
            _SCATTER_PLOT.setData(graphData);
            _SCATTER_PLOT.coupleMouseEvents('points', setViewLevel);
            _SCATTER_PLOT.coupleMouseEvents('confidenceLines', setViewLevel);
            _SCATTER_PLOT.coupleMouseEvents('pointBox', setViewLevel);
			drawHelpBubble(_SCATTER_PLOT.canvasPtr, 'speech', '?',50, 30, speechHelpMouseClick);
            _BAR_GRAPH.coupleMouseEvents('dots', setViewLevel);
            if(!_DEBATE_TABLE){

                _DEBATE_TABLE = new debateTable({
                                'debateData': _debateData,
                                'senatorData':_senatorData,
                                'senatorMap':_senatorMap,
                                'debateMap' :_debateMap,
                                'mouseOver' :_SCATTER_PLOT.mouseOver,
                                'mouseOut' :_SCATTER_PLOT.mouseOut,
                                'mouseClick' :_SCATTER_PLOT.mouseClick});
            }
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
            //populate the debates window
            _DEBATE_TABLE.update({'senator' : global.currentSenator});
            _DEBATE_TABLE.sortBy('debateScore', 'descending');
            _DEBATE_TABLE.createDebateTable();
        }
        else {
            console.error('Improper view level set: ' + viewLevelStr);
        }
    }
	global.speechHelpClicked = 0;
	global.debateHelpClicked = 0;
    global.activeStateFilter = 'None';
    createStateList('stateDropDown');
    //--------------------------------------------------------------------------------------------------------------------
    //BEGIN OUR PROGRAM
    //--------------------------------------------------------------------------------------------------------------------
    readSenatorCSV();
}

controller();

//--------------------------------------------------------------------------------------------------------------------
//filters results on selecting different states
//--------------------------------------------------------------------------------------------------------------------
function changeState(value) {
    global.activeStateFilter = value;
    global._BAR_GRAPH.updateFilter(value);
    global._SCATTER_PLOT.updateFilter(value);
}
