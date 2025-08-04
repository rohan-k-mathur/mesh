import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { live, liveSrc } = await req.json() as
        { live: boolean; liveSrc?: string };

  await prisma.stall.update({
    where: { id: BigInt(params.id) },
    data: {
      live,
      liveSrc: live ? liveSrc : null   // clear src when turning off
    },
  });

  return NextResponse.json({ ok: true });
}
