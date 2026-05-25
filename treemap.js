const width = 600;
const height = 320;

const color = d3.scaleOrdinal()
  .range([
    "#2F4B7C",
    "#665191",
    "#A05195",
    "#D45087",
    "#F95D6A",
    "#FF7C43",
    "#FFA600"
  ]);

d3.csv("data/immi_count_2024.csv").then(function(data) {
  data.forEach(function(d) {
    d.daily_cost = +d.daily_cost;
  });

  const root = d3.hierarchy({
    name: "European Cities",
    children: data.map(function(d) {
      return {
        name: d.Country,
        value: d.no_2024
      };
    })
  })
  .sum(function(d) {
    return d.value;
  })
  .sort(function(a, b) {
    return b.value - a.value;
  });

  d3.treemap()
    .size([width, height])
    .paddingInner(4)
    .paddingOuter(8)
    .round(true)(root);

  const svg = d3.select("#arrival_countries")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("font", "14px sans-serif");

  const leaf = svg.selectAll("g")
    .data(root.leaves())
    .enter()
    .append("g")
    .attr("transform", function(d) {
      return "translate(" + d.x0 + "," + d.y0 + ")";
    });

  leaf.append("rect")
    .attr("width", function(d) {
      return d.x1 - d.x0;
    })
    .attr("height", function(d) {
      return d.y1 - d.y0;
    })
    .attr("fill", function(d, i) {
      return color(i);
    })
    .attr("stroke", "#fff");

  leaf.append("text")
    .attr("x", 8)
    .attr("y", 20)
    .attr("fill", "white")
    .style("font-weight", "600")
    .text(function(d) {
      return d.data.name;
    });

  leaf.append("text")
    .attr("x", 8)
    .attr("y", 38)
    .attr("fill", "white")
    .style("font-size", "12px")
    .text(function(d) {
      return "$" + d.data.value;
    });
});