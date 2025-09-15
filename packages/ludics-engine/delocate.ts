// packages/ludics-engine/delocate.ts
import { prisma } from '@/lib/prismaclient';

type Id = string;

export type Design = { id?: string; base: string; actions: any[]; meta?: any };

export function delocate(design: Design, toLocus: string): Design {
  return {
    ...design,
    base: toLocus,
    meta: { ...(design.meta ?? {}), delocatedFrom: design.base, delocated: true }
  };
}


/** Clone a compiled design, renaming every locus under base "0" to "0.<tag>..." */
export async function cloneDesignWithShift(designId: Id, tag: string) {
  if (!tag || /[^A-Za-z0-9_-]/.test(tag)) throw new Error('Bad tag');
  const src = await prisma.ludicDesign.findUnique({
    where: { id: designId },
    include: { acts: { include: { locus: true }, orderBy: { orderInDesign: 'asc' } } },
  });
  if (!src) throw new Error('NO_SUCH_DESIGN');

  const dialogueId = src.deliberationId;

  // Build path mapping 0 -> 0.tag ; 0.1.2 -> 0.tag.1.2
  const paths = new Set<string>();
  for (const a of src.acts) if (a.locus?.path) paths.add(a.locus.path);
  paths.add('0');
  const mapPath = (p: string) =>
    p === '0' ? `0.${tag}` : p.startsWith('0.') ? `0.${tag}${p.slice(1)}` : p;

  // Ensure loci exist for all remapped paths
  const pathsArr = Array.from(paths).sort((a, b) => a.length - b.length);
  const idByPath = new Map<string, string>();
  const existing = await prisma.ludicLocus.findMany({ where: { dialogueId } });
  for (const l of existing) idByPath.set(l.path, l.id);

  for (const old of pathsArr) {
    const np = mapPath(old);
    if (!idByPath.has(np)) {
      const row = await prisma.ludicLocus.create({ data: { dialogueId, path: np } });
      idByPath.set(np, row.id);
    }
  }

  // Create the new design
  const dst = await prisma.ludicDesign.create({
    data: {
      deliberationId: dialogueId,
      participantId: src.participantId,
      rootLocusId: idByPath.get(mapPath('0'))!,
      meta: { shiftedFrom: src.id, tag },
    },
  });

  // Copy acts with locus remapped
  let order = 0;
  for (const a of src.acts) {
    await prisma.ludicAct.create({
      data: {
        designId: dst.id,
        kind: a.kind,
        polarity: a.polarity,
        expression: a.expression,
        isAdditive: a.isAdditive ?? undefined,
        ramification: Array.isArray(a.ramification) ? a.ramification : [],   // ← add this

        orderInDesign: order++,
        locusId: a.locusId ? idByPath.get(mapPath(a.locus!.path))! : null,
        metaJson: a.metaJson ?? undefined,
      },
    });
  }

  return { id: dst.id, tag, base: mapPath('0') };
}
