import { NextResponse } from "next/server";
import { refreshGmailAccessToken } from "@/lib/actions/gmail.actions";

export async function POST() {
  try {
    const token = await refreshGmailAccessToken();
    return NextResponse.json(token);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
