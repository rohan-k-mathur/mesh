//components/agora/ArgumentPopout.tsx
'use client';
import useSWR from 'swr';
import DiagramView from '../map/DiagramView';
import type { Diagram } from '../map/DiagramView';
import { SectionCard } from '../deepdive/DeepDivePanel';
import UndercutPill from "./UndercutPill";
import type { SheetStatement, SheetInference } from '@/lib/agora/types/types';

type LocalDiagram = {
  id: string;
  title?: string | null;
  statements: SheetStatement[];
  inferences: SheetInference[];

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
  : node?.argumentId
    ? `/api/arguments/${node.argumentId}?view=diagram`
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
  const byId = new Map(d.statements.map(s => [s.id, s]));


  if (!data?.diagram) return <div className="rounded border p-2 text-xs">Loading diagram…</div>;
const raw: LocalDiagram = data.diagram;

// 1) map role→kind (DiagramView expects `kind`)
const stmts = (raw.statements ?? []).map(s => ({
  id: s.id,
  text: s.text,
  // if API gives 'role' (premise|conclusion|...), map to DiagramView kinds
  kind: (s as any).kind ?? (s.role === "claim" ? "claim" : "premise"),
}));

// 2) produce conclusionId + premiseIds arrays
const infs = (raw.inferences ?? []).map(inf => ({
  id: inf.id,
  conclusionId: inf.conclusion?.id ?? '',        // if empty, DiagramView will just hide the conclusion box
  premiseIds: (inf.premises ?? [])
    .map(p => p?.statement?.id)
    .filter(Boolean) as string[],
  scheme: inf.kind ?? undefined,
}));


 // In the UI list:

// 3) normalize optional evidence if your API returns it
const evidence = Array.isArray((raw as any).evidence)
  ? (raw as any).evidence.map((e:any) => ({ id: e.id, uri: e.uri ?? e.url, note: e.note ?? null }))
  : [];

const normalized: Diagram = {
  id: raw.id,
  title: raw.title ?? node.title ?? 'Argument',
  statements: stmts as any,
  inferences: infs as any,
  evidence,
};


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
              {(d.inferences ?? []).map((inf) => {
     const concl = byId.get(inf.conclusion?.id ?? "")?.text ?? "(no conclusion)";
     const premiseTexts = (inf.premises ?? []).map(p => byId.get(p.statement?.id)?.text ?? "(?)");
     return (
       <li key={inf.id}>
         {inf.kind ?? "→"} → {concl}
         {!!premiseTexts.length && (
           <span className="text-neutral-500"> (from {premiseTexts.join(", ")})</span>
         )}
         <div className='flex flex-col my-2 w-fit gap-2'>
           <UndercutPill toArgumentId={node.diagramId!} targetInferenceId={inf.id} deliberationId={node.deliberationId} />

         </div>
       </li>
     );
  })}

          </ul>
        </div>
      </div>
    
    </div>
      <div className="flex gap-8 border-l border-neutral-200 pl-4 w-full">
        {d ? (
          <div className="flex gap-8 w-full">
                {/* <div className=" relative border border-indigo-200 rounded-xl border p-3 bg-indigo-50/30 backdrop-blur-md z-10 shadow-lg w-full max-w-[420px]">

               <DiagramView diagram={d as Diagram} />
               
        </div> */}
                    <div className=" relative border border-indigo-200 rounded-xl border p-3 bg-indigo-50/30 backdrop-blur-md z-10 shadow-lg w-full max-w-[420px]">

<DiagramView diagram={normalized} />
               
        </div>
        </div>
        ) : (
          <div className="text-xs text-neutral-500">Select a claim (minimap) to load its top argument.</div>
        )}
      </div>
      </div>
  );
}
