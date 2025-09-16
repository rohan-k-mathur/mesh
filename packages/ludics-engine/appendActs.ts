import { prisma } from '@/lib/prismaclient';
import type { DialogueAct } from 'packages/ludics-core/types';
import { Hooks } from './hooks';
import { Prisma, PrismaClient } from '@prisma/client';

// Narrow type so both PrismaClient and TransactionClient work
type DB = PrismaClient | Prisma.TransactionClient;

// --- helpers use the provided db (tx) ---
// async function ensureLocus(
//   db: DB,
//   dialogueId: string,
//   path: string,
//   parentPath?: string
// ): Promise<{ id: string; path: string }> {
//   const existing = await db.ludicLocus.findFirst({ where: { dialogueId, path } });
//   if (existing) return existing;

//   let parentId: string | undefined = undefined;
//   if (parentPath) {
//     const parent = await ensureLocus(
//       db,
//       dialogueId,
//       parentPath,
//       parentPath.split('.').slice(0, -1).join('.')
//     );
//     parentId = parent.id;
//   }
//   return db.ludicLocus.create({ data: { dialogueId, path, parentId } });
// }
// --- helpers ---
 // --- helpers use the provided db (tx) ---
 // Explicit return type breaks the TS recursive inference loop.
 async function ensureLocus(
     db: DB,
     dialogueId: string,
     path: string,
     parentPath?: string
   ): Promise<{ id: string; path: string }> {
     const existing = await db.ludicLocus.findFirst({
       where: { dialogueId, path },
       select: { id: true, path: true },
     });
     if (existing) return existing;
     let parentId: string | undefined = undefined;
     if (parentPath && parentPath.length) {
       const pp = parentPath.split('.').slice(0, -1).join('.');
       const parent = await ensureLocus(db, dialogueId, parentPath, pp);
       parentId = parent.id;
     }
     return db.ludicLocus.create({
       data: { dialogueId, path, parentId },
       select: { id: true, path: true },
     });
   }

// (optional) strict additive guard — pass db and use it

// async function assertAdditiveNotReused(
//     db: DB,
//     dialogueId: string,
//     locusPath: string
//   ) {
//     const parts = locusPath.split('.').filter(Boolean);
//     if (parts.length < 2) return; // no parent
//     const parentPath = parts.slice(0, -1).join('.');
  
//     // Is parent additive?
//     const parent = await db.ludicLocus.findFirst({
//       where: { dialogueId, path: parentPath },
//       include: { LudicAct: { where: { isAdditive: true } } },
//     });
//     if (!parent || parent.LudicAct.length === 0) return;
  
//     // If any sibling already exists under parent, forbid another child
//     const prefix = `${parentPath}.`;
//     const existingChild = await db.ludicLocus.findFirst({
//       where: {
//         dialogueId,
//         path: { startsWith: prefix },
//         NOT: { path: locusPath },
//       },
//       select: { id: true },
//     });
//     if (existingChild) {
//       throw new Error('ADDITIVE_REUSE');
//     }
//   }


async function assertAdditiveNotReused(db: DB, dialogueId: string, locusPath: string) {
  const parts = locusPath.split('.').filter(Boolean);
  if (parts.length < 2) return;
  const parentPath = parts.slice(0, -1).join('.');

  const parent = await db.ludicLocus.findFirst({ where: { dialogueId, path: parentPath } });
  if (!parent) return;

  // Is parent additive? (any P opener with isAdditive at the parent locus)
  const parentAdd = await db.ludicAct.findFirst({
    where: { locusId: parent.id, isAdditive: true },
    select: { id: true },
  });
  if (!parentAdd) return;

  // If any *other* sibling already exists, forbid another child (append-time guard)
  const prefix = `${parentPath}.`;
  const existingChild = await db.ludicLocus.findFirst({
    where: {
      dialogueId,
      path: { startsWith: prefix },
      NOT: { path: locusPath },
    },
    select: { id: true },
  });
  if (existingChild) throw new Error('ADDITIVE_REUSE');
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

  const last = await db.ludicAct.findFirst({ where: { designId }, orderBy: { orderInDesign: 'desc' } });
  let order = last?.orderInDesign ?? 0;

  const appended: { actId: string; orderInDesign: number }[] = [];
  // NOTE: alternation across designs is enforced by the stepper; do not enforce inside a single design
  // let lastPolarity: 'P'|'O'|null = last?.polarity ?? null;

     // Persist polarity as the design's participant ('P'|'O') — do not
   // reuse DialogueAct's 'pos'|'neg' which is propositional sign.
   const designPolarity: 'pos' | 'neg' | 'daimon' | 'O' | 'P' =
     design.participantId === 'Proponent' ? 'P' : 'O';
 
   for (const a of acts) {
     if (a.kind === 'PROPER') {
       // Accept either a.locus or a.locusPath from callers
       const locusPath = a.locus ?? a.locusPath;
       if (!locusPath) throw new Error('MISSING_LOCUS');
       const parts = locusPath.split('.').filter(Boolean);
       const parent = parts.length > 1 ? parts.slice(0, -1).join('.') : undefined;
 

      if (opts?.enforceAdditiveOnce) {
        await assertAdditiveNotReused(db, design.deliberationId, locusPath);
      }

      const locus = await ensureLocus(db, design.deliberationId, locusPath, parent);

      // ❌ remove per-design alternation check
      // if (opts?.enforceAlternation && lastPolarity && lastPolarity === a.polarity) throw new Error('ALTERNATION');

      const act = await db.ludicAct.create({
        data: {
          designId,
          kind: 'PROPER',
          polarity: designPolarity, // 'P' | 'O'             // 'P' or 'O'
          locusId: locus.id,
          ramification: a.ramification ?? [],
          expression: a.expression,
          metaJson: ((a as any).meta ?? {}) as Prisma.InputJsonValue,
             isAdditive: (a as any).isAdditive ?? !!a.additive,
          orderInDesign: ++order,
        },
      });
      await db.ludicChronicle.create({ data: { designId, order, actId: act.id } });

      appended.push({ actId: act.id, orderInDesign: order });
      // lastPolarity = a.polarity;

      Hooks.emitActAppended({
        designId,
        dialogueId: design.deliberationId,
        actId: act.id,
        orderInDesign: order,
        act: {
                     kind: 'PROPER',
                     polarity: designPolarity,       // 'P' | 'O'
                     locusPath,                      // normalized
                     expression: a.expression,
                     additive: (a as any).isAdditive ?? !!a.additive
                   },
      });
    } else {
      const act = await db.ludicAct.create({
        data: { designId, kind: 'DAIMON', polarity: designPolarity, orderInDesign: ++order, expression: a.expression },
      });
      await db.ludicChronicle.create({ data: { designId, order, actId: act.id } });
      appended.push({ actId: act.id, orderInDesign: order });
      // lastPolarity = null;

      Hooks.emitActAppended({
        designId,
        dialogueId: design.deliberationId,
        actId: act.id,

        orderInDesign: order,
        act: { kind: 'DAIMON', polarity: designPolarity, expression: a.expression },
      });
    }
  }
  return { ok: true, appended, designVersion: design.version };
}