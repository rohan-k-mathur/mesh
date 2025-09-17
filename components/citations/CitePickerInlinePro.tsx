// components/citations/CitePickerInlinePro.tsx
"use client";

import * as React from "react";

type Props = {
  targetType: "comment" | "claim" | "argument" | "card";
  targetId: string;
  onDone?: () => void;
};

async function resolveSource(payload: any) {
  const r = await fetch("/api/citations/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || "Resolve failed");
  return j.source;
}

async function attachCitation(args: {
  targetType: string;
  targetId: string;
  sourceId: string;
  locator?: string;
  quote?: string;
  note?: string;
  relevance?: number;
}) {
  const r = await fetch("/api/citations/attach", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || "Attach failed");
  return j.citation;
}

export default function CitePickerInlinePro({ targetType, targetId, onDone }: Props) {
  const [tab, setTab] = React.useState<"url" | "doi" | "library">("url");
  const [url, setUrl] = React.useState("");
  const [doi, setDoi] = React.useState("");
  const [libraryId, setLibraryId] = React.useState(""); // LibraryPost.id
  const [locator, setLocator] = React.useState("");
  const [quote, setQuote] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function doAttach() {
    setBusy(true);
    setErr(null);
    try {
      let source: any;
      if (tab === "url") {
        if (!url.trim()) throw new Error("Add a URL");
        source = await resolveSource({ url });
      } else if (tab === "doi") {
        if (!doi.trim()) throw new Error("Add a DOI");
        source = await resolveSource({ doi });
      } else {
        if (!libraryId.trim()) throw new Error("Pick a library item");
        source = await resolveSource({ libraryPostId: libraryId });
      }

      await attachCitation({
        targetType,
        targetId,
        sourceId: source.id,
        locator: locator || undefined,
        quote: quote || undefined,
        note: note || undefined,
      });
      onDone?.();
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border rounded p-2 bg-white/90 w-full max-w-[620px]">
      {/* Tabs */}
      <div className="flex gap-2 mb-2">
        {(["url", "doi", "library"] as const).map((t) => (
          <button
            key={t}
            className={`text-xs px-2 py-1 rounded border ${tab === t ? "bg-slate-100" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Body */}
      {tab === "url" && (
        <input
          className="w-full border rounded px-2 py-1 text-sm mb-2"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      )}
      {tab === "doi" && (
        <input
          className="w-full border rounded px-2 py-1 text-sm mb-2"
          placeholder="10.xxxx/xxxxxxx"
          value={doi}
          onChange={(e) => setDoi(e.target.value)}
        />
      )}
      {tab === "library" && (
        <div className="flex items-center gap-2 mb-2">
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="LibraryPost ID (wire a search in your UI)"
            value={libraryId}
            onChange={(e) => setLibraryId(e.target.value)}
          />
          {/* You can swap this for a tiny modal listing Library items */}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Locator (p. 13, 08:14, fig. 2)"
          value={locator}
          onChange={(e) => setLocator(e.target.value)}
        />
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Short note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <textarea
        className="w-full border rounded px-2 py-1 text-sm"
        rows={2}
        placeholder="Quote (optional, <280 chars)"
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
      />

      <div className="mt-2 flex items-center gap-2">
        <button
          className="text-xs px-2 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
          onClick={doAttach}
          disabled={busy}
        >
          {busy ? "Attaching…" : "Attach citation"}
        </button>
        {err && <div className="text-[11px] text-rose-600">{err}</div>}
      </div>
    </div>
  );
}
