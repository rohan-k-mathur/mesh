// app/api/works/[id]/dossier/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(req: NextRequest, { params }:{ params:{ id:string }}) {
  const format = req.nextUrl.searchParams.get('format') || 'md';
  const w = await prisma.theoryWork.findUnique({
    where:{ id: params.id },
    select:{
      id:true, title:true, theoryType:true, standardOutput:true, body:true,
      hermeneutic:true, practicalJustification:true, pascal:true,
      WorkDNStructure:true, WorkIHTheses:true, WorkTCTheses:true, WorkOPTheses:true,
    }
  });
  if (!w) return NextResponse.json({ error:'not found' }, { status:404 });

  const lines:string[] = [];
  lines.push(`# ${w.title}`);
  lines.push(`_Type:_ **${w.theoryType}**`);
  if (w.standardOutput) lines.push(`\n**Standard Output:** ${w.standardOutput}`);
  lines.push('\n---\n## Body\n'); lines.push(w.body || '');

  if (w.WorkDNStructure) {
    lines.push('\n---\n## DN — Structure');
    if (w.WorkDNStructure.explanandum)   lines.push(`- Explanandum: ${w.WorkDNStructure.explanandum}`);
    if (w.WorkDNStructure.nomological)   lines.push(`- Laws: ${w.WorkDNStructure.nomological}`);
    if (w.WorkDNStructure.ceterisParibus)lines.push(`- Ceteris paribus: ${w.WorkDNStructure.ceterisParibus}`);
  }
  if (w.WorkIHTheses) {
    lines.push('\n---\n## IH — Structure / Function / Objectivity');
    if (w.WorkIHTheses.structure)   lines.push(`- Structure: ${w.WorkIHTheses.structure}`);
    if (w.WorkIHTheses.function)    lines.push(`- Function: ${w.WorkIHTheses.function}`);
    if (w.WorkIHTheses.objectivity) lines.push(`- Objectivity: ${w.WorkIHTheses.objectivity}`);
  }
  if (w.WorkTCTheses) {
    lines.push('\n---\n## TC — Function / Explanation / Applications');
    if (w.WorkTCTheses.instrumentFunction) lines.push(`- Function: ${w.WorkTCTheses.instrumentFunction}`);
    if (w.WorkTCTheses.explanation)        lines.push(`- Explanation: ${w.WorkTCTheses.explanation}`);
    if ((w.WorkTCTheses.applications??[]).length) lines.push(`- Applications: ${(w.WorkTCTheses.applications as string[]).join(', ')}`);
  }
  if (w.WorkOPTheses) {
    lines.push('\n---\n## OP — Unrecognizability / Alternatives');
    if (w.WorkOPTheses.unrecognizability) lines.push(`- Unrecognizability: ${w.WorkOPTheses.unrecognizability}`);
    if ((w.WorkOPTheses.alternatives??[]).length) lines.push(`- Alternatives: ${(w.WorkOPTheses.alternatives as string[]).join(', ')}`);
  }
  if (w.hermeneutic) {
    lines.push('\n---\n## Hermeneutic\n');
    lines.push('```json'); lines.push(JSON.stringify(w.hermeneutic, null, 2)); lines.push('```');
  }
  if (w.practicalJustification) {
    lines.push('\n---\n## Practical (MCDA)\n');
    lines.push('```json'); lines.push(JSON.stringify(w.practicalJustification, null, 2)); lines.push('```');
  }
  if (w.pascal) {
    lines.push('\n---\n## Pascal (Decision)\n');
    lines.push('```json'); lines.push(JSON.stringify(w.pascal, null, 2)); lines.push('```');
  }

  const md = lines.join('\n');

  if (format === 'pdf') {
    // keep simple: return Markdown as text/plain for now or render server-side if you have a PDF lib
    return new NextResponse(md, { headers:{ 'content-type':'text/markdown; charset=utf-8' }});
  }
  return new NextResponse(md, { headers:{ 'content-type':'text/markdown; charset=utf-8' }});
}
