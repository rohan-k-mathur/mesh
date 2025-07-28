import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { serializeBigInt } from "@/lib/utils";
import { createFeedPost } from "@/lib/actions/feed.actions";


export async function GET() {
  const posts = await prisma.feedPost.findMany({
    where: { isPublic: true },
    orderBy: { created_at: "desc" },
    include: { predictionMarket: true },
  });
  return NextResponse.json(serializeBigInt(posts));
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createFeedPost(body);
    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}