import { prisma } from "@/lib/prismaclient";
import { NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { jsonSafe } from "@/lib/bigintjson";

export async function POST(req: Request) {
  /* -------- read body ONCE -------- */
  const { name = "", sectionId } = (await req.json()) as {
    name?: string;
    sectionId?: unknown;
  };

  /* -------- validate fields -------- */
  const trimmed   = name.trim();
  const secIdNum  = Number(sectionId);
  if (!trimmed || Number.isNaN(secIdNum) || secIdNum <= 0) {
    return NextResponse.json(
      { message: "Missing or bad fields" },
      { status: 400 },
    );
  }

  /* -------- auth -------- */
  const user = await getUserFromCookies();
  if (!user?.userId) {
    return NextResponse.json({ message: "Auth required" }, { status: 401 });
  }
  const ownerId      = BigInt(user.userId);
  const sectionIdBig = BigInt(secIdNum);

  /* -------- verify section -------- */
  const section = await prisma.section.findUnique({
    where: { id: sectionIdBig },
    select: { id: true },
  });
  if (!section) {
    return NextResponse.json({ message: "Invalid section" }, { status: 400 });
  }

  /* -------- uniqueness guard -------- */
  const duplicate = await prisma.stall.findFirst({
    where: { owner_id: ownerId, section_id: sectionIdBig },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json(
      { message: "You already created a stall in this section." },
      { status: 409 },
    );
  }

  /* -------- create stall -------- */
  const stall = await prisma.stall.create({
    data: {
      name: trimmed,
      section_id: sectionIdBig,
      owner_id:   ownerId,
    },
    select: { id: true },
  });

  /* -------- respond -------- */
  return NextResponse.json(jsonSafe({ id: stall.id }), { status: 201 });
}
