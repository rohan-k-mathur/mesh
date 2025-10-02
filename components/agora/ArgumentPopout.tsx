'use client';
import useSWR from 'swr';
import DiagramView from '../map/DiagramView';
import type { Diagram } from '../map/DiagramView';
import { SectionCard } from '../deepdive/DeepDivePanel';
type LocalDiagram = {
  id: string;
  title?: string | null;
  statements: { id: string; text: string; kind: string; role?: string | null }[];
  inferences: {
    id: string;
    kind?: string | null;
    conclusion?: { id: string; text?: string | null } | null;
    premises?: { statement?: { id: string; text?: string | null } | null }[];
  }[];
};

export default function ArgumentPopout({
  node,
  onClose,
}: {
  node: any;
  onClose: () => void;
}) {
  const key = node?.diagramId
    ? `/api/arguments/${node.diagramId}?view=diagram`
    : null;

  const { data, error } = useSWR(key, (r) => fetch(r).then((x) => x.json()));

  if (!node?.diagramId) return null;

  if (error)
    return (
      <div className="rounded border p-2 text-xs text-red-700">
        Failed to load diagram.
      </div>
    );

  if (!data?.diagram)
    return (
      <div className="rounded border p-2 text-xs">Loading diagram…</div>
    );
  //const d: LocalDiagram = { ...data.diagram };
  const d: LocalDiagram = data.diagram;

  // Precompute statement membership
  const conclIds = new Set(
    (d.inferences ?? [])
      .map((inf) => inf.conclusion?.id)
      .filter(Boolean) as string[]
  );
  const premiseIds = new Set(
    (d.inferences ?? []).flatMap(
      (inf) =>
        (inf.premises ?? [])
          .map((p) => p.statement?.id)
          .filter(Boolean) as string[]
    )
  );

  const letterFor = (s: { id: string; role?: string | null }) =>
    s.role?.[0]?.toUpperCase() ??
    (conclIds.has(s.id) ? 'C' : premiseIds.has(s.id) ? 'P' : 'S');

  return (
    <div className='flex gap-5'>
    <div className=" relative border border-indigo-200 rounded-xl border p-3 bg-indigo-50/30 backdrop-blur-md z-10 shadow-lg w-full max-w-[420px]">
      
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{node.title ?? d.title ?? 'Argument'}</h3>
        <button className="text-xs underline" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-medium mb-1">Statements</div>
          <ul className="text-xs space-y-1">
            {(d.statements ?? []).map((s) => (
              <li key={s.id}>
                <span className="text-neutral-500 mr-1">[{letterFor(s)}]</span>
                {s?.text ?? '(untitled)'}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs font-medium mb-1">Inferences</div>
          <ul className="text-xs space-y-1">
            {(d.inferences ?? []).map((inf) => (
              <li key={inf.id}>
                {inf.kind ?? '→'} → {inf.conclusion?.text ?? '(no conclusion)'}
                {inf.premises?.length ? (
                  <span className="text-neutral-500">
                    {' '}
                    (from{' '}
                    {(inf.premises ?? [])
                      .map((p) => p?.statement?.text ?? '(?)')
                      .join(', ')}
                    )
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    
    </div>
      <div className="flex gap-8 border-l border-neutral-200 pl-4">
        {d ? (
                <div className=" relative border border-indigo-200 rounded-xl border p-3 bg-indigo-50/30 backdrop-blur-md z-10 shadow-lg w-full max-w-[420px]">

               <DiagramView diagram={d as Diagram} />
        </div>
        ) : (
          <div className="text-xs text-neutral-500">Select a claim (minimap) to load its top argument.</div>
        )}
      </div>
      </div>
  );
}
