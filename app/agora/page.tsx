import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AgoraPage() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const res = await fetch(`${base}/api/hub/deliberations`, { cache: "no-store" });
  const { items = [] } = await res.json().catch(() => ({ items: [] }));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Agora</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((r: any) => (
          <Link key={r.id} href={`/deliberation/${r.id}`} className="block border rounded p-4 bg-white hover:bg-slate-50">
            <div className="text-sm text-slate-600">{r.host?.type} · {r.host?.id}</div>
            <div className="mt-2 text-xs">Claims: <b>{r.stats.claims}</b> · Open CQs: <b>{r.stats.openCQs}</b></div>
            <div className="mt-1 text-xs text-slate-500">Updated {new Date(r.updatedAt).toLocaleString()}</div>
          </Link>
        ))}
        {!items.length && <div className="text-sm text-slate-600">Nothing yet.</div>}
      </div>
    </div>
  );
}
