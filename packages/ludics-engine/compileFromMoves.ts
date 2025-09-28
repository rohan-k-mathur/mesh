// import { prisma } from '@/lib/prismaclient';
// import { appendActs } from './appendActs';
// import { validateVisibility } from './visibility';
// import type { DialogueAct } from 'packages/ludics-core/types';
// import { withCompileLock } from './locks';
// import { Prisma } from '@prisma/client';
// import { delocate } from './delocate';

// type Tx = Prisma.TransactionClient;

// type MoveKind = 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT';

// type Move = {
//   id: string;
//   kind: string;
//   payload?: {
//     acts?: DialogueAct[];
//     locusPath?: string;
//     expression?: string;
//     cqId?: string;
//     sourceDesignId?: string;
//     // legacy fields: note/brief/text/ramification/additive/childSuffix/evidenceDesignId…
//     [k: string]: any;
//   };
//   targetType: 'argument'|'claim'|'card';
//   targetId: string;
//   actorId: string;
// };

// // ---- helpers ---------------------------------------------------------------

// function expandActsFromMove(m: Move) {
//   const acts = m.payload?.acts ?? [];
//   return acts.map(a => ({
//     polarity: a.polarity as ('pos'|'neg'|'daimon'),
//     locus: (a.locusPath ?? '0').trim(),
//     openings: Array.isArray(a.openings) ? a.openings : [],
//     additive: !!a.additive,
//     expression: a.expression ?? '',
//     moveId: m.id,
//     targetType: m.targetType,
//     targetId: m.targetId,
//     actorId: m.actorId,
//   }));
// }

// // If a GROUNDS references a stored design, delocate (“fax”) it into `locus`.
// async function maybeDelocateForEvidence(m: Move, locus: string) {
//   const evid = (m.payload as any)?.evidenceDesignId as string | undefined;
//   if (!evid) return null;
//   const d = await prisma.ludicDesign.findUnique({
//     where: { id: evid },
//     select: { id: true, extJson: true }
//   });
//   if (!d) return null;

//   const blob = (d.extJson as any) ?? {};
//   const deloc = delocate({ base: blob.base, actions: blob.actions ?? [], meta: { sourceDesignId: d.id }}, locus);

//   // Persist a light delocated design if your engine reads designs from DB
//   const mv = await prisma.dialogueMove.findUnique({ where: { id: m.id }, select: { deliberationId: true }});
//   if (!mv) return null;

//   return prisma.ludicDesign.create({
//     data: {
//       deliberationId: mv.deliberationId,
//       participantId: 'Neutral',
//       rootLocusId: (await ensureRoot(prisma, mv.deliberationId)).id, // base anchor; deloc.base is carried in extJson
//       extJson: deloc,
//       semantics: 'ludics-v1',
//     }
//   }).catch(() => null);
// }

// interface DialogueMoveRow {
//   id: string;
//   deliberationId: string;
//   targetType: string | null;
//   targetId: string | null;
//   kind: string;
//   payload: unknown | null;
//   actorId: string | null;
//   createdAt: Date;
//   polarity?: string | null;
//   locusId?: string | null;
//   endsWithDaimon?: boolean | null;
// }

// function keyForTarget(tt?: string|null, id?: string|null) {
//   return tt && id ? `${tt}:${id}` : null;
// }

// async function ensureRoot(db: Tx | typeof prisma, dialogueId: string) {
//   const rootPath = '0';
//   let root = await db.ludicLocus.findFirst({ where: { dialogueId, path: rootPath } });
//   if (!root) root = await (db as any).ludicLocus.create({ data: { dialogueId, path: rootPath } });
//   return root;
// }

// export async function compileFromMoves(
//   deliberationId: string
// ): Promise<{ ok: true; designs: string[] }> {
//   return withCompileLock(deliberationId, async () => {
//     // 1) cleanup + pair creation (single short tx)
//     const { proponentId, opponentId } = await prisma.$transaction(async (tx) => {
//       const root = await ensureRoot(tx, deliberationId);

//       await tx.ludicChronicle.deleteMany({ where: { design: { deliberationId } } });
//       await tx.ludicAct.deleteMany({ where: { design: { deliberationId } } });
//       await tx.ludicTrace.deleteMany({ where: { deliberationId } });
//       await tx.ludicDesign.deleteMany({ where: { deliberationId } });

