const width = 500;
const height = 320;

const color = d3.scaleOrdinal()
  .range([
    "#88CCEE",
    "#DDCC77",
    "#FE6100",
    "#AA4499",
    "#332288",
    "#CC6677",
    "#111111"
  ]);

let treemapTotalValue = 0;

function formatTreemapTooltip(d) {
  const value = d3.format(",")(d.value);
  const percentage = treemapTotalValue > 0 ? d3.format(".1%")(d.value / treemapTotalValue) : "0%";
  const path = d.ancestors()
    .map(function(node) { return node.data.name; })
    .reverse()
    .slice(1)
    .join(" / ");

  const details = "Count: " + value + "<br>Share: " + percentage;
  return path ? path + "<br>" + details : details;
}

function showTreemapTooltip(tooltip, event, d) {
  tooltip
    .style("opacity", 1)
    .html(formatTreemapTooltip(d))
    .style("left", (event.pageX + 14) + "px")
    .style("top", (event.pageY - 14) + "px");
}

function moveTreemapTooltip(tooltip, event) {
  tooltip
    .style("left", (event.pageX + 14) + "px")
    .style("top", (event.pageY - 14) + "px");
}

function hideTreemapTooltip(tooltip) {
  tooltip.style("opacity", 0);
}

function wrapSvgText(textSelection, width, lineHeight, maxLines) {
  textSelection.each(function() {
    const text = d3.select(this);
    const fullText = text.text();
    const chars = fullText.split("");
    const x = text.attr("x") || 0;
    const y = text.attr("y") || 0;
    const dy = parseFloat(text.attr("dy")) || 0;

    text.text(null);

    let line = [];
    let lineNumber = 0;
    let tspan = text.append("tspan")
      .attr("x", x)
      .attr("y", y)
      .attr("dy", dy + "em");

    for (let i = 0; i < chars.length; i++) {
      line.push(chars[i]);
      tspan.text(line.join(""));

      if (tspan.node().getComputedTextLength() > width && line.length > 1) {
        line.pop();
        tspan.text(line.join(""));
        line = [chars[i]];
        lineNumber += 1;

        if (lineNumber >= maxLines - 1) {
          const remaining = chars.slice(i).join("");
          tspan = text.append("tspan")
            .attr("x", x)
            .attr("y", y)
            .attr("dy", lineHeight + "em")
            .text(remaining);
          return;
        }

        tspan = text.append("tspan")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", lineHeight + "em")
          .text(chars[i]);
      }
    }
  });
}

// title: 

d3.csv("data/immi_count_2024.csv").then(function(data) {
  data.forEach(function(d) {
    d.no_2024 = +d.no_2024;
  });

  // Sort countries by 2024 count and take top 20
  const sorted = data.sort(function(a, b) { return b.no_2024 - a.no_2024; });
  const topN = 20;
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);

  // Build hierarchy: one parent for Top 20 (with children) and one node for Other
  const topChildren = top.map(function(d) { return { name: d.Country, value: d.no_2024 }; });
  const otherSum = d3.sum(rest, function(d) { return d.no_2024; });

  const children = [
    { name: 'Top 20', children: topChildren },
  ];
  if (otherSum > 0) children.push({ name: 'Other', value: otherSum });

  const root = d3.hierarchy({ name: "European Cities", children: children })
    .sum(function(d) { return d.value; })
    .sort(function(a, b) { return b.value - a.value; });

  treemapTotalValue = root.value;

  d3.treemap()
    .size([width, height])
    .paddingInner(2)
    .paddingOuter(0)
    .round(true)(root);

  const svg = d3.select("#treemap")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("font", "14px sans-serif");

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "treemap-tooltip")
    .style("opacity", 0);

  // Draw group rectangles for depth-1 nodes (e.g., 'Top 20') so it appears as one block
  const groups = svg.selectAll("g.group")
    .data(root.children)
    .enter()
    .append("g")
    .attr("class", "group")
    .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

  groups.append("rect")
    .attr("width", function(d) { return d.x1 - d.x0; })
    .attr("height", function(d) { return d.y1 - d.y0; })
    .attr("fill", function(d) { return d.data.name === 'Other' ? '#bdbdbd' : '#f5f5f5'; })
    .attr("stroke", "#ccc")
    .style("cursor", "default")
    .on("mouseenter", function(event, d) {
      showTreemapTooltip(tooltip, event, d);
    })
    .on("mousemove", function(event) {
      moveTreemapTooltip(tooltip, event);
    })
    .on("mouseleave", function() {
      hideTreemapTooltip(tooltip);
    });

  groups.append("text")
    .attr("x", 6)
    .attr("y", 16)
    .attr("fill", "#333")
    .style("font-weight", "700")
    .text(function(d) { return d.data.name; });

  // draw leaves (depth >= 2 and also 'Other' which is depth 1 but a leaf)
  const leaves = svg.selectAll("g.leaf")
    .data(root.leaves())
    .enter()
    .append("g")
    .attr("class", "leaf")
    .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

  leaves.append("rect")
    .attr("width", function(d) { return d.x1 - d.x0; })
    .attr("height", function(d) { return d.y1 - d.y0; })
    .attr("fill", function(d, i) { return d.data.name === 'Other' ? '#bdbdbd' : color(i); })
    .attr("stroke", "#fff")
    .style("cursor", "default")
    .on("mouseenter", function(event, d) {
      showTreemapTooltip(tooltip, event, d);
    })
    .on("mousemove", function(event) {
      moveTreemapTooltip(tooltip, event);
    })
    .on("mouseleave", function() {
      hideTreemapTooltip(tooltip);
    });

  leaves.append("clipPath")
    .attr("id", function(d, i) { return "leaf-clip-" + i; })
    .append("rect")
    .attr("width", function(d) { return d.x1 - d.x0; })
    .attr("height", function(d) { return d.y1 - d.y0; });

  leaves.append("text")
    .attr("x", 8)
    .attr("y", 18)
    .attr("fill", "white")
    .style("font-weight", "600")
    .style("font-size", function(d) {
      const boxWidth = d.x1 - d.x0;
      const boxHeight = d.y1 - d.y0;
      return Math.max(9, Math.min(12, Math.min(boxWidth / 12, boxHeight / 8))) + "px";
    })
    .attr("clip-path", function(d, i) { return "url(#leaf-clip-" + i + ")"; })
    .text(function(d) { return d.data.name; });

  wrapSvgText(leaves.selectAll("text").filter(function(_, i) { return i === 0; }), 110, 1.1, 3);
});