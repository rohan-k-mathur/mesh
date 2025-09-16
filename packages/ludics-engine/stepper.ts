import { prisma } from '@/lib/prismaclient';
import type { StepResult, DaimonHint } from 'packages/ludics-core/types';
import { Hooks } from './hooks';
import { detectDirectoryCollisions } from './detect-collisions';

type Locus = { path: string; openings: string[]; additive?: boolean };
type Act   = { polarity:'pos'|'neg'|'daimon'; locus:string; openings:string[]; additive?:boolean };
export type CompositionMode = 'assoc'|'partial'|'spiritual';

// Small helpers
function isACK(expr?: string | null, meta?: any) {
  const e = (expr ?? '').toLowerCase();
  return e === 'ack' || e === 'accepted' || meta?.ack === true;
}

function proposeDaimonIfClosed(locus: Locus): Act[] {
  const hasOpen = locus.openings && locus.openings.length > 0;
  return hasOpen ? [] : [{ polarity:'daimon', locus: locus.path, openings:[], additive:false }];
}

// Exportable hint util (used by UI if needed)
export function closedLocusSuggestions(locus: { path: string; openings?: string[] }): Act[] {
  return proposeDaimonIfClosed({ path: locus.path, openings: locus.openings ?? [] } as any);
}

function chooseAdditiveChild(openings: string[], chosen?: string): string[] {
  if (!openings?.length) return [];
  return [chosen ?? openings[0]];
}

function allowInPhase(
  phase: 'focus-P'|'focus-O'|'neutral'|undefined,
  nextPosAct: any
) {
  if (!phase || phase === 'neutral') return true;
  if (phase === 'focus-P') {
    return nextPosAct?.kind === 'PROPER' && nextPosAct?.polarity === 'P' && !!nextPosAct?.isAdditive;
  }
  if (phase === 'focus-O') {
    return nextPosAct?.kind === 'PROPER' && nextPosAct?.polarity === 'P' && !nextPosAct?.isAdditive;
  }
  return true;
}

// Explain-why slice (unchanged)
function computeDecisiveIndices(
  pairs: { posActId: string; negActId: string }[],
  actById: Map<string, any>,
  fallbackWindow = 3
): number[] {
  const n = pairs.length;
  if (n === 0) return [];

  const used = new Set<number>();
  let i = n - 1;
  used.add(i);

  // Start from last positive locus and walk back via meta.justifiedByLocus
  let currentLocus =
    actById.get(pairs[i].posActId)?.locus?.path ??
    actById.get(pairs[i].negActId)?.locus?.path ?? '0';

  const isUnder = (cur: string, root: string) => {
    if (cur === root) return true;
    const c = cur.split('.');
    const r = root.split('.');
    if (r.length > c.length) return false;
    for (let idx = 0; idx < r.length; idx++) {
      if (c[idx] !== r[idx]) return false;
    }
    return true;
  };

  for (let k = i - 1; k >= 0; k--) {
    const pos = actById.get(pairs[k].posActId);
    const meta = (pos?.metaJson ?? {}) as any;
    const rawJust = meta?.justifiedByLocus as string | undefined;
    const just = typeof rawJust === 'string' ? rawJust.trim() : undefined;

    if (just && isUnder(currentLocus, just)) {
      used.add(k);
      currentLocus = pos?.locus?.path ?? currentLocus;
    }
  }

  // If the chain is too thin, fall back to the last K pairs for useful UI
  if (used.size < Math.min(2, n)) {
    for (let k = Math.max(0, n - fallbackWindow); k < n; k++) used.add(k);
  }
  return Array.from(used).sort((a, b) => a - b);
}

// NEW: compute † suggestions for loci that have no openings
// async function computeDaimonHints(dialogueId: string, posDesignId: string, negDesignId: string) {
//   // pull positive acts (openers) for both designs with their locus and ramification
//   const acts = await prisma.ludicAct.findMany({
//     where: {
//       kind: 'PROPER',
//       polarity: 'P',
//       designId: { in: [posDesignId, negDesignId] }
//     },
//     select: { locus: { select: { path: true } }, ramification: true }
//   });

