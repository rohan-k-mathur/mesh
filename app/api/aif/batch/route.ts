// API route to handle batch import of AIF JSON-LD data
// app/api/aif/batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { TargetType } from '@prisma/client';

type Mode = 'validate'|'upsert';

const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const mode: Mode = (body?.options?.mode || 'validate');
  const nodes: any[] = Array.isArray(body?.['@graph']) ? body['@graph'] : [];

  const errors: Array<{ path: string; message: string }> = [];
  const inferences: any[] = [];

  // --- super-light structural validation ---
  // Expect: I nodes, RA nodes, Premise edges (I->RA), Conclusion edges (RA->I)
  const ids = new Set(nodes.filter(n => n['@id']).map(n => n['@id']));
  const byType = (t: string) => nodes.filter(n => {
    const ty = n['@type'];
    return (Array.isArray(ty) ? ty : [ty]).includes(t);
  });

  const I = byType('aif:InformationNode');
  const RA = byType('aif:RA');
  const Prem = byType('aif:Premise');
  const Conc = byType('aif:Conclusion');

  if (!RA.length) errors.push({ path: '@graph', message: 'No aif:RA nodes found' });
  for (const e of Prem) {
    if (!ids.has(e['aif:from'])) errors.push({ path: 'Premise', message: `missing I node ${e['aif:from']}` });
    if (!ids.has(e['aif:to'])) errors.push({ path: 'Premise', message: `missing RA node ${e['aif:to']}` });
  }
  for (const e of Conc) {
    if (!ids.has(e['aif:from'])) errors.push({ path: 'Conclusion', message: `missing RA node ${e['aif:from']}` });
    if (!ids.has(e['aif:to'])) errors.push({ path: 'Conclusion', message: `missing I node ${e['aif:to']}` });
  }

  // Optional: check CQs attached to RA
  const CQEdges = nodes.filter(n => n['@type'] === 'as:hasCriticalQuestion');
  for (const e of CQEdges) {
    if (!ids.has(e['aif:from'])) errors.push({ path: 'hasCriticalQuestion', message: `missing RA ${e['aif:from']}` });
    if (!ids.has(e['aif:to'])) errors.push({ path: 'hasCriticalQuestion', message: `missing CQ ${e['aif:to']}` });
  }

  if (mode === 'validate' || errors.length) {
    return NextResponse.json({ ok: errors.length === 0, errors, inferences }, { status: errors.length ? 422 : 200, ...NO_STORE });
  }

  // --- upsert (minimal RA import: create Argument + ArgumentPremise) ---
  // Assumptions:
  // - We import into a single deliberation (required option)
  // - aif:InformationNode carry "aif:text"
  const deliberationId: string | undefined = body?.options?.deliberationId;
  const authorId: string | undefined = body?.options?.authorId;
  if (!deliberationId || !authorId) {
    return NextResponse.json({ ok:false, error: 'options.deliberationId and options.authorId are required for upsert' }, { status: 400, ...NO_STORE });
  }

  // Map JSON-LD I-ids to Claim ids (create if needed)
  const IText = new Map(I.map(n => [n['@id'], String(n['aif:text'] || '')]));
  const claimIdByNode = new Map<string, string>();

  await prisma.$transaction(async (tx) => {
    // Create claims
    for (const [nodeId, text] of IText) {
      const c = await tx.claim.create({ data: { text, createdById: authorId, deliberationId } });
      claimIdByNode.set(nodeId, c.id);
    }

    // Create arguments for each RA: premises + conclusion
    for (const r of RA) {
      const raId = r['@id'];
      const schemeKey: string | null = r['aif:usesScheme'] || r['as:appliesSchemeKey'] || null;

      const premEdges = Prem.filter(p => p['aif:to'] === raId);
      const concEdge  = Conc.find(c => c['aif:from'] === raId);
      if (!concEdge) continue;

      const conclusionClaimId = claimIdByNode.get(concEdge['aif:to'])!;
      const premiseClaimIds = premEdges.map(p => claimIdByNode.get(p['aif:from'])!).filter(Boolean);

      // Optional: scheme lookup by key
      const scheme = schemeKey
        ? await tx.argumentScheme.findUnique({ where: { key: schemeKey }, select: { id: true } }).catch(()=>null)
        : null;

      const a = await tx.argument.create({
        data: {
          deliberationId, authorId, text: '',
          conclusionClaimId,
          schemeId: scheme?.id ?? null,
        }
      });
      if (premiseClaimIds.length) {
        await tx.argumentPremise.createMany({
          data: premiseClaimIds.map(cid => ({ argumentId: a.id, claimId: cid, isImplicit: false })),
          skipDuplicates: true
        });
      }

      // CQ statuses (optional)
      const cqForThisRA = CQEdges
        .filter(e => e['aif:from'] === raId)
        .map(e => nodes.find(n => n['@id'] === e['aif:to']))
        .filter(Boolean) as any[];
      for (const q of cqForThisRA) {
        const cqKey = String(q?.['cq:key'] || '');
        const status = String(q?.['cq:status'] || 'open');
        if (!cqKey) continue;
        await tx.cQStatus.upsert({
          where: { targetType_targetId_schemeKey_cqKey: { targetType: 'argument' as TargetType, targetId: a.id, schemeKey: schemeKey || 'unknown', cqKey } },
          create: { targetType: 'argument' as TargetType, targetId: a.id, argumentId: a.id, schemeKey: schemeKey || 'unknown', cqKey, status, createdById: authorId },
          update: { status }
        });
      }
    }
  });

  return NextResponse.json({ ok:true, upserted: true }, { status: 201, ...NO_STORE });
}
