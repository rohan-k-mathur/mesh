// scripts/seed-metrovale.ts
import 'dotenv/config';
import { prisma } from '@/lib/prisma-cli'; // your script-friendly Prisma client
import { appendActs } from '@/packages/ludics-engine/appendActs';
import { compileFromMoves } from '@/packages/ludics-engine/compileFromMoves';
import { stepInteraction } from '@/packages/ludics-engine/stepper';
import { applyToCS, interactCE } from '@/packages/ludics-engine/commitments';

  async function ensureDeliberation(idArg?: string) {
       if (idArg) {
         const found = await prisma.deliberation.findUnique({ where: { id: idArg } });
         if (found) return found;
         throw new Error(`Deliberation ${idArg} not found`);
       }  const hostId = 'metrovale-cbd-pricing';
  let d = await prisma.deliberation.findFirst({ where: { hostType: 'post', hostId } });
  if (!d) {
    d = await prisma.deliberation.create({
      data: {
        hostType: 'post', hostId,
        createdById: 'seed',
        rule: 'utilitarian',
        k: 3,
      }
    });
  }
  return d;
}
async function ensureRoot(dialogueId: string) {
  const root = await prisma.ludicLocus.upsert({
    where: { dialogueId_path: { dialogueId, path: '0' } as any },
    update: {},
    create: { dialogueId, path: '0' }
  }).catch(async ()=> {
    let r = await prisma.ludicLocus.findFirst({ where: { dialogueId, path: '0' } });
    if (!r) r = await prisma.ludicLocus.create({ data: { dialogueId, path: '0' } });
    return r;
  });
  return root;
}

async function ensureDesigns(dialogueId: string, rootId: string) {
  const existing = await prisma.ludicDesign.findMany({ where: { deliberationId: dialogueId } });
  let P = existing.find(d=>d.participantId==='Proponent');
  let O = existing.find(d=>d.participantId==='Opponent');
  if (!P) P = await prisma.ludicDesign.create({ data: { deliberationId: dialogueId, participantId: 'Proponent', rootLocusId: rootId } });
  if (!O) O = await prisma.ludicDesign.create({ data: { deliberationId: dialogueId, participantId: 'Opponent',  rootLocusId: rootId } });
  return { P, O };
}

async function seedActs(Pid: string, Oid: string) {
  // P facts at loci 0.1, 0.2, 0.3 (+ ACK by O)
  await appendActs(Pid, [
    { kind:'PROPER', polarity:'P', locus:'0.1', ramification:[], expression:'congestion_high' },
    { kind:'PROPER', polarity:'P', locus:'0.2', ramification:[], expression:'revenue_earmarked_transit' },
    { kind:'PROPER', polarity:'P', locus:'0.3', ramification:['1'], expression:'equity_program_in_place' },
  ], { enforceAlternation:false }, prisma as any);
  await appendActs(Oid, [
    { kind:'PROPER', polarity:'O', locus:'0.3.1', ramification:[], expression:'ACK' },
  ], { enforceAlternation:false }, prisma as any);

  // O facts at 0.4, 0.5
  await appendActs(Oid, [
    { kind:'PROPER', polarity:'P', locus:'0.4', ramification:[], expression:'small_business_margin_thin' },
    { kind:'PROPER', polarity:'P', locus:'0.5', ramification:[], expression:'charge_on_access' },
  ], { enforceAlternation:false }, prisma as any);
}

async function seedCommitments(dialogueId: string) {
  // Proponent facts & rules
  await applyToCS(dialogueId, 'Proponent', {
    add: [
      { label: 'congestion_high',           basePolarity: 'pos', baseLocusPath: '0.1' },
      { label: 'revenue_earmarked_transit', basePolarity: 'pos', baseLocusPath: '0.2' },
      { label: 'equity_program_in_place',   basePolarity: 'pos', baseLocusPath: '0.3' },
      { label: 'congestion_high & revenue_earmarked_transit -> net_public_benefit', basePolarity:'neg', baseLocusPath:'0' },
      { label: 'equity_program_in_place -> not regressive_impact',                  basePolarity:'neg', baseLocusPath:'0' },
      { label: 'net_public_benefit -> policy_justified',                            basePolarity:'neg', baseLocusPath:'0' },
    ]
  });

  // Opponent facts & rules
  await applyToCS(dialogueId, 'Opponent', {
    add: [
      { label: 'small_business_margin_thin', basePolarity: 'pos', baseLocusPath: '0.4' },
      { label: 'charge_on_access',           basePolarity: 'pos', baseLocusPath: '0.5' },
      // NOTE: they conceded equity_program_in_place, so no "not equity_program_in_place" here
      { label: 'charge_on_access & not equity_program_in_place -> regressive_impact', basePolarity:'neg', baseLocusPath:'0' },
      { label: 'regressive_impact -> not net_public_benefit',                          basePolarity:'neg', baseLocusPath:'0' },
    ]
  });
}

async function main() {
     const idArg = process.argv[2]; // optional
     const d = await ensureDeliberation(idArg);
  await ensureRoot(d.id);
  const root = await prisma.ludicLocus.findFirst({ where: { dialogueId: d.id, path: '0' } });
  if (!root) throw new Error('No root locus');
  const { P, O } = await ensureDesigns(d.id, root.id);
  await seedActs(P.id, O.id);
  await seedCommitments(d.id);

  await compileFromMoves(d.id).catch(()=>{});
  const designs = await prisma.ludicDesign.findMany({ where: { deliberationId: d.id } });
  const pos = designs.find(x=>x.participantId==='Proponent')!;
  const neg = designs.find(x=>x.participantId==='Opponent')!;
  const trace = await stepInteraction({ dialogueId: d.id, posDesignId: pos.id, negDesignId: neg.id, phase:'neutral', maxPairs: 1024 });

  const P_res = await interactCE(d.id, 'Proponent');
  const O_res = await interactCE(d.id, 'Opponent');

  console.log('Deliberation:', d.id);
  console.log('Trace:', trace.status, (trace.pairs ?? []).length, 'pairs');
  console.log('P derived:', P_res.derivedFacts);
  console.log('P contradictions:', P_res.contradictions);
  console.log('O derived:', O_res.derivedFacts);
  console.log('O contradictions:', O_res.contradictions);
  console.log('Open the page and go to the Ludics tab; Unified tree + Commitments now seeded.');
}

main().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1); });
