// app/api/propositions/[id]/citations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propositionId = params.id;

    const citations = await prisma.citation.findMany({
      where: {
        targetType: "proposition",
        targetId: propositionId,
      },
      include: {
        source: {
          select: {
            id: true,
            url: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Transform to include source fields at top level for backwards compatibility
    const formattedCitations = citations.map((citation) => ({
      id: citation.id,
      url: citation.source?.url || null,
      title: citation.source?.title || citation.source?.url || "Untitled",
      text: citation.quote || null,
      locator: citation.locator || null,
      note: citation.note || null,
      createdAt: citation.createdAt,
    }));

    return NextResponse.json(
      { ok: true, citations: formattedCitations },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    console.error("[GET /api/propositions/[id]/citations] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to fetch citations" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
