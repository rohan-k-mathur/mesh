// app/api/thesis/[id]/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserAuthId } from "@/lib/serverutils";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authorId = await getCurrentUserAuthId();
    if (!authorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, ...NO_STORE });
    }

    // Verify ownership and current status
    const thesis = await prisma.thesis.findUnique({
      where: { id: params.id },
      select: {
        authorId: true,
        status: true,
        thesisClaimId: true,
        prongs: {
          select: { id: true },
        },
      },
    });

    if (!thesis) {
      return NextResponse.json({ error: "Thesis not found" }, { status: 404, ...NO_STORE });
    }

    if (thesis.authorId !== authorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, ...NO_STORE });
    }

    if (thesis.status === "PUBLISHED") {
      return NextResponse.json({ error: "Already published" }, { status: 400, ...NO_STORE });
    }

    // Note: In the new document-based model, thesisClaimId and prongs are optional.
    // The thesis content is stored in the `content` field (TipTap JSON).
    // We could add validation here to check if content exists if needed.

    // Update status to PUBLISHED
    const updated = await prisma.thesis.update({
      where: { id: params.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        slug: true,
        status: true,
        publishedAt: true,
      },
    });

    return NextResponse.json({ ok: true, thesis: updated }, NO_STORE);
  } catch (err: any) {
    console.error("[thesis/:id/publish POST] failed", err);
    return NextResponse.json({ error: err?.message ?? "Publish failed" }, { status: 500, ...NO_STORE });
  }
}
