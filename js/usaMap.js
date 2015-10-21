"use strict";

var usaMap = function(data){

	this.states = topojson.feature(data, data.objects.states).features;

	var width = 900,
		height = 600;

	var projection = d3.geo.mercator()
		.scale(500)
		.translate([width / 2, height / 2]);

	var projection = d3.geo.albers();
//		.center([20,45])
//		.rotate([0, 0])
//		.parallels([28, 58])
//		.scale(3000)
//		.translate([width / 2, height / 2]);
	var path = d3.geo.path()
		.projection(projection);

	//create the map
	this.mapSvg = d3.select("#usaMapContainer").append("svg")
		.attr("class", "simpleBorder")
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("viewBox", "0 0 " + width + " " + height)
		.attr("preserveAspectRatio", "xMidYMid");

	var svg = this.mapSvg;
	//Append the actual map
	var stateSvgs = svg.selectAll("states").data(this.states).enter()
		.append("path")
		.style('stroke-width', 1)
		.style('fill', function(d){return d.properties.color})
		.style('stroke', '#555')
		.attr('id', function(d){return d.properties.postal + "_state";})
		.attr("d", path)
		.attr("transform", "translate(-80,0)")
		.on("mouseover", function(d){
			d3.select(this).transition().style('stroke-width', 2)
			.style('stroke', 'black');
			d3.select(this).moveToFront();
			var senators = d.properties.senators;
			var senatorPtr;
			for(var i = 0; i < senators.length; i++){
				//senatorPtr = global._senatorMap[senators[i]];
				d3.select(senators[i].svgPoint).moveToFront().transition()
					.attr('r', 6)
					.attr('class', function(d) {return d.cssClass + ' mOver'});
				d3.select(senators[i].svgConfidenceLine).transition()
					.style('stroke-width', 4); 
				d3.select(senators[i].svgPointBox)
					.style("opacity", 1);
				d3.select(senators[i].svgDotgram).moveToFront().transition()
					.style('stroke-width', 3);
			}
		})
		.on("mouseout", function(d){
			d3.select(this).transition()
			.style('stroke-width', function(d){
				if(global.activeStateFilter != d.properties.postal)
					return 1;
				return 3;})
			.style('fill', function(d){return d.properties.color})
			.style('stroke', function(d){
				if(global.activeStateFilter != d.properties.postal)
					return '#555'
				return "black";});
			var senators = d.properties.senators;
			for(var i = 0; i < senators.length; i++){
				//highlight all senator points in both graphs
				d3.select(senators[i].svgPoint).transition()
					.attr('r', 2)
					.attr('class', function(d) {return d.cssClass});
				d3.select(senators[i].svgConfidenceLine).transition()
					.style('stroke-width', function(d){return d.strokeWidth;}); 
				d3.select(senators[i].svgPointBox).transition()
					.style("opacity", 0);
				d3.select(senators[i].svgDotgram).transition()
					.style('stroke-width', 0);
			}
		})
		.on("click", function(d){
			stateSvgs.style('stroke', '#555')
				.style('stroke-width', 1);	
			d3.select(this).transition().style('stroke-width', 3)
			.style('fill', function(d){ return d.properties.color - 1000;})
			.style('stroke', 'black');
			d3.select(this).moveToFront();
			var val = d.properties.postal;
			if(global.activeStateFilter == d.properties.postal){
				val = "None";
			}
			changeState(val)
			$("#stateDropdown").val(val);
		});
		
		//Append our gradient legend - first, we must create the gradient
		var gradient = svg.append("linearGradient")
			.attr("id", "mapGradient")
			.attr("gradientUnits", "objectBoundingBox")
			.attr("gradientTransform", "rotate(90)")
			.selectAll("stop")
			.data([
				{offset: "0%", color: "#4444ff"},
				{offset: "50%", color: "#fff0ff"},
				{offset: "100%", color: "#ff4444"}
				])
			.enter().append("stop")
	  		.attr("offset", function(d) { return d.offset; })
			.attr("stop-color", function(d) { return d.color; });

		var gradX = width - 100;
		var gradWidth = 25;
		var gradY = height / 2;
		var gradHeight = 200;
		var gradientLegend = svg.append("rect")
			.attr({
				x: gradX,
				width: gradWidth,
				y: gradY,
				height: gradHeight 
			})
			.style("fill", "url(#mapGradient)");
		var labelData = [
		{text: "Liberal", x: gradX+gradWidth/2, y: gradY-10, xAlign: "middle", yAlign: "middle", size: 14},
		{text: "Conservative", x: gradX+gradWidth/2, y: gradY+gradHeight+10, xAlign: "middle", yAlign: "middle", size: 14},
		{text: "Average", x: gradX+gradWidth+5, y: gradY+gradHeight/2-20, xAlign: "start", yAlign: "start", size: 16},
		{text: "Speech", x: gradX+gradWidth+5, y: gradY+gradHeight/2, xAlign: "start", yAlign: "start", size: 16},
		{text: "Score", x: gradX+gradWidth+5, y: gradY+gradHeight/2+20, xAlign: "start", yAlign: "start", size: 16}];
		var legendLabel = svg.selectAll("legendLabels")
			.data(labelData)
			.enter()
			.append("text")
			.attr("x", function(d){return d.x;})
			.attr("y", function(d){return d.y;})
			.attr("text-anchor", function(d){return d.xAlign;})
			.attr("alignment-baseline", function(d){return d.yAlign})
			.style("fill", "#555")
			.style("font-size", function(d){return d.size;})
			.text(function(d){return d.text;});


		//move Alaska and Hawaii onto our canvas
		d3.select("#AK_state").attr("transform", "translate(290,700) scale(0.7) rotate(-26)");
		d3.select("#HI_state").attr("transform", "translate(700,-40) rotate(-50)").moveToFront();

	
}
