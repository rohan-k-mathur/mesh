// app/api/arguments/[id]/cqs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const arg = await prisma.argument.findUnique({
    where: { id: params.id },
    include: { scheme: { include: { cqs: true } } },
  });
  if (!arg?.scheme) return NextResponse.json({ ok: true, items: [] });

  const statuses = await prisma.cQStatus.findMany({ where: { argumentId: arg.id } });
  const byKey = new Map(statuses.map(s => [s.cqKey, s.status]));

  const items = arg.scheme.cqs.map(cq => ({
    cqKey: cq.cqKey,
    text: cq.text,
    attackType: cq.attackType,
    targetScope: cq.targetScope,
    status: byKey.get(cq.cqKey) ?? "open",
  }));

  return NextResponse.json({ ok: true, items });
}
