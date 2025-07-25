import { NextRequest, NextResponse } from "next/server";
import { getHeatmap, getRandomBusySection } from "swapmeet-api";

export const revalidate = 2;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("busy") === "true") {
    const sec = await getRandomBusySection();
    return NextResponse.json(sec);
  }

  const x0 = parseInt(searchParams.get("x0") ?? "0", 10);
  const x1 = parseInt(searchParams.get("x1") ?? "0", 10);
  const y0 = parseInt(searchParams.get("y0") ?? "0", 10);
  const y1 = parseInt(searchParams.get("y1") ?? "0", 10);

  if ([x0, x1, y0, y1].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ message: "Invalid bounds" }, { status: 400 });
  }

  const data = await getHeatmap(x0, x1, y0, y1);
  return NextResponse.json(data);
}
