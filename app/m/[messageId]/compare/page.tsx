import { prisma } from "@/lib/prismaclient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function snippet(text?: string | null, n = 140) {
  if (!text) return "";
  const s = text.replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export async function generateMetadata({ params, searchParams }: any) {
  const id = BigInt(params.messageId);
  const v = Number(searchParams?.v || 0);

  const msg = await prisma.message.findUnique({
    where: { id },
    select: { id: true, text: true },
  });
  if (!msg) return {};

  // receipts for vN label
  const receipts = await prisma.mergeReceipt.findMany({
    where: { message_id: id },
    orderBy: [{ merged_at: "asc" }, { id: "asc" }],
    select: { version_hash: true },
  });
  const idx = receipts.length
    ? v > 0
      ? Math.min(v, receipts.length) - 1
      : receipts.length - 1
    : -1;

  const title =
    idx >= 0
      ? `Merged v${idx + 1} • message ${String(msg.id)}`
      : `Compare • message ${String(msg.id)}`;

  const desc = msg.text ? snippet(msg.text) : `Merged version ${idx + 1 || "—"}`;

  const base = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${base}/m/${String(msg.id)}/compare${v ? `?v=${v}` : ""}`;
  const ogImage = `${url}/opengraph-image${v ? `?v=${v}` : ""}`;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      type: "article",
      siteName: "Mesh Compare",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
    },
  };
}

export default async function ComparePage({ params, searchParams }: any) {
  const messageId = BigInt(params.messageId);
  const v = Number(searchParams?.v || "0");

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, text: true },
  });
  if (!message) notFound();

  // full history oldest → newest
  const rows = await prisma.mergeReceipt.findMany({
    where: { message_id: messageId },
    orderBy: [{ merged_at: "asc" }, { id: "asc" }],
    select: {
      version_hash: true,
      merged_at: true,
      merged_by: true,
      signature: true,
    },
  });
  // attach v numbers
  const receipts = rows.map((r, i) => ({
    v: i + 1,
    versionHash: r.version_hash,
    mergedAt: r.merged_at,
    mergedBy: r.merged_by?.toString(),
    signature: r.signature,
  }));

  const activeIndex =
    receipts.length > 0 ? (v > 0 ? Math.min(v, receipts.length) - 1 : receipts.length - 1) : -1;
  const active = activeIndex >= 0 ? receipts[activeIndex] : null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Compare (message {String(message.id)})</h1>

      {receipts.length === 0 ? (
        <div className="text-sm text-slate-600">No merges yet for this message.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* History panel */}
          <div className="md:col-span-1 rounded border bg-white/70 backdrop-blur p-3">
            <div className="font-medium mb-2">History</div>
            <div className="space-y-1 max-h-[60vh] overflow-auto">
              {[...receipts].reverse().map((r) => {
                const isActive = r.v === (active?.v ?? receipts.length);
                return (
                  <a
                    key={`v-${r.v}`}
                    href={`/m/${encodeURIComponent(String(message.id))}/compare?v=${r.v}`}
                    className={[
                      "block text-[12px] px-2 py-1 rounded",
                      isActive ? "bg-indigo-50 text-indigo-900" : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <span className="mr-2 font-medium">v{r.v}</span>
                    <span className="opacity-80">{new Date(r.mergedAt).toLocaleString()}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Receipt + Content */}
          <div className="md:col-span-2 space-y-4">
            {active && (
              <div className="rounded border p-4">
                <div className="font-medium mb-2">
                  v{active.v} • versionHash {active.versionHash}
                </div>
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(
                    {
                      v: active.v,
                      versionHash: active.versionHash,
                      mergedAt: active.mergedAt,
                      mergedBy: active.mergedBy,
                      signature: active.signature,
                    },
                    null,
                    2
                  )}
                </pre>
                <div className="mt-2 text-[12px] text-slate-600">
                  Note: we’re showing the **current** message content below; content snapshots per
                  version can be added later.
                </div>
              </div>
            )}

            <div className="rounded border p-4">
              <div className="font-medium mb-2">Current content</div>
              {message.text ? (
                <div className="prose">{message.text}</div>
              ) : (
                <div className="text-sm text-slate-600">(structured content)</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
