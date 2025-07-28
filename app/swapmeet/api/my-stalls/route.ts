import { prisma } from "@/lib/prismaclient";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.stall.findMany({
    where: { owner_id: 1n },
    select: { id: true, name: true, visitors: true },
    orderBy: { updated_at: "desc" },
  });
  return NextResponse.json(rows);
}
