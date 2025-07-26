import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { jsonSafe } from "@/lib/bigintjson";
export async function POST(req: Request) {
  const { name, sectionId } = await req.json();

  const body = await req.json();
    // validate FK
    const exists = await prisma.section.count({ where: { id: sectionId } });
    if (!exists) {
      return NextResponse.json(
        { message: "Section not found" },
        { status: 400 }
      );
    }
  const stall = await prisma.stall.create({
    data: {
      name: body.name,
      section_id: BigInt(body.sectionId),
      owner_id: 1n,
    },
  });
  return NextResponse.json(jsonSafe({ id: stall.id }));
}

