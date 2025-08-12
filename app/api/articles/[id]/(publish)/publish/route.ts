

// app/api/articles/[id]/publish/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prismaclient'
import { kebabCase } from 'lodash'
import { createFeedPost } from '@/lib/actions/feed.actions'
import { getUserFromCookies } from '@/lib/serverutils'
import { feed_post_type } from '@prisma/client'

// export async function POST(req: Request, { params }: { params: { id: string } }) {
//   const user = await getUserFromCookies()
//   if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

//   const article = await prisma.article.findUnique({ where: { id: params.id } })
//   if (!article || article.authorId !== user.userId.toString()) {
//     return NextResponse.json({ error: 'Not found' }, { status: 404 })
//   }

//   // Body is optional; if present we’ll use it to upsert final fields.
//   let body: any = {}
//   try { body = await req.json() } catch { /* ignore */ }

//   // Unique slug from CURRENT title (fallback to “untitled”)
//   const base = kebabCase(article.title || 'untitled') || 'untitled'
//   let slug = base
//   for (let i = 1; await prisma.article.findUnique({ where: { slug } }); i++) {
//     slug = `${base}-${i}`
//   }

//   // Write publish state + any final changes
//   const updated = await prisma.article.update({
//     where: { id: params.id },
//     data : {
//       slug,
//       status: 'PUBLISHED',
//       ...(body.astJson && { astJson: body.astJson }),
//       ...(body.template && { template: body.template }),
//       ...(body.heroImageKey && { heroImageKey: body.heroImageKey }),
//     },
//   })

//   // Snapshot a revision at publish time
//   await prisma.revision.create({
//     data: { articleId: updated.id, astJson: (body.astJson ?? updated.astJson) as any },
//   })

//   // Try to create a feed post, but never fail the publish if feed fails.
//   let feedPostId: string | null = null
//   try {
//     const post = await createFeedPost({
//       caption: updated.title,
//       content: `/article/${updated.slug}`,
//       imageUrl: updated.heroImageKey ?? undefined,
//       type: feed_post_type.ARTICLE,
//       // extra payload if your feed consumers use it:
//       template: updated.template,
//       heroImageKey: updated.heroImageKey,
//       title: updated.title,
//       slug: updated.slug,
//       id: updated.id,
//       status: updated.status,
//       createdAt: updated.createdAt,
//       authorId: user.userId.toString(),
//       astJson: updated.astJson,
//       analytics: updated.analytics,
//       updatedAt: updated.updatedAt,
//     })
//     // normalize ID if needed
//     feedPostId = (post as any)?.postId?.toString?.() ?? null
//   } catch (e) {
//     console.error('createFeedPost failed:', e)
//     // swallow; publish is already successful
//   }

//   return NextResponse.json(
//     { slug: updated.slug, feedPostId },
//     { status: 201 },
//   )
// }

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromCookies()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const article = await prisma.article.findUnique({ where: { id: params.id } })
  if (!article || article.authorId !== user.userId.toString()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const safeJson = async () => { try { return await _req.json() } catch { return {} } }
  const body = await safeJson()

  // 👇 only re-slug if current slug is "untitled" or "untitled-#"
  let slug = article.slug
  if (/^untitled(?:-\d+)?$/.test(article.slug)) {
    const base = kebabCase(article.title || 'untitled') || 'untitled'
    slug = base
    for (let i = 1; await prisma.article.findUnique({ where: { slug } }); i++) {
      slug = `${base}-${i}`
    }
  }

  const updated = await prisma.article.update({
    where: { id: params.id },
    data : {
      slug,
      status: 'PUBLISHED',
      ...(body.astJson && { astJson: body.astJson }),
      ...(body.template && { template: body.template }),
      ...(body.heroImageKey && { heroImageKey: body.heroImageKey }),
    },
  })

  await prisma.revision.create({
    data: { articleId: updated.id, astJson: (body.astJson ?? updated.astJson) as any },
  })

  // OPTIONAL feed post (don’t fail publish if it errors)
  try {
    await createFeedPost({
      caption: updated.title,
      content: `/article/${updated.slug}`,
      imageUrl: updated.heroImageKey ?? undefined,
      type: feed_post_type.ARTICLE,
      template: updated.template, title: updated.title, slug: updated.slug,
      id: updated.id, status: updated.status, createdAt: updated.createdAt,
      authorId: user.userId.toString(), astJson: updated.astJson,
      analytics: updated.analytics, updatedAt: updated.updatedAt,
    })
  } catch (e) {
    console.error('createFeedPost failed:', e)
  }

  return NextResponse.json({ slug: updated.slug }, { status: 201 })
}