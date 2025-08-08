// import type { NextApiRequest, NextApiResponse } from "next";
// import { prisma } from "@/lib/prismaclient";
// import { z } from "zod";

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

//   if (req.method === "GET") {
//     const articles = await prisma.article.findMany();
//     res.status(200).json(articles);
//     return;
//   }

//   if (req.method === "POST") {
//     const schema = z.object({
//       authorId: z.string(),
//       title: z.string(),
//       slug: z.string(),
//       heroImageKey: z.string().optional(),
//       template: z.string().optional(),
//       astJson: z.any(),
//     });
//     const parsed = schema.safeParse(req.body);
//     if (!parsed.success) {
//       res.status(400).json({ error: "Invalid body" });
//       return;
//     }
//     const article = await prisma.article.create({ data: parsed.data });
//     res.status(201).json({ id: article.id });
//     return;
//   }

//   res.setHeader("Allow", "GET,POST");
//   res.status(405).end("Method Not Allowed");
// }
// app/api/articles/route.ts
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
  // If your Prisma model uses a relation instead (author → User):
  // const payload: Prisma.ArticleCreateInput = {
  //   author: { connect: { id: data.authorId } },
  //   title: data.title,
  //   slug: data.slug,
  //   heroImageKey: data.heroImageKey ?? null,
  //   template: data.template ?? 'standard',
  //   astJson: data.astJson as Prisma.JsonValue,
  //   status: 'DRAFT',
  // }


const article = await prisma.article.create({ data: payload })
return NextResponse.json({ id: article.id }, { status: 201 })
}
// }
//   const schema = z.object({
//     authorId: z.string(),
//     title: z.string(),
//     slug: z.string(),
//     heroImageKey: z.string().optional(),
//     template: z.string().optional(),
//     astJson: z.any(),
//   })

//   const body = await req.json()
//   const parsed = schema.safeParse(body)
//   // console.log('draft received', parsed.success ? 'OK' : parsed.error)

//   if (!parsed.success)
//     return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

//   const article = await prisma.article.create({ data: parsed.data })
//   return NextResponse.json({ id: article.id }, { status: 201 })
// }
