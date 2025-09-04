// components/work/WorkHeaderBar.tsx
'use client';
import * as React from 'react';
import SupplyDrawer from './SupplyDrawer';
import { IntegrityBadge } from '../integrity/IntegrityBadge';

export default function WorkHeaderBar({
  workId,
  title,
  theoryType,
  deliberationId
}: { workId:string; title:string; theoryType:'DN'|'IH'|'TC'|'OP'; deliberationId:string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex items-center justify-between border-b pb-2 mb-3">
      <div className="flex items-center gap-2">
        <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-xs">{theoryType}</span>
        <h2 className="text-sm font-semibold">{title}</h2>
        <IntegrityBadge workId={workId} theoryType={theoryType} />
      </div>
      <div className="flex items-center gap-2">
        <button className="px-2 py-1 border rounded text-xs bg-white" onClick={()=>setOpen(true)}>
          Dependencies…
        </button>
      </div>
      <SupplyDrawer workId={workId} open={open} onClose={()=>setOpen(false)} />
    </div>
  );
}
