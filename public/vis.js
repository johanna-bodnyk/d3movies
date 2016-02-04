var movies = _.map(d3m.data, function(movie) {
    movie.runtime = parseInt(movie.runtime.replace(" min", "")); // store it this way instead?
    return movie;
});

var moviesWithVotes = _.filter(movies, function(movie) {
    return movie.votes > 0;
});

// Defaults
var xData = "runtime";
var yData = "imdbRating";
var data = movies;
var currentChart;

var unitLabels = {
    runtime: "min.",
    imdbRating: "on IMDB",
    metascore: "meta score",
    votes: "vote(s)"
};

var scatterPlot = function() {
    var margin = {top: 40, right: 40, bottom: 40, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    data = _.filter(data, function(item) {
        return item[xData] != "N/A" && item[yData] != "N/A"; // check for numbers instead
    });

    var xDomain = _.pluck(data, xData);
    var x = d3.scale.linear()
        .domain([d3.min(xDomain), d3.max(xDomain)])
        .range([0, width]);

    var yDomain = _.pluck(data, yData);
    var y = d3.scale.linear()
        .domain([d3.min(yDomain), d3.max(yDomain)])
        .range([height, 0]);

    // Hide the bar chart, show the y-axis control
    d3.select("#y-axis-control").style("display", "inline");
    d3.select("#bar-chart").style("display", "none");

    var svg = d3.select("svg")
        .style("display", "inline-block")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10);
    var yAxis = d3.svg.axis().scale(y).orient("left").ticks(10);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    var dots = svg.selectAll("circle")
                .data(data, function(d) { return d.title; });

    dots.exit().remove();

    dots.enter().append("circle");

    dots
        .attr("cx", function(d) { return x(d[xData]); })
        .attr("cy", function(d) { return y(d[yData]); })
        .attr("r", 5);
}

var barChart = function() {
    data = _.filter(data, function(item) {
        return item[xData] != "N/A"; // check for a number instead
    }); 
    data = _.sortBy(data, function(item) {
        return item[xData];
    });

    var domain = _.pluck(data, xData);
    var x = d3.scale.linear()
        .domain([0, d3.max(domain)])
        .range([0, 100]);
    var c = d3.scale.linear()
        .domain([d3.min(domain), d3.max(domain)])
        .range([175,0]);

    // Hide the x-y graph and the y-axis selector
    d3.select("svg").style("display", "none");
    d3.select("#y-axis-control").style("display", "none");

    var bars = d3.select("#bar-chart")
                .style("display", "block")
                .selectAll("div")
                .data(data, function(d) { return d.title; });

    bars.exit().remove();
    
    bars.enter().append("div");

    bars
        .order()
        .style("background-color", function(d) { 
            var h = c(d[xData]);
            return d3.hsl(h, .75, .5).toString();
        })
        .text(function(d) { return d.title + " (" + d[xData] + " " + unitLabels[xData] + ")"; })
        .style("width", function(d) { return x(d[xData]) + "%"; });
}    

// Controls
$("a.nav").on("click", function(e) {
    if ($(this).hasClass("active")) {
        return;
    }
    var activeNav = $("a.nav.active");
    $(this).addClass("active");
    activeNav.removeClass("active");
    switch($(this).attr("id")) {
        case "bars":
            currentChart = barChart;
            break;
        case "xy":
            currentChart = scatterPlot;
            break;
        case "force":
            break;
    }
    currentChart();
});

$("#vote-filters button").on("click", function(e) {
    if ($(this).hasClass("pure-button-primary")) {
        return;
    } else {
        var otherButton = $('.pure-button-primary');
        $(this).addClass('pure-button-primary');
        otherButton.removeClass('pure-button-primary');
        data = $(this).data('filter') === "all" ? movies : moviesWithVotes;
        currentChart();
    }
});

$("#x-axis").on("change", function(e) {
    xData = $(this).find("option:selected").data('x');
    if (xData === "votes" && currentChart === barChart) {
        $("button#all-movies").prop("disabled", true);
        $("button#all-movies").removeClass("pure-button-primary");
        $("button#with-votes").addClass('pure-button-primary');
        data = moviesWithVotes;
    }
    else {
        $("button#all-movies").prop("disabled", false);
    }
    currentChart();
});

$("#y-axis").on("change", function(e) {
    yData = $(this).find("option:selected").data('y');
    currentChart();
});

// Show default chart
currentChart = barChart;
currentChart();
