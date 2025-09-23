// app/api/discussions/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export const runtime = "nodejs";

/** GET /api/discussions/list?type=comment&id=123 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");
  if (!type || !id) return NextResponse.json({ items: [] });
  const items = await prisma.discussion.findMany({
    where: { attachedToType: type, attachedToId: id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });
  return NextResponse.json({ items });
}
