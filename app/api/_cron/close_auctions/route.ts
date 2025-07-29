export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET() {
  const expired = await prisma.auction.updateMany({
    where: { state: "LIVE", ends_at: { lt: new Date() } },
    data: { state: "CLOSED" },
  });
  return NextResponse.json({ closed: expired.count });
}
