// scripts/seed-deliberation-all.ts
import 'dotenv/config';
import { prisma } from '@/lib/prismaclient';
import { mintClaimMoid } from '@/lib/ids/mintMoid';
import { mintUrn } from '@/lib/ids/urn';
import { maybeUpsertClaimEdgeFromArgumentEdge } from '@/lib/deepdive/claimEdgeHelpers';

// Optional (skip if not present)
let recomputeGroundedForDelib: undefined | ((d: string) => Promise<void>);
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  recomputeGroundedForDelib = require('@/lib/ceg/grounded').recomputeGroundedForDelib;
} catch { /* ok */ }

// --------------------- Types & helpers ---------------------
type EdgeKind = 'support' | 'rebut' | 'rebut_premise' | 'undercut_inference';
type MoveKind = 'assertion'|'grounds'|'warrant'|'backing'|'qualifier'|'rebuttal'|'counter_rebuttal';
type ModelFlavor = 'dialogical'|'monological'|'rhetorical';

async function ensureUser(authId: string, username: string, name: string) {
  // Uses the main users table (BigInt id, unique auth_id)
  const u = await prisma.user.findUnique({ where: { auth_id: authId } });
  if (u) return u;
  return prisma.user.create({ data: { auth_id: authId, username, name } });
}

function mapEdge(kind: EdgeKind) {
  if (kind === 'support')        return { type: 'support' as const,  targetScope: undefined };
  if (kind === 'rebut')          return { type: 'rebut'   as const,  targetScope: 'conclusion' as const };
  if (kind === 'rebut_premise')  return { type: 'rebut'   as const,  targetScope: 'premise'    as const };
  return { type: 'undercut' as const, targetScope: 'inference' as const };
}

async function promoteToClaim(deliberationId: string, text: string, createdById: string) {
  const moid = mintClaimMoid(text);
  const existing = await prisma.claim.findUnique({ where: { moid } });
  if (existing) return existing;
  const urn  = mintUrn('claim', moid);
  const claim = await prisma.claim.create({
    data: {
      deliberationId,
      text,
      createdById,
      moid,
      urns: { create: { entityType: 'claim', urn } },
    },
  });
  return claim;
}

async function linkArgumentToClaim(argumentId: string, claimId: string) {
  await prisma.argument.update({ where: { id: argumentId }, data: { claimId } });
  // refresh any claim-edges from existing arg-edges
  const incident = await prisma.argumentEdge.findMany({
    where: { OR: [{ fromArgumentId: argumentId }, { toArgumentId: argumentId }] },
    select: { id: true },
  });
  for (const e of incident) await maybeUpsertClaimEdgeFromArgumentEdge(e.id);
}

async function addEvidenceLink(claimId: string, uri: string) {
  // EvidenceKind.secondary is valid per schema
  await prisma.evidenceLink.create({ data: { claimId, kind: 'secondary', uri } });
}

async function addClaimCitation(claimId: string, uri: string) {
  // ClaimCitation.excerptHash is required
  await prisma.claimCitation.create({
    data: {
      claimId, uri, excerptHash: `seed#${claimId}`, locatorStart: 0, locatorEnd: 0,
    },
  });
}

