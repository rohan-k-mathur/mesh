import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius');
  const venueType = searchParams.get('type');

  if (!lat || !lng) {
    return NextResponse.json({ error: "Latitude and longitude are required." }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${venueType}&key=${apiKey}&libraries=drawing`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch places." }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
