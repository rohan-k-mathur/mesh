import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prismaclient";
import { kebabCase } from "lodash";
import { createFeedPost } from "@/lib/actions/feedpost.actions";

function isAuthorized(req: NextApiRequest): boolean {
  const expected = process.env.BASIC_AUTH;
  if (!expected) return true;
  return req.headers.authorization === `Basic ${expected}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!isAuthorized(req)) {
    res.setHeader("WWW-Authenticate", "Basic");
    res.status(401).end("Unauthorized");
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
    return;
  }

  const id = req.query.id as string;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    res.status(404).end("Not Found");
    return;
  }

  const baseSlug = kebabCase(article.title);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  await prisma.article.update({
    where: { id },
    data: { slug, status: "PUBLISHED" },
  });

  await createFeedPost({
    type: "ARTICLE",
    caption: article.title,
    content: `/article/${slug}`,
    imageUrl: article.heroImageKey || undefined,
  });

  res.status(200).json({ slug });
}

