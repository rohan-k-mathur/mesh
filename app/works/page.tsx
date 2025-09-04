// app/works/page.tsx
import { prisma } from '@/lib/prismaclient';

export default async function WorksIndexPage({ searchParams }:{ searchParams?: Record<string,string|undefined> }) {
  const deliberationId = searchParams?.deliberationId || undefined;

  const works = await prisma.theoryWork.findMany({
    where: { ...(deliberationId ? { deliberationId } : {}) },
    select: { id:true, title:true, theoryType:true, createdAt:true, deliberationId:true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="text-sm font-medium mb-2">Theory Works {deliberationId ? `(Delib ${deliberationId})` : ''}</div>
      <div className="space-y-2">
        {works.map(w => (
          <a key={w.id} className="block p-2 border rounded hover:bg-neutral-50" href={`/works/${w.id}`}>
            <div className="flex items-center justify-between">
              <div className="font-medium">{w.title}</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100">{w.theoryType}</span>
            </div>
            <div className="text-[11px] text-neutral-500">Created {new Date(w.createdAt).toLocaleString()}</div>
          </a>
        ))}
        {!works.length && <div className="text-xs text-neutral-500">No works found.</div>}
      </div>
    </div>
  );
}
