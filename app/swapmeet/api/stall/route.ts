import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function POST(req: Request) {
  const body = await req.json();
  const stall = await prisma.stall.create({
    data: {
      name: body.name,
      section_id: BigInt(body.sectionId),
      owner_id: 1n,
    },
  });
  return NextResponse.json({ id: stall.id });
}

