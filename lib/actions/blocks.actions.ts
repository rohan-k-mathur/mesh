"use server";

import { prisma } from "@/lib/prismaclient";
import { nanoid } from "nanoid";
import { getUserFromCookies } from "@/lib/server/getUser";

function toBigIntId(v: bigint | number | string | undefined | null): bigint | null {
  if (v == null) return null;
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  if (typeof v === "string" && /^\d+$/.test(v)) return BigInt(v);
  return null;
}

export async function createBlockFromElement(args: {
  pageSlug: string;
  elementId: string;
  ownerId?: bigint | number | string;
}) {
  const user = await getUserFromCookies().catch(() => null);
  const owner = toBigIntId(args.ownerId ?? user?.id);
  if (!owner) throw new Error("Unauthorized: ownerId missing");

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

  const component = el.component as string;
  const props = el.props ?? {};

  const id = nanoid();
  const manifest = await prisma.blockManifest.create({
    data: {
      id,
      ownerId: owner,
      component,
      props,
      originSlug: args.pageSlug,
      originElId: args.elementId,
      isPublic: true,
    },
    select: { id: true, component: true, props: true, ownerId: true },
  });

  // Optionally attach blockId back into payload for provenance
  try {
    const nextAbs = abs.map((e) => (e.id === args.elementId ? { ...e, blockId: id } : e));
    await prisma.portfolioPage.update({
      where: { slug: args.pageSlug },
      data: { payload: { ...payload, absolutes: nextAbs } },
    });
  } catch { /* best effort */ }

  return manifest;
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
  if (!owner) throw new Error("Unauthorized: ownerId missing");

  const id = nanoid();
  return prisma.blockManifest.create({
    data: {
      id,
      ownerId: owner,
      component: args.component,
      props: args.props ?? {},
      originSlug: args.originSlug ?? null,
      originElId: args.originElId ?? null,
      isPublic: true,
    },
    select: { id: true, component: true, props: true, ownerId: true },
  });
}

export async function forkBlock(args: { blockId: string; newOwnerId?: bigint | number | string }) {
  const user = await getUserFromCookies().catch(() => null);
  const owner = toBigIntId(args.newOwnerId ?? user?.id);
  if (!owner) throw new Error("Unauthorized");

  const src = await prisma.blockManifest.findUnique({
    where: { id: args.blockId },
    select: { id: true, component: true, props: true },
  });
  if (!src) throw new Error("Block not found");

  const id = nanoid();
  return prisma.blockManifest.create({
    data: {
      id,
      ownerId: owner,
      component: src.component,
      props: src.props,
      forkOfId: src.id,
      isPublic: true,
    },
    select: { id: true, component: true, props: true, ownerId: true, forkOfId: true },
  });
}

export async function getBlock(blockId: string) {
  return prisma.blockManifest.findUnique({
    where: { id: blockId },
    select: { id: true, component: true, props: true, ownerId: true, isPublic: true },
  });
}

export async function listBlocks(ownerId?: bigint | number | string) {
  const user = await getUserFromCookies().catch(() => null);
  const owner = toBigIntId(ownerId ?? user?.id);
  if (!owner) throw new Error("Unauthorized");

  return prisma.blockManifest.findMany({
    where: { ownerId: owner },
    orderBy: { createdAt: "desc" },
    select: { id: true, component: true, props: true, createdAt: true },
  });
}
