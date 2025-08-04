import { NextRequest, NextResponse } from "next/server";
import { getNearestOpenSection } from "swapmeet-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const x = Number.parseInt(searchParams.get("x") ?? "0", 10);
  const y = Number.parseInt(searchParams.get("y") ?? "0", 10);
  if (Number.isNaN(x) || Number.isNaN(y)) {
    return NextResponse.json({ message: "Bad coords" }, { status: 400 });
  }
  const sec = await getNearestOpenSection(x, y);
  return NextResponse.json(sec);
}
