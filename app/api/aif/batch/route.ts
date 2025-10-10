import { NextRequest, NextResponse } from "next/server";
import { buildAifGraphJSONLD } from "@/lib/aif/jsonld";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const deliberationId = u.searchParams.get("deliberationId") ?? undefined;
  const ids = (u.searchParams.get("ids") ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  const includeLocutions = (u.searchParams.get("locutions") ?? "0") === "1";

  if (!deliberationId && ids.length === 0) {
    return NextResponse.json({ ok:false, error:"Provide deliberationId or ids" }, { status: 400 });
  }

  const jsonld = await buildAifGraphJSONLD({ deliberationId, argumentIds: ids, includeLocutions });
  return NextResponse.json(jsonld, { headers: { "Cache-Control": "no-store" } });
}
