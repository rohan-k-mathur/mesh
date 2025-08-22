import { NextRequest, NextResponse } from "next/server";
import { listBlocks } from "@/lib/actions/blocks.actions";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get("ownerId"); // 👈 allow explicit id

  try {
    const items = await listBlocks(ownerId ?? undefined);
    return NextResponse.json({ items });
  } catch (e) {
    // Dev-friendly fallback: don’t 500 the UI if not authenticated
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
