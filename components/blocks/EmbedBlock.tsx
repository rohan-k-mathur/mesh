"use client";
import useSWR from "swr";
import { registry } from "@/lib/portfolio/registry";

export default function EmbedBlock({ id }: { id: string }) {
  const { data, error } = useSWR(`/api/blocks/${id}`, (u) => fetch(u).then(r => r.json()));
  if (error) return <div className="text-xs text-red-600">Failed to load block.</div>;
  if (!data) return <div className="text-xs text-slate-400">Loading…</div>;

  const def = registry[data.component as keyof typeof registry];
  if (!def) return <div className="text-xs">Unknown component: {data.component}</div>;
  const Comp = def.component as any;

  return (
    <div data-block-id={id}>
      <Comp {...def.defaultProps} {...data.props} />
    </div>
  );
}
