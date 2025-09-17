import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import { compileFromMoves } from '@/packages/ludics-engine/compileFromMoves';
import { stepInteraction } from '@/packages/ludics-engine/stepper';
import { makeSignature, synthesizeActs } from '@/lib/dialogue/moves';


// lightweight extractor (reuse the one in /api/monological/extract if you prefer)
function splitSents(text:string){ return (text.match(/[^.!?]+[.!?]+/g) || [text]).map(t=>t.trim()).filter(Boolean); }
const CUES = {
  rebuttal:/\b(unless|except when|however|but|on the other hand|still|nevertheless)\b/i,
  grounds:/\b(because|since|given that|as|insofar as|due to|on the grounds that)\b/i,
  warrant:/\b(generally|as a rule|assuming|if.+then|there is reason to think)\b/i,
};

function extract(text:string){
  const sents = splitSents(text);
  const grounds:string[] = [], rebuttals:string[] = [], warrants:string[]=[];
  let claim = '';
  for (const s of sents) {
    if (CUES.rebuttal.test(s)) { rebuttals.push(s); continue; }
    if (CUES.grounds.test(s))  { grounds.push(s);  continue; }
    if (CUES.warrant.test(s))  { warrants.push(s); continue; }
  }
  claim = sents[sents.length-1] || text;
  return { claim, grounds: grounds.slice(0,2), rebuttals: rebuttals.slice(0,2), warrants: warrants.slice(0,1) };
}

const Body = z.object({
  argumentId: z.string().min(5),
  proponentActorId: z.string().optional(),
  opponentActorId:  z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { argumentId, proponentActorId, opponentActorId } = Body.parse(await req.json());

  const arg = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: { id:true, text:true, deliberationId:true, claimId:true },
  });
  if (!arg) return NextResponse.json({ ok:false, error:'Argument not found' }, { status: 404 });

  const targetType = arg.claimId ? 'claim' : 'argument';
  const targetId   = arg.claimId ?? arg.id;
  const { claim, grounds, rebuttals, warrants } = extract(arg.text || '');

  const P = proponentActorId ?? 'Proponent';
  const O = opponentActorId  ?? 'Opponent';

  // Build minimal P/O move sequence
  const moves = [
    { deliberationId: arg.deliberationId, targetType, targetId, kind:'ASSERT',  payload:{ text: claim, additive:false }, actorId: P },
  ] as any[];

  // ... (after you build 'moves' array)
const withSig = moves.map((m) => {
  const payload = { ...(m.payload ?? {}) };
  payload.acts = Array.isArray(payload.acts) && payload.acts.length ? payload.acts : synthesizeActs(m.kind, payload);
  const signature = makeSignature(m.kind, m.targetType, m.targetId, payload);
  return { ...m, payload, signature };
});

await prisma.dialogueMove.createMany({ data: withSig, skipDuplicates: true });

  if (rebuttals.length || !warrants.length) {
    moves.push({ deliberationId: arg.deliberationId, targetType, targetId, kind:'WHY', payload:{ note: warrants.length ? 'WHY' : 'Missing warrant?' }, actorId: O });
  }
  let i = 0;
  for (const g of grounds) {
    moves.push({ deliberationId: arg.deliberationId, targetType, targetId, kind:'GROUNDS', payload:{ brief:g, childSuffix: String(++i) }, actorId: P });
  }
  if (!grounds.length && warrants.length) {
    moves.push({ deliberationId: arg.deliberationId, targetType, targetId, kind:'GROUNDS', payload:{ brief:warrants[0], childSuffix:'1' }, actorId: P });
  }

  // Write moves, compile, step
  await prisma.dialogueMove.createMany({ data: moves, skipDuplicates: true });

// After creating moves:
await fetch(new URL('/api/ludics/compile-step', req.url), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deliberationId: arg.deliberationId, phase: 'neutral' }),
  });
  return NextResponse.json({ ok:true });
}


//   const compiled = await compileFromMoves(arg.deliberationId);
//   const [posId, negId] = compiled.designs; // 'Proponent','Opponent' order

//   const trace = await stepInteraction({
//     dialogueId: arg.deliberationId,
//     posDesignId: posId,
//     negDesignId: negId,
//     phase: 'neutral',
//     maxPairs: 256,
//   }).catch(()=>null);

//   return NextResponse.json({ ok:true, inserted: moves.length, trace });
// }
