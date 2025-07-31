import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const BASE_MAPS = "https://maps.googleapis.com/maps/api";
const BASE_ROUTES = "https://routes.googleapis.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json({ error: "missing endpoint" }, { status: 400 });
  }

  searchParams.delete("endpoint");
  const qs = searchParams.toString();
  const url = endpoint.startsWith("directions/") || endpoint.startsWith("place/") || endpoint.startsWith("geocode")
    ? `${BASE_MAPS}/${endpoint}?${qs}&key=${process.env.GMAPS_KEY}`
    : endpoint.startsWith("directions/")
    ? `${BASE_MAPS}/${endpoint}?${qs}&key=${process.env.GMAPS_KEY}`
    : endpoint.startsWith("v2:") || endpoint.includes("v2")
    ? `${BASE_ROUTES}/${endpoint}${qs ? "?" + qs : ""}`
    : `${BASE_MAPS}/${endpoint}?${qs}&key=${process.env.GMAPS_KEY}`;

  if (req.method !== "GET") {
    const body = await req.text();
    const res = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GMAPS_KEY!,
      },
      body,
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.status || res.statusText }, { status: res.status });
    }
    if (data.status && ["ZERO_RESULTS", "OVER_QUERY_LIMIT", "REQUEST_DENIED"].includes(data.status)) {
      return NextResponse.json({ error: data.status }, { status: 400 });
    }
    return NextResponse.json(data);
  }

  // GET with caching
  const cacheKey = url;
  const cached = await kv.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached as any);
  }
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.error?.status || res.statusText }, { status: res.status });
  }
  if (data.status && ["ZERO_RESULTS", "OVER_QUERY_LIMIT", "REQUEST_DENIED"].includes(data.status)) {
    return NextResponse.json({ error: data.status }, { status: 400 });
  }
  await kv.set(cacheKey, data, { ex: 600 });
  return NextResponse.json(data);
}
