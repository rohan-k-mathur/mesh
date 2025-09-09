import { prisma } from '@/lib/prismaclient';
import type { DialogueAct } from 'packages/ludics-core/types';
import { Hooks } from './hooks';
import { Prisma, PrismaClient } from '@prisma/client';

// Narrow type so both PrismaClient and TransactionClient work
type DB = PrismaClient | Prisma.TransactionClient;

// --- helpers use the provided db (tx) ---
async function ensureLocus(
  db: DB,
  dialogueId: string,
  path: string,
  parentPath?: string
): Promise<{ id: string; path: string }> {
  const existing = await db.ludicLocus.findFirst({ where: { dialogueId, path } });
  if (existing) return existing;

  let parentId: string | undefined = undefined;
  if (parentPath) {
    const parent = await ensureLocus(
      db,
      dialogueId,
      parentPath,
      parentPath.split('.').slice(0, -1).join('.')
    );
    parentId = parent.id;
  }
  return db.ludicLocus.create({ data: { dialogueId, path, parentId } });
}

// (optional) strict additive guard — pass db and use it

async function assertAdditiveNotReused(
    db: DB,
    dialogueId: string,
    locusPath: string
  ) {
    const parts = locusPath.split('.').filter(Boolean);
    if (parts.length < 2) return; // no parent
    const parentPath = parts.slice(0, -1).join('.');
  
    // Is parent additive?
    const parent = await db.ludicLocus.findFirst({
      where: { dialogueId, path: parentPath },
      include: { LudicAct: { where: { isAdditive: true } } },
    });
    if (!parent || parent.LudicAct.length === 0) return;
  
    // If any sibling already exists under parent, forbid another child
    const prefix = `${parentPath}.`;
    const existingChild = await db.ludicLocus.findFirst({
      where: {
        dialogueId,
        path: { startsWith: prefix },
        NOT: { path: locusPath },
      },
      select: { id: true },
    });
    if (existingChild) {
      throw new Error('ADDITIVE_REUSE');
    }
  }

// Main entry — pass tx db from compileFromMoves
export async function appendActs(
  designId: string,
  acts: DialogueAct[],
  opts?: { enforceAlternation?: boolean; enforceAdditiveOnce?: boolean },
  db: DB = prisma
) {
  const design = await db.ludicDesign.findUnique({ where: { id: designId } });
  if (!design) throw new Error('NO_SUCH_DESIGN');

  const last = await db.ludicAct.findFirst({
    where: { designId },
    orderBy: { orderInDesign: 'desc' },
  });
  let order = last?.orderInDesign ?? 0;

  const appended: { actId: string; orderInDesign: number }[] = [];
  let lastPolarity: 'P' | 'O' | null = last?.polarity ?? null;

  for (const a of acts) {
    if (a.kind === 'PROPER') {
      const parts = a.locus.split('.').filter(Boolean);
      const parent = parts.length > 1 ? parts.slice(0, -1).join('.') : undefined;

      // optional additive gate at append-time
      if (opts?.enforceAdditiveOnce) {
        await assertAdditiveNotReused(db, design.deliberationId, a.locus);
      }

      const locus = await ensureLocus(db, design.deliberationId, a.locus, parent);

      if (opts?.enforceAlternation && lastPolarity && lastPolarity === a.polarity) {
        throw new Error('ALTERNATION');
      }
      if (opts?.enforceAdditiveOnce) {
                  await assertAdditiveNotReused(db, design.deliberationId, a.locus);
                }

      const act = await db.ludicAct.create({
        data: {
          designId,
          kind: 'PROPER',
          polarity: a.polarity,
          locusId: locus.id,
          ramification: a.ramification ?? [],
          expression: a.expression,
          metaJson: (a.meta ?? {}) as Prisma.InputJsonValue,
          isAdditive: !!a.additive,
          orderInDesign: ++order,
        },
      });
      await db.ludicChronicle.create({ data: { designId, order, actId: act.id } });

      appended.push({ actId: act.id, orderInDesign: order });
      lastPolarity = a.polarity;

      Hooks.emitActAppended({
        designId,
        dialogueId: design.deliberationId,
        actId: act.id,
        orderInDesign: order,
        act: {
          kind: 'PROPER',
          polarity: a.polarity,
          locusPath: a.locus,
          expression: a.expression,
          additive: !!a.additive,
        },
      });
    } else {
      const act = await db.ludicAct.create({
        data: {
          designId,
          kind: 'DAIMON',
          orderInDesign: ++order,
          expression: a.expression,
        },
      });
      await db.ludicChronicle.create({ data: { designId, order, actId: act.id } });

      appended.push({ actId: act.id, orderInDesign: order });
      lastPolarity = null;

      Hooks.emitActAppended({
        designId,
        dialogueId: design.deliberationId,
        actId: act.id,
        orderInDesign: order,
        act: { kind: 'DAIMON', expression: a.expression },
      });
    }
  }

  // IMPORTANT: no validateVisibility() here (do it once after compile)
  return { ok: true, appended, designVersion: design.version };
}
