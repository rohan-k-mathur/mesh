export type LatLng = { lat: number; lng: number };
export type Candidate = {
  id: string;
  name: string;
  address: string;
  location: LatLng;
  rating?: number;
  price_level?: number;
  durations?: number[];
  cost?: number;
};

import { haversineDistance } from "../../lib/sorters";

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY!;

async function candidateGeneration(origins: LatLng[], type = "restaurant"): Promise<Candidate[]> {
  const centroid = origins.reduce(
    (acc, cur) => ({ lat: acc.lat + cur.lat / origins.length, lng: acc.lng + cur.lng / origins.length }),
    { lat: 0, lng: 0 }
  );
  const radius = Math.min(
    5000,
    Math.max(...origins.map((o) => haversineDistance(o, centroid)))
  );

  let results: any[] = [];
  let pageToken: string | undefined;
  while (results.length < 50) {
    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${centroid.lat},${centroid.lng}` +
      `&radius=${radius}&type=${type}&key=${GOOGLE_KEY}` +
      (pageToken ? `&pagetoken=${pageToken}` : "");
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    results = results.concat(data.results || []);
    pageToken = data.next_page_token;
    if (!pageToken) break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  results = results.slice(0, 50);

  const candidates: Candidate[] = [];
  for (const place of results) {
    const detailUrl =
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}` +
      `&fields=name,formatted_address,rating,price_level,geometry&key=${GOOGLE_KEY}`;
    const det = await fetch(detailUrl);
    const d = det.ok ? await det.json() : { result: {} };
    const info = { ...place, ...d.result };
    candidates.push({
      id: place.place_id,
      name: info.name,
      address: info.formatted_address || place.vicinity,
      location: {
        lat: info.geometry?.location?.lat ?? place.geometry.location.lat,
        lng: info.geometry?.location?.lng ?? place.geometry.location.lng,
      },
      rating: info.rating,
      price_level: info.price_level,
    });
  }
  return candidates;
}

async function travelMatrix(origins: LatLng[], candidates: Candidate[]): Promise<number[][]> {
  const originChunks = chunk(origins, 25);
  const destChunks = chunk(candidates.map((c) => c.location), 25);
  const matrix: number[][] = Array.from({ length: origins.length }, () => Array(candidates.length).fill(Infinity));
  for (let oi = 0; oi < originChunks.length; oi++) {
    for (let di = 0; di < destChunks.length; di++) {
      const oStr = originChunks[oi].map((o) => `${o.lat},${o.lng}`).join("|");
      const dStr = destChunks[di].map((d) => `${d.lat},${d.lng}`).join("|");
      const url =
        `https://maps.googleapis.com/maps/api/distancematrix/json?key=${GOOGLE_KEY}` +
        `&origins=${oStr}&destinations=${dStr}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      data.rows.forEach((row: any, rIdx: number) => {
        row.elements.forEach((el: any, cIdx: number) => {
          const origIndex = oi * 25 + rIdx;
          const destIndex = di * 25 + cIdx;
          if (origIndex < origins.length && destIndex < candidates.length) {
            matrix[origIndex][destIndex] = el.duration?.value ?? Infinity;
          }
        });
      });
    }
  }
  return matrix;
}

function scoreCandidates(origins: LatLng[], candidates: Candidate[], matrix: number[][], topN = 10): Candidate[] {
  const scored: Candidate[] = candidates.map((c, j) => {
    const durations = matrix.map((row) => row[j]);
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((s, d) => s + (d - mean) ** 2, 0) / durations.length;
    const total = durations.reduce((a, b) => a + b, 0);
    const cost = variance + total / durations.length;
    return { ...c, durations, cost };
  });
  return scored.sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0)).slice(0, topN);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function findBestVenues(origins: LatLng[], type = "restaurant", topN = 10): Promise<Candidate[]> {
  const candidates = await candidateGeneration(origins, type);
  const matrix = await travelMatrix(origins, candidates);
  return scoreCandidates(origins, candidates, matrix, topN);
}
