import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json([], { status: 200 });
  }
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, image: true },
    take: 10,
  });
  return NextResponse.json(
    users.map((u) => ({ id: u.id.toString(), name: u.name, image: u.image })),
    { status: 200 }
  );
}
