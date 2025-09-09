import { prisma } from '@/lib/prismaclient';
import { appendActs } from './appendActs';
import { validateVisibility } from './visibility';
import type { DialogueAct } from 'packages/ludics-core/types';
import { withCompileLock } from './locks';
import { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

type MoveKind = 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT';

interface DialogueMoveRow {
    id: string;
    deliberationId: string;
    targetType: string | null;
    targetId: string | null;
    kind: string;
    payload: unknown | null;
    actorId: string | null;
    createdAt: Date;
    polarity?: string | null;           // 👈 widened from 'P'|'O' to string|null
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

async function locusPathFromId(db: Tx, locusId?: string | null): Promise<string | null> {
  if (!locusId) return null;
  const loc = await db.ludicLocus.findUnique({ where: { id: locusId } });
  return loc?.path ?? null;
}

export async function compileFromMoves(
  deliberationId: string
): Promise<{ ok: true; designs: string[] }> {
  return withCompileLock(deliberationId, async () => {
    // ---- Tx-1: cleanup + create designs (short) ----
    const { proponentId, opponentId } = await prisma.$transaction(async (tx) => {
      const root = await ensureRoot(tx, deliberationId);

      // explicit ids, safe order
      const oldDesigns = await tx.ludicDesign.findMany({
        where: { deliberationId }, select: { id: true }
      });
      const oldIds = oldDesigns.map(d => d.id);
      if (oldIds.length) {
        await tx.ludicChronicle.deleteMany({ where: { designId: { in: oldIds } } });
        const oldActs = await tx.ludicAct.findMany({ where: { designId: { in: oldIds } }, select: { id: true } });
        const oldActIds = oldActs.map(a => a.id);
        if (oldActIds.length) {
          await tx.ludicChronicle.deleteMany({ where: { actId: { in: oldActIds } } });
          await tx.ludicAct.deleteMany({ where: { id: { in: oldActIds } } });
        }
        await tx.ludicTrace.deleteMany({ where: { deliberationId } });
        await tx.ludicDesign.deleteMany({ where: { id: { in: oldIds } } });
      }

      const proponent = await tx.ludicDesign.create({
        data: { deliberationId, participantId: 'Proponent', rootLocusId: root.id },
      });
      const opponent = await tx.ludicDesign.create({
        data: { deliberationId, participantId: 'Opponent', rootLocusId: root.id },
      });
      return { proponentId: proponent.id, opponentId: opponent.id };
    }, { timeout: 15_000, maxWait: 5_000 });

    // Build synthetic design refs (we just need the ids here)
    const proponent = { id: proponentId, participantId: 'Proponent' as const };
    const opponent  = { id: opponentId,  participantId: 'Opponent'  as const };

    // ---- Outside tx: load moves once ----
    const moves: DialogueMoveRow[] = await prisma.dialogueMove.findMany({
      where: { deliberationId }, orderBy: { createdAt: 'asc' },
      select: {
        id: true, deliberationId: true, targetType: true, targetId: true,
        kind: true, payload: true, actorId: true, createdAt: true,
        polarity: true, locusId: true, endsWithDaimon: true,
      },
    });

    // compile moves → ludic acts
    let nextTopIdx = 0;
    let lastAssertLocus: string | null = null;
    const anchorForTarget = new Map<string, string>();
    const childCounters   = new Map<string, number>();
    const acts: { designId: string; act: DialogueAct }[] = [];

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

      // We need a tx client for this helper; use a short tx wrapper to read the path once
      const locFromId = await prisma.$transaction(async (txRead) => {
        return await locusPathFromId(txRead, m.locusId ?? undefined);
      });

      const defaultDesign = kind === 'WHY' ? opponent : proponent;
      const design =
        m.polarity === 'O' ? opponent :
        m.polarity === 'P' ? proponent :
        defaultDesign;

      if (kind === 'ASSERT') {
        const locus = explicitPath ?? locFromId ?? `0.${++nextTopIdx}`;
        lastAssertLocus = locus;
        if (targetKey) anchorForTarget.set(targetKey, locus);

        acts.push({
          designId: design.id,
          act: {
            kind: 'PROPER', polarity: 'P', locus,
            ramification: (payload.ramification as string[]) ?? ['1'],
            expression: expr, additive: !!(payload as any).additive,
          },
        });

        if (m.endsWithDaimon) {
          acts.push({ designId: design.id, act: { kind: 'DAIMON', expression: 'END' } });
          lastAssertLocus = null;
        }
        continue;
      }

      if (kind === 'WHY') {
        const locus =
          explicitPath ??
          locFromId ??
          (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
          lastAssertLocus ?? '0';

        acts.push({
          designId: design.id,
          act: {
            kind: 'PROPER', polarity: 'O', locus,
            ramification: [], expression: expr,
            meta: { justifiedByLocus: locus },
          },
        });
        continue;
      }

      if (kind === 'GROUNDS') {
        const parent =
          explicitPath ??
          locFromId ??
          (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
          lastAssertLocus ?? '0';

        const child = pickChild(parent, explicitChild);
        acts.push({
          designId: design.id,
          act: {
            kind: 'PROPER', polarity: 'P', locus: child,
            ramification: [], expression: expr,
            meta: { justifiedByLocus: parent },
          },
        });

        if (m.endsWithDaimon) {
          acts.push({ designId: design.id, act: { kind: 'DAIMON', expression: 'END' } });
        }
        continue;
      }

      if (kind === 'RETRACT') {
        const locus = explicitPath ?? locFromId ?? lastAssertLocus ?? '0';
        acts.push({
          designId: design.id,
          act: { kind: 'PROPER', polarity: 'P', locus, ramification: ['1'], expression: expr || 'RETRACT' },
        });
        acts.push({ designId: design.id, act: { kind: 'DAIMON', expression: 'RETRACT' } });
        lastAssertLocus = null;
        continue;
      }
    }

    // ---- Batched appends in short txs ----
    const BATCH = 100;
    for (let i = 0; i < acts.length; i += BATCH) {
      const chunk = acts.slice(i, i + BATCH);
      await prisma.$transaction(async (tx2) => {
        for (const { designId, act } of chunk) {
          await appendActs(designId, [act], { enforceAlternation: false }, tx2);
        }
      }, { timeout: 10_000, maxWait: 5_000 });
    }

    // ---- Run visibility after all writes commit ----
    await Promise.allSettled([
      validateVisibility(proponentId),
      validateVisibility(opponentId),
    ]);

    return { ok: true, designs: [proponentId, opponentId] };
  });
}