//       const proponent = await tx.ludicDesign.create({
//         data: { deliberationId, participantId: 'Proponent', rootLocusId: root.id }
//       });
//       const opponent = await tx.ludicDesign.create({
//         data: { deliberationId, participantId: 'Opponent',  rootLocusId: root.id }
//       });
//       return { proponentId: proponent.id, opponentId: opponent.id };
//     }, { timeout: 30_000, maxWait: 5_000 });

//     const proponent = { id: proponentId, participantId: 'Proponent' as const };
//     const opponent  = { id: opponentId,  participantId: 'Opponent'  as const };

//     // 2) load moves once (outside tx)
//     const moves: DialogueMoveRow[] = await prisma.dialogueMove.findMany({
//       where: { deliberationId }, orderBy: { createdAt: 'asc' },
//       select: {
//         id: true, deliberationId: true, targetType: true, targetId: true,
//         kind: true, payload: true, actorId: true, createdAt: true,
//         polarity: true, locusId: true, endsWithDaimon: true,
//       },
//     });

//     const loci = await prisma.ludicLocus.findMany({
//       where: { dialogueId: deliberationId },
//       select: { id:true, path:true }
//     });
//     const pathById = new Map(loci.map(l => [l.id, l.path]));

//     // 3) compile moves → Ludic acts (gather first; append in chunks)
//     let nextTopIdx = 0;
//     let lastAssertLocus: string | null = null;
//     const anchorForTarget = new Map<string, string>();
//     const childCounters   = new Map<string, number>();
//     const actsToAppend: { designId: string; act: any }[] = [];

//     const pickChild = (parent: string, explicit?: string|null) => {
//       if (explicit) return `${parent}.${explicit}`;
//       const n = (childCounters.get(parent) ?? 0) + 1;
//       childCounters.set(parent, n);
//       return `${parent}.${n}`;
//     };

//     for (const row of moves) {
//       const m = row as unknown as Move;
//       const kind = (m.kind || '').toUpperCase() as MoveKind;
//       const payload = (m.payload ?? {}) as Record<string, any>;
//       const targetKey = keyForTarget(m.targetType ?? undefined, m.targetId ?? undefined);

//       const explicitPath  = (payload.locusPath as string | undefined) ?? null;
//       const explicitChild = (payload.childSuffix as string | undefined) ?? null;
//       const expr =
//         (payload.text as string) ??
//         (payload.note as string) ??
//         (payload.brief as string) ??
//         (payload.expression as string) ??
//         kind;

//       const locFromId = row.locusId ? (pathById.get(row.locusId) ?? null) : null;

//       const defaultDesign = kind === 'WHY' ? opponent : proponent;
//       const design =
//         row.polarity === 'O' ? opponent :
//         row.polarity === 'P' ? proponent :
//         defaultDesign;

//       // -------------------------------------------------------------------
//       // A) NEW: prefer multi-act payloads (acts[]). Falls back to legacy.
//       // -------------------------------------------------------------------
//       const protoActs = Array.isArray(payload?.acts) ? expandActsFromMove(m) : [];
//       if (protoActs.length) {
//         const defaultAnchor =
//           (row.locusId ? pathById.get(row.locusId) ?? null : null) ??
//           (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
//           lastAssertLocus ?? '0';

//         const designFor = (pol?: string) => {
//           if (pol === 'neg') return opponent;
//           if (pol === 'pos' || pol === 'daimon') return proponent;
//           return kind === 'WHY' ? opponent : proponent;
//         };

//         for (const a of protoActs) {
//           const locus = a.locus.trim() || defaultAnchor;
//           if (!locus) continue;

