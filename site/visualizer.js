async function visualize() {
  let data = await d3.json("/trips.json");

  const INDICES = {
    tripDuration: 0,
    startTime: 1,
    startStationId: 2,
    endStationId: 3,
    userType: 4,
    riderAge: 5,
    gender: 6,
    wind: 7,
    precipitation: 8,
    temp: 9,
    canopy: 10,
    residential: 11,
    commercial: 12,
    industrial: 13,
  };

  window.rawData = data;

  // Various formatters.
  const formatNumber = d3.format(",d");

  const xfilter = crossfilter(data);
  const all = xfilter.groupAll();

  const date = xfilter.dimension((d) => new Date(d[INDICES.startTime]));
  const dates = date.group(d3.timeDay);

  const dow = xfilter.dimension(
    (d) => (new Date(d[INDICES.startTime]).getDay() + 1) % 7
  );
  const dowGroups = dow.group();

  const gender = xfilter.dimension((d) => d[INDICES.gender]);
  const genderGroups = dow.group();

  const age = xfilter.dimension((d) => d[INDICES.riderAge]);
  const ageGroups = age.group();

  const hour = xfilter.dimension(
    (d) =>
      new Date(d[INDICES.startTime]).getHours() +
      new Date(d[INDICES.startTime]).getMinutes() / 60
  );
  const hours = hour.group(Math.floor);

  const duration = xfilter.dimension((d) => d[INDICES.tripDuration]);
  const durations = duration.group((d) => Math.floor(d / 10) * 10);

  const precipitation = xfilter.dimension((d) => d[INDICES.precipitation]);
  const precipitationGroups = precipitation.group(
    (d) => Math.floor(d * 100) / 100
  );

  const temp = xfilter.dimension((d) => d[INDICES.temp]);
  const tempGroups = temp.group((d) => Math.floor(d / 1));

  const wind = xfilter.dimension((d) => d[INDICES.wind]);
  const windGroups = wind.group((d) => Math.floor(d * 10) / 10);

  const canopyPercent = xfilter.dimension((d) => d[INDICES.canopy]);
  const canopyPercentGroups = canopyPercent.group();

  const residential = xfilter.dimension((d) => d[INDICES.residential]);
  const residentialGroups = residential.group();

  const commercial = xfilter.dimension((d) => d[INDICES.commercial]);
  const commercialGroups = commercial.group();

  const industrial = xfilter.dimension((d) => d[INDICES.industrial]);
  const industrialGroups = industrial.group();

  const charts = [
    barChart()
      .dimension(hour)
      .group(hours)
      .x(
        d3
          .scaleLinear()
          .domain([0, 24])
          .rangeRound([0, 10 * 24])
      ),

    barChart()
      .dimension(dow)
      .group(dowGroups)
      .x(
        d3
          .scaleLinear()
          .domain([0, 7])
          .rangeRound([0, 17 * 7])
      ),

    barChart()
      .dimension(duration)
      .group(durations)
      .x(
        d3
          .scaleLinear()
          .domain([0, 6000])
          .rangeRound([0, 10 * 40])
      ),

    barChart()
      .dimension(age)
      .group(ageGroups)
      .x(
        d3
          .scaleLinear()
          .domain([0, 100])
          .rangeRound([0, 10 * 30])
      ),

    // // barChart().dimension(gender).group(genderGroups),

    barChart()
      .dimension(date)
      .group(dates)
      .round(d3.timeDay.round)
      .x(
        d3
          .scaleTime()
          .domain([new Date(2019, 0, 1), new Date(2019, 12, 1)])
          .rangeRound([0, 10 * 90])
      ),

    // // barChart()
    // //   .dimension(precipitation)
    // //   .group(precipitationGroups)
    // //   .x(
    // //     d3
    // //       .scaleLinear()
    // //       .domain([0.1, 1])
    // //       .rangeRound([0, 10 * 40])
    // //   ),

    barChart()
      .dimension(temp)
      .group(tempGroups)
      .x(
        d3
          .scaleLinear()
          .domain([0, 100])
          .rangeRound([0, 10 * 40])
      ),

    barChart()
      .dimension(wind)
      .group(windGroups)
      .x(
        d3
          .scaleLinear()
          .domain([0, 20])
          .rangeRound([0, 10 * 40])
      ),

    barChart()
      .dimension(canopyPercent)
      .group(canopyPercentGroups)
      .x(
        d3
          .scaleLinear()
          .domain([0, 1])
          .rangeRound([0, 10 * 20])
      ),

    barChart()
      .dimension(residential)
      .group(residentialGroups)
      .x(
        d3
          .scaleLinear()
          .domain([0, 1])
          .rangeRound([0, 10 * 20])
      ),

    barChart()
      .dimension(commercial)
      .group(commercialGroups)
      .x(
        d3
          .scaleLinear()
          .domain([0, 0.7])
          .rangeRound([0, 10 * 20])
      ),

    barChart()
      .dimension(industrial)
      .group(industrialGroups)
      .x(
        d3
          .scaleLinear()
          .domain([0, 0.2])
          .rangeRound([0, 10 * 20])
      ),
  ];

  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display.
  const chart = d3.selectAll(".chart").data(charts);

  // // Render the initial lists.
  // const list = d3.selectAll(".list").data([flightList]);

  // Render the total.
  d3.selectAll("#total").text(formatNumber(xfilter.size()));

  renderAll();

  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    chart.each(render);
    // list.each(render);
    d3.select("#active").text(formatNumber(all.value()));
  }

  // Like d3.timeFormat, but faster.
  function parseDate(d) {
    return new Date(
      2019,
      d.substring(0, 2) - 1,
      d.substring(2, 4),
      d.substring(4, 6),
      d.substring(6, 8)
    );
  }

  window.filter = (filters) => {
    filters.forEach((d, i) => {
      charts[i].filter(d);
    });
    renderAll();
  };

  window.reset = (i) => {
    charts[i].filter(null);
    renderAll();
  };

  function barChart() {
    if (!barChart.id) barChart.id = 0;

    let margin = { top: 10, right: 13, bottom: 20, left: 10 };
    let x;
    let y = d3.scaleLinear().range([100, 0]);
    const id = barChart.id++;
    const axis = d3.axisBottom();
    const brush = d3.brushX();
    let brushDirty;
    let dimension;
    let group;
    let round;
    let gBrush;

    function chart(div) {
      const width = x.range()[1];
      const height = y.range()[0];

      brush.extent([
        [0, 0],
        [width, height],
      ]);

      y.domain([0, group.top(1)[0].value]);

      div.each(function () {
        const div = d3.select(this);
        let g = div.select("g");

        // Create the skeletal chart.
        if (g.empty()) {
          div
            .select(".title")
            .append("a")
            .attr("href", `javascript:reset(${id})`)
            .attr("class", "reset")
            .text("reset")
            .style("display", "none");

          g = div
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

          g.append("clipPath")
            .attr("id", `clip-${id}`)
            .append("rect")
            .attr("width", width)
            .attr("height", height);

          g.selectAll(".bar")
            .data(["background", "foreground"])
            .enter()
            .append("path")
            .attr("class", (d) => `${d} bar`)
            .datum(group.all());

          g.selectAll(".foreground.bar").attr("clip-path", `url(#clip-${id})`);

          g.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(axis);

          // Initialize the brush component with pretty resize handles.
          gBrush = g.append("g").attr("class", "brush").call(brush);

          gBrush
            .selectAll(".handle--custom")
            .data([{ type: "w" }, { type: "e" }])
            .enter()
            .append("path")
            .attr("class", "brush-handle")
            .attr("cursor", "ew-resize")
            .attr("d", resizePath)
            .style("display", "none");
        }

        // Only redraw the brush if set externally.
        if (brushDirty !== false) {
          const filterVal = brushDirty;
          brushDirty = false;

          div
            .select(".title a")
            .style("display", d3.brushSelection(div) ? null : "none");

          if (!filterVal) {
            g.call(brush);

            g.selectAll(`#clip-${id} rect`).attr("x", 0).attr("width", width);

            g.selectAll(".brush-handle").style("display", "none");
            renderAll();
          } else {
            const range = filterVal.map(x);
            brush.move(gBrush, range);
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        const path = [];
        let i = -1;
        const n = groups.length;
        let d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
        }
        return path.join("");
      }

      function resizePath(d) {
        const e = +(d.type === "e");
        const x = e ? 1 : -1;
        const y = height / 3;
        return `M${0.5 * x},${y}A6,6 0 0 ${e} ${6.5 * x},${y + 6}V${
          2 * y - 6
        }A6,6 0 0 ${e} ${0.5 * x},${2 * y}ZM${2.5 * x},${y + 8}V${2 * y - 8}M${
          4.5 * x
        },${y + 8}V${2 * y - 8}`;
      }
    }

    brush.on("start.chart", function () {
      const div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function () {
      const g = d3.select(this.parentNode);
      const brushRange = d3.event.selection || d3.brushSelection(this); // attempt to read brush range
      const xRange = x && x.range(); // attempt to read range from x scale
      let activeRange = brushRange || xRange; // default to x range if no brush range available

      const hasRange =
        activeRange &&
        activeRange.length === 2 &&
        !isNaN(activeRange[0]) &&
        !isNaN(activeRange[1]);

      if (!hasRange) return; // quit early if we don't have a valid range

      // calculate current brush extents using x scale
      let extents = activeRange.map(x.invert);

      // if rounding fn supplied, then snap to rounded extents
      // and move brush rect to reflect rounded range bounds if it was set by user interaction
      if (round) {
        extents = extents.map(round);
        activeRange = extents.map(x);

        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "mousemove") {
          d3.select(this).call(brush.move, activeRange);
        }
      }

      // move brush handles to start and end of range
      g.selectAll(".brush-handle")
        .style("display", null)
        .attr("transform", (d, i) => `translate(${activeRange[i]}, 0)`);

      // resize sliding window to reflect updated range
      g.select(`#clip-${id} rect`)
        .attr("x", activeRange[0])
        .attr("width", activeRange[1] - activeRange[0]);

      // filter the active dimension to the range extents
      dimension.filterRange(extents);

      // re-render the other charts accordingly
      renderAll();
    });

    brush.on("end.chart", function () {
      // reset corresponding filter if the brush selection was cleared
      // (e.g. user "clicked off" the active range)
      if (!d3.brushSelection(this)) {
        reset(id);
      }
    });

    chart.margin = function (_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function (_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      return chart;
    };

    chart.y = function (_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.dimension = function (_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = (_) => {
      if (!_) dimension.filterAll();
      brushDirty = _;
      return chart;
    };

    chart.group = function (_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function (_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    chart.gBrush = () => gBrush;

    return chart;
  }
}
visualize().then(console.log).catch(console.error);
