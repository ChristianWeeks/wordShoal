"use strict";

//timeline is closure based, instead of prototype based, because it will only be created once.  Prototype therefore
//has no performance advantage, and so we get the advantage of a private scope without the cost of performance
function timeline(data, startX, startY, svgObject, readYearCSV){
	var cellWidth = 80;
	var cellHeight = 40;
	var mouseOver = yearMouseOver();
	var mouseOut = yearMouseOut();
	var mouseClick = yearMouseClick();
	var currentlyClicked = null;

	//the central horizontal line of the timeline
	var centerLine = svgObject.append("line")
		.style("stroke", "black")
		.style("stroke-width", "1px")
		.attr("x1", startX + cellWidth/2)
		.attr("y1", startY - cellHeight/2)
		.attr("x2", startX + data.length*cellWidth - cellWidth/2)
		.attr("y2", startY - cellHeight/2);
	
	//the vertical tickmarks for each year
	var yearTicks = svgObject.selectAll("#yearTick")
		.data(data)
		.enter()
		.append("line") 
		.style("stroke", "black")
		.style("stroke-width", "1px")
		.attr("id", "yearTick")
		.attr("x1", function(d, i){ d.yearTick = this; return i*cellWidth + cellWidth/2})
		.attr("y1", startY)
		.attr("x2", function(d, i){ return i*cellWidth + cellWidth/2})
		.attr("y2", startY - cellHeight);

	//these circles tell the user what year of data is currently active.
	var yearOn = svgObject.selectAll("#yearOn")
		.data(data)
		.enter()
		.append("circle")
		.style("fill", "#F77")
		.style("opacity", 0)
		.attr("id", "yearOn")
		.attr("cx", function(d, i){ d.yearOn = this; return i*cellWidth + cellWidth/2})
		.attr("cy", startY - cellHeight/2)
		.attr("r", 5);

	//text label giving the year
	var yearLabel = svgObject.selectAll("#yearLabel")
		.data(data)
		.enter()
		.append("text")
		.style("font-size", "16px")
		.attr("id", "yearLabel")
		.attr("text-anchor", "middle")
		.attr("alignment-baseline", "central")
		.attr("x", function(d, i){ d.yearLabel = this;return i*cellWidth + cellWidth/2})
		.attr("y", startY + 15)
		.text(function(d) { return d.year});

	//all the elements above are narrow, so this is a transparent box that will make it easy for the user to mouse over
	var yearMouseoverBox = svgObject.selectAll("#yearBox")
		.data(data)
		.enter()
		.append("rect")
		.style("fill", "red")
		.style("opacity", 0)
		.attr("id", "yearBox")
		.attr("x", function(d, i){d.yearBox = this;return i*cellWidth})
		.attr("y", startY - cellHeight)	
		.attr("width", cellWidth)
		.attr("height", cellHeight + 30)
		.on("mouseover", mouseOver)
		.on("mouseout", mouseOut)
		.on("click", mouseClick);

	function yearMouseOver(){
		var yearMouseOverClosure = function(d, i){
			if(currentlyClicked != d.id){
				d3.select(d.yearTick).transition().attr("y1", startY + 5).attr("y2", startY - cellHeight - 15).style("stroke-width", "3px")
				d3.select(d.yearLabel).transition().style("font-size", "25px");
			}
		}
		return yearMouseOverClosure;
	};

	function yearMouseClick(){
		var yearMouseClickClosure = function(d, i){
			//first deactivate all active svg elements
			d3.selectAll("#yearBox").transition().style("opacity", 0);
			d3.selectAll("#yearOn").transition().attr("r", 0);
			d3.selectAll("#yearTick").transition().attr("y1", startY).attr("y2", startY - cellHeight).style("stroke-width", "1px");
			d3.selectAll("#yearLabel").transition().style("font-size", "16px");

			//now highlight the current year's elements
			d3.select(d.yearBox).transition().style("opacity", .1);
			d3.select(d.yearOn).transition().attr("r", 10).style("opacity", 1);
			d3.select(d.yearTick).transition().attr("y1", startY + 5).attr("y2", startY - cellHeight - 15).style("stroke-width", "3px")
			d3.select(d.yearLabel).transition().style("font-size", "25px");
			currentlyClicked = d.id;
			readYearCSV(d, i);
		}
		return yearMouseClickClosure;
	};
	function yearMouseOut(){
		var yearMouseOutClosure = function(d, i){
			if(currentlyClicked != d.id){
				d3.select(d.yearBox).transition().style("opacity", 0);
				d3.select(d.yearTick).transition().attr("y1", startY).attr("y2", startY - cellHeight).style("stroke-width", "1px");
				d3.select(d.yearLabel).transition().style("font-size", "16px");
			}
		}
		return yearMouseOutClosure;
	};

}

