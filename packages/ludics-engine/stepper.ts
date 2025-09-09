import { prisma } from '@/lib/prismaclient';
import type { StepResult } from 'packages/ludics-core/types';
import { Hooks } from './hooks';

function isACK(expr?: string | null, meta?: any) {
  const e = (expr ?? '').toLowerCase();
  return e === 'ack' || e === 'accepted' || meta?.ack === true;
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

  for (let k = i - 1; k >= 0; k--) {
    const pos = actById.get(pairs[k].posActId);
    const meta = (pos?.metaJson ?? {}) as any;
    const just = meta?.justifiedByLocus as string | undefined;
    if (just && (currentLocus === just || currentLocus.startsWith(just + '.'))) {
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

  const [posDesign, negDesign] = await Promise.all([
    prisma.ludicDesign.findUnique({
      where: { id: opts.posDesignId },
      include: { acts: { include: { locus: true }, orderBy: { orderInDesign: 'asc' } } },
    }),
    prisma.ludicDesign.findUnique({
      where: { id: opts.negDesignId },
      include: { acts: { include: { locus: true }, orderBy: { orderInDesign: 'asc' } } },
    }),
  ]);
  if (!posDesign || !negDesign) throw new Error('NO_SUCH_DESIGN');

  const loci = await prisma.ludicLocus.findMany({ where: { dialogueId } });
  const pathById = new Map(loci.map(l => [l.id, l.path]));

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

  // Load previous additive picks (persisted in extJson.usedAdditive)
  type UsedAdditive = Record<string, string>;
  let usedAdditive: UsedAdditive = {};
  const prevTrace = await prisma.ludicTrace.findFirst({
    where: { deliberationId: dialogueId, posDesignId: posDesign.id, negDesignId: negDesign.id },
    orderBy: { createdAt: 'desc' },
    select: { extJson: true },
  }).catch(() => null);
  if (prevTrace?.extJson && typeof prevTrace.extJson === 'object') {
    usedAdditive = (prevTrace.extJson as any).usedAdditive ?? {};
  }

  const isAdditiveParent = (childPath?: string | null) => {
    if (!childPath || childPath.indexOf('.') < 0) return null;
    const parentPath = childPath.split('.').slice(0, -1).join('.');
    const parentId = loci.find(l => l.path === parentPath)?.id;
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

  return {
    status,
    pairs,
    endedAtDaimonForParticipantId,
    endorsement,
    decisiveIndices,
    usedAdditive,
  };
}
