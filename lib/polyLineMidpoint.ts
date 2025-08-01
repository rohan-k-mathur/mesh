import { decode } from '@googlemaps/polyline-codec';

/**
 * Given the encoded polyline & total distance (metres),
 * return the lat/lng at half the distance along the route.
 */
export function halfwayPoint(encoded: string): { lat: number; lng: number } {
  const coords = decode(encoded, 5);          // [[lat,lng], …]
  // crude cumulative‑distance walk
  const haversine = (a: number[], b: number[]) => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const [lat1, lon1] = a.map(toRad);
    const [lat2, lon2] = b.map(toRad);
    const dLat = lat2 - lat1, dLon = lon2 - lon1;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const segLengths = coords.slice(1).map((c, i) => haversine(coords[i], c));
  const total = segLengths.reduce((s, v) => s + v, 0);
  let acc = 0;
  let i = 0;
  while (i < segLengths.length && acc + segLengths[i] < total / 2) {
    acc += segLengths[i++];
  }
  return { lat: coords[i][0], lng: coords[i][1] };
}
