import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { jsonSafe } from "@/lib/bigintjson";
export async function POST(req: Request) {
  const body = await req.json();
  const { name, sectionId } = body;

  const exists = await prisma.section.count({ where: { id: sectionId } });
  if (!exists) {
    return NextResponse.json(
      { message: "Section not found" },
      { status: 400 }
    );
  }

  const [stall] = await prisma.$transaction([
    prisma.stall.create({
      data: {
        name,
        section_id: BigInt(sectionId),
        owner_id: 1n,
      },
    }),
    prisma.section.update({
      where: { id: BigInt(sectionId) },
      data: { visitors: { increment: 1 } },
    }),
  ]);
  return NextResponse.json(jsonSafe({ id: stall.id, name: stall.name }));
}

