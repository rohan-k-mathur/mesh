
import { prisma } from '@/lib/prismaclient'
import { NextResponse } from 'next/server'
import { z } from 'zod'


const CreateArticle = z.object({
  authorId: z.string(),               // <-- make sure your Prisma model expects string here
  title: z.string(),
  slug: z.string(),
  heroImageKey: z.string().nullable().optional(),
  template: z.string().default('standard'),
  astJson: z.unknown(),               // or z.any()
})

export async function GET() {
  const articles = await prisma.article.findMany()
  return NextResponse.json(articles)
}

export async function POST(req: Request) {

  const data = CreateArticle.parse(await req.json())
 // If your Prisma model uses a scalar authorId field:
 const payload: prisma.ArticleUncheckedCreateInput = {
  authorId: data.authorId,
  title: data.title,
  slug: data.slug,
  heroImageKey: data.heroImageKey ?? null,
  template: data.template ?? 'standard',
  astJson: data.astJson as prisma.JsonValue, // <- important
  status: 'DRAFT',                           // include if required or omit if defaulted
}


const article = await prisma.article.create({ data: payload })
return NextResponse.json({ id: article.id }, { status: 201 })
}
