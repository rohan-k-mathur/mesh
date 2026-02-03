/**
 * GET /api/arguments/:argumentId/permalink
 * Get or create permalink for an argument (Phase 3.2)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreatePermalink,
  generateCitationText,
} from "@/lib/citations/permalinkService";
import { CitationFormat } from "@/lib/citations/argumentCitationTypes";

export const dynamic = "force-dynamic";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

const VALID_FORMATS = ["apa", "mla", "chicago", "bibtex", "mesh"];

/**
 * GET - Get or create permalink for an argument
 * Query params:
 *   - format: Citation format to include (apa, mla, chicago, bibtex, mesh)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { argumentId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") as CitationFormat | null;

    const permalink = await getOrCreatePermalink(params.argumentId);

    // If citation format requested, include citation text
    if (format && VALID_FORMATS.includes(format)) {
      const citationResult = await generateCitationText(
        params.argumentId,
        format as CitationFormat
      );
      return NextResponse.json(
        {
          ok: true,
          data: {
            ...permalink,
            citation: citationResult,
          },
        },
        NO_STORE
      );
    }

    return NextResponse.json({ ok: true, data: permalink }, NO_STORE);
  } catch (error: any) {
    console.error("[GET /api/arguments/[argumentId]/permalink] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to get permalink" },
      { status: 500, ...NO_STORE }
    );
  }
}
