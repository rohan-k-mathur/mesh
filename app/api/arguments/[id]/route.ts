// app/api/arguments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { buildDiagramForArgument, Diagram } from '@/lib/arguments/diagram';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

const UpdateSchema = z.object({
  quantifier: z.enum(['SOME','MANY','MOST','ALL']).nullable().optional(),
  modality:   z.enum(['COULD','LIKELY','NECESSARY']).nullable().optional(),
});

const selectArg = {
  id: true, deliberationId: true, claimId: true,
  text: true, sources: true, confidence: true, isImplicit: true,
  quantifier: true, modality: true, mediaType: true, mediaUrl: true,
  createdAt: true,
} as const;

// Optional: normalize DB "role" → view "kind"
const roleToKind = (role?: string | null): Diagram['statements'][number]['kind'] => {
  switch ((role ?? '').toLowerCase()) {
    case 'claim':
    case 'conclusion': return 'claim';
    case 'premise':    return 'premise';
    case 'warrant':    return 'warrant';
    case 'backing':    return 'backing';
    case 'rebuttal':   return 'rebuttal';
    default:           return 'claim';
  }
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(String(params.id || '')).trim();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const u = new URL(req.url);
  const view = (u.searchParams.get('view') || '').toLowerCase();

  if (view === 'diagram') {
    // 1) Try a persisted ArgumentDiagram by its own id
    const pd = await prisma.argumentDiagram.findUnique({
      where: { id },
      select: {
        id: true, title: true,
        statements: { select: { id: true, text: true, role: true } },
        inferences: {
          select: {
            id: true, kind: true, conclusionId: true,
            premises: { select: { statement: { select: { id: true, text: true } } } },
            schemeKey: true,
          },
        },
        evidence: { select: { id: true, uri: true, note: true } },
      },
    });

    if (pd) {
      const stmts = pd.statements.map(s => ({ id: s.id, text: s.text, kind: roleToKind(s.role) }));
      const byId = new Map(stmts.map(s => [s.id, s]));
      const infs = pd.inferences.map((inf) => {
        const conclStmt = byId.get(inf.conclusionId) ?? { id: inf.conclusionId, text: '(conclusion)', kind: 'statement' as const };
        return {
          id: inf.id,
          kind: inf.kind ?? 'defeasible',
          conclusion: { id: conclStmt.id, text: conclStmt.text },
          premises: (inf.premises ?? []).map(p => ({ statement: { id: p.statement.id, text: p.statement.text } })),
          scheme: inf.schemeKey ?? null,
        };
      });

      const diagram: Diagram = {
        id: pd.id,
        title: pd.title ?? null,
        statements: stmts,
        inferences: infs.map(inf => ({
          id: inf.id,
          conclusionId: inf.conclusion.id,
          premiseIds: inf.premises.map(p => p.statement.id),
          scheme: inf.scheme,
        })),
        evidence: pd.evidence,
      };
      return NextResponse.json({ ok: true, diagram }, NO_STORE);
    }

    // 2) Fallback: treat :id as Argument.id and synthesize with the same rich shape
    const computed = await buildDiagramForArgument(id);
    if (!computed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, diagram: computed }, NO_STORE);
  }

  // Default: return the argument row
  const arg = await prisma.argument.findUnique({ where: { id }, select: selectArg });
  if (arg) return NextResponse.json({ argument: arg }, NO_STORE);

  const alt = await prisma.argument.findFirst({
    where: { claimId: id },
    orderBy: { createdAt: 'desc' },
    select: selectArg,
  });
  if (alt) return NextResponse.json({ argument: alt, via: 'claimId' }, NO_STORE);

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(String(params.id || '')).trim();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Author-only policy; remove if you decide to allow broader updates.
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Support either `authorId` or `createdById` depending on your schema
  const owner = (await prisma.argument.findUnique({
    where: { id },
    // Cast to any to avoid TS errors if one of these fields doesn't exist in your generated client
    select: { authorId: true, createdById: true } as any,
  })) as { authorId?: string | null; createdById?: string | null } | null;

  if (!owner) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ownerId = owner.authorId ?? owner.createdById;
  if (!ownerId || String(ownerId) !== String(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, any> = {};
  if ('quantifier' in parsed.data) data.quantifier = parsed.data.quantifier ?? null;
  if ('modality' in parsed.data) data.modality = parsed.data.modality ?? null;

  if (!Object.keys(data).length) {
    return NextResponse.json({ ok: true, noop: true }, NO_STORE);
  }

  try {
    const updated = await prisma.argument.update({
      where: { id },
      data,
      select: selectArg,
    });
    return NextResponse.json({ ok: true, argument: updated }, NO_STORE);
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw e;
  }
}
