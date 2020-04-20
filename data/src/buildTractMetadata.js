const { csvParse } = require("d3-dsv");
const { geoContains } = require("d3-geo");
const { getFeatures } = require("./rsm-utils");
const fs = require("fs");

const canopyData = csvParse(
  fs.readFileSync("./processed_data/canopy_with_tracts.csv", "utf-8")
);

const avg = (property) => (data) =>
  data.map((row) => row[property]).reduce((a, b) => a + b, 0) / data.length;

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

// http://worldmap.harvard.edu/data/geonode:tree_canopy_fraction_census_tracts_wa8
function getCanopyForTract(tract) {
  const id = tract.id;
  const relevantRows = canopyData.filter((row) => row.tractId === "" + id);
  if (relevantRows.length === 0) {
    return {};
  }
  return {
    // LST_CT: avg("LST_CT")(relevantRows),
    CanopyPercent: avg("CAN_CT")(relevantRows),
    // ALB_CT: avg("ALB_CT")(relevantRows),
    // ISA_CT: avg("ISA_CT")(relevantRows),
  };
}

// https://www.cityofboston.gov/assessing/pdfs/land_use_codes.pdf
const isResidential = (lot) => {
  return [
    "R1",
    "R2",
    "R3",
    "R4",
    "A",
    "RL",
    "CD",
    "CM",
    "CC",
    "RC",
    "CP",
  ].includes(lot.LU);
};

// https://www.cityofboston.gov/assessing/pdfs/land_use_codes.pdf
const isCommercial = (lot) => {
  return ["C", "RC", "CL"].includes(lot.LU);
};

// https://www.cityofboston.gov/assessing/pdfs/land_use_codes.pdf
const isIndustrial = (lot) => {
  return ["I"].includes(lot.LU);
};

const landUseData = csvParse(
  fs.readFileSync("./processed_data/landUse.csv", "utf-8")
).map((row) => ({
  ...row,
  ["Shape.STArea()"]: parseFloat(row["Shape.STArea()"]),
}));

// TODO source
function getLandUseForTract(tract) {
  const id = tract.id;
  const relevantRows = landUseData.filter((row) => row.tractId === "" + id);
  if (relevantRows.length === 0) {
    return {};
  }

  const percentResidential =
    sum(
      relevantRows.filter(isResidential).map((row) => row["Shape.STArea()"])
    ) / sum(relevantRows.map((row) => row["Shape.STArea()"]));
  const percentCommercial =
    sum(relevantRows.filter(isCommercial).map((row) => row["Shape.STArea()"])) /
    sum(relevantRows.map((row) => row["Shape.STArea()"]));
  const percentIndustrial =
    sum(relevantRows.filter(isIndustrial).map((row) => row["Shape.STArea()"])) /
    sum(relevantRows.map((row) => row["Shape.STArea()"]));
  return { percentResidential, percentCommercial, percentIndustrial };
}

function buildTractMapping() {
  const tractsTopo = require("../raw_data/Census_2010_Tracts");

  const tracts = getFeatures(tractsTopo);

  return tracts.map((tract) => {
    const metadata = {
      ...getCanopyForTract(tract),
      ...getLandUseForTract(tract),
    };

    console.log(metadata);

    return {
      metadata,
      ...tract,
    };
  });
}

function buildStationMapping() {
  const tracts = buildTractMapping();
  const stations = csvParse(
    fs
      .readFileSync("./raw_data/current_bluebikes_stations.csv", "utf-8")
      .split("\n")
      .slice(1)
      .join("\n")
  );
  // Map over each station
  return stations.map((station) => {
    // For each station find the tract that includes it
    const tract = tracts.find((tract) =>
      geoContains(tract, [station.Longitude, station.Latitude])
    );

    console.log(tract && tract.metadata);

    // If we can find a tract, include the tract id with the station data
    return {
      tractId: tract ? tract.id : undefined,
      tractMetadata: tract ? tract.metadata : undefined,
      ...station,
    };
  });
}

module.exports = {
  buildTractMapping,
  buildStationMapping,
};
