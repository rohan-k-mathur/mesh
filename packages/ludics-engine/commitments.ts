import { prisma } from '@/lib/prismaclient';
import { Hooks } from './hooks';

type AddOp = { label: string; basePolarity: 'pos'|'neg'; baseLocusPath?: string; designIds?: string[]; derived?: boolean };
type EraseOp = { byLabel?: string; byLocusPath?: string };

async function ensureRoot(dialogueId: string) {
  let root = await prisma.ludicLocus.findFirst({ where: { dialogueId, path: '0' } });
  if (!root) root = await prisma.ludicLocus.create({ data: { dialogueId, path: '0' } });
  return root;
}


async function ensureLocus(dialogueId: string, path: string) {
  const parts = path.split('.').filter(Boolean);
  let parentPath = '';
  for (let i = 0; i < parts.length; i++) {
    const p = (parentPath ? parentPath + '.' : '') + parts[i];
    // eslint-disable-next-line no-await-in-loop
    let hit = await prisma.ludicLocus.findFirst({ where: { dialogueId, path: p } });
    if (!hit) {
      // eslint-disable-next-line no-await-in-loop
      hit = await prisma.ludicLocus.create({
        data: {
          dialogueId,
          path: p,
          parentId: i === 0 ? undefined : (await prisma.ludicLocus.findFirst({ where: { dialogueId, path: parentPath } }))?.id,
        },
      });
    }
    parentPath = p;
  }
  const final = await prisma.ludicLocus.findFirst({ where: { dialogueId, path } });
  if (!final) throw new Error('LOCUS_CREATE_FAILED');
  return final;
}

export async function applyToCS(dialogueId: string, ownerId: string, ops: { add?: AddOp[]; erase?: EraseOp[] }) {
  const root = await ensureRoot(dialogueId);
  let cs = await prisma.ludicCommitmentState.findFirst({ where: { ownerId } });
  if (!cs) {
    cs = await prisma.ludicCommitmentState.create({ data: { ownerId } });
  } else {
    await prisma.ludicCommitmentState.update({
      where: { id: cs.id },
      data: { updatedAt: new Date() },
    });
  }

  const added: string[] = [];
  const erased: string[] = [];

  // ERASE
  if (ops.erase?.length) {
    for (const e of ops.erase) {
      const where: any = { ownerId };
      if (e.byLabel) where.label = e.byLabel;
      if (e.byLocusPath) {
        const base = await prisma.ludicLocus.findFirst({ where: { dialogueId, path: e.byLocusPath } });
        if (base) where.baseLocusId = base.id;
      }
      const victims = await prisma.ludicCommitmentElement.findMany({ where, select: { id: true } });
      if (victims.length) {
        const ids = victims.map(v => v.id);
        await prisma.ludicCommitmentElement.deleteMany({ where: { id: { in: ids } } });
        erased.push(...ids);
      }
    }
  }

  // ADD
  if (ops.add?.length) {
    for (const a of ops.add) {
      const base = await ensureLocus(dialogueId, a.baseLocusPath ?? '0');
      const exists = await prisma.ludicCommitmentElement.findFirst({
        where: { ownerId, basePolarity: a.basePolarity, baseLocusId: base.id, label: a.label },
      });
      if (exists) { added.push(exists.id); continue; }
      const ce = await prisma.ludicCommitmentElement.create({
        data: {
          ownerId,
          basePolarity: a.basePolarity,
          baseLocusId: base.id,
          label: a.label,
          ludicCommitmentStateId: cs.id,
          extJson: { derived: !!a.derived, designIds: a.designIds ?? [] },
        },
      });
      added.push(ce.id);
    }
  }

  Hooks.emitCSUpdated({ ownerId, csId: cs.id, added, erased });
  return { ok: true, csId: cs.id, added, erased };
}

export async function interactCE(dialogueId: string, ownerId: string) {
  // Load state with its elements
  const cs = await prisma.ludicCommitmentState.findFirst({
    where: { ownerId },
    include: { elements: true },
  });
  if (!cs) return { ok: true, csId: null, derivedFacts: [], contradictions: [] };

  const facts = new Set(cs.elements.filter(e => e.basePolarity === 'pos').map(e => e.label || '').filter(Boolean));
  const rules = new Set(cs.elements.filter(e => e.basePolarity === 'neg').map(e => e.label || '').filter(Boolean));

  const derivedFacts: { label: string }[] = [];
  const contradictions: { a: string; b: string }[] = [];

  // v0 demo rule: r1 + contract + delivered ⇒ to.pay
  if (rules.has('r1') && facts.has('contract') && facts.has('delivered')) {
    if (!facts.has('to.pay')) derivedFacts.push({ label: 'to.pay' });
  }

  // clash: to.pay ⟂ notPaid
  const hasToPay = facts.has('to.pay') || derivedFacts.some(d => d.label === 'to.pay');
  if (hasToPay && facts.has('notPaid')) {
    contradictions.push({ a: 'to.pay', b: 'notPaid' });
  }

  return { ok: true, csId: cs.id, derivedFacts, contradictions };
}

export async function setEntitlement(ownerId: string, label: string, entitled: boolean) {
  await prisma.ludicCommitmentElement.updateMany({
    where: { ownerId, label },
    data: { entitled },
  });
  return { ok:true };
}