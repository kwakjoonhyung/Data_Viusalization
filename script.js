// Define the attributes manually
const attributes = [
    'time', 'use [kW]', 'gen [kW]', 'House overall [kW]', 'Dishwasher [kW]',
    'Furnace 1 [kW]', 'Furnace 2 [kW]', 'Home office [kW]', 'Fridge [kW]',
    'Wine cellar [kW]', 'Garage door [kW]', 'Kitchen 12 [kW]', 'Kitchen 14 [kW]',
    'Kitchen 38 [kW]', 'Barn [kW]', 'Well [kW]', 'Microwave [kW]',
    'Living room [kW]', 'Solar [kW]', 'temperature', 'icon', 'humidity',
    'visibility', 'summary', 'apparentTemperature', 'pressure', 'windSpeed',
    'cloudCover', 'windBearing', 'precipIntensity', 'dewPoint', 'precipProbability'
];

// Populate dropdown menus
var xSelect = d3.select("#xAttribute");
var ySelect = d3.select("#yAttribute");

attributes.forEach(function(attr) {
    xSelect.append("option").text(attr).attr("value", attr);
    ySelect.append("option").text(attr).attr("value", attr);
});

// Function to calculate statistics
function calculateStatistics(data, attr) {
    const values = data.map(d => d[attr]).filter(d => !isNaN(d));
    const mean = d3.mean(values);
    const median = d3.median(values);
    const stddev = d3.deviation(values);

    return { mean, median, stddev };
}

// Function to display statistics
function displayStatistics(stats, id) {
    d3.select(`#${id}Mean`).text(`Mean: ${stats.mean ? stats.mean.toFixed(2) : 'N/A'}`);
    d3.select(`#${id}Median`).text(`Median: ${stats.median ? stats.median.toFixed(2) : 'N/A'}`);
    d3.select(`#${id}StdDev`).text(`Standard Deviation: ${stats.stddev ? stats.stddev.toFixed(2) : 'N/A'}`);
}

// Function to create scatter plot
function createScatterPlot(data, xAttr, yAttr) {
    // Create the new plot
    var svg = d3.select("#plot").append("svg")
        .attr("width", 800)
        .attr("height", 500);

    var x = d3.scaleLinear().range([50, 750]);
    var y = d3.scaleLinear().range([450, 50]);

    x.domain(d3.extent(data, function(d) { return d[xAttr]; }));
    y.domain(d3.extent(data, function(d) { return d[yAttr]; }));

    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisLeft(y);

    svg.append("g")
        .attr("transform", "translate(0,450)")
        .call(xAxis);

    svg.append("g")
        .attr("transform", "translate(50,0)")
        .call(yAxis);

    // Set up the color scale
    var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", function(d) { return x(d[xAttr]); })
        .attr("cy", function(d) { return y(d[yAttr]); })
        .attr("r", 3)
        .attr("fill", function(d) { return colorScale(d[xAttr]); });

    console.log("Scatter plot created with X attribute:", xAttr, "and Y attribute:", yAttr);
}

// Function to create zoomable area chart
function createZoomableAreaChart(data, xAttr, yAttr) {
    const width = 928;
    const height = 500;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 30;

    const x = d3.scaleUtc()
        .domain(d3.extent(data, d => d[xAttr]))
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[yAttr])]).nice()
        .range([height - marginBottom, marginTop]);

    const xAxis = (g, x) => g
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    const area = (data, x) => d3.area()
        .curve(d3.curveStepAfter)
        .x(d => x(d[xAttr]))
        .y0(y(0))
        .y1(d => y(d[yAttr]))
        (data);

    const zoom = d3.zoom()
        .scaleExtent([1, 32])
        .extent([[marginLeft, 0], [width - marginRight, height]])
        .translateExtent([[marginLeft, -Infinity], [width - marginRight, Infinity]])
        .on("zoom", zoomed);

    const svg = d3.select("#plot").append("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto;");

    const clip = "clip";

    svg.append("clipPath")
        .attr("id", clip)
        .append("rect")
        .attr("x", marginLeft)
        .attr("y", marginTop)
        .attr("width", width - marginLeft - marginRight)
        .attr("height", height - marginTop - marginBottom);

    // Set up the color scale for the area chart
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const path = svg.append("path")
        .attr("clip-path", `url(#${clip})`)
        .attr("fill", color(0))
        .attr("d", area(data, x));

    const gx = svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis, x);

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).ticks(null, "s"))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("Value"));

    function zoomed(event) {
        const xz = event.transform.rescaleX(x);
        path.attr("d", area(data, xz));
        gx.call(xAxis, xz);
    }

    svg.call(zoom)
        .transition()
        .duration(750)
        .call(zoom.scaleTo, 4, [x(Date.UTC(2001, 8, 1)), 0]);

    console.log("Zoomable area chart created with X attribute:", xAttr, "and Y attribute:", yAttr);
}

// Load the data
d3.csv("HomeC.csv").then(function(data) {
    console.log("Data loaded:", data);

    // Plot the data
    d3.select("#plotButton").on("click", function() {
        var xAttr = xSelect.node().value;
        var yAttr = ySelect.node().value;

        console.log("Selected X Attribute:", xAttr);
        console.log("Selected Y Attribute:", yAttr);

        // Remove any existing plot
        d3.select("#plot").selectAll("*").remove();

        // Parse the data correctly
        data.forEach(function(d) {
            d[xAttr] = +d[xAttr];
            d[yAttr] = +d[yAttr];
        });

        // Calculate and display statistics
        const xStats = calculateStatistics(data, xAttr);
        const yStats = calculateStatistics(data, yAttr);
        displayStatistics(xStats, "x");
        displayStatistics(yStats, "y");

        // Choose which chart to create based on the attribute type
        if (xAttr === 'time' && yAttr !== 'time') {
            createZoomableAreaChart(data, xAttr, yAttr);
        } else {
            createScatterPlot(data, xAttr, yAttr);
        }
    });
}).catch(function(error) {
    console.error('Error loading or parsing data:', error);
});
