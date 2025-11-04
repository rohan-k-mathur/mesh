import { NextRequest, NextResponse } from "next/server";
import { compileFromMoves } from "@/packages/ludics-engine/compileFromMoves";
import { z } from "zod";

const zBody = z.object({ 
  deliberationId: z.string(),
  scopingStrategy: z.enum(["legacy", "issue", "actor-pair", "argument", "topic"]).optional(),
  forceRecompile: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = zBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() }, 
      { status: 400 }
    );
  }

  const { deliberationId, scopingStrategy, forceRecompile } = parsed.data;

  try {
    // Compile with specified strategy (defaults to 'legacy' for backward compatibility)
    const result = await compileFromMoves(deliberationId, {
      scopingStrategy: scopingStrategy ?? "legacy",
      forceRecompile: forceRecompile ?? true,
    });

    // TODO: Sync to AIF and invalidate caches if needed
    // await syncLudicsToAif(deliberationId);
    // await invalidateInsightsCache(deliberationId);

    return NextResponse.json({
      ok: true,
      designs: result.designs,
      designCount: result.designs.length,
      scopingStrategy: scopingStrategy ?? "legacy",
    });
  } catch (error: any) {
    console.error("Error compiling ludics designs:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "compilation failed" },
      { status: 500 }
    );
  }
}
