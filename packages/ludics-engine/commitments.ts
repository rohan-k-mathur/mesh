// packages/ludics-engine/commitments.ts
import { prisma } from '@/lib/prismaclient';
import { Hooks } from './hooks';

type AddOp = {
  label: string;
  basePolarity: 'pos'|'neg';
  baseLocusPath?: string;
  designIds?: string[];
  derived?: boolean;
  entitled?: boolean;          // NEW: allow setting on add
};
type EraseOp = { byLabel?: string; byLocusPath?: string };

function norm(s?: string) { return String(s ?? '').trim(); }
function isNeg(s: string) { return /^not[\s_]+/.test(s) || s.startsWith('¬'); }
function stripNeg(s: string) { return s.replace(/^not[\s_]+/,'').replace(/^¬/,''); }

// parse: "A & B -> C", "A,B=>C", "A -> not X"
function parseRule(r: string): null | { ifAll: string[]; then: string } {
  const raw = norm(r);
  const [lhs, rhs] =
    raw.includes('->') ? raw.split('->') :
    raw.includes('=>') ? raw.split('=>') : [null, null];
  if (!lhs || !rhs) return null;
  const ifAll = lhs.split(/[,&]/).map(norm).filter(Boolean);
  const then  = norm(rhs);
  if (!ifAll.length || !then) return null;
  return { ifAll, then };
}

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
    let hit = await prisma.ludicLocus.findFirst({ where: { dialogueId, path: p } });
    if (!hit) {
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

export async function applyToCS(
  dialogueId: string,
  ownerId: string,
  ops: { add?: AddOp[]; erase?: EraseOp[] }
) {
  await ensureRoot(dialogueId);
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
          entitled: a.entitled ?? true,             // NEW
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

export async function listCS(dialogueId: string, ownerId: string) {
  const cs = await prisma.ludicCommitmentState.findFirst({
    where: { ownerId },
    include: {
      elements: {
        include: { baseLocus: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!cs) return { ok: true, facts: [], rules: [] };

  const facts = cs.elements
    .filter(e => e.basePolarity === 'pos')
    .map(e => ({
      label: e.label ?? '',
      entitled: e.entitled !== false,
      derived: !!(e.extJson as any)?.derived,
      locusPath: e.baseLocus?.path ?? '0',
    }));

  const rules = cs.elements
    .filter(e => e.basePolarity === 'neg')
    .map(e => ({ label: e.label ?? '', locusPath: e.baseLocus?.path ?? '0' }));

  return { ok: true, facts, rules };
}

export async function interactCE(dialogueId: string, ownerId: string) {
  // load entitled elements only
  const cs = await prisma.ludicCommitmentState.findFirst({
    where: { ownerId },
    include: { elements: true },
  });
  if (!cs) return { ok: true, csId: null, derivedFacts: [], contradictions: [] };

  const factRows = cs.elements.filter(e => e.basePolarity === 'pos' && e.entitled !== false);
  const ruleRows = cs.elements.filter(e => e.basePolarity === 'neg' && e.entitled !== false);

  const facts = new Set(factRows.map(e => norm(e.label)).filter(Boolean));
  // allow “not X” style in facts
  const positives = new Set<string>();
  const negatives = new Set<string>();
  for (const f of facts) isNeg(f) ? negatives.add(stripNeg(f)) : positives.add(f);

  const rules = ruleRows
    .map(e => parseRule(e.label ?? ''))
    .filter(Boolean) as { ifAll: string[]; then: string }[];

  // forward-chaining saturation (very small)
  const derived = new Set<string>();
  let changed = true;
  const MAX_ITERS = 1024;
  let guard = 0;

  while (changed && guard++ < MAX_ITERS) {
    changed = false;
    for (const r of rules) {
      const ok = r.ifAll.every(p =>
        isNeg(p) ? negatives.has(stripNeg(p)) : positives.has(p)
      );
      if (!ok) continue;

      const head = r.then;
      if (isNeg(head)) {
        const h = stripNeg(head);
        if (!negatives.has(h)) { negatives.add(h); derived.add(`not ${h}`); changed = true; }
      } else {
        if (!positives.has(head)) { positives.add(head); derived.add(head); changed = true; }
      }
    }
  }

  // contradictions: X and not X
  const contradictions: { a: string; b: string }[] = [];
  for (const x of positives) {
    if (negatives.has(x)) contradictions.push({ a: x, b: `not ${x}` });
  }

  const derivedFacts = Array.from(derived)
    .filter(lbl => !facts.has(lbl))
    .map(label => ({ label }));

  return { ok: true, csId: cs.id, derivedFacts, contradictions };
}

export async function setEntitlement(ownerId: string, label: string, entitled: boolean) {
  await prisma.ludicCommitmentElement.updateMany({
    where: { ownerId, label },
    data: { entitled },
  });
  return { ok:true };
}
