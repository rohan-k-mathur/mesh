/**
 * GET /api/v3/deliberations/[id]/synthetic-readout
 *
 * Track AI-EPI Pt. 4 §5 — SyntheticReadout endpoint.
 *
 * The editorial primitive. Composes fingerprint + frontier + missing
 * moves + chain exposure into a single deliberation-scope object whose
 * shape makes centrist-synthesis prose structurally hard to construct.
 * The `refusalSurface.cannotConcludeBecause` field enumerates exactly
 * what the graph will not license; consumers that close anyway lie
 * about a structured field.
 */
import { NextRequest, NextResponse } from "next/server";
import { computeSyntheticReadout } from "@/lib/deliberation/syntheticReadout";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  try {
    const readout = await computeSyntheticReadout(id);
    if (!readout) {
      return NextResponse.json(
        { error: "deliberation not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(readout, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60",
        "X-Content-Hash": readout.contentHash,
      },
    });
  } catch (err: any) {
    // Transient DB connectivity (Supabase pooler hiccup, etc.) returns
    // Prisma P1001. Surface as 503 so SWR backs off rather than
    // treating it as a permanent failure.
    if (err?.code === "P1001" || err?.code === "P1002" || err?.code === "P1017") {
      return NextResponse.json(
        { error: "upstream unavailable", code: err.code },
        { status: 503, headers: { "Retry-After": "5" } },
      );
    }
    throw err;
  }
}
