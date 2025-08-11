import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const article = await prisma.article.findUnique({ where: { slug: params.slug } });
  if (!article) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data = await prisma.commentThread.findMany({
    where: { articleId: article.id },
    include: { comments: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  const payload = data.map(t => ({
    id: t.id,
    articleId: t.articleId,
    anchor: t.anchor as any,
    resolved: t.resolved,
    createdBy: t.createdBy,
    createdAt: t.createdAt.toISOString(),
    comments: t.comments.map(c => ({
      id: c.id,
      threadId: c.threadId,
      body: c.body,
      createdBy: c.createdBy,
      createdAt: c.createdAt.toISOString(),
      upvotes: c.upvotes,
      downvotes: c.downvotes,
    })),
  }));
  return NextResponse.json(payload);
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const article = await prisma.article.findUnique({ where: { slug: params.slug } });
  if (!article) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { anchor, body } = await req.json();
  if (!anchor || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // TODO: replace with real auth (session.user.id / username)
  const userId = "anon";

  const thread = await prisma.commentThread.create({
    data: {
      articleId: article.id,
      anchor,
      createdBy: userId,
      comments: { create: { body, createdBy: userId } },
    },
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });

  const resp = {
    id: thread.id,
    articleId: thread.articleId,
    anchor: thread.anchor as any,
    resolved: thread.resolved,
    createdBy: thread.createdBy,
    createdAt: thread.createdAt.toISOString(),
    comments: thread.comments.map(c => ({
      id: c.id,
      threadId: c.threadId,
      body: c.body,
      createdBy: c.createdBy,
      createdAt: c.createdAt.toISOString(),
      upvotes: c.upvotes,
      downvotes: c.downvotes,
    })),
  };

  return NextResponse.json(resp, { status: 201 });
}