//           if (a.polarity === 'pos') {
//             actsToAppend.push({
//               designId: designFor('pos').id,
//               act: {
//                 kind: 'PROPER',
//                 polarity: 'P',
//                 locus,
//                 ramification: Array.isArray(a.openings) ? a.openings : [],
//                 expression: a.expression ?? '',
//                 isAdditive: !!a.additive,
//               }
//             });
//           } else if (a.polarity === 'neg') {
//             actsToAppend.push({
//               designId: designFor('neg').id,
//               act: {
//                 kind: 'PROPER',
//                 polarity: 'O',
//                 locus,
//                 ramification: [],
//                 expression: a.expression ?? '',
//               }
//             });
//           } else if (a.polarity === 'daimon') {
//             actsToAppend.push({
//               designId: designFor('daimon').id,
//               act: { kind: 'DAIMON', expression: a.expression ?? 'END' }
//             });
//           }
//         }

//         // maintain anchors for subsequent WHY/GROUNDS addressing same target
//         const firstPos = protoActs.find(a => a.polarity === 'pos');
//         if (firstPos) {
//           const anchor = (firstPos.locus.trim()) || defaultAnchor;
//           if (anchor && targetKey) anchorForTarget.set(targetKey, anchor);
//           lastAssertLocus = anchor ?? lastAssertLocus;
//         }
//         continue; // handled by multi-act path
//       }

//       // -------------------------------------------------------------------
//       // Legacy path (kept 1:1 with your previous behavior)
//       // -------------------------------------------------------------------
//       if (kind === 'ASSERT') {
//         const locus = explicitPath ?? locFromId ?? `0.${++nextTopIdx}`;
//         lastAssertLocus = locus;
//         if (targetKey) anchorForTarget.set(targetKey, locus);

//         actsToAppend.push({
//           designId: design.id,
//           act: {
//             kind: 'PROPER', polarity: 'P', locus,
//             ramification: (payload.ramification as string[]) ?? ['1'],
//             expression: expr,
//             // C) mark opener additivity
//             isAdditive: !!payload.additive,
//           },
//         });

//         if (row.endsWithDaimon) {
//           actsToAppend.push({ designId: design.id, act: { kind: 'DAIMON', expression: 'END' } });
//           lastAssertLocus = null;
//         }
//         continue;
//       }

//       if (kind === 'WHY') {
//         const locus =
//           explicitPath ??
//           locFromId ??
//           (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
//           lastAssertLocus ?? '0';

//         actsToAppend.push({
//           designId: design.id,
//           act: {
//             kind: 'PROPER', polarity: 'O', locus,
//             ramification: [], expression: expr,
//             meta: {
//               justifiedByLocus: locus,
//               schemeKey: payload.schemeKey ?? null,
//               cqId: payload.cqId ?? null
//             },
//           },
//         });
//         continue;
//       }

//       if (kind === 'GROUNDS') {
//         const parent =
//           explicitPath ??
//           locFromId ??
//           (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
//           lastAssertLocus ?? '0';

//         // B) delocate evidence design (fax) into the parent locus, if any
//         await maybeDelocateForEvidence(m, parent).catch(() => null);

//         const child = pickChild(parent, explicitChild);
//         actsToAppend.push({
//           designId: design.id,
//           act: {
//             kind: 'PROPER', polarity: 'P', locus: child,
//             ramification: [], expression: expr,
//             meta: {
//               justifiedByLocus: parent,
//               schemeKey: payload.schemeKey ?? null,
//               cqId: payload.cqId ?? null
//             },
//           },
//         });

//         if (row.endsWithDaimon) {
//           actsToAppend.push({ designId: design.id, act: { kind: 'DAIMON', expression: 'END' } });
//         }
//         continue;
//       }

//       if (kind === 'RETRACT') {
//         const locus = explicitPath ?? locFromId ?? lastAssertLocus ?? '0';
//         actsToAppend.push({
//           designId: design.id,
//           act: { kind: 'PROPER', polarity: 'P', locus, ramification: ['1'], expression: expr || 'RETRACT' },
//         });
//         actsToAppend.push({ designId: design.id, act: { kind: 'DAIMON', expression: 'RETRACT' } });
//         lastAssertLocus = null;
//         continue;
//       }
//     }

//     // 4) D) robust batched appends inside short txs
//     const BATCH = 100;
//     for (let i = 0; i < actsToAppend.length; i += BATCH) {
//       const chunk = actsToAppend.slice(i, i + BATCH);
//       await prisma.$transaction(async (tx2) => {
//         for (const { designId, act } of chunk) {
//           await appendActs(designId, [act], { enforceAlternation: false }, tx2);
//         }
//       }, { timeout: 10_000, maxWait: 5_000 });
//     }

