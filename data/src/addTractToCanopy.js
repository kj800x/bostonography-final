const { geoContains, geoCentroid } = require("d3-geo");
const csvStringify = require("csv-stringify/lib/sync");
const transform = require("transform-coordinates");
const { getFeatures } = require("./rsm-utils");
const fs = require("fs");

const convert = transform("EPSG:26919", "4326");

async function main() {
  const canopies = require("../raw_data/tree_canopy_fraction_census_tracts_wa8");
  const tractsTopo = require("../raw_data/Census_2010_Tracts");
  const tracts = getFeatures(tractsTopo);

  const csv_data = canopies.features.map((feature) => {
    // I have to convert from EPSG:26919 project to the 4326 (GPS / lat lon) projection
    const convertedFeature = {
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: feature.geometry.coordinates.map((ring) =>
          ring.map((coords) => {
            return coords.map(([x, y]) => {
              const latLong = convert.forward({ x, y });
              return [latLong.y, latLong.x];
            });
          })
        ),
      },
    };

    const centroid = geoCentroid(convertedFeature);

    // Map the canopy tract to the id from the Census_2010_Tracts file
    const tract = tracts.find((tract) =>
      geoContains(tract, [centroid[1], centroid[0]])
    );

    return {
      tractId: tract ? tract.id : undefined,
      centroidLat: centroid[0],
      centroidLong: centroid[1],
      ...convertedFeature.properties,
    };
  });

  fs.writeFileSync(
    "./processed_data/canopy_with_tracts.csv",
    csvStringify(csv_data, { header: true })
  );

  return "CSV Generated Successfully";
}

main().then(console.log).catch(console.error);
