const { csvParse } = require("d3-dsv");
const fs = require("fs");
const { buildStationMapping } = require("./buildTractMetadata");
const { weatherFor } = require("./weatherData");

const leftpad = (s) => (("" + s).length === 1 ? "0" + s : s);

const files = [];
for (let i = 1; i <= 12; i++) {
  files.push(`./usage-data/2019${leftpad(i)}-bluebikes-tripdata.csv`);
}

const sample = (skip) => (data) => {
  return data.filter((_, i) => i % skip === 0);
};

const SAMPLE_RATE = 1; // Only 1 in SAMPLE_RATE trips will be included, otherwise we run out of memory on my computer

function process(data, stationData) {
  data = sample(SAMPLE_RATE)(data);

  return data
    .map((trip) => {
      const startStation = stationData.find(
        (station) => station.Name === trip["start station name"]
      );
      const startStationMetadata = startStation
        ? startStation.tractMetadata
        : {};
      const endStation = stationData.find(
        (station) => station.Name === trip["end station name"]
      );
      const endStationMetadata = endStation ? endStation.tractMetadata : {};

      const weather = weatherFor(trip.starttime);
      return {
        ...trip,
        weather,
        startStationMetadata,
        endStationMetadata,
        include: !!(startStationMetadata && endStationMetadata && weather),
      };
    })
    .filter((trip) => trip.include);
}

// Remove outliers and process data to
// There is a huge spike of riders with age 50 and it looks like bad data rather than real data
// Trips with super long durations are likely stolen bikes and not what we are interested in
function filter(data) {
  return data
    .filter((trip) => {
      return (
        trip.tripduration < 6000 &&
        !isNaN(
          trip.startStationMetadata &&
            trip.startStationMetadata.percentResidential
        ) &&
        !isNaN(
          trip.endStationMetadata && trip.endStationMetadata.percentResidential
        ) &&
        !isNaN(trip.startStationMetadata.CanopyPercent) &&
        +trip["birth year"] !== 2019 - 50
      );
    })
    .map((trip) => {
      const riderAge = 2019 - +trip["birth year"];
      return [
        +trip.tripduration,
        new Date(trip.starttime).getTime(),
        // trip.stoptime,
        +trip["start station id"],
        // trip["start station name"],
        +trip["end station id"],
        // trip["end station name"],
        trip.usertype === "Subscriber" ? "S" : "C", // Subscriber or Customer but short
        riderAge,
        +trip.gender === 1 ? "M" : +trip.gender === 2 ? "F" : "?",
        +trip.weather.AvgWind,
        +trip.weather.Precip,
        +trip.weather.TempAvg,
        +Math.floor(+trip.startStationMetadata.CanopyPercent * 100) / 100,
        +Math.floor(+trip.startStationMetadata.percentResidential * 100) / 100,
        +Math.floor(+trip.startStationMetadata.percentCommercial * 100) / 100,
        +Math.floor(+trip.startStationMetadata.percentIndustrial * 100) / 100,
      ];
    });
}

async function main() {
  const stationData = buildStationMapping();

  fs.writeFileSync("./debug.json", JSON.stringify(stationData, null, 2));
  let results = [];

  for (let file of files) {
    console.log("processing", file);
    results = [
      ...results,
      ...filter(process(csvParse(fs.readFileSync(file, "utf-8")), stationData)),
    ];
  }

  fs.writeFileSync("./trips.json", JSON.stringify(results));
}

main().then(console.log).catch(console.error);
