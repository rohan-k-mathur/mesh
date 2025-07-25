import { NextRequest, NextResponse } from "next/server";
import { getSection } from "swapmeet-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const x = parseInt(searchParams.get("x") ?? "0", 10);
  const y = parseInt(searchParams.get("y") ?? "0", 10);

  if (Number.isNaN(x) || Number.isNaN(y)) {
    return NextResponse.json({ message: "Invalid coordinates" }, { status: 400 });
  }

  const data = await getSection(x, y);
  return NextResponse.json(data);
}
