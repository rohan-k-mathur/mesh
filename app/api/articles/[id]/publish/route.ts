// app/api/articles/[id]/publish/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prismaclient'
import { kebabCase } from 'lodash'
import { createFeedPost } from '@/lib/actions/feed.actions'
import { getUserFromCookies } from '@/lib/serverutils'
import { feed_post_type } from '@prisma/client'
import { jsonSafe } from '@/lib/bigintjson'
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })

//   /* create or fetch a unique slug */
//   const base = kebabCase(article.title);
//   const slug  = base;                       // TODO: ensure uniqueness
  const base = kebabCase(article.title)
  let slug = base
  let suffix = 1
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix++}`
  }

  /* ①  write slug + PUBLISHED status */
await prisma.article.update({
    where: { id: params.id },
    data: { slug, status: 'PUBLISHED' },
  })



  const post = await createFeedPost({
    caption: article.title,
    content: `/article/${slug}`,
    imageUrl: article.heroImageKey ?? undefined,
    type: feed_post_type.ARTICLE,
  });

  return NextResponse.json({ postId: post.id.toString(), slug }, { status: 201 })
}
