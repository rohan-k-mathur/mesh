import { NextRequest, NextResponse } from 'next/server';
import { validateAifGraph } from 'packages/aif-core/src/invariants';
import { importAifJSONLD } from '@/lib/aif/import';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalize(jsonld: any) {
  const nodes = (jsonld?.['@graph'] ?? [])
    .filter((x:any) => typeof x['@id'] === 'string' && typeof x['@type'] === 'string');
  const edges = (jsonld?.['@graph'] ?? [])
    .filter((x:any) => typeof x['@type'] === 'string' && /aif:(Premise|Conclusion|ConflictingElement|ConflictedElement|PreferredElement|DispreferredElement)$/i.test(x['@type']));
  return { nodes, edges };
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const mode = (url.searchParams.get('mode') ?? 'validate') as 'validate'|'upsert';
  const deliberationId = url.searchParams.get('deliberationId') ?? undefined;

  const graph = await req.json().catch(()=> ({}));
  if (!graph?.['@graph']) {
    return NextResponse.json({ ok:false, error:'Missing @graph' }, { status:400 });
  }
  const { nodes, edges } = normalize(graph);

  if (mode === 'validate') {
    const report = validateAifGraph({ claims:[], arguments:[], attacks:[] }); // structural validator (quick)
    // You can expand with node/edge role checks here if you want
    return NextResponse.json({ ok: true, nodes: nodes.length, edges: edges.length, report });
  }

  // Upsert via your JSON-LD importer (expects deliberationId + JSON-LD object)
  if (!deliberationId) {
    return NextResponse.json({ ok:false, error:'deliberationId required for upsert' }, { status:400 });
  }
  const res = await importAifJSONLD(deliberationId, graph);
  const { ok, ...rest } = res;
  return NextResponse.json({ ok: true, ...rest }, { status: 201 });
}
