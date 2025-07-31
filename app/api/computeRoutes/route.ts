import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "origin and destination required" },
      { status: 400 }
    );
  }

  const [origLat, origLng] = origin.split(",");
  const [destLat, destLng] = destination.split(",");

  const body = {
    origin: {
      location: { latLng: { latitude: parseFloat(origLat), longitude: parseFloat(origLng) } },
    },
    destination: {
      location: { latLng: { latitude: parseFloat(destLat), longitude: parseFloat(destLng) } },
    },
    travelMode: "DRIVE",
  };
  const fieldMask = "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline";

  const url = new URL("/api/googleProxy", req.url);
  url.searchParams.set("endpoint", "directions/v2:computeRoutes");
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    return NextResponse.json(
      typeof data.error === "string" ? { error: data.error } : data,
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
