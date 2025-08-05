import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prismaclient";
import { z } from "zod";

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

  if (req.method === "GET") {
    const articles = await prisma.article.findMany();
    res.status(200).json(articles);
    return;
  }

  if (req.method === "POST") {
    const schema = z.object({
      authorId: z.string(),
      title: z.string(),
      slug: z.string(),
      heroImageKey: z.string().optional(),
      template: z.string().optional(),
      astJson: z.any(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const article = await prisma.article.create({ data: parsed.data });
    res.status(201).json({ id: article.id });
    return;
  }

  res.setHeader("Allow", "GET,POST");
  res.status(405).end("Method Not Allowed");
}
