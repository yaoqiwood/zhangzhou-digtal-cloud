const toFiniteNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const resolvePointArray = (item = {}) => {
  const point = item?.point ?? item?.coord;
  if (
    Array.isArray(point) &&
    point.length >= 2 &&
    Number.isFinite(Number(point[0])) &&
    Number.isFinite(Number(point[1]))
  ) {
    return [Number(point[0]), Number(point[1])];
  }
  return null;
};

export const enrichTrafficEventCoordinateData = (item = {}) => {
  const point = resolvePointArray(item);
  if (point) {
    const [lon, lat] = point;
    return {
      lon,
      lng: lon,
      longitude: lon,
      lat,
      latitude: lat,
      point,
    };
  }

  const lon = toFiniteNumber(
    item?.mapLon ??
      item?.mapLng ??
      item?.longitude ??
      item?.lng ??
      item?.lon
  );
  const lat = toFiniteNumber(item?.mapLat ?? item?.latitude ?? item?.lat);
  if (lon === null || lat === null) return null;

  return {
    lon,
    lng: lon,
    longitude: lon,
    lat,
    latitude: lat,
    point: [lon, lat],
  };
};

export const enrichTrafficEventCoordinateDataList = (items = []) => {
  const source = Array.isArray(items) ? items : [];
  return source.map((item) => enrichTrafficEventCoordinateData(item));
};
