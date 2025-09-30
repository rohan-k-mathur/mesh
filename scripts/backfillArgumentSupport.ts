import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find arguments that *conclude a claim* (hom(I, φ) candidates)
  const args = await prisma.argument.findMany({
    where: { claimId: { not: null } },
    select: { id: true, claimId: true, deliberationId: true, confidence: true },
  });

  // Detect if an argument has *no incoming support* → atomic (I → a)
  const incoming = new Set(
    (await prisma.argumentEdge.findMany({
      where: { type: 'support', toArgumentId: { in: args.map(a => a.id) } },
      select: { toArgumentId: true },
    })).map(e => e.toArgumentId)
  );

/// ——— Evidence/strength over arguments that support a claim (hom(I, φ)) ———

// Fetch zero or more ArgumentSupports
  let inserted = 0;
  for (const a of args) {
    const atomic = !incoming.has(a.id);
    await prisma.argumentSupport.upsert({
      where: {
        // Replace with the correct unique constraint key from your Prisma schema
        claimId_argumentId_mode: {
          claimId: a.claimId!,
          argumentId: a.id,
          mode: "product"
        }
      },
      update: {},
      create: {
        deliberationId: a.deliberationId,
        claimId: a.claimId!,
        argumentId: a.id,
        strength: typeof a.confidence === 'number' && a.confidence >= 0 && a.confidence <= 1 ? a.confidence : (atomic ? 0.65 : 0.55),
        composed: !atomic,
        rationale: atomic ? 'atomic support (no incoming premises)' : 'initial composed support',
      }
    });
    inserted++;
  }
  console.log(`Backfilled ${inserted} ArgumentSupport rows.`);
}
main().catch(e => { console.error(e); process.exit(1); });
