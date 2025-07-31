import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const address = req.query.address as string | undefined;
  if (!address) {
    res.status(400).json({ error: "Missing address" });
    return;
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&libraries=drawing`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      res.status(response.status).json({ error: "Failed to fetch from Google API" });
      return;
    }
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      res.status(404).json({ error: "No results found" });
      return;
    }
    res.status(200).json(data.results[0].geometry.location);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
