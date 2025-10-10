// app/api/aif/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { importAifJSONLD } from "@/packages/aif-core/src/import";
export async function POST(req: NextRequest) {
  const { deliberationId, graph } = await req.json().catch(()=>({}));
  if (!deliberationId || !graph) return NextResponse.json({ ok:false, error:'missing deliberationId/graph' }, { status:400 });
  const res = await importAifJSONLD(deliberationId, graph);
  return NextResponse.json(res, { status: 201 });
}
