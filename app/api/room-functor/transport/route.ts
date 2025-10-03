// app/api/room-functor/transport/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const Body = z.object({
  fromId: z.string().min(6),
  toId: z.string().min(6),
  claimMap: z.record(z.string().min(6)).optional(), // { fromClaimId: toClaimId }
  merge: z.boolean().default(true), // merge with previous mapping
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = Body.parse(await req.json());
  const { fromId, toId, claimMap = {}, merge, notes } = body;

  // upsert mapping row
  const prev = await prisma.roomFunctor.findFirst({
    where: { fromRoomId: fromId, toRoomId: toId },
    select: { id: true, claimMapJson: true },
  }).catch(() => null);

  const nextMap = merge && prev?.claimMapJson && typeof prev.claimMapJson === "object"
    ? { ...(prev.claimMapJson as Record<string,string>), ...claimMap }
    : claimMap;

  const row = prev
    ? await prisma.roomFunctor.update({
        where: { id: prev.id },
        data: { claimMapJson: nextMap, notes: notes ?? undefined },
        select: { id: true },
      })
    : await prisma.roomFunctor.create({
        data: { fromRoomId: fromId, toRoomId: toId, claimMapJson: nextMap, notes: notes ?? null },
        select: { id: true },
      });

  // OPTIONAL: emit a signal; later you might copy/import edges or arguments
  try { (globalThis as any).dispatchEvent?.(new CustomEvent("roomFunctor:changed")); } catch {}

  return NextResponse.json({ ok: true, id: row.id, fromId, toId, claimMap: nextMap });
}
