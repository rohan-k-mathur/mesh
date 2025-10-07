// app/api/deliberations/[id]/aif/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exportDeliberationAsAifJSONLD } from "@/lib/aif/export";
import { prisma } from '@/lib/prismaclient';
import { validateAifGraph } from "@/lib/eval/aifInvariants";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;
  // light size guard
  const count = await prisma.claim.count({ where: { deliberationId } });
  if (count > 10_000) return NextResponse.json({ error: 'too large to export' }, { status: 413 });

  const graph = await exportDeliberationAsAifJSONLD(deliberationId);

  // Optional: quick invariant pass if ?validate=1
  if (req.nextUrl.searchParams.get('validate') === '1') {
    // build a minimal view for fast checks
    const claims = graph.nodes.filter((n:any)=>n['@type']==='aif:InformationNode').map((n:any)=>({id:String(n['@id']).slice(2)}));
    // If you want, hydrate arguments/attacks and call validateAifGraph(...)
    return NextResponse.json({ graph, // plus: could attach validation results here
    });
  }
  return NextResponse.json(graph);
}
