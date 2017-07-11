document.addEventListener("DOMContentLoaded", function (event) {
	"use strict";

	var data_path = FV.hydrograph_data_path;


	// Set the dimensions of the canvas / graph
	var margin = {top: 30, right: 20, bottom: 30, left: 50};
	var width = FV.chart_dimensions.width - margin.left - margin.right;
	var height = FV.chart_dimensions.height - margin.top - margin.bottom;

	// Set the ranges
	var x = d3.scaleTime().range([0, width]);
	var y = d3.scaleLog().range([height, 0]);

	// Define the voronoi
	var voronoi = d3.voronoi()
		.x(function (d) {
			return x(d.time_mili);
		})
		.y(function (d) {
			return y(d.value);
		})
		.extent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]])

	// Define the line
	var line = d3.line()
		.x(function (d) {
			return x(d.time_mili);
		})
		.y(function (d) {
			return y(d.value);
		});

	// Adds the svg canvas
	var svg = d3.select("#hydrograph")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform",
			"translate(" + margin.left + "," + margin.top + ")");

	// Get the data
	d3.json(data_path, function (error, data) {
		
		data.forEach(function (d) {
			d.value = Number(d.value);
		});

		// Scale the range of the data
		x.domain(d3.extent(data, function (d) {
			return d.time_mili;
		}));
		y.domain([20, d3.max(data, function (d) {
			return d.value;
		})]);

		// Nest the entries by site number
		var dataNest = d3.nest()
			.key(function (d) {
				return d.key;
			})
			.entries(data);

		// Loop through each symbol / key
		dataNest.forEach(function (d) {
			var map_site = document.getElementById('map' + d.key);
			map_site.classList.add('accent');
			svg.append("g")
				.attr('class', 'gages')
				.append("path")
				.attr("id", "hydro" + d.key)
				.attr("d", line(d.values));
		});

		// Add the X Axis
		svg.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x).tickFormat(d3.timeFormat("%B %e")));

		// Add the Y Axis
		svg.append("g")
			.attr("class", "axis")
			.call(d3.axisLeft(y).ticks(10, ".0f"));

		var focus = svg.append("g")
			.attr("transform", "translate(-100,-100)")
			.attr("class", "focus");
		
		focus.append("circle")
			.attr("r", 3.5);

		focus.append("text")
			.attr("y", -10);

		var voronoiGroup = svg.append("g")
			.attr("class", "voronoi");

		voronoiGroup.selectAll("path")
			.data(voronoi.polygons(d3.merge(dataNest.map(function (d) {
				return d.values
			}))))
			.enter().append("path")
			.attr("d", function (d) {
				return d ? "M" + d.join("L") + "Z" : null;
			})
			.on("mouseover", mouseover)
			.on("mouseout", mouseout)
			.on("click", click);

		// Event Functions
		function mouseover(d) {
			d3.select(d.data.name).classed("gage--hover", true);
			focus.attr("transform", "translate(" + x(d.data.time_mili) + "," + y(d.data.value) + ")");
			focus.select("text").html(d.data.key + ": " + d.data.value + " cfs " + " " + d.data.time + " " + d.data.timezone);
			
			// Interative linking with map
			var map_site = document.getElementById('map'+d.data.key);
			var cords = map_site.getBoundingClientRect();
			var maptip = d3.select('#maptip');
			maptip.transition().duration(500);
			maptip.style("display", "inline-block")
				.style("left", cords.left + 10 + "px")
				.style("top", (cords.top - 50) + "px")
				.html((d.data.name));
		}

		function mouseout(d) {
			d3.select(d.data.name).classed("gage--hover", false);
			focus.attr("transform", "translate(-100,-100)");
			// Interative linking with map
			var maptip = d3.select('#maptip');
			maptip.style("display", "none");
		}

		function click(d){
			// Interative linking with map
			var map_site = document.getElementById('map'+d.data.key);
			map_site.classList.remove('accent');
		}

	});
});