import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseclient";
import { WORKFLOW_CHANNEL } from "@/constants";

export async function POST(req: Request) {
  const { event, payload } = await req.json();
  const channel = supabase.channel(WORKFLOW_CHANNEL);
  await channel.send({ type: "broadcast", event, payload });
  supabase.removeChannel(channel);
  return NextResponse.json({ status: "ok" });
}
