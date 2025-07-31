import { NextResponse } from "next/server";
import { spawnSection } from "@/lib/actions/section.server";
export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET() {
  const { x, y } = await spawnSection();
  return NextResponse.json({ x, y });
}