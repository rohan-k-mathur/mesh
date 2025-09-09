import { NextRequest, NextResponse } from 'next/server';
import { zAppendActs } from 'packages/ludics-rest/zod';
import { appendActs } from 'packages/ludics-engine/appendActs';
import { z } from 'zod';


const zAppend = z.object({
    designId: z.string(),
    enforceAlternation: z.boolean().optional(),
    acts: z.array(z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal('PROPER'),
        polarity: z.enum(['P','O']),
        locusPath: z.string(),
        ramification: z.array(z.string()),
        expression: z.string().optional(),
        meta: z.record(z.any()).optional(),
        additive: z.boolean().optional(),
      }),
      z.object({ kind: z.literal('DAIMON'), expression: z.string().optional() }),
    ])),
  });
  
  export async function POST(req: NextRequest) {
    const { designId, acts, enforceAlternation } = zAppend.parse(await req.json());
    const transformed = acts.map(a => a.kind === 'PROPER'
      ? { kind: 'PROPER' as const, polarity: a.polarity, locus: a.locusPath, ramification: a.ramification, expression: a.expression, meta: a.meta, additive: a.additive }
      : { kind: 'DAIMON' as const, expression: a.expression }
    );
    const res = await appendActs(designId, transformed, { enforceAlternation });
    return NextResponse.json(res);
  }