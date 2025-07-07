import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat1 = searchParams.get("lat1");
  const lng1 = searchParams.get("lng1");
  const lat2 = searchParams.get("lat2");
  const lng2 = searchParams.get("lng2");

  if (!lat1 || !lng1 || !lat2 || !lng2) {
    return NextResponse.json(
      { error: "Coordinates required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const directionsUrl =
    `https://maps.googleapis.com/maps/api/directions/json?origin=${lat1},${lng1}&destination=${lat2},${lng2}&key=${apiKey}`;

  const res = await fetch(directionsUrl);
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch directions" },
      { status: res.status }
    );
  }

  const data = await res.json();
  if (!data.routes || data.routes.length === 0) {
    return NextResponse.json(
      { error: "No route" },
      { status: 404 }
    );
  }

  const legs = data.routes[0].legs;
  let totalDistance = 0;
  legs.forEach((leg: any) => {
    totalDistance += leg.distance.value;
  });
  let half = totalDistance / 2;
  let traveled = 0;

  for (const leg of legs) {
    for (const step of leg.steps) {
      const stepDistance = step.distance.value;
      if (traveled + stepDistance >= half) {
        const remaining = half - traveled;
        const ratio = remaining / stepDistance;
        const start = step.start_location;
        const end = step.end_location;
        const lat = start.lat + (end.lat - start.lat) * ratio;
        const lng = start.lng + (end.lng - start.lng) * ratio;
        return NextResponse.json({ lat, lng });
      }
      traveled += stepDistance;
    }
  }

  const lastLeg = legs[legs.length - 1];
  const lastStep = lastLeg.steps[lastLeg.steps.length - 1];
  return NextResponse.json({
    lat: lastStep.end_location.lat,
    lng: lastStep.end_location.lng,
  });
}
