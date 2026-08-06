// shared validation helpers

// geojson sanity - [lng, lat] in valid ranges
const isvalidlocation = (loc) => {
  if (!loc || loc.type !== "Point" || !Array.isArray(loc.coordinates)) return false;
  const [lng, lat] = loc.coordinates;
  return (
    typeof lng === "number" &&
    typeof lat === "number" &&
    lng >= -180 && lng <= 180 &&
    lat >= -90 && lat <= 90
  );
};

module.exports = { isvalidlocation };