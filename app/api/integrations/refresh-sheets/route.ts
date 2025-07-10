import { NextResponse } from "next/server";
import { refreshSheetsAccessToken } from "@/lib/actions/googleSheets.actions";

export async function POST() {
  try {
    const accessToken = await refreshSheetsAccessToken();
    return NextResponse.json({ accessToken });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
