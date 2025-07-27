import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { jsonSafe } from "@/lib/bigintjson";

export async function POST(req: Request) {
  const { stallId, url, blurhash } = await req.json();
  if (!stallId || !url) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }
  const img = await prisma.stallImage.create({
    data: {
      stall_id: BigInt(stallId),
      url,
      blurhash,
    },
  });
  return NextResponse.json(jsonSafe(img));
}
