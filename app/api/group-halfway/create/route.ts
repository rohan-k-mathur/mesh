import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { signGroupToken } from "@/lib/jwtHelpers";

export async function POST(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, uids } = await req.json();
  if (!Array.isArray(uids) || uids.length === 0) {
    return NextResponse.json({ error: "Invalid uids" }, { status: 400 });
  }

  const meeting = await prisma.groupMeeting.create({
    data: { title: title ?? null, participantUids: uids },
  });

  const token = signGroupToken({ uid: user.uid, id: meeting.id });
  const joinUrl = `/g-halfway/${meeting.id}?token=${token}`;

  return NextResponse.json({ joinUrl });
}
