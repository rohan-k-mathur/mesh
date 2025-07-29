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
    select: { id: true, x: true, y: true },
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

  /* -------- section capacity -------- */
  let targetSectionId = sectionIdBig;
  const stallCount = await prisma.stall.count({
    where: { section_id: sectionIdBig },
  });
  if (stallCount >= 9 && section) {
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const;
    for (const [dx, dy] of dirs) {
      const nx = section.x + dx;
      const ny = section.y + dy;
      const existing = await prisma.section.findUnique({
        where: { x_y: { x: nx, y: ny } },
        select: { id: true },
      });
      if (existing) continue;
      const neighbor = await prisma.section.findFirst({
        where: {
          OR: [
            { x: nx + 1, y: ny, stalls: { some: {} } },
            { x: nx - 1, y: ny, stalls: { some: {} } },
            { x: nx, y: ny + 1, stalls: { some: {} } },
            { x: nx, y: ny - 1, stalls: { some: {} } },
          ],
        },
        select: { id: true },
      });
      if (neighbor) {
        const newSec = await prisma.section.create({
          data: { x: nx, y: ny },
          select: { id: true },
        });
        targetSectionId = newSec.id;
        break;
      }
    }
  }

  /* -------- create stall -------- */
  const stall = await prisma.stall.create({
    data: {
      name: trimmed,
      section_id: targetSectionId,
      owner_id:   ownerId,
    },
    select: { id: true },
  });

  /* -------- respond -------- */
  return NextResponse.json(jsonSafe({ id: stall.id }), { status: 201 });
}