//   // group: locusPath -> did any opener at this exact locus have openings?
//   const map = new Map<string, { hasOpenings: boolean }>();
//   for (const a of acts) {
//     const path = a.locus?.path ?? '0';
//     const entry = map.get(path) ?? { hasOpenings: false };
//     const has = Array.isArray(a.ramification) && a.ramification.length > 0;
//     map.set(path, { hasOpenings: entry.hasOpenings || has });
//   }

//   // for every locus mentioned in designs, if no opener had openings => † is available there
//   const hints: { locusPath: string; act: Act }[] = [];
//   for (const [path, { hasOpenings }] of map.entries()) {
//     if (!hasOpenings) {
//       hints.push({ locusPath: path, act: { polarity: 'daimon', locus: path, openings: [], additive: false } });
//     }
//   }
//   return hints;
// }


// NEW: synchronous †-hint computation from acts already loaded
// function computeDaimonHints(posActs: any[], negActs: any[], pathById: Map<string,string>) {
//   const hints = new Map<string, { locusPath: string; reason: 'no-openings' }>();
//   const scan = (acts: any[]) => {
//     for (const a of acts) {
//       if (a.kind === 'PROPER' && a.polarity === 'P') {
//         const opens = Array.isArray(a.ramification) ? a.ramification : [];
//         if (opens.length === 0) {
//           const p = a.locusId ? pathById.get(a.locusId) : undefined;
//           if (p) hints.set(p, { locusPath: p, reason: 'no-openings' });
//         }
//       }
//     }
//   };
//   scan(posActs); scan(negActs);
//   return Array.from(hints.values());
// }
function computeDaimonHints(posActs: any[], negActs: any[]) {
  const hints = new Map<string, { locusPath: string; reason: 'no-openings' }>();
  const scan = (acts: any[]) => {
    for (const a of acts) {
      if (a.kind === 'PROPER' && a.polarity === 'P') {
        const opens = Array.isArray(a.ramification) ? a.ramification : [];
        if (opens.length === 0) {
          const p = a.locus?.path ?? '0';
          if (p) hints.set(p, { locusPath: p, reason: 'no-openings' });
        }
      }
    }
  };
  scan(posActs); scan(negActs);
  return Array.from(hints.values());
}


