const fetch = require("node-fetch");
const csvStringify = require("csv-stringify/lib/sync");
const { getFeatures } = require("./rsm-utils");
const { geoContains } = require("d3-geo");

const fs = require("fs");
const process = require("process");

// Define which ids are which maps
const BUILDINGS = 3;
const OPEN_SPACE = 4;
const LAND_USE = 5;

const FILENAME = {
  [BUILDINGS]: "buildings",
  [OPEN_SPACE]: "openSpace",
  [LAND_USE]: "landUse",
};

const tractsTopo = require("../raw_data/Census_2010_Tracts");
const tracts = getFeatures(tractsTopo);

const url = (map) =>
  `http://mapservices.bostonredevelopmentauthority.org/arcgis/rest/services/Maps/Bos_Zoning_LU/MapServer/${map}/query`;

async function makeRequest(map, params) {
  const formParams = new URLSearchParams();

  formParams.append("f", "json");
  Object.entries(params).forEach(([key, value]) => {
    formParams.append(key, value);
  });

  const response = await fetch(url(map), { method: "POST", body: formParams });

  return await response.json();
}

async function requestChunk(afterObjectId, mapType) {
  return makeRequest(mapType, {
    where: `OBJECTID>${afterObjectId}`,
    outFields: "*",
    outSr: 4326,
    returnGeometry: true,
  });
}

const ATTRIBUTES = {
  [BUILDINGS]: [
    "OBJECTID",
    "PART_USE",
    "PART_BRA_U",
    "IEL_TYPE",
    "Land_Use",
    "BRA_Land_Use",
    "Shape.STArea()",
  ],
  [OPEN_SPACE]: [
    "OBJECTID",
    "SITE_NAME",
    "OWNERSHIP",
    "PROTECTION",
    "TYPECODE",
    "DISTRICT",
    "ADDRESS",
    "ACRES",
    "ZonAgg",
    "TypeLong",
    "OS_Own_Jur",
    "OS_Mngmnt",
    "POS",
    "PA",
    "ALT_NAME",
    "AgncyJuris",
    "Shape.STArea()",
  ],
  [LAND_USE]: [
    "OBJECTID",
    "PARCEL",
    "PID",
    "OWNER",
    "ST_NUM",
    "ST_NAME",
    "ST_NAM_SUF",
    "UNI_NUM",
    "ZIPCODE",
    "LU",
    "PTYPE",
    "LOTSIZE",
    "Xcoord",
    "Ycoord",
    "BRA_name",
    "NUM_FLOORS",
    "Shape.STArea()",
  ],
};

function header(mapType) {
  return [
    "tractId",
    ...ATTRIBUTES[mapType],
    "avgLat",
    "avgLong",
    "rawGeometry",
  ];
}

// Take the first ring and average all lats and longs
function avgGeometry(geometry) {
  try {
    const points = geometry.rings[0];
    const sums = points.reduce(([a, b], [c, d]) => [a + c, b + d], [0, 0]);
    const [longitude, latitude] = sums.map(
      (latOrLong) => latOrLong / points.length
    );
    return [latitude, longitude];
  } catch (e) {
    console.log(geometry, e);
    return [0, 0];
  }
}

function determineTract([latitude, longitude]) {
  const tract = tracts.find((tract) =>
    geoContains(tract, [longitude, latitude])
  );

  return tract ? tract.id : undefined;
}

function processData(features, mapType) {
  return (features || []).map((feature) => {
    const [latitude, longitude] = avgGeometry(feature.geometry);

    const tractId = determineTract([latitude, longitude]);

    return [
      tractId,
      ...ATTRIBUTES[mapType].map((attrib) => feature.attributes[attrib]),
      latitude,
      longitude,
      JSON.stringify(feature.geometry),
    ];
  });
}

async function write(writeStream, data) {
  const contents = csvStringify(data);
  writeStream.write(contents);
}

async function main(mapType) {
  let maxObject = 0;

  const writeStream = fs.createWriteStream(
    `./processed_data/${FILENAME[mapType]}.csv`
  );

  await write(writeStream, [header(mapType)]);

  let response = { exceededTransferLimit: true };
  do {
    console.log(`Requesting entries with ID larger than ${maxObject}`);

    response = await requestChunk(maxObject, mapType);

    const result = processData(response.features, mapType);

    await write(writeStream, result);

    maxObject = Math.max(...result.map((e) => e[1]));
  } while (response.exceededTransferLimit);

  writeStream.end();

  return "Completed scraping of MapID: " + mapType;
}

main(parseInt(process.argv[2], 10)).then(console.log).catch(console.error);
