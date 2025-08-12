// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prismaclient";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();

//     const article = await prisma.article.create({
//       data: {
//         authorId: body.authorId,
//         title: body.title,
//         slug: body.slug,
//         astJson: body.astJson,
//       },
//     });

//     return NextResponse.json(article);
//   } catch (err) {
//     console.error("Error creating article:", err);
//     return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
//   }
// }

// // (optional) GET for listing all articles
// export async function GET() {
//   const articles = await prisma.article.findMany();
//   return NextResponse.json(articles);
// }
import { prisma } from '@/lib/prismaclient'
import { NextResponse } from 'next/server'
import { getUserFromCookies } from '@/lib/serverutils'

export async function GET(req: Request) {
  const user = await getUserFromCookies()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const url = new URL(req.url)
  const page     = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1)
  const pageSize = Math.min(Math.max(parseInt(url.searchParams.get('pageSize') || '20', 10), 1), 100)
  const q        = (url.searchParams.get('q') || '').trim()
  const status   = url.searchParams.get('status') as 'DRAFT' | 'PUBLISHED' | null
  const template = url.searchParams.get('template') || undefined
  const view     = url.searchParams.get('view') || 'active' // 'active' | 'trash'
  const sort     = url.searchParams.get('sort') || 'updatedAt:desc' // field:dir

  const [sortField, sortDir] = sort.split(':') as [string, 'asc'|'desc']
  const orderBy = [{ [sortField || 'updatedAt']: (sortDir === 'asc' ? 'asc' : 'desc') as const }]

  const where: any = {
    authorId: user.userId.toString(),
    deletedAt: view === 'trash' ? { not: null } : null,
    ...(status ? { status } : {}),
    ...(template ? { template } : {}),
    ...(q ? { OR: [
      { title: { contains: q, mode: 'insensitive' } },
      { slug:  { contains: q, mode: 'insensitive' } },
    ] } : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where, orderBy, take: pageSize, skip: (page - 1) * pageSize,
      select: { id:true,title:true,slug:true,status:true,createdAt:true,updatedAt:true,heroImageKey:true,template:true },
    })
  ])

  // serialize dates → strings for client components
  const items = rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  return NextResponse.json({ items, total, page, pageSize })
}