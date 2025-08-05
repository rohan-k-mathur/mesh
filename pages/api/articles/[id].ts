import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prismaclient";
import { z } from "zod";

function isAuthorized(req: NextApiRequest): boolean {
  const expected = process.env.BASIC_AUTH;
  if (!expected) return true;
  return req.headers.authorization === `Basic ${expected}`;
}

const updateSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  heroImageKey: z.string().optional(),
  template: z.string().optional(),
  astJson: z.any().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!isAuthorized(req)) {
    res.setHeader("WWW-Authenticate", "Basic");
    res.status(401).end("Unauthorized");
    return;
  }

  const id = req.query.id as string;

  if (req.method === "GET") {
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      res.status(404).end("Not Found");
      return;
    }
    res.status(200).json(article);
    return;
  }

  if (req.method === "PATCH") {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const article = await prisma.article.update({ where: { id }, data: parsed.data });
    res.status(200).json(article);
    return;
  }

  if (req.method === "DELETE") {
    await prisma.article.delete({ where: { id } });
    res.status(204).end();
    return;
  }

  res.setHeader("Allow", "GET,PATCH,DELETE");
  res.status(405).end("Method Not Allowed");
}
