"use client";

import * as React from "react";
import LibrarySearchModal from "@/components/citations/LibrarySearchModal";

/** Simplified citation data for collection before target exists */
export type PendingCitation = {
  type: "url" | "doi" | "library";
  value: string;
  locator?: string;
  quote?: string;
  note?: string;
  title?: string; // for display
};

type Props = {
  citations: PendingCitation[];
  onChange: (citations: PendingCitation[]) => void;
  className?: string;
};

/**
 * CitationCollector - Collects citation metadata before the target entity exists
 * This allows users to add evidence during composition, which gets attached after creation
 */
export default function CitationCollector({ citations, onChange, className }: Props) {
  const [tab, setTab] = React.useState<"url" | "doi" | "library">("url");
  const [showForm, setShowForm] = React.useState(false);

  // Form state
  const [url, setUrl] = React.useState("");
  const [doi, setDoi] = React.useState("");
  const [libraryId, setLibraryId] = React.useState("");
  const [libraryTitle, setLibraryTitle] = React.useState("");
  const [locator, setLocator] = React.useState("");
  const [quote, setQuote] = React.useState("");
  const [note, setNote] = React.useState("");
  const [libOpen, setLibOpen] = React.useState(false);

  function resetForm() {
    setUrl("");
    setDoi("");
    setLibraryId("");
    setLibraryTitle("");
    setLocator("");
    setQuote("");
    setNote("");
  }

  function addCitation() {
    let newCitation: PendingCitation | null = null;

    if (tab === "url" && url.trim()) {
      newCitation = {
        type: "url",
        value: url.trim(),
        locator: locator || undefined,
        quote: quote || undefined,
        note: note || undefined,
        title: url.trim(),
      };
    } else if (tab === "doi" && doi.trim()) {
      newCitation = {
        type: "doi",
        value: doi.trim(),
        locator: locator || undefined,
        quote: quote || undefined,
        note: note || undefined,
        title: `DOI: ${doi.trim()}`,
      };
    } else if (tab === "library" && libraryId.trim()) {
      newCitation = {
        type: "library",
        value: libraryId.trim(),
        locator: locator || undefined,
        quote: quote || undefined,
        note: note || undefined,
        title: libraryTitle || `Library item ${libraryId}`,
      };
    }

    if (newCitation) {
      onChange([...citations, newCitation]);
      resetForm();
      setShowForm(false);
    }
  }

  function removeCitation(index: number) {
    onChange(citations.filter((_, i) => i !== index));
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-slate-700">Evidence & Citations</label>
        <button
          type="button"
          className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Hide" : "Add citation"}
        </button>
      </div>

      {showForm && (
        <div className="border rounded-lg px-3 bg-white/70 w-full py-3 mb-2">
          {/* Tabs */}
          <div className="flex gap-2 mb-2">
            {(["url", "doi", "library"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`text-[11px] px-2 py-1 rounded border ${tab === t ? "bg-slate-300" : "bg-white"}`}
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
                    setLibOpen(false);
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
            className="w-full border rounded px-2 py-1 text-sm commentfield"
            rows={2}
            placeholder="Quote (optional, <280 chars)"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
          />

          {/* Actions */}
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="text-xs px-2 py-1 rounded bg-emerald-600 text-white"
              onClick={addCitation}
              title="Add citation to list"
            >
              Add to list
            </button>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded border bg-white"
              onClick={resetForm}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Display collected citations */}
      {citations.length > 0 && (
        <div className="space-y-1 mt-2">
          <div className="text-[11px] text-slate-600">
            {citations.length} citation(s) will be attached after posting
          </div>
          {citations.map((cit, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-xs bg-white border rounded px-2 py-1.5"
            >
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">
                  {cit.type.toUpperCase()}: {cit.title || cit.value}
                </div>
                {cit.locator && (
                  <div className="text-[10px] text-slate-500">Locator: {cit.locator}</div>
                )}
                {cit.quote && (
                  <div className="text-[10px] text-slate-500 truncate">
                    Quote: {cit.quote}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="text-rose-600 hover:text-rose-800 flex-shrink-0"
                onClick={() => removeCitation(idx)}
                title="Remove citation"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
