"use client";
import { useState,useEffect } from "react";
import { z } from "zod";
import { invalidateDeliberation } from '@/lib/deepdive/invalidate';
import EnthymemeNudge from '@/components/deepdive/EnthymemeNudge';
import { TheoryFraming } from "../compose/TheoryFraming";
import React from "react";
import { useAuth } from "@/lib/AuthContext";

type Props = {
  deliberationId: string;
  onPosted?: () => void;
  targetArgumentId?: string;
};
type CounterKind =
  | "none"
  | "rebut_conclusion"
  | "rebut_premise"
  | "undercut_inference";

const schema = z.object({
  text: z.string().min(1).max(5000),
  sources: z.array(z.string().url()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  isImplicit: z.boolean().optional(),
  quantifier: z.enum(['SOME','MANY','MOST','ALL']).optional(),
   modality: z.enum(['COULD','LIKELY','NECESSARY']).optional(),
});

export default function DeliberationComposer({
  deliberationId,
  onPosted,
  targetArgumentId,
}: Props) {
  const [text, setText] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [edgeType, setEdgeType] = useState<
    "support" | "rebut" | "undercut" | null
  >(null);
  const [imageUrl, setImageUrl] = useState("");
  const [quantifier, setQuantifier] = useState<
    "SOME" | "MANY" | "MOST" | "ALL" | undefined
  >();
  const [modality, setModality] = useState<
    "COULD" | "LIKELY" | "NECESSARY" | undefined
  >();
  const [counterKind, setCounterKind] = useState<CounterKind>("none");
  const [workTitle, setWorkTitle] = useState("");
const [workBody, setWorkBody]   = useState("");

  const [showYesBut, setShowYesBut] = useState(false);
  const [concession, setConcession] = useState("");
  const [counter, setCounter] = useState("");

  const [showWorkFields, setShowWorkFields] = useState(false);
  const [savedWorkId, setSavedWorkId] = React.useState<string | null>(null);
  const framingRef = React.useRef<HTMLDivElement|null>(null);


  const [framing, setFraming] = React.useState<{ theoryType:'DN'|'IH'|'TC'|'OP'; standardOutput?:string }>({
    theoryType: 'DN',
  });
  
  const { user } = useAuth();
// Derive an id from common providers
const effectiveUserId =
  // Supabase / Clerk
  (user as any)?.id ??
  // Custom contexts that use userId
  (user as any)?.userId ??
  // Firebase
  (user as any)?.uid ??
  // Auth0
  (user as any)?.sub ??
  null;

  // const userId = effectiveUserId;
    const addSource = (url: string) => {
    try {
      new URL(url);
      setSources((prev) => [...new Set([...prev, url])]);
    } catch {}
  };

  const post = async () => {
    const body = {
      text,
      sources,
      confidence,
      quantifier,
      modality,
      mediaType: imageUrl ? "image" : "text",
      mediaUrl: imageUrl || undefined,
    };
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return alert("Please add a point (and valid sources if included).");

    setPending(true);
    try {
      // 1) create argument
      const res = await fetch(
        `/api/deliberations/${deliberationId}/arguments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const { argument } = await res.json();

      // 2) if replying to a target with an edge type, add edge
      if (targetArgumentId && edgeType) {
        await fetch(`/api/deliberations/${deliberationId}/edges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromArgumentId: argument.id,
            toArgumentId: targetArgumentId,
            type: edgeType,
          }),
        });
      }
      invalidateDeliberation(deliberationId);

      setText("");
      setSources([]);
      setConfidence(undefined);
      setEdgeType(null);
      onPosted?.();
    } catch (e: any) {
      console.error(e);
      alert("Could not post. Please try again.");
    } finally {
      setPending(false);
    }
  };

  async function createArgument(argText: string) {
    const res = await fetch(`/api/deliberations/${deliberationId}/arguments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: argText }),
    });
    const data = await res.json();
    if (!res.ok || data.error)
      throw new Error(data.error ?? "Failed to create argument");
    return data.argument as { id: string };
  }

  async function createEdge(
    fromArgumentId: string,
    toArgumentId: string,
    kind: CounterKind | "support" | "concede"
  ) {
    // map to API payload
    let type: "support" | "rebut" | "undercut" | "concede" = "support";
    let targetScope: "conclusion" | "premise" | "inference" | undefined;

    if (kind === "rebut_conclusion") {
      type = "rebut";
      targetScope = "conclusion";
    } else if (kind === "rebut_premise") {
      type = "rebut";
      targetScope = "premise";
    } else if (kind === "undercut_inference") {
      type = "undercut";
      targetScope = "inference";
    } else if (kind === "concede") {
      type = "concede";
    }

    const res = await fetch(`/api/deliberations/${deliberationId}/edges`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fromArgumentId,
        toArgumentId,
        type,
        targetScope,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error)
      throw new Error(data.error ?? "Failed to create edge");
    return data.edge;
  }

  async function submitSimple() {
    if (!text.trim()) return;
    setPending(true);
    try {
      const created = await createArgument(text.trim());

      // If this is a counter reply, attach the appropriate edge
      if (targetArgumentId && counterKind !== "none") {
        await createEdge(created.id, targetArgumentId, counterKind);
      }
      invalidateDeliberation(deliberationId);

      setText("");
      setCounterKind("none");
      onPosted?.();
    } catch (e: any) {
      alert(e?.message ?? "Failed");
    } finally {
      setPending(false);
    }
  }

  async function submitYesBut() {
    if (!targetArgumentId) return; // needs a target
    const hasConcession = concession.trim().length > 0;
    const hasCounter = counter.trim().length > 0;
    if (!hasConcession && !hasCounter) return;

    setPending(true);
    try {
      // (a) post concession (optional)
      let concessionArgId: string | null = null;
      if (hasConcession) {
        const a = await createArgument(concession.trim());
        concessionArgId = a.id;
        await createEdge(concessionArgId, targetArgumentId, "concede"); // visual concession link
      }

      // (b) post counter (required for counter effect)
      if (hasCounter) {
        const b = await createArgument(counter.trim());
        await createEdge(b.id, targetArgumentId, "rebut_conclusion"); // default rebut-to-conclusion
      }

      setConcession("");
      setCounter("");
      setShowYesBut(false);
      invalidateDeliberation(deliberationId);

      onPosted?.();
    } catch (e: any) {
      alert(e?.message ?? "Failed");
    } finally {
      setPending(false);
    }
  }
  // inside DeliberationComposer (add this effect near other hooks)
useEffect(() => {
  const handler = (ev: CustomEvent) => {
    if (!ev?.detail) return;
    if (ev.detail.deliberationId !== deliberationId) return;
    setShowWorkFields(true);
    // optional: focus title for quick typing
    setTimeout(() => {
      const el = document.getElementById('work-title-input');
      if (el) (el as HTMLInputElement).focus();
    }, 0);
  };
  window.addEventListener('mesh:open-work-fields', handler as any);
  return () => window.removeEventListener('mesh:open-work-fields', handler as any);
}, [deliberationId]);


  return (
    <div className="relative z-10 w-full  rounded-md border p-4 space-y-3">
      <div className="text-md font-semibold  text-neutral-600">Analysis</div>
      <textarea
        className="w-full border rounded p-3 "
        rows={4}
        placeholder="Respond Here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <EnthymemeNudge
  targetType="argument"
  targetId={targetArgumentId}
  draft={text}
  onPosted={() => {/* optional toast */}}
/>
      <div className="relative flex flex-wrap gap-2">
        <button
          className="px-2 py-1 border rounded-xl text-sm bg-white/70 "
          onClick={() => {
            const url = prompt("Add source URL");
            if (url) addSource(url);
          }}
        >
          Add Source
        </button>
        <div className="h-8 border-r-[1px] border-slate-700" />

        {/* Quantifier chips */}
        <div className="relative flex items-center gap-1 text-sm">
          <span className="text-neutral-500 ">Quantifier:</span>
          {(["SOME", "MANY", "MOST", "ALL"] as const).map((q) => (
            <button
              key={q}
              className={`px-2 py-1 border rounded ${
                quantifier === q ? "bg-neutral-100" : ""
              }`}
              onClick={() => setQuantifier(q)}
            >
              {q}
            </button>
          ))}
          <div className="h-8 border-r-[1px] border-slate-700" />
        </div>
        {/* Modality chips */}
        <div className="relative flex items-center gap-1 text-sm">
          <span className="text-neutral-500 mr-1">Modality:</span>
          {(["COULD", "LIKELY", "NECESSARY"] as const).map((m) => (
            <button
              key={m}
              className={`px-2 py-1 border rounded ${
                modality === m ? "bg-neutral-100" : ""
              }`}
              onClick={() => setModality(m)}
            >
              {m}
            </button>
          ))}
          <div className="h-8 border-r-[1px] border-slate-700" />
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-neutral-500 ">Confidence Level:</span>
          <div className=" text-sm text-neutral-900">
            <button
              className="px-2 py-1 border rounded"
              onClick={() => setConfidence(0.25)}
            >
              25%
            </button>
            <button
              className="px-2 py-1 border rounded"
              onClick={() => setConfidence(0.5)}
            >
              {" "}
              50%
            </button>
            <button
              className="px-2 py-1 border rounded"
              onClick={() => setConfidence(0.75)}
            >
              75%
            </button>
            <button
              className="px-2 py-1 border rounded"
              onClick={() => setConfidence(1)}
            >
              100%
            </button>
          </div>
           {sources.length > 0 && (
        <div className="text-xs text-neutral-600">
          Sources:{" "}
          {sources.map((s) => (
            <a key={s} href={s} target="_blank" className="underline mr-2">
              {s}
            </a>
          ))}
        </div>
      )}
        </div>
       
      </div>
      
<div className="flex justify-start gap-4 py-1 mb-1">
  <span className="text-sm text-neutral-700">Theory Builder</span>
  <button
    type="button"
    className="px-5 py-0 text-xs bg-white border rounded lockbutton"
    onClick={() => setShowWorkFields(v => !v)}
  >
    {showWorkFields ? 'Hide' : 'Expand'}
  </button>
</div>

{showWorkFields && (
  <div className="rounded border p-3 space-y-2 bg-white/60">
<div ref={framingRef}>

    {/* 🔸 Keep a SINGLE TheoryFraming, wired to show summary + builder when savedWorkId exists */}
    <TheoryFraming
      key={savedWorkId ?? 'no-work'}             // force remount on first save so the builder opens
      value={framing}
      onChange={setFraming}
      workId={savedWorkId ?? undefined}          // enables PracticalSummary/Builder after save
      canEditPractical={true}
      defaultOpenBuilder={!!savedWorkId}         // auto-open builder after first save
      className="mb-2"
    />
</div>

    {/* Work fields (title/body) + Save button */}
    <label className="block text-xs text-neutral-600">Work Title</label>
    <input
      id="work-title-input"  // 👈 add this

      className="w-full border rounded px-2 py-1 text-sm"
      placeholder="Title for this work"
      value={workTitle}
      onChange={(e) => setWorkTitle(e.target.value)}
    />

    <label className="block text-xs text-neutral-600">Work Body</label>
    <textarea
      className="w-full border rounded px-2 py-1 text-sm min-h-[120px]"
      placeholder="Write the body of the work"
      value={workBody}
      onChange={(e) => setWorkBody(e.target.value)}
    />

    <button
      className="px-3 py-1 rounded border text-sm bg-white disabled:opacity-50"
      onClick={async () => {
        if (!workTitle.trim() || !workBody.trim()) {
          alert('Please provide a work title and body.');
          return;
        }

        const payload = {
          deliberationId,

          title: workTitle.trim(),
          body: workBody.trim(),
          ...(framing?.theoryType ? { theoryType: framing.theoryType } : {}),
          standardOutput: framing?.standardOutput ?? null,
        };

        try {
          const res = await fetch('/api/theoryworks', {
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify(payload)
          });

          const text = await res.text();
          let json: any = null;
          try { json = JSON.parse(text); } catch {}

          if (!res.ok) {
            const msg = json?.error || json?.message || text || `HTTP ${res.status}`;
            alert(`Save failed: ${msg}`);
            return;
          }

          const { ok, work } = json;
          if (ok && work?.id) {
            setSavedWorkId(work.id);     // 👈 triggers remount/open of builder
            setTimeout(() => framingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);

          }
          alert('Work saved.');
        } catch (err:any) {
          console.error(err);
          alert(`Save failed: ${err?.message ?? 'Unknown error'}`);
        }
      }}
    >
      Save Work
    </button>
  </div>
)}



      {/* Counter toolbar (only when replying) */}
      {targetArgumentId && !showYesBut && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-neutral-500">Counter type:</span>
          <button
            className={`px-2 py-1 rounded border ${
              counterKind === "rebut_conclusion"
                ? "bg-neutral-900 text-white"
                : "hover:bg-neutral-50"
            }`}
            onClick={() =>
              setCounterKind((k) =>
                k === "rebut_conclusion" ? "none" : "rebut_conclusion"
              )
            }
          >
            Rebut (conclusion)
          </button>
          <button
            className={`px-2 py-1 rounded border ${
              counterKind === "rebut_premise"
                ? "bg-neutral-900 text-white"
                : "hover:bg-neutral-50"
            }`}
            onClick={() =>
              setCounterKind((k) =>
                k === "rebut_premise" ? "none" : "rebut_premise"
              )
            }
          >
            Rebut premise
          </button>
          <button
            className={`px-2 py-1 rounded border ${
              counterKind === "undercut_inference"
                ? "bg-neutral-900 text-white"
                : "hover:bg-neutral-50"
            }`}
            onClick={() =>
              setCounterKind((k) =>
                k === "undercut_inference" ? "none" : "undercut_inference"
              )
            }
          >
            Undercut inference
          </button>

          <span className="mx-2 text-neutral-300">|</span>

          <button
            className="px-2 py-1 rounded border hover:bg-neutral-50"
            onClick={() => {
              setShowYesBut(true);
              setCounterKind("none");
            }}
            title={`Posts two linked items: Concession + Counter\nConcession is linked with a "concede" edge; Counter rebuts the conclusion.`}
          >
            Yes, … but …
          </button>
        </div>
      )}

      {/* Yes, … but … template */}
      {showYesBut && (
        <div className="rounded border p-2 space-y-2 bg-amber-50/40">
          <div className="text-xs font-medium">Yes, … but …</div>

          <label className="text-xs text-neutral-600">
            Concession (what you agree with)
          </label>
          <textarea
            className="w-full border rounded px-2 py-1 text-sm min-h-[70px]"
            placeholder="Briefly acknowledge the strongest part of the target…"
            value={concession}
            onChange={(e) => setConcession(e.target.value)}
          />

          <label className="text-xs text-neutral-600">
            But… (your counter)
          </label>
          <textarea
            className="w-full border rounded px-2 py-1 text-sm min-h-[90px]"
            placeholder="Present your counterpoint…"
            value={counter}
            onChange={(e) => setCounter(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm disabled:opacity-50"
              onClick={submitYesBut}
              disabled={
                pending ||
                !(concession.trim() || counter.trim()) ||
                !targetArgumentId
              }
            >
              {pending ? "Posting…" : "Post both"}
            </button>
            <button
              className="px-3 py-1.5 rounded border text-sm"
              onClick={() => {
                setShowYesBut(false);
                setConcession("");
                setCounter("");
              }}
              disabled={pending}
            >
              Cancel
            </button>
          </div>

          <div className="text-[11px] text-neutral-500">
            This posts two linked arguments: a concession (linked via{" "}
            <code>concede</code>) and a counter (linked via <code>rebut</code>{" "}
            to the conclusion).
          </div>
        </div>
      )}

      {/* Image argument adder */}
      <div className="space-y-1">
        <input
          type="url"
          placeholder="Paste image URL (optional)"
          className="w-full border rounded px-2 py-1 text-sm"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        {imageUrl && (
          <div className="border rounded p-2">
            <img
              src={imageUrl}
              alt="preview"
              className="max-h-40 object-contain mx-auto"
            />
          </div>
        )}
      </div>
      {targetArgumentId && (
        <div className="flex gap-2 items-center">
          <span className="text-sm text-neutral-700">This is a reply:</span>
          <button
            className={`px-2 py-1 border rounded ${
              edgeType === "support" ? "bg-neutral-100" : ""
            }`}
            onClick={() => setEdgeType("support")}
          >
            Support
          </button>
          <button
            className={`px-2 py-1 border rounded ${
              edgeType === "rebut" ? "bg-neutral-100" : ""
            }`}
            onClick={() => setEdgeType("rebut")}
          >
            Rebut
          </button>
          <button
            className={`px-2 py-1 border rounded ${
              edgeType === "undercut" ? "bg-neutral-100" : ""
            }`}
            onClick={() => setEdgeType("undercut")}
          >
            Undercut
          </button>
          <span className="text-xs text-neutral-500">
            (“Undercut” challenges the link, not the claim.)
          </span>
        </div>
      )}
      <div className="flex justify-start">
        <button
          disabled={pending || !text.trim()}
          onClick={post}
          className="px-3 py-1 rounded-xl bg-white/70 text-black disabled:opacity-50"
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
