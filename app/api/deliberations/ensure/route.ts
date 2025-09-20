// app/api/deliberations/ensure/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { emitBus } from "@/lib/server/bus";

export async function POST(req: NextRequest) {
  const me = await getCurrentUserId();
  if (!me) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { hostType, hostId, anchor } = await req.json();

  let d = await prisma.deliberation.findFirst({ where: { hostType, hostId }, select: { id: true } });
  let created = false;
  if (!d) {
    d = await prisma.deliberation.create({
      data: { hostType, hostId, createdById: String(me) },
      select: { id: true },
    });
    created = true;
    emitBus("deliberations:created", { id: d.id, hostType, hostId, source: "deliberate" });
  }

  let anchorId: string | undefined;
  if (anchor) {
    const a = await prisma.deliberationAnchor.create({
      data: {
        deliberationId: d.id,
        targetType: anchor.targetType,
        targetId: anchor.targetId ?? null,
        selectorJson: anchor.selectorJson ?? null,
        title: anchor.title ?? null,
        snippet: anchor.snippet ?? null,
        createdById: String(me),
      }, select: { id: true }
    });
    anchorId = a.id;
    emitBus("anchors:changed", { deliberationId: d.id, op: "add", anchorId });
  }

  return NextResponse.json({ id: d.id, created, anchorId });
}
