"use server";

import { prisma } from "../prismaclient";
import { nanoid } from "nanoid";
export async function createPortfolioPage({
  html,
  css,
  tsx,
}: {
  html: string;
  css: string;
  tsx?: string;
}) {
  const slug = nanoid(10);
  await prisma.portfolioPage.create({
    data: { slug, html, css, tsx },   // tsx may be undefined
  });
  return slug;
}

export async function fetchPortfolioPage(slug: string) {
  return prisma.portfolioPage.findUnique({ where: { slug } });
}
