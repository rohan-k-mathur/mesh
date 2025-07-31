import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getIO } from "@/lib/socket";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { candidateId, uid } = await req.json();
  if (!candidateId || !uid) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const meeting = await prisma.groupMeeting.findUnique({ where: { id: params.id } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const votes = (meeting.votes as any) || {};
  votes[uid] = candidateId;

  await prisma.groupMeeting.update({ where: { id: params.id }, data: { votes } });

  const io = getIO();
  io?.to(`group-${params.id}`).emit("voteUpdate", { uid, candidateId, votes });

  return NextResponse.json({ ok: true });
}