// type Locus = { path: string; openings: string[]; additive?: boolean };
export async function stepInteraction(opts: {
  dialogueId: string,
  posDesignId: string,
  negDesignId: string,
  startPosActId?: string,
  maxPairs?: number,
  phase?: 'focus-P'|'focus-O'|'neutral',
  maskNamesAt?: string[], // bases where child names are hidden from testers

  // consensus testers
  virtualNegPaths?: string[],   // synthesize an O at these locus paths
  drawAtPaths?: string[],       // treat no-response here as draw by consensus
  // composition preflight
  compositionMode?: CompositionMode,
  focusAt?: string | null;  // pin traversal under this locus

}): Promise<StepResult> {
  const {
    dialogueId,
    posDesignId,
    negDesignId,
    maxPairs = 10_000,
    phase,
    virtualNegPaths = [],
    drawAtPaths = [],
  } = opts;

  const fuel = Math.max(1, Math.min(maxPairs, 10_000));
  const virtualNegByPath = new Set(virtualNegPaths);
  const drawAt = new Set(drawAtPaths);
  const mode = opts.compositionMode ?? 'assoc';


  // -- resolve designs (robust to stale/cross-dialogue ids)
  async function resolvePair() {
    const [pos0, neg0] = await Promise.all([
      prisma.ludicDesign.findUnique({
        where: { id: posDesignId },
        include: { acts: { include: { locus: true }, orderBy: { orderInDesign: 'asc' } } },
      }),
      prisma.ludicDesign.findUnique({
        where: { id: negDesignId },
        include: { acts: { include: { locus: true }, orderBy: { orderInDesign: 'asc' } } },
      }),
    ]);

    let pos = pos0 && pos0.deliberationId === dialogueId ? pos0 : null;
    let neg = neg0 && neg0.deliberationId === dialogueId ? neg0 : null;

    if (!pos || !neg) {
      const designs = await prisma.ludicDesign.findMany({
        where: { deliberationId: dialogueId },
        orderBy: [{ participantId: 'asc' }, { id: 'asc' }],
        include: { acts: { include: { locus: true }, orderBy: { orderInDesign: 'asc' } } },
      });
      pos = pos ?? (designs.find(d => d.participantId === 'Proponent') ?? designs[0] ?? null);
      neg = neg ?? (designs.find(d => d.participantId === 'Opponent')  ?? designs[1] ?? designs[0] ?? null);
    }
    if (!pos || !neg) throw new Error('NO_SUCH_DESIGN');
    return { pos, neg };
  }
  const { pos: posDesign, neg: negDesign } = await resolvePair();
  const displayPath = (raw?: string) => {
    if (!raw) return raw;
    for (const b of opts.maskNamesAt ?? []) {
      if (raw.startsWith(b + '.')) {
        const segs = raw.split('.');
        if (segs.length >= b.split('.').length + 1) {
          segs[b.split('.').length] = '•'; // hide the name
          return segs.join('.');
        }
      }
    }
    return raw;
  };
  // -- loci maps
  const loci     = await prisma.ludicLocus.findMany({ where: { dialogueId } });
  const pathById = new Map(loci.map(l => [l.id, l.path]));
  const idByPath = new Map(loci.map(l => [l.path, l.id]));

  // -- views over designs
  const A = { design: posDesign, acts: posDesign.acts };
  const B = { design: negDesign, acts: negDesign.acts };

   // --- Directory collision pre-flight (only matters for additives at the SAME base)
   if (mode !== 'assoc') {
    const collisions = await detectDirectoryCollisions({
      dialogueId: opts.dialogueId, posDesignId: posDesign.id, negDesignId: negDesign.id
    });
    if (collisions.length) {
      if (mode === 'partial') {
        return {
          status: 'DIVERGENT',
          pairs: [],
          reason: 'dir-collision',         // <<< explicit, matches StepResult
          daimonHints: [],
          usedAdditive: {},
          decisiveIndices: [],
          endorsement: undefined,
          endedAtDaimonForParticipantId: undefined,
        };
      }
      // spiritual: UI should call /api/ludics/delocate then re-run
      (globalThis as any).__ludics__lastCollision = collisions;
    }
  }
  // -- previous additive choices (persisted)
  type UsedAdditive = Record<string, string>;
  let usedAdditive: UsedAdditive = {};
  const prevTrace = await prisma.ludicTrace.findFirst({
    where: { deliberationId: dialogueId, posDesignId: A.design.id, negDesignId: B.design.id },
    orderBy: { createdAt: 'desc' },
    select: { extJson: true },
  }).catch(() => null);
  if (prevTrace?.extJson && typeof prevTrace.extJson === 'object') {
    usedAdditive = (prevTrace.extJson as any).usedAdditive ?? {};
  }

  // -- finders
  const findNextPositive = (acts: typeof posDesign.acts, from: number) => {
    for (let i = from; i < acts.length; i++) {
      const a = acts[i];
      if (opts.focusAt) {
        // skip positives that are not under focusAt prefix
        const p = pathById.get(a.locusId!);
        if (!p || !(p === opts.focusAt || p.startsWith(opts.focusAt + '.'))) continue;
      }
      if (a.kind === 'DAIMON') return { idx: i, act: a };
      if (a.kind === 'PROPER' && a.polarity === 'P') return { idx: i, act: a };
    }
    
    return null;
  };

  const findNextNegativeAtLocus = (acts: typeof posDesign.acts, from: number, locusId: string) => {
    for (let i = from; i < acts.length; i++) {
      const a = acts[i];
      if (a.kind === 'PROPER' && a.polarity === 'O' && a.locusId === locusId) {
        return { idx: i, act: a };
      }
    }
    // virtual negative synthesized by tester
    const p = pathById.get(locusId);
    if (p && virtualNegByPath.has(p)) {
      return { idx: from, act: { id: undefined, kind:'PROPER', polarity:'O', locusId } as any };
    }
    return null;
  };

  // -- additive parent detector
  const isAdditiveParent = (childPath?: string | null) => {
    if (!childPath || childPath.indexOf('.') < 0) return null;
    const parentPath = childPath.split('.').slice(0, -1).join('.');
    const parentId = idByPath.get(parentPath);
    if (!parentId) return null;
    const parentAdd =
      A.acts.some(a => a.locusId === parentId && a.isAdditive) ||
      B.acts.some(a => a.locusId === parentId && a.isAdditive);
    return parentAdd ? parentPath : null;
  };
  const childSuffixOf = (path: string) => path.split('.').slice(-1)[0];

  // -- traversal
  let cursorA = 0, cursorB = 0;
  let side: 'A'|'B' = 'A';
  const pairs: { posActId: string; negActId: string; locusPath: string; ts: number }[] = [];
  let status: StepResult['status'] = 'ONGOING';
  let reason: StepResult['reason'] | undefined;
  let endedAtDaimonForParticipantId: 'Proponent'|'Opponent'|undefined;

  for (let steps = 0; steps < fuel; steps++) {
    const posSide   = side === 'A' ? A : B;
    const negSide   = side === 'A' ? B : A;
    const posCursor = side === 'A' ? cursorA : cursorB;
    const negCursor = side === 'A' ? cursorB : cursorA;

    const nextPos = findNextPositive(posSide.acts, posCursor);
    if (!nextPos) { status = 'STUCK'; reason = 'no-response'; break; }

    if (!allowInPhase(phase, nextPos.act)) { status = 'ONGOING'; break; }

    if (nextPos.act.kind === 'DAIMON') {
      status = 'CONVERGENT';
      endedAtDaimonForParticipantId = posSide.design.participantId as any;
      break;
    }

    const locusPath = nextPos.act.locusId ? pathById.get(nextPos.act.locusId) : undefined;
    const parentPath = isAdditiveParent(locusPath);
    if (parentPath) {
      const chosen = childSuffixOf(locusPath!);
      const prev = usedAdditive[parentPath];
      if (prev && prev !== chosen) { status = 'DIVERGENT'; reason = 'additive-violation'; break; }
      usedAdditive[parentPath] = chosen;
    }

    let dual = findNextNegativeAtLocus(negSide.acts, negCursor, nextPos.act.locusId!);
    if (!dual) {
      const p = pathById.get(nextPos.act.locusId!);
      if (p && virtualNegByPath.has(p)) {
        // synthesize a "virtual" O at this locus to continue the run
        dual = { idx: negCursor, act: { id: `virt:${p}:${Date.now()}`, kind: 'PROPER', polarity: 'O', locusId: nextPos.act.locusId } as any };
      }
    }
    if (!dual) {
      const p = pathById.get(nextPos.act.locusId!);
      if (p && drawAt.has(p)) {
        status = 'DIVERGENT';
        reason = 'consensus-draw';
      } else {
        status = 'DIVERGENT';
        reason = reason ?? 'incoherent-move';
      }
      break;
    }

    pairs.push({
             posActId: nextPos.act.id,
             negActId: dual.act.id,
             locusPath: locusPath ?? '0',
             ts: Date.now(),
           });

    if (side === 'A') { cursorA = nextPos.idx + 1; cursorB = dual.idx + 1; side = 'B'; }
    else              { cursorB = nextPos.idx + 1; cursorA = dual.idx + 1; side = 'A'; }
  }

  // hints for † at closed loci (no openings)
 // hints for † at closed loci (no openings) -> full DaimonHint objects
 // hints for † at closed loci (no openings) → full DaimonHint objects (keep literals narrow)
 const daimonHints: DaimonHint[] = computeDaimonHints(A.acts, B.acts).map((h) => {
     const lp = h.locusPath;
     const act: DaimonHint['act'] = {
       polarity: 'daimon',
       locus: lp,
       openings: [],       // typed as [] not never[]
       additive: false,    // literal false
       reason: 'no-openings',
     };
     return { locusPath: lp, act };
   });

  // event for live panels
  Hooks.emitTraversal({
    dialogueId,
    posDesignId: A.design.id,
    negDesignId: B.design.id,
    pairs,
    status,
    endedAtDaimonForParticipantId,
  });

  // persist (if DB trace status enum has no STUCK, map to ONGOING)
  const traceRow = await prisma.ludicTrace.create({
    data: {
      deliberationId: dialogueId,
      posDesignId: A.design.id,
      negDesignId: B.design.id,
      status: status === 'STUCK' ? 'ONGOING' : status,
      endedAtDaimonForParticipantId,
      steps: pairs,
      extJson: { usedAdditive },
    },
  }).catch(async (e: any) => {
    if (String(e?.code) === 'P2003') {
      const pair = await resolvePair();
      return prisma.ludicTrace.create({
        data: {
          deliberationId: dialogueId,
          posDesignId: pair.pos.id,
          negDesignId: pair.neg.id,
          status: status === 'STUCK' ? 'ONGOING' : status,
          endedAtDaimonForParticipantId,
          steps: pairs,
          extJson: { usedAdditive },
        },
      });
    }
    throw e;
  });

  // endorsement heuristic
  let endorsement: StepResult['endorsement'];
  if (status === 'CONVERGENT' && pairs.length > 0) {
    const last = pairs[pairs.length - 1];
    const [pos, neg] = await Promise.all([
      prisma.ludicAct.findUnique({ where: { id: last.posActId }, include: { locus: true, design: true } }),
      prisma.ludicAct.findUnique({ where: { id: last.negActId }, include: { locus: true, design: true } }),
    ]);

    if (isACK(neg?.expression, neg?.metaJson)) {
      endorsement = {
        locusPath: neg?.locus?.path ?? pos?.locus?.path ?? '0',
        byParticipantId: (neg?.design?.participantId as any) ?? 'Opponent',
        viaActId: neg?.id ?? last.negActId,
      };
    } else {
      const ender = endedAtDaimonForParticipantId;
      const locusPath2 = pos?.locus?.path ?? '0';
      const by = ender && ender === pos?.design?.participantId
        ? (neg?.design?.participantId as any) ?? 'Opponent'
        : (pos?.design?.participantId as any) ?? 'Proponent';
      endorsement = { locusPath: locusPath2, byParticipantId: by, viaActId: neg?.id ?? last.negActId };
    }
  }

  // decisive slice for UI explanation
  const allActIds = Array.from(new Set(pairs.flatMap(p => [p.posActId, p.negActId])));
  const acts = await prisma.ludicAct.findMany({ where: { id: { in: allActIds } }, include: { locus: true } });
  const byId = new Map(acts.map(a => [a.id, a]));
  const decisiveIndices = computeDecisiveIndices(pairs, byId);

  await prisma.ludicTrace.update({
    where: { id: traceRow.id },
    data: { extJson: { usedAdditive, decisiveIndices } },
  }).catch(() => undefined);

  return {
    status,
    pairs,
    endedAtDaimonForParticipantId,
    endorsement,
    decisiveIndices,
    usedAdditive,
    daimonHints,
    reason,
  };
}