import { prisma } from '@/lib/prismaclient';
import type { StepResult } from 'packages/ludics-core/types';
import { Hooks } from './hooks';


// packages/ludics-engine/stepper.ts
type Locus = { path: string; openings: string[]; additive?: boolean };
type Act  = { polarity:'pos'|'neg'|'daimon'; locus:string; openings:string[]; additive?:boolean };


function isACK(expr?: string | null, meta?: any) {
  const e = (expr ?? '').toLowerCase();
  return e === 'ack' || e === 'accepted' || meta?.ack === true;
}

function proposeDaimonIfClosed(locus: Locus): Act[] {
  const hasOpen = locus.openings && locus.openings.length > 0;
  return hasOpen ? [] : [{ polarity:'daimon', locus: locus.path, openings:[], additive:false }];
}
export function closedLocusSuggestions(locus: { path: string; openings?: string[] }): Act[] {
  return proposeDaimonIfClosed({ path: locus.path, openings: locus.openings ?? [] } as any);
}
function chooseAdditiveChild(openings: string[], chosen?: string): string[] {
  if (!openings?.length) return [];
  // In additive mode, only one child can be active. If none chosen, pick the first deterministically.
  return [chosen ?? openings[0]];
}

function allowInPhase(
  phase: 'focus-P'|'focus-O'|'neutral'|undefined,
  nextPosAct: any
) {
  if (!phase || phase === 'neutral') return true;
  if (phase === 'focus-P') {
    // Active choice loci only (additive)
    return nextPosAct?.kind === 'PROPER' && nextPosAct?.polarity === 'P' && !!nextPosAct?.isAdditive;
  }
  if (phase === 'focus-O') {
    // Passive response lanes (non-additive positive next)
    return nextPosAct?.kind === 'PROPER' && nextPosAct?.polarity === 'P' && !nextPosAct?.isAdditive;
  }
  return true;
}

