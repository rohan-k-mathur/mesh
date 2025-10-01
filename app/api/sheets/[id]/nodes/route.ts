import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, $Enums } from '@prisma/client';

const Body = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  // Either bridge to existing items or seed a fresh diagram
  argumentId: z.string().optional(),
  claimId: z.string().optional(),
  diagram: z.object({
    title: z.string().optional(),
    statements: z.array(z.object({
      id: z.string().optional(),
      text: z.string().min(1),
      role: z.enum(['premise','intermediate','conclusion','assumption','question'])
    })),
    inferences: z.array(z.object({
      // accept a friendly superset; we’ll map to Prisma
      kind: z.enum(['deductive','inductive','abductive','analogical','analogy','defeasible','causal','statistical']),
      premises: z.array(z.string()),
      conclusionRef: z.string(),
      schemeKey: z.string().optional(),
      cqKeys: z.array(z.string()).optional()
    })).optional()
  }).optional()
});

const toStatementRole = (r: 'premise'|'intermediate'|'conclusion'|'assumption'|'question'): $Enums.StatementRole => {
  // Map authoring roles to your Prisma enum; adjust here if your enum differs.
  if (r === 'conclusion')  return 'claim';
  if (r === 'premise')     return 'premise';
  if (r === 'intermediate')return 'premise';   // treat as derived premise
  if (r === 'assumption')  return 'premise';   // assumptions can also be modeled via AssumptionUse
  // 'question' → a harmless bucket
  return 'context';
};

const toInferenceKind = (
  k: 'deductive'|'inductive'|'abductive'|'analogical'|'analogy'|'defeasible'|'causal'|'statistical'
): $Enums.InferenceKind => {
  if (k === 'analogy') return 'analogical';
  return k as $Enums.InferenceKind;
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const sheetId = params.id;
  const body = Body.parse(await req.json());

  const exists = await prisma.debateSheet.findUnique({
    where: { id: sheetId },
    select: { id: true }
  });
  if (!exists) return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });

  let diagramId: string | null = null;

  if (body.diagram) {
    // 1) Create diagram + statements
    const diag = await prisma.argumentDiagram.create({
      data: {
        title: body.diagram.title ?? body.title ?? null,
        createdById: 'system',
        statements: {
          create: body.diagram.statements.map((s) => ({
            text: s.text,
            role: toStatementRole(s.role),
            tags: []
          }))
        }
      },
      select: { id: true, statements: { select: { id: true, text: true } } }
    });

    diagramId = diag.id;

    // 2) Create inferences (if any)
    if (body.diagram.inferences?.length) {
      const textToId = new Map(diag.statements.map((s) => [s.text, s.id]));

      for (const inf of body.diagram.inferences) {
        const conclusionId = textToId.get(inf.conclusionRef) ?? null;
        if (!conclusionId) continue;

        const newInf = await prisma.inference.create({
          data: {
            diagramId,
            kind: toInferenceKind(inf.kind),
            conclusionId,
            schemeKey: inf.schemeKey ?? null,
            cqKeys: inf.cqKeys ?? []
          },
          select: { id: true }
        });

        // premises join rows
        for (const pText of inf.premises) {
          const stId = textToId.get(pText);
          if (stId) {
            await prisma.inferencePremise.create({
              data: { inferenceId: newInf.id, statementId: stId }
            });
          }
        }
      }
    }
  }

  // 3) Create the DebateNode (bridges optional)
  const node = await prisma.debateNode.create({
    data: {
      sheetId,
      title: body.title ?? null,
      summary: body.summary ?? null,
      diagramId,
      argumentId: body.argumentId ?? null,
      claimId: body.claimId ?? null
    },
    select: { id: true }
  });

  return NextResponse.json({ ok: true, node }, { headers: { 'Cache-Control': 'no-store' } });
}
