import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

/**
 * GET /api/library/post?id=<libraryPostId>
 * Returns the public file_url and metadata needed for viewing.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || searchParams.get("postId");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const p = await prisma.libraryPost.findUnique({
      where: { id: String(id) },
      select: { id: true, title: true, file_url: true, page_count: true, thumb_urls: true },
    });

    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: p.id,
      title: p.title ?? "PDF",
      fileUrl: p.file_url,
      pageCount: p.page_count,
      thumbUrls: p.thumb_urls,
    });
  } catch (e: any) {
    console.error("[library/post] error", e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
