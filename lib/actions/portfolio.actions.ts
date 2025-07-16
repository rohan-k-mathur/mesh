"use server";

import { prisma } from "../prismaclient";
import { nanoid } from "nanoid";

export async function createPortfolioPage({
  html,
  css,
}: {
  html: string;
  css: string;
}) {
  const slug = nanoid(10);
  await prisma.portfolioPage.create({
    data: { slug, html, css },
  });
  return slug;
}

export async function fetchPortfolioPage(slug: string) {
  return prisma.portfolioPage.findUnique({ where: { slug } });
}
