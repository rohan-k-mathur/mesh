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

  //   /* ---------- grab the final doc/state sent by the client ----------- */
  // let incoming: { astJson?: unknown; template?: string; heroImageKey?: string | null }
  // try {
  //   incoming = await req.json()
  // } catch {
  //   incoming = {}
  // }

//   /* create or fetch a unique slug */
//   const base = kebabCase(article.title);
//   const slug  = base;                       // TODO: ensure uniqueness
  const base = kebabCase(article.title)
  let slug = base
  let suffix = 1
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix++}`
  }
  const safeJson = async () => {
    try { return await _req.json() } catch { return {} }
  }
  const body = await safeJson()

  //const body = await _req.json().catch(() => null)  // client may POST content

  /* ①  write slug + PUBLISHED status */
// await prisma.article.update({
//     where: { id: params.id },
//     data: { slug, status: 'PUBLISHED' },
//   })
await prisma.article.update({
    where: { id: params.id },
    data : {
      slug,
      status: 'PUBLISHED',
      ...(body.astJson && { astJson: body.astJson }),
      ...(body.template && { template: body.template }),
      ...(body.heroImageKey && { heroImageKey: body.heroImageKey }),
    },
  })


  const post = await createFeedPost({
    caption: article.title,
    content: `/article/${slug}`,
    imageUrl: article.heroImageKey ?? undefined,
    type: feed_post_type.ARTICLE,

    template: article.template,
    heroImageKey: article.heroImageKey,
    title: article.title,
    slug: article.slug,
    id: article.id,
    status: article.status,
    createdAt: Date,
    authorId: user.userId.toString(),
    astJson: article.astJson,
    analytics: article.analytics,
    updatedAt: Date,
  });

  return NextResponse.json({ postId: post.postId.toString(), slug }, { status: 201 })
}


// import type { NextApiRequest, NextApiResponse } from "next";
// import { prisma } from "@/lib/prismaclient";
// import { kebabCase } from "lodash";
// import { createFeedPost } from "@/lib/actions/feedpost.actions";

// function isAuthorized(req: NextApiRequest): boolean {
//   const expected = process.env.BASIC_AUTH;
//   if (!expected) return true;
//   return req.headers.authorization === `Basic ${expected}`;
// }

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse,
// ) {
//   if (!isAuthorized(req)) {
//     res.setHeader("WWW-Authenticate", "Basic");
//     res.status(401).end("Unauthorized");
//     return;
//   }

//   if (req.method !== "POST") {
//     res.setHeader("Allow", "POST");
//     res.status(405).end("Method Not Allowed");
//     return;
//   }

//   const id = req.query.id as string;
//   const article = await prisma.article.findUnique({ where: { id } });
//   if (!article) {
//     res.status(404).end("Not Found");
//     return;
//   }

//   const baseSlug = kebabCase(article.title);
//   let slug = baseSlug;
//   let suffix = 1;
//   while (await prisma.article.findUnique({ where: { slug } })) {
//     slug = `${baseSlug}-${suffix++}`;
//   }

//   await prisma.article.update({
//     where: { id },
//     data: { slug, status: "PUBLISHED" },
//   });

//   await createFeedPost({
//     type: "ARTICLE",
//     caption: article.title,
//     content: `/article/${slug}`,
//     imageUrl: article.heroImageKey || undefined,
//   });

//   res.status(200).json({ slug });
// }

