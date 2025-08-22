import { NextRequest, NextResponse } from "next/server";
import { getBlock } from "@/lib/actions/blocks.actions";

export async function GET(_: NextRequest, ctx: { params: { id: string } }) {
  const row = await getBlock(ctx.params.id);
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}
