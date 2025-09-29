'use client';
import useSWR from 'swr';

export default function ArgumentPopout({ node, onClose }:{ node:any, onClose:()=>void }) {
  const { data } = useSWR(node?.diagramId ? `/api/arguments/${node.diagramId}?view=diagram` : null, r => fetch(r).then(x=>x.json()));
  if (!node?.diagramId) return null;
  if (!data?.diagram) return <div className="rounded border p-2 text-xs">Loading diagram…</div>;
  const d = data.diagram;

  return (
    <div className="rounded-lg border p-3 bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{node.title ?? d.title ?? 'Argument'}</h3>
        <button className="text-xs underline" onClick={onClose}>Collapse</button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-medium mb-1">Statements</div>
          <ul className="text-xs space-y-1">
            {d.statements.map((s:any)=>(
              <li key={s.id}><span className="text-neutral-500 mr-1">[{s.role.slice(0,1).toUpperCase()}]</span>{s.text}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-medium mb-1">Inferences</div>
          <ul className="text-xs space-y-1">
            {d.inferences.map((inf:any)=>(
              <li key={inf.id}>
                {inf.kind} → {inf.conclusion?.text}
                {inf.premises?.length ? (
                  <span className="text-neutral-500"> (from {inf.premises.map((p:any)=>p.statement.text).join(', ')})</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
