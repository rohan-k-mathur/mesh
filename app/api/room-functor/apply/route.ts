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
  const results: Array<{ fingerprint: string; status: 'applied' | 'skipped' | 'materialized'; argumentId: string }> = [];

  for (const p of proposals) {
    // Quick Win #3: Conflict Detection - Check for existing fingerprint
    const exists = await prisma.argumentImport.findUnique({
      where: { fingerprint: p.fingerprint },
      select: { id: true, toArgumentId: true }
    }).catch(() => null);
    
    if (exists) {
      if (exists.toArgumentId) {
        // Already materialized - skip
        skipped++;
        results.push({ fingerprint: p.fingerprint, status: 'skipped', argumentId: exists.toArgumentId });
        continue;
      } else {
        // Virtual import exists - materialize it
        const src = await prisma.argument.findUnique({
          where: { id: p.fromArgumentId },
          select: { text: true, authorId: true },
        }).catch(() => null);

        // Quick Win #2: Wrap in transaction for atomicity
        try {
          const result = await prisma.$transaction(async (tx) => {
            const toArg = await tx.argument.create({
              data: {
                deliberationId: toId,
                authorId: src?.authorId ?? 'system',
                text: p.previewText || src?.text || 'Imported support',
                claimId: p.toClaimId,
                isImplicit: false,
              },
              select: { id: true }
            });

            await tx.argumentSupport.create({
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

            // Update existing ArgumentImport with toArgumentId
            await tx.argumentImport.update({
              where: { id: exists.id },
              data: { toArgumentId: toArg.id }
            });

            return toArg;
          });

          applied++;
          results.push({ fingerprint: p.fingerprint, status: 'materialized', argumentId: result.id });
          continue;
        } catch (error) {
          console.error('Transaction failed for fingerprint', p.fingerprint, error);
          skipped++;
          continue;
        }
      }
    }

    // New import - create all 3 records in transaction
    const src = await prisma.argument.findUnique({
      where: { id: p.fromArgumentId },
      select: { text: true, authorId: true },
    }).catch(() => null);

    // Quick Win #2: Wrap in transaction for atomicity
    try {
      const result = await prisma.$transaction(async (tx) => {
        const toArg = await tx.argument.create({
          data: {
            deliberationId: toId,
            authorId: src?.authorId ?? 'system',
            text: p.previewText || src?.text || 'Imported support',
            claimId: p.toClaimId,
            isImplicit: false,
          },
          select: { id: true }
        });

        await tx.argumentSupport.create({
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

        await tx.argumentImport.create({
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

        return toArg;
      });

      applied++;
      results.push({ fingerprint: p.fingerprint, status: 'applied', argumentId: result.id });
    } catch (error) {
      console.error('Transaction failed for fingerprint', p.fingerprint, error);
      skipped++;
    }
  }

  try { (globalThis as any).dispatchEvent?.(new CustomEvent('plexus:links:changed')); } catch {}
  return NextResponse.json({ ok: true, applied, skipped, results }, NO_STORE);
}