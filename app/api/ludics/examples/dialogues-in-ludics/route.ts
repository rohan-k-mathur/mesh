import { NextRequest, NextResponse } from 'next/server';
import { stepInteraction } from '@/packages/ludics-engine/stepper';
import { Example_EnglishDrama_P, Example_EnglishDrama_O } from '@/packages/ludics-engine/examples/dialoguesInLudics';

export async function GET(req: NextRequest) {
  // In a real setup you could switch by ?name=…; we run the EnglishDrama default.
  try {
    // Persist-free stepping: pass designs in-memory if your stepper supports it;
    // otherwise, upsert two LudicDesign rows and call stepInteraction({ …ids… }).
    const step = await stepInteraction({
      dialogueId: 'EXAMPLE:english-drama',
      posDesignActs: Example_EnglishDrama_P.acts,
      negDesignActs: Example_EnglishDrama_O.acts,
      phase: 'neutral',
      maxPairs: 256,
    }).catch(() => null);

    return NextResponse.json({ ok:true, example:'english-drama', step });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
