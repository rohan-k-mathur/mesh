// // app/api/dialogue/legal-moves/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { z } from 'zod';
// import { getCurrentUserId } from '@/lib/serverutils';
// import { legalAttacksFor } from '@/lib/dialogue/legalMoves';

// const BodySchema = z.object({ text: z.string().min(1) });

// export async function POST(req: NextRequest) {
//   const userId = await getCurrentUserId().catch(() => null);
//   if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

//   const parsed = BodySchema.safeParse(await req.json());
//   if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

//   const { text } = parsed.data;
//   const res = legalAttacksFor(text);

//   return NextResponse.json({ ok: true, ...res });
// }

// app/api/dialogue/legal-moves/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { computeLegalMoves } from '@/packages/dialogue/computeLegalMoves';

const Q = z.object({
  deliberationId: z.string().min(5),
  targetType: z.enum(['argument','claim','card']),
  targetId: z.string().min(5),
});

export async function GET(req: NextRequest) {
  const parsed = Q.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
  const moves = await computeLegalMoves(parsed.data);
  return NextResponse.json({ ok:true, moves }, { headers: { 'Cache-Control': 'no-store' } });
}
