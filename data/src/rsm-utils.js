// This is a copy of the util file from the react-simple-mapper package, which can convert from TopoJson to GeoJson
// Unfortunately it's not published on NPM, so I have to duplicate it directly

const { feature } = require("topojson-client");

function getFeatures(geographies, parseGeographies) {
  if (Array.isArray(geographies))
    return parseGeographies ? parseGeographies(geographies) : geographies;
  const feats = feature(
    geographies,
    geographies.objects[Object.keys(geographies.objects)[0]]
  ).features;
  return parseGeographies ? parseGeographies(feats) : feats;
}

module.exports = {
  getFeatures,
};
