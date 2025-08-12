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

export async function GET() {
  const user = await getUserFromCookies()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const items = await prisma.article.findMany({
    where: { authorId: user.userId.toString() },
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true, title: true, slug: true, status: true,
      createdAt: true, updatedAt: true, heroImageKey: true, template: true,
    },
  })
  return NextResponse.json(items)
}

export async function POST() {
  const user = await getUserFromCookies()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // unique draft slug: untitled, untitled-1, untitled-2, …
  let slug = 'untitled'
  let i = 1
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.article.findUnique({ where: { slug } })) slug = `untitled-${i++}`

  const article = await prisma.article.create({
    data: {
      authorId: user.userId.toString(),
      title: 'Untitled',
      slug,
      template: 'standard',
      status: 'DRAFT',
      astJson: { type: 'doc', content: [] } as any,
    },
    select: { id: true, slug: true },
  })

  return NextResponse.json(article, { status: 201 })
}
