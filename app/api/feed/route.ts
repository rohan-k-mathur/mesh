import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { serializeBigInt } from "@/lib/utils";

export async function GET() {
  const posts = await prisma.feedPost.findMany({
    where: { isPublic: true },
    orderBy: { created_at: "desc" },
    include: { predictionMarket: true },
  });
  return NextResponse.json(serializeBigInt(posts));
}
