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

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
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

  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey!,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch directions" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
