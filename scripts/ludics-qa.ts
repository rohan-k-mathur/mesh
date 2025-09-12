// scripts/ludics-qa.ts
import { prisma } from '@/lib/prisma-cli'; // if this fails, change to '../lib/prisma-cli'
import { compileFromMoves } from '@/packages/ludics-engine/compileFromMoves';
import { appendActs } from '@/packages/ludics-engine/appendActs';
import { stepInteraction } from '@/packages/ludics-engine/stepper';

const deliberationId = process.argv[2] || 'dlg_qa';
const P = 'Proponent';
const O = 'Opponent';

async function main() {
  console.log('[QA] start for', deliberationId);

  // 0) ensure deliberation
  await prisma.deliberation.upsert({
    where: { id: deliberationId },
    update: {},
    create: { id: deliberationId, hostType: 'article', hostId: 'qa', createdById: 'system' },
  });
  console.log('[QA] upserted deliberation');

  // 1) clean previous moves (idempotent)
  await prisma.dialogueMove.deleteMany({ where: { deliberationId } }).catch(()=>{});
  console.log('[QA] cleared prior moves');

  // 2) seed moves
  await prisma.dialogueMove.createMany({
    data: [
      { deliberationId, targetType:'claim', targetId:'C_core', kind:'ASSERT',
        payload:{ text:'policy A is beneficial', additive:false }, actorId:P },
      { deliberationId, targetType:'claim', targetId:'C_core', kind:'WHY',
        payload:{ schemeKey:'Consequences', cqId:'ac-2', note:'are important consequences omitted?' },
        actorId:O },
      { deliberationId, targetType:'claim', targetId:'C_core', kind:'GROUNDS',
        payload:{ schemeKey:'Consequences', cqId:'ac-2', brief:'we include mitigation costs' },
        actorId:P },
    ],
    skipDuplicates: true,
  });
  console.log('[QA] inserted ASSERT/WHY/GROUNDS');

  // 3) compile designs
  const { designs } = await compileFromMoves(deliberationId);
  console.log('[QA] compiled → designIds', designs);

  const ds = await prisma.ludicDesign.findMany({
    where: { id: { in: designs } },
    select:{ id:true, participantId:true }
  });
  const dP = ds.find(d => d.participantId===P) ?? ds[0];
  const dO = ds.find(d => d.participantId===O) ?? ds[1] ?? ds[0];
  console.log('[QA] Proponent', dP?.id, 'Opponent', dO?.id);

  if (!dP || !dO) { throw new Error('Designs missing after compile'); }

  // 4) additive node (⊕) with two children
  await appendActs(dP.id, [
    { kind:'PROPER', polarity:'P', locus:'0.2',   ramification:[], expression:'choose mitigation or trade-off', additive:true },
    { kind:'PROPER', polarity:'P', locus:'0.2.1', ramification:[], expression:'mitigation' },
    { kind:'PROPER', polarity:'P', locus:'0.2.2', ramification:[], expression:'trade-off' },
  ], { enforceAlternation:false }, prisma);
  console.log('[QA] appended additive block at 0.2');

  // 5) opponent response so there is at least one pair
  await appendActs(dO.id, [
    { kind:'PROPER', polarity:'O', locus:'0', ramification:[], expression:'risk outweighs benefit' },
  ], { enforceAlternation:false }, prisma);
  console.log('[QA] appended O reply @0');

  // 6) step once
  let step = await stepInteraction({ dialogueId: deliberationId, posDesignId: dP.id, negDesignId: dO.id, phase:'neutral', maxPairs: 1024 });
  console.log('[QA] after step:', { status: step.status, pairs: step.pairs?.length ?? 0 });

  // 7) converge fast: append † on Opponent and step again
  await appendActs(dO.id, [{ kind:'DAIMON', expression:'END' }], { enforceAlternation:false }, prisma);
  step = await stepInteraction({ dialogueId: deliberationId, posDesignId: dP.id, negDesignId: dO.id, phase:'neutral', maxPairs: 1024 });
  console.log('[QA] converged:', { status: step.status, decisive: step.decisiveIndices ?? [] });

  console.log('[QA] done');
}

main().then(()=>process.exit(0)).catch(e=>{ console.error('[QA] ERROR', e); process.exit(1); });
