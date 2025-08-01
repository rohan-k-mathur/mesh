import { NextResponse } from "next/server";

// ───────────────────────────────────────────────────────────
// * One handler for both GET and POST (legacy & Routes v2)  *
// ───────────────────────────────────────────────────────────
const handler = async (req: Request) => {
  /* 1 ─ read query */
  const incoming = new URL(req.url);
  const endpoint = incoming.searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json({ error: "missing endpoint" }, { status: 400 });
  }

  /* 2 ─ decide Google host */
  const isRoutesV2 = endpoint.startsWith("directions/v2:computeRoutes");
  const googleBase = isRoutesV2
    ? "https://routes.googleapis.com/"
    : "https://maps.googleapis.com/maps/api/";


    
  /* 3 ─ rebuild Google URL */
  const target = new URL(endpoint, googleBase);
  incoming.searchParams.forEach((v, k) => {
    if (k !== "endpoint") target.searchParams.set(k, v); // copy the rest
  });

  /* 4 ─ headers & body */
  const apiKey = process.env.GOOGLE_MAPS_API_KEY!;
  const init: RequestInit = { method: req.method };

  if (isRoutesV2) {
    init.method = "POST";
    init.headers = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      // 👇 FIX: read from the original request, not URL
      "X-Goog-FieldMask": req.headers.get("x-goog-fieldmask") ?? "*",
    };
    init.body = await req.text();
  } else {
    target.searchParams.set("key", apiKey);
  }

  /* 5 ─ fire & relay */
  const gRes = await fetch(target.toString(), init);
  const raw = await gRes.text();

  if (!gRes.ok) {
    console.error("Google error →", raw);
    return NextResponse.json({ error: "upstream fail", detail: raw }, { status: gRes.status });
  }
  return NextResponse.json(JSON.parse(raw));
};

// export *after* definition to avoid ReferenceError
export const GET  = handler;
export const POST = handler;