//     // 5) visibility checks (fire-and-forget)
//     await Promise.allSettled([
//       validateVisibility(proponentId),
//       validateVisibility(opponentId),
//     ]);

//     return { ok: true, designs: [proponentId, opponentId] };
//   });
// }
import { prisma } from '@/lib/prismaclient';
import { appendActs } from './appendActs';
import { validateVisibility } from './visibility';
import type { DialogueAct } from 'packages/ludics-core/types';
import { withCompileLock } from './locks';
import { Prisma } from '@prisma/client';
import { delocate } from './delocate';

type Tx = Prisma.TransactionClient;
 type MoveKind = "ASSERT" | "WHY" | "GROUNDS" | "RETRACT" | "CONCEDE" | "CLOSE" | "THEREFORE" | "SUPPOSE" | "DISCHARGE";

type Move = {
  id: string;
  kind: string;
  payload?: {
    acts?: DialogueAct[];
    locusPath?: string;
    expression?: string;
    cqId?: string;
    sourceDesignId?: string;
    // legacy fields ok
  };
  targetType: 'argument'|'claim'|'card';
  targetId: string;
  actorId: string;
};

// -- helper: materialize acts out of a move payload (new path)
function expandActsFromMove(m: Move) {
  const acts = m.payload?.acts ?? [];
  return acts.map(a => ({
    polarity: a.polarity,                          // 'pos'|'neg'|'daimon'
    locusPath: a.locusPath ?? '0',
    openings: Array.isArray(a.openings) ? a.openings : [],
    isAdditive: !!a.additive,
    expression: a.expression ?? '',
    moveId: m.id,
    targetType: m.targetType,
    targetId: m.targetId,
    actorId: m.actorId,
  }));
}

// return delocated blob (no DB write)
function mkDelocatedBlob(src: { base: string; actions: any[]; meta?: any }, toLocus: string) {
  return { ...src, base: toLocus, meta: { ...(src.meta ?? {}), delocated: true } };
}


// -- helper: delocate (fax) evidence into a locus when answering WHY
// -- helper: delocate (fax) evidence into a locus when answering WHY
async function maybeDelocateForEvidence(m: Move, locus: string) {
  const evid = (m.payload as any)?.evidenceDesignId as string | undefined;
  if (!evid) return null;

  const d = await prisma.ludicDesign.findUnique({
    where: { id: evid },
     // current schema has no `base` column; we only need the id to annotate provenance
    select: { id: true },
});
  if (!d) return null;

  // Just annotate; let renderer/inspector explain provenance
  return { delocatedFromDesignId: d.id, intoLocus: locus };
}




interface DialogueMoveRow {
  id: string;
  deliberationId: string;
  targetType: string | null;
  targetId: string | null;
  kind: string;
  payload: unknown | null;
  actorId: string | null;
  createdAt: Date;
  polarity?: string | null;           // 'P'|'O' or null
  locusId?: string | null;
  endsWithDaimon?: boolean | null;
}

function keyForTarget(tt?: string|null, id?: string|null) {
  return tt && id ? `${tt}:${id}` : null;
}

async function ensureRoot(db: Tx, dialogueId: string) {
  const rootPath = '0';
  let root = await db.ludicLocus.findFirst({ where: { dialogueId, path: rootPath } });
  if (!root) root = await db.ludicLocus.create({ data: { dialogueId, path: rootPath } });
  return root;
}

