const { csvParse } = require("d3-dsv");
const { geoContains } = require("d3-geo");
const csvStringify = require("csv-stringify/lib/sync");
const { getFeatures } = require("./rsm-utils");
const fs = require("fs");

async function main() {
  const tractsTopo = require("../raw_data/Census_2010_Tracts");

  const tracts = getFeatures(tractsTopo);

  const stationsText = fs.readFileSync(
    "./raw_data/current_bluebikes_stations.csv",
    "utf-8"
  );

  // We have to remove the first line since BlueBikes includes an invalid header
  var stationsCsv = stationsText.substring(stationsText.indexOf("\n") + 1);

  var rawStations = csvParse(stationsCsv);

  // Map over each station
  const stations = rawStations.map((station) => {
    // For each station find the tract that includes it
    const tract = tracts.find((tract) =>
      geoContains(tract, [station.Longitude, station.Latitude])
    );

    // If we can find a tract, include the tract id with the station data
    return {
      tractId: tract ? tract.id : undefined,
      ...station,
    };
  });

  // Now we have the stations augmented with tracts, output it into processed_data
  fs.writeFileSync(
    "./processed_data/bluebikes_with_tracts.csv",
    csvStringify(stations, { header: true })
  );

  return "CSV Generated Successfully";
}

main().then(console.log).catch(console.error);
