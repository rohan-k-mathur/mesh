import { NextRequest, NextResponse } from "next/server";
import { getHeatmap, getRandomBusySection } from "swapmeet-api";

export const revalidate = 2;   // still fine to keep

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  /* ── busy‑section shortcut ─────────────────────────────── */
  if (searchParams.get("busy") === "true") {
    const sec = await getRandomBusySection();
    return NextResponse.json(sec, {
      headers: { "Cache-Control": "s-maxage=2, stale-while-revalidate=5" },
    });
  }

  /* ── normal heat‑map query ─────────────────────────────── */
  const x0 = Number.parseInt(searchParams.get("x0") ?? "0", 10);
  const x1 = Number.parseInt(searchParams.get("x1") ?? "0", 10);
  const y0 = Number.parseInt(searchParams.get("y0") ?? "0", 10);
  const y1 = Number.parseInt(searchParams.get("y1") ?? "0", 10);

  if ([x0, x1, y0, y1].some((n) => Number.isNaN(n))) {
    return NextResponse.json(
      { message: "Invalid bounds" },
      { status: 400 }
    );
  }

  const data = await getHeatmap(x0, x1, y0, y1);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=2, stale-while-revalidate=5" },
  });
}
