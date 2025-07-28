import { prisma } from "@/lib/prismaclient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, sectionId } = await req.json();

  if (!name || !sectionId) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  const section = await prisma.section.findUnique({
    where: { id: BigInt(sectionId) },
    select: { id: true },
  });

  if (!section) {
    return NextResponse.json({ message: "Invalid section" }, { status: 400 });
  }

  const stall = await prisma.stall.create({
    data: {
      name,
      section_id: section.id,
      owner_id: 1n, // TODO: replace with auth
    },
  });

  return NextResponse.json({ id: Number(stall.id) });
}

