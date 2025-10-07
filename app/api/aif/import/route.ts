// app/api/aif/import/route.ts
import { NextResponse } from "next/server";
import { importAifJSONLD } from "@/lib/aif/import";

export async function POST(req: Request) {
  const { deliberationId, graph } = await req.json();
  if (!deliberationId || !graph) return NextResponse.json({ ok:false, error:'Missing deliberationId or graph' }, { status:400 });
  const res = await importAifJSONLD(deliberationId, graph);
  return NextResponse.json(res, { status: 201 });
}
