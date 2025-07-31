export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';  // prevent Next from caching the RSC
import { prisma } from "@/lib/prismaclient";

export async function POST(req: Request) {
  const { stallId, cell } = await req.json();
  await prisma.stallHeat.upsert({
    where: { stall_id_cell: { stall_id: BigInt(stallId), cell } },
    update: { views: { increment: 1 } },
    create: { stall_id: BigInt(stallId), cell, views: 1 },
  });
  return new Response("ok");
}

