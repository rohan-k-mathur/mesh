import { prisma } from '@/lib/prismaclient';
import { appendActs } from './appendActs';
import { applyToCS } from './commitments';

export async function concede(params: {
  dialogueId: string,
  concedingParticipantId: string,         // 'Proponent' | 'Opponent'
  anchorLocus: string,                     // L
  proposition: { text: string, baseLocus?: string }, // P at L
}) {
  const { dialogueId, concedingParticipantId, anchorLocus, proposition } = params;

  // Find the conceding side's design
  const design = await prisma.ludicDesign.findFirst({
    where: { deliberationId: dialogueId, participantId: concedingParticipantId }
  });
  if (!design) throw new Error('NO_SUCH_DESIGN');

  // (+, L, {L.1}, "P") then (−, L.1, [], "ACK")
  const child = `${anchorLocus}.1`;
  await appendActs(design.id, [
    { kind:'PROPER', polarity:'P', locus: anchorLocus, ramification:['1'], expression: proposition.text },
    { kind:'PROPER', polarity:'O', locus: child,       ramification:[],    expression: 'ACK' },
  ], { enforceAlternation: false });

  // Update commitment state for THE OTHER side (they now “have” P)
  const receiver = concedingParticipantId === 'Proponent' ? 'Opponent' : 'Proponent';
  await applyToCS(dialogueId, receiver, {
    add: [{ label: proposition.text, basePolarity: 'pos', baseLocusPath: proposition.baseLocus ?? '0' }]
  });

  return { ok:true, appended: 2, anchorLocus, child };
}
