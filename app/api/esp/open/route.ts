import { NextRequest, NextResponse } from "next/server";
import { espSessions } from "@/lib/espSessionStore";
import { supabase } from "@/lib/supabaseclient";

export async function POST(req: NextRequest) {
  const { targetUserId, roomId } = await req.json();
  const userId = 0n; // TODO: auth
  const paneId = crypto.randomUUID();
  espSessions.set(paneId, { users: [userId, BigInt(targetUserId)], touched: Date.now() });
  await supabase.channel("esp-open").send({
    type: "broadcast",
    event: "open",
    payload: { paneId, roomId, users: [userId, BigInt(targetUserId)] },
  });
  return NextResponse.json({ paneId });
}
