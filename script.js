document.addEventListener("DOMContentLoaded", function () {
  const drawMap = function (arr, obj1, obj2, obj3) {
    const counties = topojson.feature(arr, arr.objects.counties);
    const states = topojson.mesh(arr, arr.objects.states, (a, b) => {
      return a !== b;
    });
    const path = d3.geoPath();

    const edu = [];

    for (const [keys, values] of Object.entries(obj2)) {
      edu.push({ id: keys, education: values });
    }

    const minEdu = d3.min(edu, (e) => e.education);
    const maxEdu = d3.max(edu, (e) => e.education);

    const legendData = [];

    for (
      let i = minEdu;
      i <= maxEdu;
      i += (maxEdu - minEdu) / 5 - Number.EPSILON
    ) {
      legendData.push(i);
    }

    const w = 1200;
    const h = 600;
    const pad = { top: 20, bottom: 20, left: 20, right: 20 };
    const wLegend = 250;
    const hLegend = 100;
    const padLegend = { top: 20, bottom: 20, left: 20, right: 20 };
    const rectWidth =
      (wLegend - padLegend.left - padLegend.right) / legendData.length;

    const legendScale = d3
      .scaleLinear()
      .domain([minEdu, maxEdu])
      .range([padLegend.left, wLegend - padLegend.right])
      .nice();

    const legendAxis = d3.axisBottom(legendScale);

    const colorScale = d3
      .scaleLinear()
      .domain([minEdu, maxEdu])
      .range(["white", "blue"]);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .attr("id", "tooltip")
      .style("opacity", 0);

    const svg = d3
      .select("#container")
      .append("svg")
      .attr("id", "background")
      .attr("width", w)
      .attr("height", h);

    const legend = svg
      .append("svg")
      .attr("x", w - wLegend)
      .attr("width", wLegend)
      .attr("height", hLegend)
      .attr("class", "legend")
      .attr("id", "legend");

    legend
      .append("text")
      .attr("x", wLegend / 2 - 20)
      .attr("y", padLegend.top)
      .text("Legend");

    legend
      .selectAll("rect")
      .data(legendData)
      .enter()
      .append("rect")
      .attr("width", rectWidth)
      .attr("height", rectWidth)
      .attr("y", hLegend - padLegend.bottom - rectWidth - 20)
      .attr("x", (d, i) => rectWidth * i + padLegend.left)
      .attr("fill", (d) => colorScale(d));

    legend
      .append("g")
      .attr("transform", `translate(0,${hLegend - padLegend.bottom - 20})`)
      .call(legendAxis.tickFormat((d) => d + "%"));

    d3.select("#container")
      .append("text")
      .attr("id", "title")
      .text("US Higher Education rate")
      .attr("class", "title");

    d3.select("#container")
      .append("text")
      .attr("id", "description")
      .text(
        "This graph shows the percentage of people with a bachelor degree or higher in each county in the US"
      )
      .attr("class", "description");

    const map = svg
      .append("svg")
      .attr("id", "map")
      .attr("width", w - pad.right - pad.left)
      .attr("height", h - pad.bottom - pad.top);

    map
      .append("g")
      .selectAll("path")
      .data(counties.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("id", (d) => d.id)
      .attr("county-name", (d) => obj1[d.id])
      .attr("data-fips", (d) => d.id)
      .attr("data-education", (d) => obj2[d.id])
      .attr("fill", (d) => colorScale(obj2[d.id]))
      .attr("class", "county")
      .on("mouseover", (e, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.attr("data-education", obj2[d.id]);
        tooltip
          .style("position", "absolute")
          .style("top", e.pageY + "px")
          .style("left", e.pageX + "px");
        tooltip.html(
          `${obj1[d.id]}<br>State: ${obj3[d.id]}<br>Percentage: ${obj2[d.id]}%`
        );
      })
      .on("mouseout", () => {
        tooltip.transition().duration(200).style("opacity", 0);
      });

    const selection = svg.select("g").selectAll("path").attr("data-fips");

    map.append("path").datum(states).attr("d", path).attr("class", "states");

    svg.call(
      d3.zoom().on("zoom", (e) => {
        svg.attr("transform", e.transform);
      })
    );
  };

  Promise.all([
    d3.json(
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
    ),
    d3.json(
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
    )
  ]).then(([education, county]) => {
    const names = education.reduce((acc, d) => {
      acc[d.fips] = d["area_name"];
      return acc;
    }, {});

    const edu = education.reduce((acc, d) => {
      acc[d.fips] = d["bachelorsOrHigher"];
      return acc;
    }, {});

    const state = education.reduce((acc, d) => {
      acc[d.fips] = d["state"];
      return acc;
    }, {});

    drawMap(county, names, edu, state);
  });
});