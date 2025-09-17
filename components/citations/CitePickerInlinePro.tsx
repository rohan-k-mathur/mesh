"use client";

import * as React from "react";
import LibrarySearchModal from "@/components/citations/LibrarySearchModal";

/** Resolve/create a Source row */
async function resolveSource(payload: any) {
  const r = await fetch("/api/citations/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await r.json();
  if (!r.ok || j.error || !j.source?.id) throw new Error(j.error || "Resolve failed");
  return j.source as { id: string };
}

/** Attach a Source to a target (comment/claim/argument/card/move) */
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

type Props = {
  targetType: "comment" | "claim" | "argument" | "card" | "move";
  targetId: string;
  onDone?: () => void;

  /** Optional prefill (e.g., from PDF selection overlay) */
  initialUrl?: string;
  initialDOI?: string;
  initialLocator?: string;
  initialQuote?: string;
  initialNote?: string;
};

export default function CitePickerInlinePro({
  targetType,
  targetId,
  onDone,
  initialUrl,
  initialDOI,
  initialLocator,
  initialQuote,
  initialNote,
}: Props) {
  const [tab, setTab] = React.useState<"url" | "doi" | "library">(
    initialDOI ? "doi" : initialUrl ? "url" : "library"
  );

  // URL tab
  const [url, setUrl] = React.useState(initialUrl ?? "");
  // DOI tab
  const [doi, setDoi] = React.useState(initialDOI ?? "");
  // Library tab
  const [libraryId, setLibraryId] = React.useState(""); // LibraryPost.id (set by modal)
  const [libraryTitle, setLibraryTitle] = React.useState<string | undefined>(undefined);

  // Common fields
  const [locator, setLocator] = React.useState(initialLocator ?? "");
  const [quote, setQuote] = React.useState(initialQuote ?? "");
  const [note, setNote] = React.useState(initialNote ?? "");

  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [libOpen, setLibOpen] = React.useState(false);

  async function doAttach() {
    setBusy(true);
    setErr(null);
    try {
      let sourceId: string | null = null;

      if (tab === "url") {
        const v = url.trim();
        if (!v) throw new Error("Add a URL");
        const s = await resolveSource({ url: v });
        sourceId = s.id;
      } else if (tab === "doi") {
        const v = doi.trim();
        if (!v) throw new Error("Add a DOI");
        const s = await resolveSource({ doi: v });
        sourceId = s.id;
      } else {
        const id = libraryId.trim();
        if (!id) throw new Error("Pick a library item");
        const s = await resolveSource({ libraryPostId: id, meta: { title: libraryTitle } });
        sourceId = s.id;
      }

      await attachCitation({
        targetType,
        targetId,
        sourceId,
        locator: locator || undefined,
        quote: quote || undefined,
        note: note || undefined,
      });

      // fan-out to live listeners (optional; SSE also covers this when your route emits)
      try {
        window.dispatchEvent(new CustomEvent("citations:changed", { detail: { targetType, targetId } }));
      } catch {}

      onDone?.();
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border rounded p-2 bg-white/90 w-full max-w-[680px]">
      {/* Tabs */}
      <div className="flex gap-2 mb-2">
        {(["url", "doi", "library"] as const).map((t) => (
          <button
            key={t}
            className={`text-[11px] px-2 py-1 rounded border ${tab === t ? "bg-slate-100" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab bodies */}
      {tab === "url" && (
        <div className="mb-2 flex items-center gap-2">
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {!!url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] underline text-slate-600"
              title="Open link"
            >
              Open
            </a>
          )}
        </div>
      )}

      {tab === "doi" && (
        <div className="mb-2 flex items-center gap-2">
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="10.xxxx/xxxxxxx"
            value={doi}
            onChange={(e) => setDoi(e.target.value)}
          />
          {!!doi && (
            <a
              href={`https://doi.org/${doi}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] underline text-slate-600"
              title="Open DOI"
            >
              Open
            </a>
          )}
        </div>
      )}

      {tab === "library" && (
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder="LibraryPost ID (or browse)"
              value={libraryId}
              onChange={(e) => setLibraryId(e.target.value)}
            />
            <LibrarySearchModal
              open={libOpen}
              onOpenChange={setLibOpen}
              onPick={(id) => {
                setLibraryId(id);
                // Optional: store title for better Source
                setLibraryTitle(undefined); // you can return title from modal via onPick signature if you like
              }}
              trigger={
                <button
                  type="button"
                  className="px-2 py-1 text-[11px] rounded border bg-white/80"
                  onClick={() => setLibOpen(true)}
                >
                  Browse…
                </button>
              }
            />
          </div>
          {!!libraryId && (
            <div className="mt-1 text-[11px] text-slate-600">Selected: {libraryId}</div>
          )}
        </div>
      )}

      {/* Common fields */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Locator (p. 13, 08:14, fig. 2)"
          value={locator}
          onChange={(e) => setLocator(e.target.value)}
        />
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Note (optional)"
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

      {/* Actions */}
      <div className="mt-2 flex items-center gap-2">
        <button
          className="text-xs px-2 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
          onClick={doAttach}
          disabled={busy}
          title="Attach citation to the current target"
        >
          {busy ? "Attaching…" : "Attach citation"}
        </button>
        {err && <div className="text-[11px] text-rose-600">{err}</div>}
      </div>
    </div>
  );
}
