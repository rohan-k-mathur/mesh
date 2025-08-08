import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const article = await prisma.article.create({
      data: {
        authorId: body.authorId,
        title: body.title,
        slug: body.slug,
        astJson: body.astJson,
      },
    });

    return NextResponse.json(article);
  } catch (err) {
    console.error("Error creating article:", err);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}

// (optional) GET for listing all articles
export async function GET() {
  const articles = await prisma.article.findMany();
  return NextResponse.json(articles);
}
