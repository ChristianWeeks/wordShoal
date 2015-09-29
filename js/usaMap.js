"use strict";

var usaMap = function(data){

	console.log(data);
	this.states = topojson.feature(data, data.objects.states).features;

	console.log(this.states);
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
		.attr("width", width)
		.attr("height", height)
//		.attr("viewBox", "0 0 " + width + " " + height)
//		.attr("preserveAspectRatio", "xMidYMid");

	var svg = this.mapSvg
		svg.selectAll("states").data(this.states).enter()
		.append("path")
		.style('stroke-width', 1)
		.style('fill', function(d){return d.properties.color})
		.style('stroke', '#555')
		.attr('id', function(d){return d.properties.name + "_state";})
		.attr("d", path)
		.on("mouseover", function(d){
			d3.select(this).transition().style('stroke-width', 2)
			.style('fill', function(d){ return d.properties.color - 1000;})
			.style('stroke', 'black');
			d3.select(this).moveToFront();
		})
		.on("mouseout", function(d){
			d3.select(this).transition()
			.style('stroke-width', 1)
			.style('fill', function(d){return d.properties.color})
			.style('stroke', '#555');
		})
		.on("click", function(d){
			changeState(d.properties.postal)
		});

		d3.select("#Alaska_state").attr("transform", "translate(290,680) scale(0.7) rotate(-24)");
		d3.select("#Hawaii_state").attr("transform", "translate(760,-40) rotate(-50)").moveToFront();
	console.log("END OF USA MAP");
	
}
