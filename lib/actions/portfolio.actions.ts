"use server";

import { prisma } from "../prismaclient";
import { nanoid } from "nanoid";
import type { PortfolioExportData } from "@/lib/portfolio/export";

/** Shape used by create/update */
type CreateArgs = {
  html?: string | null;
  css?: string | null;
  tsx?: string | null;
  payload?: PortfolioExportData | null; // JSON stored as-is
  snapshot?: string | null;             // top-level snapshot URL (optional)
  slug?: string;                        // optional; default nanoid()
  ownerId?: bigint | number | string;   // 👈 NEW

};

function toBigIntish(v: unknown): bigint | undefined {
  if (v == null) return undefined;
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  if (typeof v === "string") {
    const s = v.endsWith("n") ? v.slice(0, -1) : v;
    if (/^\d+$/.test(s)) return BigInt(s);
  }
  return undefined;
}

/**
 * Create a portfolio page record.
 * Stores payload so CanvasRenderer can render components from payload.absolutes[*].props.
 */
export async function createPortfolioPage({
  html = "",
  css = "",
  tsx,
  payload = null,
  snapshot = null,
  slug,
  ownerId,                         // 👈 NEW

}: CreateArgs) {
   const finalSlug = slug ?? nanoid(10);
  const owner = toBigIntish(ownerId);
  await prisma.portfolioPage.create({
    data: {
      slug: finalSlug,
      html,
      css,
      tsx: tsx ?? "",
      payload,
      snapshot,
      ...(owner ? { owner_id: owner } : {}),   // 👈 write owner_id
    },
  });
  return finalSlug;
}

/** Fetch the full record (helpful for debugging) */
export async function fetchPortfolioPage(slug: string) {
  return prisma.portfolioPage.findUnique({ where: { slug } });
}

/**
 * Partial update. Only fields explicitly provided are touched.
 * Use this right after screenshot to attach { payload: {..., snapshot}, snapshot }.
 */
export async function updatePortfolioPage(slug: string, data: Partial<CreateArgs>) {
  const updateData: any = {};

  if ("html" in data) updateData.html = data.html ?? "";
  if ("css"  in data) updateData.css  = data.css  ?? "";
  if ("tsx"  in data) updateData.tsx  = data.tsx  ?? "";
  if ("payload" in data) updateData.payload = data.payload ?? null;
  if ("snapshot" in data) updateData.snapshot = data.snapshot ?? null;

  await prisma.portfolioPage.update({
    where: { slug },
    data: updateData,
  });
}
