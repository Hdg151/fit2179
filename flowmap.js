function renderRegionFlowMap() {
    const container = d3.select("#region_flow_map");
    const width = 900;
    const height = 400;
    const australiaTarget = [134, -25];

    const sourceCentroids = {
        "Oceania (ex Aust. born)": [165, -17],
        "North-West Europe": [10, 52],
        "Southern & Eastern Europe": [22, 44],
        "North Africa & Middle East": [35, 26],
        "South-East Asia": [105, 8],
        "North-East Asia": [120, 36],
        "Southern & Central Asia": [78, 24],
        "Americas": [-90, 15],
        "Sub-Saharan Africa": [20, 0]
    };

    container.selectAll("*").remove();
    container.append("h2")
        .text("Region of immigrant arrival to Australia (Flow Map)")
        .style("font-family", "system-ui, sans-serif")
        .style("font-size", "18px")
        .style("margin", "8px 0");

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("max-width", "100%")
        .style("height", "auto");

    const projection = d3.geoEqualEarth()
        .rotate([-150, 0, 0])
        .fitExtent([[12, 20], [width - 12, height - 14]], { type: "Sphere" });
    const path = d3.geoPath(projection);

    Promise.all([
        d3.json("ne_110m_admin_0_countries.json"),
        d3.csv("data/thumbnail_world_region_arrival.csv", d3.autoType)
    ]).then(([topology, rows]) => {
        if (!window.topojson || !topology || !topology.objects || !topology.objects.ne_110m_admin_0_countries) {
            throw new Error("TopoJSON parser or map topology is unavailable.");
        }

        const world = topojson.feature(topology, topology.objects.ne_110m_admin_0_countries);

        const flowRows = rows
            .filter((d) => d.region && sourceCentroids[d.region] && Number.isFinite(+d.no_2024))
            .map((d) => ({
                region: d.region,
                value: +d.no_2024,
                source: sourceCentroids[d.region],
                target: australiaTarget
            }));

        const valueExtent = d3.extent(flowRows, (d) => d.value);
        const lineWidth = d3.scaleSqrt().domain(valueExtent).range([1.5, 9]);
        const markerSize = d3.scaleSqrt().domain(valueExtent).range([3.5, 13]);
        const flowColor = d3.scaleSequential(d3.interpolateYlOrRd).domain([valueExtent[0], valueExtent[1]]);

        const targetGapPx = 14;

        const flowPath = (d) => {
            const [x1, y1] = projection(d.source);
            const [x2, y2] = projection(d.target);
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;
            const ex = x2 - (dx / len) * targetGapPx;
            const ey = y2 - (dy / len) * targetGapPx;
            const cx = (x1 + ex) / 2;
            const cy = (y1 + ey) / 2 - Math.max(18, Math.abs(ex - x1) * 0.12);
            return `M${x1},${y1} Q${cx},${cy} ${ex},${ey}`;
        };

        svg.append("path")
            .datum({ type: "Sphere" })
            .attr("d", path)
            .attr("fill", "#eaf2fb");

        svg.append("g")
            .selectAll("path")
            .data(world.features)
            .join("path")
            .attr("d", path)
            .attr("fill", (d) => d.properties.region === "Australia" ? "#f7f5cc" : "#d9d9d9")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 0.6);

        const defs = svg.append("defs");
        defs.append("marker")
            .attr("id", "flow-arrow")
            .attr("viewBox", "0 -3 6 6")
            .attr("refX", 6)
            .attr("refY", 0)
            .attr("markerUnits", "userSpaceOnUse")
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-3L6,0L0,3")
            .attr("fill", "#7f2704");

        svg.append("g")
            .selectAll("path")
            .data(flowRows.sort((a, b) => b.value - a.value))
            .join("path")
            .attr("d", flowPath)
            .attr("fill", "none")
            .attr("stroke", (d) => flowColor(d.value))
            .attr("stroke-width", (d) => lineWidth(d.value))
            .attr("stroke-linecap", "round")
            .attr("stroke-opacity", 0.82)
            .attr("marker-end", "url(#flow-arrow)")
            .append("title")
            .text((d) => `${d.region}: ${d.value.toLocaleString()} arrivals (2024)`);

        svg.append("g")
            .selectAll("circle")
            .data(flowRows)
            .join("circle")
            .attr("cx", (d) => projection(d.source)[0])
            .attr("cy", (d) => projection(d.source)[1])
            .attr("r", (d) => markerSize(d.value))
            .attr("fill", (d) => flowColor(d.value))
            .attr("fill-opacity", 0.85)
            .attr("stroke", "#5b1f00")
            .attr("stroke-width", 0.5)
            .append("title")
            .text((d) => `${d.region}: ${d.value.toLocaleString()} arrivals (2024)`);

        const [ax, ay] = projection(australiaTarget);
        svg.append("circle")
            .attr("cx", ax)
            .attr("cy", ay)
            .attr("r", 6)
            .attr("fill", "#7f2704")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.2)
            .append("title")
            .text("Australia destination");
    }).catch(console.error);
}

renderRegionFlowMap();