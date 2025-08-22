// lib/actions/blocks.actions.ts
"use server";

import { prisma } from "@/lib/prismaclient";
import { nanoid } from "nanoid";
import { getUserFromCookies } from "@/lib/server/getUser";
import { screenshotPage } from "@/lib/screenshot";
import { uploadFileToSupabase } from "@/lib/utils";

function toBigIntId(v: bigint | number | string | undefined | null): bigint | null {
  if (v == null) return null;
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  if (typeof v === "string") {
    const s = v.endsWith("n") ? v.slice(0, -1) : v;   // 👈 allow "123n"
    if (/^\d+$/.test(s)) return BigInt(s);
  }
  return null;
}


async function renderBlockThumbnail(blockId: string): Promise<string | null> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url  = `${base}/blocks/${blockId}/preview`; // 👈 the preview page

    // Render screenshot (use your existing Playwright utility)
    const pngBuffer = await screenshotPage(url);
    const fileName  = `blocks/thumb-${blockId}.png`;

    const { fileURL: thumbnail, error } = await uploadFileToSupabase(
      new File([pngBuffer], fileName, { type: "image/png" })
    );
    if (error) throw error;

    await prisma.blockManifest.update({
      where: { id: blockId },
      data: { thumbnail },
    });
    return thumbnail;
  } catch (err) {
    console.warn("renderBlockThumbnail failed", err);
    return null;
  }
}

// ----- existing APIs updated to call the helper -----

export async function createBlockFromElement(args: {
  pageSlug: string;
  elementId: string;
  ownerId?: bigint | number | string;
}) {
  const user = await getUserFromCookies().catch(() => null);
  const owner = toBigIntId(args.ownerId ?? user?.id);
  if (!owner) throw new Error("Unauthorized");

  // Load the page payload and find the component element
  const page = await prisma.portfolioPage.findUnique({
    where: { slug: args.pageSlug },
    select: { payload: true },
  });
  if (!page?.payload) throw new Error("Page/payload not found");

  const payload = page.payload as any;
  const abs: any[] = Array.isArray(payload.absolutes) ? payload.absolutes : [];
  const el = abs.find((e) => e?.id === args.elementId && e?.type === "component");
  if (!el) throw new Error("Component element not found");

  const id = nanoid();
  const manifest = await prisma.blockManifest.create({
    data: {
      id,
      ownerId: owner,
      component: el.component,
      props: el.props ?? {},
      originSlug: args.pageSlug,
      originElId: args.elementId,
      isPublic: true,
    },
    select: { id: true, component: true, props: true },
  });

  // best-effort back-fill of blockId on canvas payload
  try {
    const nextAbs = abs.map((e) => (e.id === args.elementId ? { ...e, blockId: id } : e));
    await prisma.portfolioPage.update({
      where: { slug: args.pageSlug },
      data: { payload: { ...payload, absolutes: nextAbs } },
    });
  } catch {}

  // 👇 generate a thumbnail
  await renderBlockThumbnail(manifest.id);
  return manifest;
}

export async function listBlocks(ownerId?: bigint | number | string) {
  const user = await getUserFromCookies().catch(() => null);
  const owner = toBigIntId(ownerId ?? user?.id);
  if (!owner) throw new Error("Unauthorized");

  return prisma.blockManifest.findMany({
    where: { ownerId: owner },
    orderBy: { createdAt: "desc" },
    select: { id: true, component: true, props: true, createdAt: true, thumbnail: true }, // 👈 include thumbnail
  });
}


export async function createBlockFromSpec(args: {
  component: string;
  props: any;
  originSlug?: string | null;
  originElId?: string | null;
  ownerId?: bigint | number | string;
}) {
  const user = await getUserFromCookies().catch(() => null);
  const owner = toBigIntId(args.ownerId ?? user?.id);
  if (!owner) throw new Error("Unauthorized");

  const id = nanoid();
  const row = await prisma.blockManifest.create({
    data: {
      id,
      ownerId: owner,
      component: args.component,
      props: args.props ?? {},
      originSlug: args.originSlug ?? null,
      originElId: args.originElId ?? null,
      isPublic: true,
    },
    select: { id: true, component: true, props: true },
  });

  await renderBlockThumbnail(row.id);
  return row;
}
