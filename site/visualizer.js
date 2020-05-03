async function visualize() {
  let data = await d3.json(window.DATA_URL);

  const DOW = ["S", "S", "M", "T", "W", "R", "F"];

  // The keys aren't baked into the trips.json since they are constant and so we can make the file smaller
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
  const genderGroups = gender.group();

  const memberStatus = xfilter.dimension((d) => d[INDICES.userType]);
  const memberStatusGroups = memberStatus.group();

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
      .ticks(7)
      .tickFormat((x) => DOW[x])
      .x(
        d3
          .scaleLinear()
          .domain([0, 7])
          .rangeRound([0, 12 * 7])
      ),

    barChart()
      .dimension(gender)
      .group(genderGroups)
      .ticks(3)
      .tickFormat((x) => (x === 1 ? "M" : x === 2 ? "F" : ""))
      .x(d3.scaleLinear().domain([0, 3]).rangeRound([0, 50])),

    barChart()
      .dimension(memberStatus)
      .group(memberStatusGroups)
      .ticks(3)
      .tickFormat((x) => (x === 1 ? "Y" : x === 0 ? "N" : ""))
      .x(d3.scaleLinear().domain([-1, 2]).rangeRound([0, 50])),

    barChart()
      .dimension(age)
      .group(ageGroups)
      .x(
        d3
          .scaleLinear()
          .domain([0, 100])
          .rangeRound([0, 10 * 20])
      ),

    barChart()
      .dimension(duration)
      .group(durations)
      .tickFormat((x) => x + "s")
      .x(
        d3
          .scaleLinear()
          .domain([0, 6000])
          .rangeRound([0, 10 * 40])
      ),

    barChart()
      .dimension(date)
      .group(dates)
      .round(d3.timeDay.round)
      .x(
        d3
          .scaleTime()
          .domain([window.MIN_DATE, window.MAX_DATE])
          .rangeRound([0, 10 * 115])
      ),

    barChart()
      .dimension(precipitation)
      .group(precipitationGroups)
      .tickFormat((x) => `${x}"`)
      .x(
        d3
          .scaleLinear()
          .domain([0, 1])
          .rangeRound([0, 10 * 30])
      ),

    barChart()
      .dimension(temp)
      .group(tempGroups)
      .tickFormat((x) => `${x}F`)
      .x(
        d3
          .scaleLinear()
          .domain([0, 100])
          .rangeRound([0, 10 * 30])
      ),

    barChart()
      .dimension(wind)
      .group(windGroups)
      .tickFormat((x) => `${x} MPH`)
      .x(
        d3
          .scaleLinear()
          .domain([0, 20])
          .rangeRound([0, 10 * 50])
      ),

    barChart()
      .dimension(canopyPercent)
      .group(canopyPercentGroups)
      .ticks(5)
      .tickFormat((x) => `${(x * 100).toFixed(0)}%`)
      .x(
        d3
          .scaleLinear()
          .domain([0, 1])
          .rangeRound([0, 10 * 25])
      ),

    barChart()
      .dimension(residential)
      .group(residentialGroups)
      .ticks(5)
      .tickFormat((x) => `${(x * 100).toFixed(0)}%`)
      .x(
        d3
          .scaleLinear()
          .domain([0, 1])
          .rangeRound([0, 10 * 30])
      ),

    barChart()
      .dimension(commercial)
      .group(commercialGroups)
      .ticks(5)
      .tickFormat((x) => `${(x * 100).toFixed(0)}%`)
      .x(
        d3
          .scaleLinear()
          .domain([0, 1])
          .rangeRound([0, 10 * 25])
      ),

    barChart()
      .dimension(industrial)
      .group(industrialGroups)
      .ticks(5)
      .tickFormat((x) => `${(x * 100).toFixed(0)}%`)
      .x(
        d3
          .scaleLinear()
          .domain([0, 1])
          .rangeRound([0, 10 * 25])
      ),
  ];

  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display.
  window.chart = d3.selectAll(".chart").data(charts);

  // Render the total.
  d3.selectAll("#total").text(formatNumber(xfilter.size()));

  window.renderAll = () => {
    chart.each(render);
    d3.select("#active").text(formatNumber(all.value()));
  };
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

  renderAll();

  document.getElementById("loading").style.display = "none";
  document.getElementById("charts").style.display = "block";
  document.getElementById("totals").style.display = "block";
}
visualize().then(console.log).catch(console.error);