function nowPlus(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// --------------------- Seed: arguments, edges, approvals ---------------------
async function seedArgumentsBundle(deliberationId: string, actors: {authId: string; userId: string; name: string}[]) {
  const createdByAuth = actors[0].authId;
  const createdById   = actors[0].userId; // BigInt -> string cast not needed here since createdById is String in deliberation models

  const A: Record<string, { id: string }> = {};

  async function addArg(key: string, text: string, authorAuth: string, move: MoveKind, model: ModelFlavor, meta?: any) {
    const arg = await prisma.argument.create({
      data: {
        deliberationId,
        authorId: authorAuth, // String (we use auth_id convention)
        text,
        mediaType: 'text',
        sources: {
          model, move,
          ...(meta ?? {})
        } as any,
      },
    });
    A[key] = { id: arg.id };
    return arg.id;
  }

  async function link(fromKey: string, toKey: string, kind: EdgeKind) {
    const { type, targetScope } = mapEdge(kind);
    const edge = await prisma.argumentEdge.create({
      data: {
        deliberationId,
        fromArgumentId: A[fromKey].id,
        toArgumentId:   A[toKey].id,
        type,
        targetScope,
        createdById: createdByAuth,
      },
    });
    await maybeUpsertClaimEdgeFromArgumentEdge(edge.id);
  }

  // Toulmin-ish nucleus + dialogue + rhetoric
  const P = actors[0], D = actors[1], C = actors[2], F = actors[3];
  await addArg('C',  'We should adopt Policy P for the next quarter.', P.authId, 'assertion',       'monological', { modality: 'should' });
  await addArg('G',  'Meta-analysis shows ~30% reduction in absenteeism with P.', P.authId, 'grounds',         'monological', { cite: 'doi:10.0000/example' });
  await addArg('W',  'If absenteeism falls at low cost, adopting is justified.', P.authId, 'warrant',         'monological', { quantifier: 'MOST' });
  await addArg('B',  'Comparable orgs succeeded with P in 2024Q1.',               P.authId, 'backing',         'monological');
  await addArg('Q',  'Assuming ops cost remains under $15k/month.',               P.authId, 'qualifier',       'monological');

  await link('G','C','support'); await link('W','C','support'); await link('B','W','support'); await link('Q','W','support');

  await addArg('R1', 'Publication bias weakens your grounds.',                    D.authId, 'rebuttal',        'dialogical');
  await link('R1','G','rebut_premise');

  await addArg('U1', 'Low-cost assumption fails once compliance burden counted.', C.authId, 'rebuttal',        'dialogical');
  await link('U1','W','undercut_inference');

  await addArg('AL1','Alternative Q achieves similar benefit at lower cost.',     F.authId, 'rebuttal',        'dialogical');
  await link('AL1','C','rebut');

  await addArg('CR1','Bias addressed via trim-and-fill; diagnostics look OK.',    P.authId, 'counter_rebuttal','dialogical');
  await link('CR1','R1','rebut');

  await addArg('CR2','Compliance burden ~2 min/shift; negligible cost impact.',   P.authId, 'counter_rebuttal','dialogical');
  await link('CR2','U1','rebut');

  await addArg('CR3','Q’s trial population mismatched; effects non-comparable.',  P.authId, 'counter_rebuttal','dialogical');
  await link('CR3','AL1','rebut');

  await addArg('RHP','P reduces chaos and restores trust for teams.',             F.authId, 'assertion',       'rhetorical', { appeal: 'pathos' });
  await link('RHP','C','support');

  await addArg('RHL','Given the data and costs, P is dominantly rational.',       P.authId, 'assertion',       'rhetorical', { appeal: 'logos' });
  await link('RHL','C','support');

  // Promote a few arguments → Claims and link/cite
  const claimC  = await promoteToClaim(deliberationId, 'Adopt Policy P next quarter.', P.authId);
  const claimAL = await promoteToClaim(deliberationId, 'Prefer alternative Q over P.', F.authId);
  const claimW  = await promoteToClaim(deliberationId, 'Low-cost + reduced absenteeism justifies adoption.', P.authId);

  await linkArgumentToClaim(A['C'].id,  claimC.id);
  await linkArgumentToClaim(A['AL1'].id, claimAL.id);
  await linkArgumentToClaim(A['W'].id,  claimW.id);

  await addEvidenceLink(claimC.id,  'https://osf.io/example-preprint');
  await addClaimCitation(claimC.id, '/argument/C');
  await addClaimCitation(claimAL.id, '/argument/AL1');

  // A few approvals weighted by “stance”
  for (const key of ['C','G','W','B','Q','R1','U1','AL1','CR1','CR2','CR3','RHP','RHL']) {
    for (const a of actors) {
      const isPro = (a.name === 'Ada' || a.name === 'Chen');
      const isAttack = ['R1','U1','AL1'].includes(key);
      const approve = (isPro && !isAttack) || (!isPro && isAttack) ? 0.75 : 0.25;
      if (Math.random() < approve) {
        await prisma.argumentApproval.create({
          data: { deliberationId, argumentId: A[key].id, userId: a.authId },
        }).catch(() => {});
      }
    }
  }

  // Small annotations & a missing premise/warrant record
  await prisma.argumentAnnotation.create({
    data: {
      targetType: 'argument', targetId: A['Q'].id,
      type: 'hedge', text: 'Assuming', source: 'heuristic',
      offsetStart: 0, offsetEnd: 8,
    },
  });
  await prisma.missingPremise.create({
    data: {
      deliberationId, targetType: 'argument', targetId: A['W'].id,
      proposedById: P.authId, text: '“Low cost” means <$20k/month.', premiseType: 'warrant',
    },
  });

  // Dialogue moves
  await prisma.dialogueMove.createMany({
    data: [
      { deliberationId, targetType: 'argument', targetId: A['C'].id, kind: 'ASSERT', payload: {}, actorId: P.authId },
      { deliberationId, targetType: 'argument', targetId: A['G'].id, kind: 'WHY',    payload: {}, actorId: D.authId },
    ],
    skipDuplicates: true,
  });

  return { A, claimC, claimAL, claimW, createdByAuth, createdById };
}

// --------------------- Seed: Works (DN/IH/TC/OP) + supplies ---------------------
type Weight = number;
type MCDA = {
  criteria: { id: string; label: string; weight: Weight }[];
  options:  { id: string; label: string; desc?: string }[];
  scores:   Record<string, Record<string, number>>;
};
function computeMcda(mcda: MCDA) {
  const totals: Record<string, number> = {};
  let best = -Infinity, bestOptionId: string | null = null;
  for (const o of mcda.options) {
    let t = 0;
    for (const c of mcda.criteria) t += (mcda.scores[o.id]?.[c.id] ?? 0) * c.weight;
    totals[o.id] = t;
    if (t > best) { best = t; bestOptionId = o.id; }
  }
  return { totals, bestOptionId };
}
function euMax(utilities: Record<string, Record<string, number>>) {
  const worlds = Array.from(new Set(Object.values(utilities).flatMap(u => Object.keys(u))));
  const p = Object.fromEntries(worlds.map(w => [w, 1/worlds.length]));
  let best = -Infinity, bestAction: string | null = null;
  for (const [a, map] of Object.entries(utilities)) {
    const eu = worlds.reduce((s,w) => s + (map[w] ?? 0)*(p[w] ?? 0), 0);
    if (eu > best) { best = eu; bestAction = a; }
  }
  return { actionId: bestAction, expectedUtility: best, priors: p };
}

async function seedWorks(deliberationId: string, authorId: string) {
  // DN
  const dn = await prisma.theoryWork.create({
    data: {
      deliberationId, authorId,
      title: 'DN: Compliance effects of empathy-based nudges',
      body: 'Synthesize six field experiments; 3–9 pp adherence gains; modest decay after 8 weeks.',
      theoryType: 'DN',
    },
  });

  // IH (+ hermeneutic + practical MCDA)
  const ih = await prisma.theoryWork.create({
    data: {
      deliberationId, authorId,
      title: 'IH: Autonomy-preserving public health nudges',
      body: 'Interpret subjective reasons & social meanings; idealize autonomy-respecting instruments.',
      theoryType: 'IH',
      standardOutput: 'Improve vaccination uptake while preserving autonomy',
    },
  });

  await prisma.workHermeneuticProject.create({
    data: {
      workId: ih.id,
      facts:        [{ id:'F1', text:'Reminders perceived as judgmental by some.' }],
      hypotheses:   [{ id:'H1', text:'Ambassador-led messages raise trust.' }, { id:'H3', text:'Personalization reduces judgment.' }],
      plausibility: [{ hypothesisId:'H1', score:0.75 }, { hypothesisId:'H3', score:0.6 }],
      selectedIds:  ['H1','H3'],
    } as any,
  });

  const ihMcda: MCDA = {
    criteria: [
      { id:'C_eff', label:'Effectiveness', weight:0.5 },
      { id:'C_aut', label:'Autonomy',     weight:0.3 },
      { id:'C_eq',  label:'Equity',       weight:0.2 },
    ],
    options: [
      { id:'O_default',  label:'Default opt-out' },
      { id:'O_personal', label:'Personalized reminders' },
      { id:'O_amb',      label:'Community ambassadors' },
    ],
    scores: {
      O_default:  { C_eff:0.70, C_aut:0.35, C_eq:0.55 },
      O_personal: { C_eff:0.62, C_aut:0.72, C_eq:0.60 },
      O_amb:      { C_eff:0.78, C_aut:0.68, C_eq:0.75 },
    },
  };
  const ihRes = computeMcda(ihMcda);
  await prisma.workPracticalJustification.create({
    data: { workId: ih.id, purpose: ih.standardOutput ?? '', criteria: ihMcda.criteria as any, options: ihMcda.options as any, scores: ihMcda.scores as any, result: ihRes as any },
  });

  // TC (+ practical MCDA)
  const tc = await prisma.theoryWork.create({
    data: {
      deliberationId, authorId,
      title: 'TC: Constructing a low-friction outreach instrument',
      body: 'Design a concrete program optimized on stated criteria.',
      theoryType: 'TC',
      standardOutput: 'Minimize missed appointments with minimal autonomy costs',
    },
  });
  const tcMcda: MCDA = {
    criteria: [
      { id:'C_eff',  label:'Effectiveness', weight:0.55 },
      { id:'C_cost', label:'Cost',          weight:0.20 },
      { id:'C_aut',  label:'Autonomy',      weight:0.25 },
    ],
    options: [
      { id:'O_sms',  label:'Neutral SMS' },
      { id:'O_pers', label:'Personalized SMS' },
      { id:'O_inct', label:'Small incentive' },
    ],
    scores: {
      O_sms:  { C_eff:0.58, C_cost:0.85, C_aut:0.75 },
      O_pers: { C_eff:0.68, C_cost:0.70, C_aut:0.80 },
      O_inct: { C_eff:0.74, C_cost:0.40, C_aut:0.50 },
    },
  };
  const tcRes = computeMcda(tcMcda);
  await prisma.workPracticalJustification.create({
    data: { workId: tc.id, purpose: tc.standardOutput ?? '', criteria: tcMcda.criteria as any, options: tcMcda.options as any, scores: tcMcda.scores as any, result: tcRes as any },
  });

  // OP (+ Pascal)
  const op = await prisma.theoryWork.create({
    data: {
      deliberationId, authorId,
      title: 'OP: As-if decision under uncertainty about transmission waves',
      body: 'Choose an action under genuine theoretical underdetermination.',
      theoryType: 'OP',
    },
  });
  const pascal = {
    propositions: [{ id:'W_high', statement:'High transmission' }, { id:'W_low', statement:'Low/transient' }],
    actions:      [{ id:'A_targeted', label:'Targeted measures' }, { id:'A_strict', label:'Strict restrictions' }, { id:'A_status', label:'Status quo' }],
    utilities:    { A_targeted:{ W_high:0.40, W_low:0.65 }, A_strict:{ W_high:0.55, W_low:-0.30 }, A_status:{ W_high:-0.30, W_low:0.40 } },
    assumption:   'Equal priors.',
  };
  const decision = euMax(pascal.utilities);
  await prisma.workPascalModel.create({ data: { workId: op.id, ...pascal, decision } as any });

  // Supplies: DN → IH/TC/OP
  await prisma.knowledgeEdge.createMany({
    data: [
      { deliberationId, kind:'SUPPLIES_PREMISE', fromWorkId: dn.id, toWorkId: ih.id },
      { deliberationId, kind:'SUPPLIES_PREMISE', fromWorkId: dn.id, toWorkId: tc.id },
      { deliberationId, kind:'SUPPLIES_PREMISE', fromWorkId: dn.id, toWorkId: op.id },
    ],
    skipDuplicates: true,
  });

  // Promote work conclusions to claims & cite works
  const ihBest = ihMcda.options.find(o => o.id === ihRes.bestOptionId)?.label ?? 'selected';
  const tcBest = tcMcda.options.find(o => o.id === tcRes.bestOptionId)?.label ?? 'selected';
  const opAct  = (pascal.actions.find(a => a.id === decision.actionId)?.label) ?? 'chosen';

  const ihClaim = await promoteToClaim(deliberationId, `For “${ih.standardOutput}”, the best option is ${ihBest}.`, authorId);
  const tcClaim = await promoteToClaim(deliberationId, `To “${tc.standardOutput}”, the best instrument is ${tcBest}.`, authorId);
  const opClaim = await promoteToClaim(deliberationId, `Act as if: ${opAct} (under equal priors).`, authorId);

  await addClaimCitation(ihClaim.id, `/works/${ih.id}#loc=0-0`);
  await addClaimCitation(tcClaim.id, `/works/${tc.id}#loc=0-0`);
  await addClaimCitation(opClaim.id, `/works/${op.id}#loc=0-0`);

  // Optional knowledge links work→claim
  await prisma.knowledgeEdge.createMany({
    data: [
      { deliberationId, kind:'SUPPORTS', fromWorkId: ih.id, toClaimId: ihClaim.id },
      { deliberationId, kind:'SUPPORTS', fromWorkId: tc.id, toClaimId: tcClaim.id },
      { deliberationId, kind:'SUPPORTS', fromWorkId: op.id, toClaimId: opClaim.id },
    ],
    skipDuplicates: true,
  });

  return { dn, ih, tc, op, ihClaim, tcClaim, opClaim };
}

// --------------------- Seed: Viewpoints, clusters, bridge, amplification ---------------------
async function seedViewpointsClustersBridge(deliberationId: string, actorAuths: string[], Aids: Record<string, string>) {
  // Viewpoint selection (harmonic) with k=3
  const selection = await prisma.viewpointSelection.create({
    data: {
      deliberationId,
      rule: 'harmonic',
      k: 3,
      coverageAvg: 0.72,
      coverageMin: 0.55,
      explainJson: { note: 'seeded selection' } as any,
      createdById: actorAuths[0],
    },
  });
  // Assign a few arguments to viewpoints
  await prisma.viewpointArgument.createMany({
    data: [
      { selectionId: selection.id, argumentId: Aids['C'],   viewpoint: 0 },
      { selectionId: selection.id, argumentId: Aids['R1'],  viewpoint: 1 },
      { selectionId: selection.id, argumentId: Aids['AL1'], viewpoint: 2 },
    ],
    skipDuplicates: true,
  });

  // Clusters
  const topic = await prisma.cluster.create({
    data: { deliberationId, type: 'topic', label: 'Costs vs Benefits' },
  });
  const affinity = await prisma.cluster.create({
    data: { deliberationId, type: 'affinity', label: 'Ops-focused' },
  });

  await prisma.argumentCluster.createMany({
    data: [
      { clusterId: topic.id,   argumentId: Aids['C'] },
      { clusterId: topic.id,   argumentId: Aids['AL1'] },
      { clusterId: affinity.id, argumentId: Aids['G'] },
    ],
    skipDuplicates: true,
  });
  for (const authId of actorAuths) {
    await prisma.userCluster.create({
      data: { clusterId: affinity.id, userId: authId, score: Math.random() },
    }).catch(() => {});
  }

  // Bridge request targeting the topic cluster
  const br = await prisma.bridgeRequest.create({
    data: {
      deliberationId,
      requestedById: actorAuths[0],
      targetClusterId: topic.id,
      status: 'assigned',
      expiresAt: nowPlus(7),
    },
  });
  const assign = await prisma.bridgeAssignment.create({
    data: { requestId: br.id, assigneeId: actorAuths[2], rewardCare: 10, acceptedAt: new Date() },
  });

  // Amplification Event bound to the selection
  await prisma.amplificationEvent.create({
    data: {
      deliberationId,
      hostType: 'deliberation',
      hostId: deliberationId,
      eventType: 'selection_published',
      reason: 'Demo publish',
      viewpointSelectionId: selection.id,
      createdById: actorAuths[0],
    },
  });

  return { selection, topic, affinity, br, assign };
}

// --------------------- Seed: Card, Brief(+Version), Issues, Governance, CQ, Values, Bounty ---------------------
async function seedCardsBriefsGovernanceCQEtc(
  deliberationId: string,
  roomId: string | null,
  claimAdoptId: string,
  actors: {authId: string; userId: string; name: string}[],
  Aids: Record<string, string>
) {
  const P = actors[0], D = actors[1];

  // DeliberationCard linked to claim
  const card = await prisma.deliberationCard.create({
    data: {
      deliberationId,
      authorId: P.authId,
      status: 'published',
      claimText: 'Adopt Policy P next quarter.',
      reasonsText: ['Absenteeism reduction', 'Low cost'],
      evidenceLinks: ['doi:10.0000/example'],
      anticipatedObjectionsText: ['Publication bias', 'Compliance burden'],
      warrantText: 'Cost-benefit justification is acceptable.',
      moid: mintClaimMoid('card: adopt policy P'),
      claimId: claimAdoptId, // <- use FK
    },
  });
  await prisma.cardCitation.create({
    data: { cardId: card.id, uri: '/cards/' + card.id, locatorStart: '0', locatorEnd: '0' },
  });

  // Brief + Version
  const brief = await prisma.brief.create({
    data: {
      roomId: roomId ?? 'seed-room',
      title: 'Living Brief: Policy P',
      slug: `brief-p-${Date.now()}`,
      createdById: P.authId,
      status: 'published',
      visibility: 'public',
    },
  });
  const version = await prisma.briefVersion.create({
    data: {
      briefId: brief.id,
      number: 1,
      compiledFromDeliberationId: deliberationId,
      sectionsJson: [{ type:'summary', text:'Seeded summary of P' }],
      citations: [{ type:'argument', id: Aids['G'] }],
      createdById: P.authId,
    } as any,
  });
  await prisma.brief.update({ where: { id: brief.id }, data: { currentVersionId: version.id } });
  await prisma.briefLink.create({
    data: { briefVersionId: version.id, sourceType: 'claim', sourceId: claimAdoptId },
  });

  // Issue + link
  const issue = await prisma.issue.create({
    data: { deliberationId, label: 'Data validity', description: 'Check meta-analysis bias.', createdById: D.authId },
  });
  await prisma.issueLink.create({ data: { issueId: issue.id, argumentId: Aids['G'], role: 'related' } });

  // Governance: Panel, Panelists, Status, DecisionReceipt
  const panel = await prisma.panel.create({ data: { roomId: roomId ?? 'seed-room' } });
  for (const a of actors) {
    await prisma.panelist.create({
      data: { panelId: panel.id, userId: a.authId, role: a.name === 'Ada' ? 'chair' : 'member' },
    }).catch(() => {});
  }
  await prisma.contentStatus.create({
    data: {
      roomId: roomId ?? 'seed-room',
      targetType: 'claim',
      targetId: claimAdoptId,
      currentStatus: 'OK',
    },
  }).catch(() => {});
  await prisma.decisionReceipt.create({
    data: {
      roomId: roomId ?? 'seed-room',
      actorId: actors[0].authId,
      action: 'STATUS_CHANGE',
      targetType: 'claim',
      targetId: claimAdoptId,
      panelId: panel.id,
      reason: 'Initial moderation pass',
    },
  });
  await prisma.roomLogbook.create({
    data: { roomId: roomId ?? 'seed-room', entryType: 'NOTE', summary: 'Seeded brief & moderation.' },
  });

  // CQ / Schemes
  const scheme = await prisma.argumentScheme.upsert({
    where: { key: 'expert_opinion' },
    create: {
      key: 'expert_opinion',
      title: 'Appeal to Expert Opinion',
      summary: 'Uses an expert’s statement as support.',
      cq: { questions: ['Is the source a genuine expert?', 'Is there consensus?', 'Is the field relevant?'] },
    } as any,
    update: {},
  });
  const inst = await prisma.schemeInstance.create({
    data: {
      targetType: 'claim',
      targetId: claimAdoptId,
      schemeId: scheme.id,
      data: { expert: { name:'Dr. Rivera', field:'Operations' }, statement:'P cuts absenteeism ~30%' },
      createdById: actors[0].authId,
    } as any,
  });
  await prisma.criticalQuestion.createMany({
    data: [
      { instanceId: inst.id, cqId: 'CQ1', text: 'Is Dr. Rivera a relevant expert?',   attackKind: 'UNDERMINES', status: 'open', openedById: actors[1].authId },
      { instanceId: inst.id, cqId: 'CQ2', text: 'Is there expert consensus on this?', attackKind: 'REBUTS',     status: 'open', openedById: actors[1].authId },
    ],
    skipDuplicates: true,
  });
  await prisma.cQStatus.create({
    data: { targetType:'claim', targetId:claimAdoptId, schemeKey:'expert_opinion', cqKey:'CQ1', satisfied:false, createdById: actors[1].authId },
  }).catch(() => {});
  await prisma.graphEdge.create({
    data: {
      fromId: inst.id, toId: claimAdoptId, type: 'undercut',
      scope: 'inference', roomId: roomId ?? 'seed-room', createdById: actors[1].authId, meta: { schemeKey:'expert_opinion', cqKey:'CQ1' },
    },
  }).catch(() => {});

  // Values & preferences
  const vAut = await prisma.value.upsert({
    where: { key: 'autonomy' }, create: { key:'autonomy', label:'Autonomy' }, update: {},
  });
  const vEff = await prisma.value.upsert({
    where: { key: 'efficiency' }, create: { key:'efficiency', label:'Efficiency' }, update: {},
  });
  await prisma.claimValue.createMany({
    data: [
      { claimId: claimAdoptId, valueId: vAut.id, weight: 2 },
      { claimId: claimAdoptId, valueId: vEff.id, weight: 3 },
    ],
    skipDuplicates: true,
  });
  await prisma.audiencePreference.create({
    data: { ownerType: 'room', ownerId: roomId ?? 'seed-room', order: 'Efficiency>Autonomy' },
  }).catch(() => {});

  // Bounty + submission (bridge/synthesis)
  const bounty = await prisma.bounty.create({
    data: {
      roomId: roomId ?? 'seed-room',
      type: 'synthesis',
      title: 'Synthesize counter-evidence',
      brief: 'Find high-quality sources challenging P.',
      rewardCare: 50,
      opensAt: new Date(),
      closesAt: nowPlus(14),
    },
  });
  await prisma.bountySubmission.create({
    data: {
      bountyId: bounty.id,
      submitterId: actors[1].authId,
      submissionType: 'claim',
      submissionId: claimAdoptId,
    },
  });

  // Warrant for the claim
  await prisma.claimWarrant.create({
    data: { claimId: claimAdoptId, text: 'Low-cost effectiveness warrants adoption.', createdBy: actors[0].authId },
  }).catch(() => {});

  return { card, brief, version, panel, bounty };
}

// --------------------- Seed: Claim edges + labels + stats ---------------------
async function seedClaimEdgesLabelsStats(deliberationId: string, claimC: string, claimAL: string, claimW: string) {
  // Claim edges: W supports C; AL rebuts C
  await prisma.claimEdge.createMany({
    data: [
      { fromClaimId: claimW,  toClaimId: claimC,  type: 'supports', attackType: 'SUPPORTS', deliberationId },
      { fromClaimId: claimAL, toClaimId: claimC,  type: 'rebuts',   attackType: 'REBUTS',   deliberationId, targetScope: 'conclusion' },
    ],
    skipDuplicates: true,
  });

  // Basic labels
  await prisma.claimLabel.upsert({
    where: { claimId: claimC },
    update: { semantics: 'grounded', label: 'IN', explainJson: { note: 'seed' } as any },
    create: { claimId: claimC, semantics: 'grounded', label: 'IN' },
  });
  await prisma.claimLabel.upsert({
    where: { claimId: claimAL },
    update: { semantics: 'grounded', label: 'UNDEC' },
    create: { claimId: claimAL, semantics: 'grounded', label: 'UNDEC' },
  });

  // Stats recompute (light)
  const [supportsCount, rebutsCount, undercutsCount] = await Promise.all([
    prisma.claimEdge.count({ where: { toClaimId: claimC, type: 'supports' } }),
    prisma.claimEdge.count({ where: { toClaimId: claimC, type: 'rebuts'   } }),
    prisma.claimEdge.count({ where: { toClaimId: claimC, attackType: 'UNDERCUTS' } }),
  ]);
  // approvalsCount is for Claims; we use Argument approvals as proxy (linked by any Argument with this claimId)
  const argForC = await prisma.argument.findFirst({ where: { claimId: claimC }, select: { id: true } });
  const approvalsCount = argForC ? await prisma.argumentApproval.count({ where: { argumentId: argForC.id } }) : 0;

  await prisma.claimStats.upsert({
    where: { deliberationId_claimId: { deliberationId, claimId: claimC } },
    update: { approvalsCount, supportsCount, rebutsCount, undercutsCount, updatedAt: new Date() },
    create: { deliberationId, claimId: claimC, approvalsCount, supportsCount, rebutsCount, undercutsCount },
  });
}

// --------------------- Main orchestrator ---------------------
async function main() {
  const deliberationId = process.argv[2] || 'cmf5x2hcr0033rmy4278kber0';

  // Actors (User table with BigInt id; we use auth_id String everywhere in deliberation models)
  const users = await Promise.all([
    ensureUser('demo-auth-1', 'demo1', 'Ada'),
    ensureUser('demo-auth-2', 'demo2', 'Bo'),
    ensureUser('demo-auth-3', 'demo3', 'Chen'),
    ensureUser('demo-auth-4', 'demo4', 'Dee'),
  ]);
  const actors = users.map(u => ({ authId: u.auth_id, userId: String(u.id), name: u.name }));

  // 1) Arguments + claims + approvals
  const seeded = await seedArgumentsBundle(deliberationId, actors);

  // 2) Works (DN/IH/TC/OP) + knowledge edges
  const works = await seedWorks(deliberationId, actors[0].authId);

  // 3) Viewpoints, clusters, bridge, amplification
  await seedViewpointsClustersBridge(
    deliberationId,
    actors.map(a => a.authId),
    Object.fromEntries(Object.entries(seeded.A).map(([k, v]) => [k, v.id]))
  );

  // Fetch deliberation room (if present) for governance/AudiencePreference
  const delib = await prisma.deliberation.findUnique({ where: { id: deliberationId }, select: { roomId: true } });

  // 4) Cards, brief, governance, CQ, values, bounty
  await seedCardsBriefsGovernanceCQEtc(
    deliberationId,
    delib?.roomId ?? null,
    seeded.claimC.id,
    actors,
    Object.fromEntries(Object.entries(seeded.A).map(([k, v]) => [k, v.id]))
  );

  // 5) Claim edges + labels + stats
  await seedClaimEdgesLabelsStats(deliberationId, seeded.claimC.id, seeded.claimAL.id, seeded.claimW.id);

  // 6) Recompute grounded semantics (if available)
  try { await recomputeGroundedForDelib?.(deliberationId); } catch {}

  // Summary
  console.log('\n=== Seed complete ===');
  console.table([
    { Kind: 'Claim',   Id: seeded.claimC.id,  Text: 'Adopt Policy P next quarter.' },
    { Kind: 'Claim',   Id: seeded.claimAL.id, Text: 'Prefer alternative Q over P.' },
    { Kind: 'Claim',   Id: seeded.claimW.id,  Text: 'Low-cost + reduced absenteeism justifies adoption.' },
    { Kind: 'Work',    Id: works.dn.id,       Text: 'DN' },
    { Kind: 'Work',    Id: works.ih.id,       Text: 'IH' },
    { Kind: 'Work',    Id: works.tc.id,       Text: 'TC' },
    { Kind: 'Work',    Id: works.op.id,       Text: 'OP' },
  ]);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
