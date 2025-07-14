import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";
import { getPineconeIndex } from "@/lib/pineconeClient";

export async function GET(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const k = parseInt(req.nextUrl.searchParams.get("k") || "50", 10);
  const record = await prisma.userEmbedding.findUnique({
    where: { user_id: user.userId },
  });
  if (!record) return NextResponse.json([]);
  const index = await getPineconeIndex();
  const result = await index.query({ topK: k + 1, vector: record.embedding });
  const matches = (result.matches || [])
    .filter((m: any) => m.id !== user.userId.toString())
    .map((m: any) => ({ userId: parseInt(m.id, 10), score: m.score }));
  return NextResponse.json(matches);
}
