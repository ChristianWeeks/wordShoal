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

	this.mapSvg = d3.select("#usaMapContainer").append("svg")
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("viewBox", "0 0 " + width + " " + height)
		.attr("preserveAspectRatio", "xMidYMid");

	var svg = this.mapSvg;
	var stateSvgs = svg.selectAll("states").data(this.states).enter()
		.append("path")
		.style('stroke-width', 1)
		.style('fill', function(d){return d.properties.color})
		.style('stroke', '#555')
		.attr('id', function(d){return d.properties.postal + "_state";})
		.attr("d", path)
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

		d3.select("#AK_state").attr("transform", "translate(290,680) scale(0.7) rotate(-24)");
		d3.select("#HI_state").attr("transform", "translate(760,-40) rotate(-50)").moveToFront();
	
}
