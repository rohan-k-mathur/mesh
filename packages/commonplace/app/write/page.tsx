"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import { tiptapSharedExtensions } from "@cp/lib/tiptap/shared";
import { pickEpigraph, type Epigraph } from "@cp/lib/epigraphs";
import SourcePicker from "@cp/app/_components/SourcePicker";

type Genre =
  | "FRAGMENT"
  | "EXCERPT"
  | "OBSERVATION"
  | "MEDITATION"
  | "DIALOGUE"
  | "LETTER"
  | "LIST";

const GENRE_LABELS: Record<Genre, string> = {
  FRAGMENT: "Fragment",
  EXCERPT: "Excerpt",
  OBSERVATION: "Observation",
  MEDITATION: "Meditation",
  DIALOGUE: "Dialogue",
  LETTER: "Letter",
  LIST: "List",
};

const GENRE_HELP: Record<Genre, string> = {
  FRAGMENT: "",
  EXCERPT: "A passage from a source text.",
  OBSERVATION: "Something noticed in experience.",
  MEDITATION: "Sustained thought on a named theme.",
  DIALOGUE: "An imagined conversation.",
  LETTER: "Written to a specific addressee.",
  LIST: "An accumulating inventory.",
};

type Thread = {
  id: string;
  name: string | null;
  _count?: { entries: number };
};

export default function WritePage() {
  const router = useRouter();

  const [genre, setGenre] = useState<Genre>("FRAGMENT");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState<string | "">("");
  const [newThreadName, setNewThreadName] = useState("");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [locator, setLocator] = useState("");
  const [isEmpty, setIsEmpty] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // The empty-state prompt: weekday + an epigraph from the tradition.
  // Both are computed once per page-load (seeded by the local date so
  // the same epigraph holds for the day) and rendered only while the
  // editor is empty.
  const [now] = useState<Date>(() => new Date());
  const [epigraph] = useState<Epigraph>(() => {
    const today = new Date();
    const seed =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();
    return pickEpigraph(seed);
  });
  const dateLabel = useMemo(
    () =>
      now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [now],
  );

  const editor = useEditor({
    extensions: [...tiptapSharedExtensions()],
    editorProps: {
      attributes: {
        class:
          "prose prose-stone max-w-none p-2  border-[.5px] border-stone-300 rounded-[5px] focus:outline-none min-h-[60vh]",
      },
    },
    autofocus: true,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setIsEmpty(editor.isEmpty);
    },
  });

  // Load threads when MEDITATION is chosen.
  useEffect(() => {
    if (genre !== "MEDITATION") return;
    let cancelled = false;
    fetch("/api/threads")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.threads)) setThreads(data.threads);
      })
      .catch(() => {
        /* swallow */
      });
    return () => {
      cancelled = true;
    };
  }, [genre]);

  const canSave = useMemo(() => !isEmpty && !saving, [isEmpty, saving]);

  async function ensureThreadId(): Promise<string | null> {
    if (genre !== "MEDITATION") return null;
    if (threadId) return threadId;
    const name = newThreadName.trim();
    if (!name) return null; // unnamed/emerging meditation — leave threadId null
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("thread_create_failed");
    const data = await res.json();
    return data.thread.id as string;
  }

  async function handleSave() {
    if (!editor || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      const finalThreadId = await ensureThreadId();
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: editor.getJSON(),
          genre,
          threadId: finalThreadId,
          sourceId: genre === "EXCERPT" ? sourceId : null,
          locator: genre === "EXCERPT" ? locator.trim() || null : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "save_failed");
      }
      const data = await res.json();
      router.push(`/entry/${data.entry.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  // Cmd/Ctrl+Enter to save.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, canSave, genre, threadId, newThreadName]);

  return (
    <div className="space-y-6 w-full" ref={titleRef}>
      {isEmpty && (
        <div className="space-y-3 pb-2">
          <div className="font-sans text-xs uppercase tracking-wide text-stone-400">
            {dateLabel}
          </div>
          <blockquote className="border-l border-stone-300 pl-4 ml-2 text-stone-400">
            <p className="italic">{epigraph.text}</p>
            <footer className="mt-1 font-sans text-xs not-italic">
              — {epigraph.author}
            </footer>
          </blockquote>
        </div>
      )}

      <EditorContent editor={editor} />

      {!isEmpty && (
        <div className="border-t border-stone-200 pt-6 space-y-4 font-sans">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              What kind of entry is this?
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(GENRE_LABELS) as Genre[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={`rounded border px-3 py-1 text-sm transition ${
                    genre === g
                      ? "border-stone-900 bg-stone-900 text-stone-50"
                      : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
                  }`}
                >
                  {GENRE_LABELS[g]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-500">{GENRE_HELP[genre]}</p>
          </div>

          {genre === "MEDITATION" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700">
                Thread
              </label>
              <select
                value={threadId}
                onChange={(e) => setThreadId(e.target.value)}
                className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">— New or unnamed —</option>
                {threads.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name ?? "(unnamed)"}{" "}
                    {t._count ? `· ${t._count.entries}` : ""}
                  </option>
                ))}
              </select>
              {!threadId && (
                <input
                  type="text"
                  value={newThreadName}
                  onChange={(e) => setNewThreadName(e.target.value)}
                  placeholder="Name a new theme (optional — leave blank for unnamed)"
                  className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm"
                />
              )}
            </div>
          )}

          {genre === "EXCERPT" && (
            <SourcePicker
              sourceId={sourceId}
              onSourceChange={setSourceId}
              locator={locator}
              onLocatorChange={setLocator}
            />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="rounded bg-stone-900 px-4 py-2 text-sm text-stone-50 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save entry"}
            </button>
            <span className="text-xs text-stone-500">
              ⌘/Ctrl + Enter
            </span>
            {error && (
              <span className="text-xs text-rose-700">Error: {error}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
