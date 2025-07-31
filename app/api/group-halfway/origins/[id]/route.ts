import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { verifyGroupToken } from "@/lib/jwtHelpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const payload = verifyGroupToken(token);
  if (!payload || payload.id !== params.id) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { address, lat, lng } = await req.json();
  const meeting = await prisma.groupMeeting.findUnique({ where: { id: params.id } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const origins = (meeting.origins as any) || {};
  origins[payload.uid] = { address, lat, lng };

  await prisma.groupMeeting.update({ where: { id: params.id }, data: { origins } });

  return NextResponse.json({ ok: true });
}
