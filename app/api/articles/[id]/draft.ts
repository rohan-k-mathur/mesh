import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prismaclient";
import { z } from "zod";

function isAuthorized(req: NextApiRequest): boolean {
  const expected = process.env.BASIC_AUTH;
  if (!expected) return true;
  return req.headers.authorization === `Basic ${expected}`;
}

const schema = z.object({
  astJson: z.any(),
  template: z.string().optional(),
  heroImageKey: z.string().optional(),
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

  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    res.status(405).end("Method Not Allowed");
    return;
  }

  const id = req.query.id as string;
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  await prisma.article.update({
    where: { id },
    data: { ...parsed.data, status: "DRAFT" },
  });
  res.status(200).json({ ok: true });
}
