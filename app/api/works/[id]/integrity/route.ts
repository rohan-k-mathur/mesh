// app/api/works/[id]/integrity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';

type ChecklistItem = { key: string; label: string; ok: boolean; details?: string };
type IntegrityPayload = {
  ok: true;
  type: 'DN'|'IH'|'TC'|'OP';
  completion: number;               // 0..1
  checklist: ChecklistItem[];
  // quick booleans for simple badges
  has: {
    std: boolean;
    herm: boolean;
    prac: boolean;
    pascal: boolean;
    dn: boolean;
    ih: boolean;
    tc: boolean;
    op: boolean;
  };
};

export async function GET(_req: NextRequest, { params }: { params: { id: string }}) {
  const w = await prisma.theoryWork.findUnique({
    where: { id: params.id },
    select: {
      theoryType: true,
      standardOutput: true,
      // existing one-to-ones
      hermeneutic: { select: { id: true, facts: true, plausibility: true, selectedIds: true } },
      practicalJustification: { select: { id: true, result: true } },
      pascal: { select: { id: true, decision: true, propositions: true } },
      // new theses-slot records
      WorkDNStructure: { select: { explanandum: true, nomological: true, ceterisParibus: true } },
      WorkIHTheses:    { select: { structure: true, function: true, objectivity: true } },
      WorkTCTheses:    { select: { instrumentFunction: true, explanation: true, applications: true } },
      WorkOPTheses:    { select: { unrecognizability: true, alternatives: true } },
    },
  });

  if (!w) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const type = w.theoryType as 'DN'|'IH'|'TC'|'OP';
  const hasStd    = !!w.standardOutput;
  const hasHerm   = !!w.hermeneutic;
  const hasPrac   = !!w.practicalJustification && !!w.practicalJustification.result && Object.keys(w.practicalJustification.result as any).length > 0;
  const hasPascal = !!w.pascal && !!w.pascal.decision && Object.keys(w.pascal.decision as any).length > 0;

  const hasDN = !!w.WorkDNStructure && (!!w.WorkDNStructure.explanandum || !!w.WorkDNStructure.nomological);
  const hasIH = !!w.WorkIHTheses && (!!w.WorkIHTheses.structure || !!w.WorkIHTheses.function || !!w.WorkIHTheses.objectivity);
  const hasTC = !!w.WorkTCTheses && (!!w.WorkTCTheses.instrumentFunction || !!w.WorkTCTheses.explanation || (w.WorkTCTheses.applications ?? []).length > 0);
  const hasOP = !!w.WorkOPTheses && (!!w.WorkOPTheses.unrecognizability || (w.WorkOPTheses.alternatives ?? []).length > 0);

  const checklist: ChecklistItem[] = [];

  const add = (key: string, label: string, ok: boolean, details?: string) => {
    checklist.push({ key, label, ok, details });
  };

  // Assemble a compact, type-appropriate checklist
  if (type === 'DN') {
    add('TDN-Structure',    'Explanandum / nomological laws present', hasDN);
    add('TDN-Optionality',  'Ceteris paribus / notes provided (optional)', !!w.WorkDNStructure?.ceterisParibus);
  }

  if (type === 'IH') {
    add('TIH-Structure',    'Structure present', !!w.WorkIHTheses?.structure);
    add('TIH-Function',     'Function present', !!w.WorkIHTheses?.function);
    add('TIH-Objectivity',  'Objectivity justification', !!w.WorkIHTheses?.objectivity);
    add('TIH-StdOutput',    'Standard output provided', hasStd);
    add('IH-Hermeneutic',   'Hermeneutic material saved', hasHerm);
    add('IH-Practical',     'Practical justification (MCDA) saved', hasPrac);
  }

  if (type === 'TC') {
    add('TTC-StdOutput',    'Standard output provided', hasStd);
    add('TTC-Function',     'Instrument function provided', !!w.WorkTCTheses?.instrumentFunction);
    add('TTC-Explanation',  'Explanation of functioning', !!w.WorkTCTheses?.explanation);
    add('TTC-Applications', 'Applications listed', (w.WorkTCTheses?.applications ?? []).length > 0);
    add('TTC-Practical',    'Practical justification (MCDA) saved', hasPrac);
  }

  if (type === 'OP') {
    add('TOP-Unrecog',      'Unrecognizability argument', !!w.WorkOPTheses?.unrecognizability);
    add('TOP-Alternatives', 'Suitable alternatives listed', (w.WorkOPTheses?.alternatives ?? []).length > 1);
    add('TOP-Decision',     'Pascal decision saved', hasPascal);
  }

  const completion = checklist.length ? checklist.filter(i => i.ok).length / checklist.length : 0;

  const payload: IntegrityPayload = {
    ok: true,
    type,
    completion,
    checklist,
    has: {
      std: hasStd, herm: hasHerm, prac: hasPrac, pascal: hasPascal,
      dn: hasDN, ih: hasIH, tc: hasTC, op: hasOP,
    },
  };

  return NextResponse.json(payload);
}