export async function compileFromMoves(dialogueId: string): Promise<{ ok: true; designs: string[] }> {
  return withCompileLock(dialogueId, async () => {
    // 1) wipe+recreate designs inside a short tx (relation-safe)
    const { proponentId, opponentId } = await prisma.$transaction(async (tx) => {
      const root = await ensureRoot(tx as Tx, dialogueId);
      await tx.ludicChronicle.deleteMany({ where: { design: { deliberationId: dialogueId } } });
      await tx.ludicAct.deleteMany({ where: { design: { deliberationId: dialogueId } } });
      await tx.ludicTrace.deleteMany({ where: { deliberationId: dialogueId } });
      await tx.ludicDesign.deleteMany({ where: { deliberationId: dialogueId } });

      const P = await tx.ludicDesign.create({ data: { deliberationId: dialogueId, participantId: 'Proponent', rootLocusId: root.id } });
      const O = await tx.ludicDesign.create({ data: { deliberationId: dialogueId, participantId: 'Opponent',  rootLocusId: root.id } });
      return { proponentId: P.id, opponentId: O.id };
    }, { timeout: 30_000, maxWait: 5_000 });

    const P = { id: proponentId, participantId: 'Proponent' as const };
    const O = { id: opponentId,  participantId: 'Opponent'  as const };

    // 2) read moves + loci
    const moves: DialogueMoveRow[] = await prisma.dialogueMove.findMany({
      where: { deliberationId: dialogueId },
      orderBy: { createdAt: 'asc' },
      select: {
        id:true, deliberationId:true, targetType:true, targetId:true,
        kind:true, payload:true, actorId:true, createdAt:true,
        polarity:true, locusId:true, endsWithDaimon:true,
      },
    });
    const loci = await prisma.ludicLocus.findMany({ where: { dialogueId }, select: { id:true, path:true } });
    const pathById = new Map(loci.map(l => [l.id, l.path]));

    // 3) compile → acts
    let nextTopIdx = 0;
    let lastAssertLocus: string | null = null;
    const anchorForTarget = new Map<string, string>();
    const childCounters   = new Map<string, number>();
    const outActs: { designId: string; act: any }[] = [];

    const pickChild = (parent: string, explicit?: string|null) => {
      if (explicit) return `${parent}.${explicit}`;
      const n = (childCounters.get(parent) ?? 0) + 1;
      childCounters.set(parent, n);
      return `${parent}.${n}`;
    };

    for (const m of moves) {
      const kind = (m.kind || '').toUpperCase() as MoveKind;
      const payload = (m.payload ?? {}) as Record<string, unknown>;
      const targetKey = keyForTarget(m.targetType ?? undefined, m.targetId ?? undefined);
      const explicitPath  = (payload.locusPath as string | undefined) ?? null;
      const explicitChild = (payload.childSuffix as string | undefined) ?? null;
      const expr =
        (payload.text as string) ??
        (payload.note as string) ??
        (payload.brief as string) ??
        (payload.expression as string) ??
        kind;
      const locFromId = m.locusId ? pathById.get(m.locusId) ?? null : null;
      const defaultDesign = kind === 'WHY' ? O : P;
      const design =
        m.polarity === 'O' ? O :
        m.polarity === 'P' ? P : defaultDesign;

      // ----- A) prefer multi‑act payloads -----
      const protoActs = Array.isArray((m.payload as any)?.acts) ? expandActsFromMove(m as any) : [];
      if (protoActs.length) {
        const defaultAnchor: string =
                 (m.locusId ? pathById.get(m.locusId) ?? null : null) ??
                  (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
                  lastAssertLocus ?? '0';

        const designFor = (pol?: string) => {
          if (pol === 'neg') return O;
          if (pol === 'pos' || pol === 'daimon') return P;
          return (kind === 'WHY') ? O : P;
        };

        for (const a of protoActs) {
          const locus = (a.locusPath && a.locusPath.trim()) ? a.locusPath.trim() : defaultAnchor;
          if (!locus) continue;

          if (a.polarity === 'pos') {
            outActs.push({
              designId: designFor('pos').id,
              act: {
                kind: 'PROPER', polarity: 'P', locus,
                ramification: Array.isArray(a.openings) ? a.openings : [],
                expression: a.expression ?? '',
                isAdditive: !!a.isAdditive,
              },
            });
          } else if (a.polarity === 'neg') {
            outActs.push({
              designId: designFor('neg').id,
              act: {
                kind: 'PROPER', polarity: 'O', locus,
                ramification: [], expression: a.expression ?? '',
              },
            });
          } else if (a.polarity === 'daimon') {
            outActs.push({
              designId: designFor('daimon').id,
              act: { kind: 'DAIMON', expression: a.expression ?? 'END' },
            });
          }
        }

        // maintain anchor for follow‑on WHY/GROUNDS
        const firstPos = protoActs.find(a => a.polarity === 'pos');
       const anchor: string = firstPos?.locusPath?.trim() || defaultAnchor;
        if (anchor && targetKey) anchorForTarget.set(targetKey, anchor);
        lastAssertLocus = anchor ?? lastAssertLocus;
        continue; // handled this move
      }

      // ----- legacy path (ASSERT/WHY/GROUNDS/RETRACT) -----

      if (kind === 'ASSERT') {
        const locus = explicitPath ?? locFromId ?? `0.${++nextTopIdx}`;
        lastAssertLocus = locus;
        if (targetKey) anchorForTarget.set(targetKey, locus);

        outActs.push({
          designId: design.id,
          act: {
            kind: 'PROPER', polarity: 'P', locus,
            ramification: (payload.ramification as string[]) ?? ['1'],
            expression: expr,
            isAdditive: !!(payload as any).additive,   // C) mark additivity on opener
          },
        });

        if (m.endsWithDaimon) {
          outActs.push({ designId: design.id, act: { kind: 'DAIMON', expression: 'END' } });
          lastAssertLocus = null;
        }
        continue;
      }

      if (kind === 'WHY') {
        const locus =
          explicitPath ?? locFromId ??
          (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
          lastAssertLocus ?? '0';

        outActs.push({
          designId: design.id,
          act: {
            kind: 'PROPER', polarity: 'O', locus,
            ramification: [], expression: expr,
            meta: { justifiedByLocus: locus, schemeKey: payload.schemeKey ?? null, cqId: payload.cqId ?? null },
          },
        });
        continue;
      }

      if (kind === 'GROUNDS') {
        const parent =
          explicitPath ?? locFromId ??
          (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
          lastAssertLocus ?? '0';
      
        // annotate delocation (no new DB row)
        const delocInfo = await maybeDelocateForEvidence(m as any, parent).catch(() => null);
      
        const child = pickChild(parent, explicitChild);
        outActs.push({
          designId: design.id,
          act: {
            kind: 'PROPER', polarity: 'P', locus: child,
            ramification: [], expression: expr,
            meta: {
              justifiedByLocus: parent,
              schemeKey: payload.schemeKey ?? null,
              cqId: payload.cqId ?? null,
              ...(delocInfo ? { delocated: true, delocatedFromDesignId: delocInfo.delocatedFromDesignId } : null),
            },
          },
        });

        if (m.endsWithDaimon) {
          outActs.push({ designId: design.id, act: { kind: 'DAIMON', expression: 'END' } });
        }
        continue;
      }

      if (kind === 'RETRACT') {
        const locus = explicitPath ?? locFromId ?? lastAssertLocus ?? '0';
        outActs.push({
          designId: design.id,
          act: { kind: 'PROPER', polarity: 'P', locus, ramification: ['1'], expression: expr || 'RETRACT' },
        });
        outActs.push({ designId: design.id, act: { kind: 'DAIMON', expression: 'RETRACT' } });
        lastAssertLocus = null;
        continue;
      }
    }

    // 4) batched appends (D) — robust to concurrent compiles
    const BATCH = 100;
     const skippedAdditive: Array<{ locus: string; designId: string }> = [];
    for (let i = 0; i < outActs.length; i += BATCH) {
      const chunk = outActs.slice(i, i + BATCH);
      await prisma.$transaction(async (tx2) => {
               for (const { designId, act } of chunk) {
                 try {
                   // compile should be tolerant; stepper will report violations
                   await appendActs(designId, [act], { enforceAdditiveOnce: false }, tx2);
                  } catch (e: any) {
                               if (String(e?.message || e) === 'ADDITIVE_REUSE') {
                                 skippedAdditive.push({ locus: act.locus, designId });
                                 continue;
                               }
                   throw e;
                 }
               }
             }, { timeout: 10_000, maxWait: 5_000 });
    }
    (globalThis as any).__ludics__compile_skipped_additive = skippedAdditive;
    await Promise.allSettled([ validateVisibility(proponentId), validateVisibility(opponentId) ]);
    return { ok: true, designs: [proponentId, opponentId] };
  });
}
