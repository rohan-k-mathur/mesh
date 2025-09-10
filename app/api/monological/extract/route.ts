// app/api/monological/extract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';

const Q = z.object({
  argumentId: z.string().optional(),
  text: z.string().optional(),
});

const CUES = {
  claim:     /\b(therefore|thus|so it follows|we should|hence|conclude|in conclusion|thereby)\b/i,
  grounds:   /\b(because|since|given that|as|insofar as|due to|on the grounds that)\b/i,
  warrant:   /\b(generally|as a rule|ceteris paribus|assuming|if.+then|there is reason to think)\b/i,
  backing:   /\b(according to|as shown in|by (the|a) study|evidence from|meta-?analysis|replication)\b/i,
  qualifier: /\b(probably|likely|plausibly|maybe|possibly|almost certainly|in most cases)\b/i,
  rebuttal:  /\b(unless|except when|however|but|on the other hand|still|nevertheless)\b/i,
};

function splitSents(text: string): string[] {
  const s = (text.match(/[^.!?]+[.!?]+/g) || [text]).map(t => t.trim());
  return s.filter(Boolean);
}

type Slot = 'claim'|'grounds'|'warrant'|'backing'|'qualifier'|'rebuttal';

function extractSlots(text: string) {
  const sents = splitSents(text);
  const bySlot: Record<Slot, string[]> = {
    claim: [], grounds: [], warrant: [], backing: [], qualifier: [], rebuttal: [],
  };

  // Pass 1: direct matches with rebuttal precedence
  for (const s of sents) {
    const t = s.trim();
    if (!t) continue;

    if (CUES.rebuttal.test(t)) { bySlot.rebuttal.push(t); continue; }
    if (CUES.grounds.test(t))  { bySlot.grounds.push(t);  continue; }
    if (CUES.warrant.test(t))  { bySlot.warrant.push(t);  continue; }
    if (CUES.backing.test(t))  { bySlot.backing.push(t);  continue; }
    if (CUES.qualifier.test(t)){ bySlot.qualifier.push(t);continue; }
    if (CUES.claim.test(t))    { bySlot.claim.push(t);    continue; }
  }

  // Pass 2: last-sentence bias for claim if empty
  if (bySlot.claim.length === 0 && sents.length) {
    const last = sents[sents.length - 1];
    // Avoid obvious rebuttal tokens
    if (!CUES.rebuttal.test(last)) bySlot.claim.push(last);
  }

  // Small cleanup: unique & keep first 3 per slot
  (Object.keys(bySlot) as Slot[]).forEach(k => {
    const seen = new Set<string>();
    bySlot[k] = bySlot[k].filter(x => {
      const key = x.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 5);
  });

  return bySlot;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = Q.safeParse({
    argumentId: url.searchParams.get('argumentId') || undefined,
    text: url.searchParams.get('text') || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Bad query' }, { status: 400 });
  }
  const { argumentId, text } = parsed.data;

  let sourceText = text ?? '';
  if (!sourceText && argumentId) {
    const arg = await prisma.argument.findUnique({
      where: { id: argumentId },
      select: { text: true },
    });
    sourceText = arg?.text ?? '';
  }
  if (!sourceText) {
    return NextResponse.json({ error: 'No text to analyze' }, { status: 400 });
  }

  const slots = extractSlots(sourceText);
  return NextResponse.json({ ok: true, slots });
}
