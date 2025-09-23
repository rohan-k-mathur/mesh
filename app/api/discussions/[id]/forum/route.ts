// app/api/discussions/[id]/forum/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { facetToPlainText } from "@/lib/text/mentions"; // you already use this elsewhere



export const runtime = "nodejs";
// top of the file

function toPlainText(x: any): string {
    try {
      if (typeof x === "string") return x;
      return facetToPlainText(x);
    } catch {
      return typeof x === "string" ? x : "";
    }
  }
  
  function looksJson(s?: string | null): boolean {
    if (!s) return false;
    const t = s.trim();
    return t.startsWith("{") || t.startsWith("[");
  }
  
  function serializeComment(row: any) {
    // Fix old data: if bodyText looks like JSON or is empty, derive from body
    let cleanText = typeof row.bodyText === "string" ? row.bodyText : "";
    if (!cleanText || looksJson(cleanText)) {
      try { cleanText = toPlainText(row.body).slice(0, 3000); } catch {}
    }
  
    return {
      id: row.id ? String(row.id) : null,
      discussionId: row.discussionId,
      parentId: row.parentId != null ? String(row.parentId) : null,
      authorId: row.authorId,
      body: row.body,
      bodyText: cleanText,                    // 👈 now plain text
      sourceMessageId: row.sourceMessageId ?? null,
      score: row.score ?? 0,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    };
  }
  
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor"); // BigInt id
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "30", 10), 100);
  const rows = await prisma.forumComment.findMany({
    where: { discussionId: params.id, parentId: null },
    orderBy: { id: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: BigInt(cursor) }, skip: 1 } : {}),
    select: {
      id: true, authorId: true, body: true, bodyText: true,
      createdAt: true, score: true, sourceMessageId: true, parentId: true,
      discussionId: true,
    },
  });

  return NextResponse.json({ items: rows.map(serializeComment) });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const uid = await getCurrentUserId();
  if (!uid) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const { parentId, content } = body ?? {};

  const bodyText = toPlainText(content).slice(0, 3000);   // 👈 use plain text


//   const { parentId, content } = body ?? {};

//   const bodyText =
//     typeof content === "string"
//       ? content.slice(0, 3000)
//       : JSON.stringify(content ?? "").slice(0, 3000);

//       const created = await prisma.forumComment.create({
//         data: {
//           discussionId: params.id,
//           parentId: parentId ? BigInt(parentId) : null,
//           authorId: String(uid),
//           body: content ?? { type: "paragraph", content: [{ type: "text", text: "" }] },
//           bodyText,
//         },
//         select: {
//           id: true, authorId: true, body: true, bodyText: true,
//           createdAt: true, score: true, sourceMessageId: true, parentId: true,
//           discussionId: true,
//         },
//       });
const created = await prisma.forumComment.create({
    data: {
      discussionId: params.id,
      parentId: parentId ? BigInt(parentId) : null,
      authorId: String(uid),
      body: content ?? { type: "paragraph", content: [{ type: "text", text: "" }] },
      bodyText,
    },
    select: { id: true, discussionId: true, parentId: true, createdAt: true },
  });
      return NextResponse.json({ comment: serializeComment(created) }, { status: 201 });
    }