// Compute a minimal “decisive” slice of the trace by following justifiedByLocus backward
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
async function computeDaimonHints(dialogueId: string, posDesignId: string, negDesignId: string) {
  // pull positive acts (openers) for both designs with their locus and ramification
  const acts = await prisma.ludicAct.findMany({
    where: {
      kind: 'PROPER',
      polarity: 'P',
      designId: { in: [posDesignId, negDesignId] }
    },
    select: { locus: { select: { path: true } }, ramification: true }
  });

  // group: locusPath -> did any opener at this exact locus have openings?
  const map = new Map<string, { hasOpenings: boolean }>();
  for (const a of acts) {
    const path = a.locus?.path ?? '0';
    const entry = map.get(path) ?? { hasOpenings: false };
    const has = Array.isArray(a.ramification) && a.ramification.length > 0;
    map.set(path, { hasOpenings: entry.hasOpenings || has });
  }

  // for every locus mentioned in designs, if no opener had openings => † is available there
  const hints: { locusPath: string; act: Act }[] = [];
  for (const [path, { hasOpenings }] of map.entries()) {
    if (!hasOpenings) {
      hints.push({ locusPath: path, act: { polarity: 'daimon', locus: path, openings: [], additive: false } });
    }
  }
  return hints;
}
export async function stepInteraction(opts: {
  dialogueId: string,
  posDesignId: string,
  negDesignId: string,
  startPosActId?: string,
  maxPairs?: number,
  phase?: 'focus-P'|'focus-O'|'neutral',
}): Promise<StepResult> {
  const { dialogueId } = opts;
  const maxPairs = Math.max(1, Math.min(opts.maxPairs ?? 10_000, 10_000));

   // --- Resolve designs resiliently (handles stale IDs) ---
   async function resolvePair() {
       const [pos0, neg0] = await Promise.all([
         prisma.ludicDesign.findUnique({
           where: { id: opts.posDesignId },
           include: { acts: { include: { locus: true }, orderBy: { orderInDesign: 'asc' } } },
         }),
         prisma.ludicDesign.findUnique({
           where: { id: opts.negDesignId },
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
     let { pos: posDesign, neg: negDesign } = await resolvePair();

  const loci = await prisma.ludicLocus.findMany({ where: { dialogueId } });
  const pathById = new Map(loci.map(l => [l.id, l.path]));
  const idByPath = new Map(loci.map(l => [l.path, l.id]));


  const findNextPositive = (acts: typeof posDesign.acts, from: number) => {
    for (let i = from; i < acts.length; i++) {
      const a = acts[i];
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
    return null;
  };




  type UsedAdditive = Record<string, string>;
  let usedAdditive: UsedAdditive = {};
  const prevTrace = await prisma.ludicTrace.findFirst({ /* unchanged */ }).catch(() => null);
  if (prevTrace?.extJson && typeof prevTrace.extJson === 'object') {
    usedAdditive = (prevTrace.extJson as any).usedAdditive ?? {};
  }

  const isAdditiveParent = (childPath?: string | null) => {
    if (!childPath || childPath.indexOf('.') < 0) return null;
    const parentPath = childPath.split('.').slice(0, -1).join('.');
    const parentId = idByPath.get(parentPath);
    if (!parentId) return null;
    const parentAdditive =
      posDesign.acts.some(a => a.locusId === parentId && a.isAdditive) ||
      negDesign.acts.some(a => a.locusId === parentId && a.isAdditive);
    return parentAdditive ? parentPath : null;
  };
  const childSuffixOf = (path: string) => path.split('.').slice(-1)[0];



  const A = { design: posDesign, acts: posDesign.acts };
  const B = { design: negDesign, acts: negDesign.acts };

  let cursorA = 0, cursorB = 0;
  let side: 'A'|'B' = 'A';
  const pairs: { posActId: string; negActId: string; ts: number }[] = [];
  let status: 'ONGOING'|'CONVERGENT'|'DIVERGENT' = 'ONGOING';
  let endedAtDaimonForParticipantId: string | undefined;

  for (let steps = 0; steps < maxPairs; steps++) {
    const posSide = side === 'A' ? A : B;
    const negSide = side === 'A' ? B : A;
    const posCursor = side === 'A' ? cursorA : cursorB;
    const negCursor = side === 'A' ? cursorB : cursorA;

    const nextPos = findNextPositive(posSide.acts, posCursor);
    if (!nextPos) { status = 'DIVERGENT'; break; }

    // Phase gating
    if (!allowInPhase(opts.phase, nextPos.act)) {
      // do not mark divergence; pause traversal with what we have so far
      status = 'ONGOING';
      break;
    }

    if (nextPos.act.kind === 'DAIMON') {
      status = 'CONVERGENT';
      endedAtDaimonForParticipantId = posSide.design.participantId;
      break;
    }

    // Additive travel guard
    const locusPath = pathById.get(nextPos.act.locusId!);
    const parentPath = isAdditiveParent(locusPath);
    if (parentPath) {
      const chosen = childSuffixOf(locusPath!);
      const prev = usedAdditive[parentPath];
      if (prev && prev !== chosen) {
        status = 'DIVERGENT';
        break;
      }
      usedAdditive[parentPath] = chosen;
    }

    const dual = findNextNegativeAtLocus(negSide.acts, negCursor, nextPos.act.locusId!);
    if (!dual) { status = 'DIVERGENT'; break; }

    pairs.push({ posActId: nextPos.act.id, negActId: dual.act.id, ts: Date.now() });

    // advance cursors & flip side
    if (side === 'A') {
      cursorA = nextPos.idx + 1;
      cursorB = dual.idx + 1;
      side = 'B';
    } else {
      cursorB = nextPos.idx + 1;
      cursorA = dual.idx + 1;
      side = 'A';
    }
  }


  
  function nextFrom(a: Act, locus: Locus): string[] {
    if (a.additive || locus.additive) return chooseAdditiveChild(a.openings ?? locus.openings ?? []);
    return (a.openings ?? locus.openings ?? []);
  }
  // Persist trace with additive choices & (later) decisive indices
  const traceRow = await prisma.ludicTrace.create({
    data: {
      deliberationId: dialogueId,
      posDesignId: A.design.id,
      negDesignId: B.design.id,
      status,
      endedAtDaimonForParticipantId,
      steps: pairs,
      extJson: { usedAdditive }, // filled now; decisiveIndices below after we compute them
    },
  }).catch(async (e: any) => {
         // If a compile wiped designs between read & write, fall back to current pair and retry once.
         if (String(e?.code) === 'P2003') {
           const pair = await resolvePair();
           const A2 = { design: pair.pos, acts: pair.pos.acts };
           const B2 = { design: pair.neg, acts: pair.neg.acts };
           return prisma.ludicTrace.create({
             data: {
               deliberationId: dialogueId,
               posDesignId: A2.design.id,
               negDesignId: B2.design.id,
               status,
               endedAtDaimonForParticipantId,
               steps: pairs,
               extJson: { usedAdditive },
             },
           });
         }
         throw e;
       });

  Hooks.emitTraversal({
    dialogueId,
    posDesignId: A.design.id,
    negDesignId: B.design.id,
    pairs,
    status,
    endedAtDaimonForParticipantId,
  });

  

  // --- Endorsement (heuristic) ---
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
        byParticipantId: neg?.design?.participantId ?? 'Opponent',
        viaActId: neg?.id ?? last.negActId,
      };
    } else {
      const locusPath2 = pos?.locus?.path ?? '0';
      const ender = endedAtDaimonForParticipantId;
      const by = ender && ender === pos?.design?.participantId
        ? (neg?.design?.participantId ?? 'Opponent')
        : (pos?.design?.participantId ?? 'Proponent');
      endorsement = { locusPath: locusPath2, byParticipantId: by, viaActId: neg?.id ?? last.negActId };
    }
  }

  // --- Decisive indices (embed) ---
  const allActIds = Array.from(new Set(pairs.flatMap(p => [p.posActId, p.negActId])));
  const acts = await prisma.ludicAct.findMany({
    where: { id: { in: allActIds } },
    include: { locus: true },
  });
  const byId = new Map(acts.map(a => [a.id, a]));
  const decisiveIndices = computeDecisiveIndices(pairs, byId);

  // Backfill decisiveIndices into the trace row for continuity
  await prisma.ludicTrace.update({
    where: { id: traceRow.id },
    data: { extJson: { usedAdditive, decisiveIndices } },
  }).catch(() => undefined);
  // NEW: † suggestions for closed loci (so UI can show "Close (†)")
   const daimonHints = await computeDaimonHints(dialogueId, A.design.id, B.design.id);
  
  return {
    status,
    pairs,
    endedAtDaimonForParticipantId,
    endorsement,
    decisiveIndices,
    usedAdditive,
     daimonHints, // [{ locusPath, act: {polarity:'daimon', locus, …} }]

  };
}
