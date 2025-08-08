// app/api/articles/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prismaclient'

export async function GET(_req: Request, { params }: { params: { id: string }}) {
  const article = await prisma.article.findUnique({ where: { id: params.id } })
  return article
    ? NextResponse.json(article)
    : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PATCH(req: Request, { params }: { params: { id: string }}) {
  const body = await req.json()
  const article = await prisma.article.update({ where: { id: params.id }, data: body })
  return NextResponse.json(article)
}

export async function DELETE(_req: Request, { params }: { params: { id: string }}) {
  await prisma.article.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}


