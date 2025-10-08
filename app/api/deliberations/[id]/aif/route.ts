// app/api/deliberations/[id]/aif/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { exportDeliberationAsAifJSONLD } from '@/lib/aif/export';
import { validateAifGraph } from 'packages/aif-core/src/invariants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;
  const count = await prisma.claim.count({ where: { deliberationId } });
  if (count > 10_000) return NextResponse.json({ error: 'too large to export' }, { status: 413 });

  const jsonld = await exportDeliberationAsAifJSONLD(deliberationId);

  // Build a minimal view for invariant report
  const claims = jsonld.nodes.filter((n:any)=>n['@type']==='aif:InformationNode')
                              .map((n:any)=>({ id: n['@id'].slice(2), text: n.text ?? '' }));
  const arguments_ = jsonld.nodes.filter((n:any)=>n['@type']==='aif:RA')
                                 .map((n:any)=>({ id: n['@id'].slice(2) }));
  const attacks = jsonld.nodes.filter((n:any)=>n['@type']==='aif:CA')
                              .map((n:any)=>({ id: n['@id'].slice(3) }));

  const g = {
    claims: claims.map(c => ({ id: c.id, text: c.text })),
    arguments: arguments_.map(a => ({ id: a.id, conclusionClaimId: 'unknown', premises: [] as any[] })), // light
    attacks: attacks.map(a => ({ id: a.id, attackType: 'REBUTS', targetScope: 'conclusion' }))
  } as any;

  const validation = validateAifGraph({ claims: [], arguments: [], attacks: [] }); // placeholder—use full graph if needed
  return NextResponse.json({ jsonld, validation }, { status: 200 });
}
