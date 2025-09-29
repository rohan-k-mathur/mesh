import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';

const Body = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  // Either reference to existing argument/claim (bridge) or full diagram seed
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
      kind: z.enum(['deductive','inductive','abductive','defeasible','analogy']),
      premises: z.array(z.string()),
      conclusionRef: z.string(),  // reference to statements[i].id/text
      schemeKey: z.string().optional(),
      cqKeys: z.array(z.string()).optional()
    })).optional()
  }).optional()
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const sheetId = params.id;
  const body = Body.parse(await req.json());

  let diagramId: string | null = null;
  if (body.diagram) {
    const diag = await prisma.argumentDiagram.create({
      data: {
        title: body.diagram.title ?? body.title ?? null,
        createdById: 'system',
        statements: {
          create: body.diagram.statements.map(s => ({
            text: s.text,
            role: s.role,
            tags: []
          }))
        }
      },
      select: { id: true, statements: { select: { id: true, text: true } } }
    });

    diagramId = diag.id;
    if (body.diagram.inferences?.length) {
      // Build mapping from provided text -> actual ids
      const textToId = new Map(diag.statements.map(s => [s.text, s.id]));
      for (const inf of body.diagram.inferences) {
        const conclusionId = textToId.get(inf.conclusionRef) ?? null;
        if (!conclusionId) continue;
        const newInf = await prisma.inference.create({
          data: {
            diagramId,
            kind: inf.kind,
            conclusionId,
            schemeKey: inf.schemeKey ?? null,
            cqKeys: inf.cqKeys ?? []
          }
        });
        // premises join
        for (const pText of inf.premises) {
          const stId = textToId.get(pText);
          if (stId) {
            await prisma.inferencePremise.create({ data: { inferenceId: newInf.id, statementId: stId } });
          }
        }
      }
    }
  }

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

  return NextResponse.json({ ok: true, node });
}
