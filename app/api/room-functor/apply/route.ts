import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

const ProposalZ = z.object({
  fingerprint: z.string().min(10),
  fromArgumentId: z.string().min(6),
  fromClaimId: z.string().min(6),
  toClaimId: z.string().min(6),
  base: z.number().min(0).max(1),
  previewText: z.string().optional(),
});

const Body = z.object({
  fromId: z.string().min(6),
  toId: z.string().min(6),
  claimMap: z.record(z.string().min(6)).optional(),
  proposals: z.array(ProposalZ).default([]),
});

export async function POST(req: NextRequest) {
  const { fromId, toId, proposals } = Body.parse(await req.json());
  if (!proposals.length) return NextResponse.json({ ok: true, applied: 0, skipped: 0 }, NO_STORE);

  let applied = 0, skipped = 0;

  for (const p of proposals) {
    const exists = await prisma.argumentImport.findUnique({
      where: { fingerprint: p.fingerprint },
      select: { id: true }
    }).catch(()=>null);
    if (exists) { skipped++; continue; }

    const src = await prisma.argument.findUnique({
      where: { id: p.fromArgumentId },
      select: { text:true, authorId:true },
    }).catch(()=>null);

    const toArg = await prisma.argument.create({
      data: {
        deliberationId: toId,
        authorId: src?.authorId ?? 'system',
        text: p.previewText || src?.text || 'Imported support',
        claimId: p.toClaimId,
        isImplicit: false,
      },
      select: { id:true }
    });

    await prisma.argumentSupport.create({
      data: {
        deliberationId: toId,
        claimId: p.toClaimId,
        argumentId: toArg.id,
        base: p.base,
        provenanceJson: {
          kind: 'import',
          fingerprint: p.fingerprint,
          fromDeliberationId: fromId,
          fromArgumentId: p.fromArgumentId,
          fromClaimId: p.fromClaimId
        },
      }
    });

    await prisma.argumentImport.create({
      data: {
        fingerprint: p.fingerprint,
        fromDeliberationId: fromId,
        toDeliberationId: toId,
        fromArgumentId: p.fromArgumentId,
        toArgumentId: toArg.id,
        fromClaimId: p.fromClaimId,
        toClaimId: p.toClaimId,
        baseAtImport: p.base,
        metaJson: {},
      }
    });

    applied++;
  }

  try { (globalThis as any).dispatchEvent?.(new CustomEvent('plexus:links:changed')); } catch {}
  return NextResponse.json({ ok:true, applied, skipped }, NO_STORE);
}