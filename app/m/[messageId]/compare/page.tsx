import { prisma } from "@/lib/prismaclient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function snippet(text?: string | null, n = 140) {
  if (!text) return "";
  const s = text.replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// very defensive extraction from a facet-style content object/array
function facetTextPreview(content: any): string {
  try {
    const blocks = Array.isArray(content) ? content : content?.blocks ?? [];
    const textish =
      blocks.find((b: any) => /title|heading/i.test(b?.type))?.text ||
      blocks.find((b: any) => /text|paragraph/i.test(b?.type))?.text ||
      blocks.find((b: any) => b?.text)?.text ||
      "";
    const s = String(textish || "").replace(/\s+/g, " ").trim();
    return s.length > 140 ? s.slice(0, 139) + "…" : s;
  } catch {
    return "";
  }
}

export async function generateMetadata({ params, searchParams }: any) {
  const id = BigInt(params.messageId);
  const v = Number(searchParams?.v || 0);

  // only select fields known to exist on Message
  const msg = await prisma.message.findUnique({
    where: { id },
    select: { id: true, text: true },
  });
  if (!msg) return {};

  // receipts to figure out vN
  const receipts = await prisma.mergeReceipt.findMany({
    where: { message_id: id },
    orderBy: { merged_at: "asc" },
    select: { version_hash: true },
  });
  const idx = receipts.length
    ? v > 0
      ? Math.min(v, receipts.length) - 1
      : receipts.length - 1
    : -1;

  // try to build a facet preview; swallow any schema diffs
  let facetPreview = "";
  try {
    const fac = await (prisma as any).sheafFacet?.findFirst?.({
      where: { message_id: id },
      select: { content: true },
    });
    if (fac?.content) facetPreview = facetTextPreview(fac.content);
  } catch {}

  const title =
    idx >= 0
      ? `Merged v${idx + 1} • message ${String(msg.id)}`
      : `Compare • message ${String(msg.id)}`;

  const desc = msg.text ? snippet(msg.text) : facetPreview || `Merged version ${idx + 1 || "—"}`;

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
  const v = Number(searchParams?.v || 0);

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, text: true },
  });
  if (!message) notFound();

  const receipts = await prisma.mergeReceipt.findMany({
    where: { message_id: messageId },
    orderBy: { merged_at: "asc" },
  });
  const idx = receipts.length
    ? v > 0
      ? Math.min(v, receipts.length) - 1
      : receipts.length - 1
    : -1;
  const receipt = idx >= 0 ? receipts[idx] : null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">
        Compare (message {String(message.id)})
      </h1>
      {receipt ? (
        <>
          <div className="text-sm text-slate-600">
            v{idx + 1} • versionHash {receipt.version_hash}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded border p-4">
              <div className="font-medium mb-2">Receipt</div>
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    v: idx + 1,
                    versionHash: receipt.version_hash,
                    mergedAt: receipt.merged_at,
                    mergedBy: String(receipt.merged_by),
                    signature: receipt.signature,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
            <div className="rounded border p-4">
              <div className="font-medium mb-2">Current content</div>
              {message.text ? (
                <div className="prose">{message.text}</div>
              ) : (
                <div>(structured content)</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-sm text-slate-600">
          No merges yet for this message.
        </div>
      )}
    </div>
  );
}
