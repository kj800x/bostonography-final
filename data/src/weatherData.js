const { csvParse } = require("d3-dsv");
const fs = require("fs");

// NOAA https://www.ncdc.noaa.gov/cdo-web/
const rawWeather = csvParse(fs.readFileSync("./raw_data/weather.csv", "utf-8"));

module.exports = {
  weatherFor: (date) => {
    const day = date.split(" ")[0];
    const weatherRecord = rawWeather.find((row) => row.DATE === day);
    if (!weatherRecord) {
      return {};
    }
    return {
      AvgWind: weatherRecord.AWND,
      Precip: weatherRecord.PRCP,
      Snow: weatherRecord.SNOW,
      TempAvg: weatherRecord.TAVG,
    };
  },
};
