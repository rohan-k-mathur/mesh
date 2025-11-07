"use client";
import * as React from "react";
import {
  listSchemes,
  createArgument,
  getArgumentCQs,
  askCQ,
} from "@/lib/client/aifApi";
import { ClaimPicker } from "@/components/claims/ClaimPicker";
import dynamic from "next/dynamic";
import { LegalMoveToolbarAIF } from "@/components/dialogue/LegalMoveToolbarAIF";
import { SchemeComposerPicker } from "../SchemeComposerPicker";
import { ClaimConfidence } from "@/components/evidence/ClaimConfidence";
import { createClaim } from "@/lib/client/aifApi";
import { SchemePickerWithHierarchy } from "./SchemePickerWithHierarchy";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PropositionComposerPro } from "@/components/propositions/PropositionComposerPro";
import { Save } from "lucide-react";
import CitationCollector, { type PendingCitation } from "@/components/citations/CitationCollector";
export type AttackContext =
  | { mode: "REBUTS"; targetClaimId: string; hint?: string }
  | { mode: "UNDERCUTS"; targetArgumentId: string; hint?: string }
  | { mode: "UNDERMINES"; targetPremiseId: string; hint?: string }
  | null;

type Props = {
  deliberationId: string;
  authorId: string;
  conclusionClaim: { id?: string; text?: string } | null; // ⬅️ allow null to “clear”

  defaultSchemeKey?: string | null;
  attackContext?: AttackContext; // ✅ NEW
  onCreated?: (argumentId: string) => void;
  onCreatedDetail?: (arg: {
    id: string;
    conclusion: { id: string; text: string };
    premises: { id: string; text: string }[];
  }) => void;
  onChangeConclusion?: (c: { id?: string; text?: string } | null) => void; // ⬅️ accept null/partial
};

type Prem = { id: string; text: string };
type Scheme = {
  id: string;
  key: string;
  name: string;
  slotHints?: { premises?: { role: string; label: string }[] } | null;
  cqs?: Array<{
    cqKey: string;
    text: string;
    attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES";
    targetScope: "conclusion" | "inference" | "premise";
  }>;
  formalStructure?: {
    majorPremise?: string;
    minorPremise?: string;
    conclusion?: string;
  } | null;
};

export function AIFArgumentWithSchemeComposer({
  deliberationId,
  authorId,
  conclusionClaim,
  defaultSchemeKey,
  attackContext = null,
  onCreated,
  onCreatedDetail,
  onChangeConclusion,
}: Props) {
  const [schemes, setSchemes] = React.useState<
    Array<{
      id: string;
      key: string;
      name: string;
      slotHints?: any;
      cqs?: any[];
      formalStructure?: {
        majorPremise?: string;
        minorPremise?: string;
        conclusion?: string;
      } | null;
    }>
  >([]);
  const [schemeKey, setSchemeKey] = React.useState(defaultSchemeKey ?? "");
  const [premises, setPremises] = React.useState<Prem[]>([]);
  const [notes, setNotes] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [argumentId, setArgumentId] = React.useState<string | null>(null);
  const [cqs, setCqs] = React.useState<
    Array<{
      cqKey: string;
      text: string;
      status: "open" | "answered";
      attackType: string;
      targetScope: string;
    }>
  >([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [pendingCitations, setPendingCitations] = React.useState<PendingCitation[]>([]);
  
  // Phase B: Axioms designation - mark all premises as axioms (indisputable)
  const [premisesAreAxioms, setPremisesAreAxioms] = React.useState(false);

  // NEW: drafts for inline creation
  const [conclusionDraft, setConclusionDraft] = React.useState(
    conclusionClaim?.text ?? ""
  );
  React.useEffect(() => {
    setConclusionDraft(conclusionClaim?.text ?? "");
  }, [conclusionClaim?.id, conclusionClaim?.text]);

  const [premDraft, setPremDraft] = React.useState(""); // quick-add premise text
  const [majorPremiseDraft, setMajorPremiseDraft] = React.useState("");
  const [minorPremiseDraft, setMinorPremiseDraft] = React.useState("");
  const [majorPremise, setMajorPremise] = React.useState<Prem | null>(null);
  const [minorPremise, setMinorPremise] = React.useState<Prem | null>(null);
  const [pickerPremOpen, setPickerPremOpen] = React.useState(false);
  const [pickerMajorOpen, setPickerMajorOpen] = React.useState(false);
  const [pickerMinorOpen, setPickerMinorOpen] = React.useState(false);
  const [pickerConcOpen, setPickerConcOpen] = React.useState(false);
  const [editingConclusion, setEditingConclusion] = React.useState(false);
  const [savingConclusion, setSavingConclusion] = React.useState(false);
  const [expandedConclusionEditor, setExpandedConclusionEditor] = React.useState(false);
  const [expandedPremiseEditor, setExpandedPremiseEditor] = React.useState(false);

  async function saveConclusionNow() {
    const draft = (conclusionDraft ?? "").trim();
    if (!draft) return;
    setSavingConclusion(true);
    try {
      const id = await createClaim({ deliberationId, authorId, text: draft });
      onChangeConclusion?.({ id, text: draft });
      setEditingConclusion(false);
      window.dispatchEvent(
        new CustomEvent("claims:changed", { detail: { deliberationId } })
      );
    } catch (e: any) {
      setErr(e.message || "Failed to save conclusion");
    } finally {
      setSavingConclusion(false);
    }
  }
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [currentConclusion, setCurrentConclusion] = React.useState<{
    id?: string;
    text?: string;
  } | null>(conclusionClaim ?? null);
  const [justPicked, setJustPicked] = React.useState(false);

  // keep local in sync when parent prop changes
  React.useEffect(() => {
    setCurrentConclusion(conclusionClaim ?? null);
  }, [conclusionClaim?.id, conclusionClaim?.text]);

  // helper to set both local + parent
  const setConclusion = React.useCallback(
    (c: { id?: string; text?: string } | null) => {
      setCurrentConclusion(c);
      onChangeConclusion?.(c ?? null);
    },
    [onChangeConclusion]
  );

  React.useEffect(() => {
    listSchemes()
      .then(setSchemes)
      .catch(() => setSchemes([]));
  }, []);

  const selected = schemes.find((s) => s.key === schemeKey) || null;
  
  // Debug logging for formal structure
  React.useEffect(() => {
    if (selected) {
      console.log('Selected scheme:', selected.key, selected.name);
      console.log('Has formalStructure:', !!selected.formalStructure);
      console.log('formalStructure data:', selected.formalStructure);
    }
  }, [selected]);
  
  // const hasConclusion = Boolean(conclusionClaim?.id);
  // const canCreate = Boolean(authorId && hasConclusion && premises.length > 0);

  // function removePremise(id: string) { setPremises(ps => ps.filter(p => p.id !== id)); }

  // allow: either an id or a non-empty text
  // const hasConclusion =
  //   Boolean(conclusionClaim?.id) ||
  //   Boolean(conclusionDraft && conclusionDraft.trim().length > 0);
  const hasConclusion =
    Boolean(currentConclusion?.id) ||
    Boolean((conclusionDraft ?? "").trim().length > 0);

  // Check if using structured (major/minor) or freeform premises
  const hasStructuredPremises = Boolean(majorPremise && minorPremise);
  const hasFreeformPremises = premises.length > 0;
  
  const canCreate = Boolean(
    authorId && 
    hasConclusion && 
    (hasStructuredPremises || hasFreeformPremises)
  );

  function removePremise(id: string) {
    setPremises((ps) => ps.filter((p) => p.id !== id));
  }

  // NEW: ensure a claim id exists (create if needed)
  async function ensureClaimId(c: {
    id?: string;
    text?: string;
  }): Promise<string> {
    if (c?.id) return c.id;
    const text = (c?.text ?? conclusionDraft ?? "").trim();
    if (!text) throw new Error("Provide text for the conclusion.");
    const id = await createClaim({ deliberationId, authorId, text });
    // inform parent so downstream widgets (Confidence, toolbar) get the id
    onChangeConclusion?.({ id, text });
    return id;
  }

  async function ensureConclusionId(): Promise<string> {
    const draft = (conclusionDraft ?? "").trim();

    // If the user typed something new, mint it
    if (draft && draft !== (currentConclusion?.text ?? "")) {
      const id = await createClaim({ deliberationId, authorId, text: draft });
      setConclusion({ id, text: draft });
      return id;
    }

    if (currentConclusion?.id) return currentConclusion.id;
    if (draft) {
      const id = await createClaim({ deliberationId, authorId, text: draft });
      setConclusion({ id, text: draft });
      return id;
    }
    throw new Error("Provide a conclusion.");
  }
  const hasConclusionId = Boolean(currentConclusion?.id);

  // NEW: quick-add premise by typing
  async function addPremiseFromDraft() {
    const text = premDraft.trim();
    if (!text) return;
    try {
      const id = await createClaim({ deliberationId, authorId, text });
      setPremises((ps) => [...ps, { id, text }]);
      setPremDraft("");
      window.dispatchEvent(
        new CustomEvent("claims:changed", { detail: { deliberationId } })
      );
    } catch (e: any) {
      setErr(e.message || "Failed to create premise");
    }
  }

  // Add major premise
  async function addMajorPremiseFromDraft() {
    const text = majorPremiseDraft.trim();
    if (!text) return;
    try {
      const id = await createClaim({ deliberationId, authorId, text });
      setMajorPremise({ id, text });
      setMajorPremiseDraft("");
      window.dispatchEvent(
        new CustomEvent("claims:changed", { detail: { deliberationId } })
      );
    } catch (e: any) {
      setErr(e.message || "Failed to create major premise");
    }
  }

  // Add minor premise
  async function addMinorPremiseFromDraft() {
    const text = minorPremiseDraft.trim();
    if (!text) return;
    try {
      const id = await createClaim({ deliberationId, authorId, text });
      setMinorPremise({ id, text });
      setMinorPremiseDraft("");
      window.dispatchEvent(
        new CustomEvent("claims:changed", { detail: { deliberationId } })
      );
    } catch (e: any) {
      setErr(e.message || "Failed to create minor premise");
    }
  }

  // small helper to post CA (conflict application)
  async function postCA(body: any, signal?: AbortSignal) {
    const r = await fetch("/api/ca", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j?.ok === false)
      throw new Error(j?.error || `HTTP ${r.status}`);
  }
  async function handleCreate() {
    if (!canCreate) {
      setErr(
        !hasStructuredPremises && !hasFreeformPremises
          ? "Add at least one premise or both major and minor premises."
          : !hasConclusion
          ? "Provide or pick a conclusion."
          : "User not ready."
      );
      return;
    }
    setErr(null);
    setCreating(true);
    const ctrl = new AbortController();

    try {
      // 1) Ensure conclusion id (create if only text provided)
      const conclusionId = await ensureConclusionId();

      // 2) Build premise list: prioritize structured (major/minor) if present
      let premiseClaimIds: string[];
      if (hasStructuredPremises) {
        // Use major + minor in order
        premiseClaimIds = [majorPremise!.id, minorPremise!.id];
      } else {
        // Use freeform premises
        premiseClaimIds = premises.map((p) => p.id);
      }

      // 3) (Optional) build slots from slotHints for server-side validators
      let slots: Record<string, string> | undefined = undefined;
      const roles =
        selected?.slotHints?.premises?.map((p: any) => p.role) ?? [];
      if (roles.length && hasStructuredPremises) {
        // Map major premise to first role, minor to second
        slots = {};
        if (roles[0]) slots[roles[0]] = majorPremise!.id;
        if (roles[1]) slots[roles[1]] = minorPremise!.id;
        if (conclusionId) (slots as any).conclusion = conclusionId;
      } else if (roles.length) {
        slots = {};
        roles.forEach((role: string, i: number) => {
          const pid = premises[i]?.id;
          if (role && pid) slots![role] = pid;
        });
        // also pass conclusion if your validator expects it
        if (conclusionId) (slots as any).conclusion = conclusionId;
      }

      // 3) Create the RA
      const id = await createArgument({
        deliberationId,
        authorId,
        conclusionClaimId: conclusionId,
        premiseClaimIds,
        schemeId: selected?.id ?? null,
        implicitWarrant: notes ? { text: notes } : null,
        // Phase B: Pass axiom designation to API
        premisesAreAxioms,
        // harmless extra; server will just ignore if not using it yet
        ...(slots ? { slots } : {}),
      });
      setArgumentId(id);
      onCreated?.(id);
      
      // Attach citations to the newly created argument
      if (pendingCitations.length > 0) {
        await Promise.all(
          pendingCitations.map(async (citation) => {
            try {
              // First resolve the source
              let resolvePayload: any = {};
              if (citation.type === "url") {
                resolvePayload = { url: citation.value, meta: { title: citation.title } };
              } else if (citation.type === "doi") {
                resolvePayload = { doi: citation.value };
              } else if (citation.type === "library") {
                resolvePayload = { libraryPostId: citation.value, meta: { title: citation.title } };
              }

              const resolveRes = await fetch("/api/citations/resolve", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(resolvePayload),
                signal: ctrl.signal,
              });
              const { source } = await resolveRes.json();
              
              if (!source?.id) throw new Error("Failed to resolve source");

              // Then attach the citation
              await fetch("/api/citations/attach", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  targetType: "argument",
                  targetId: id,
                  sourceId: source.id,
                  locator: citation.locator,
                  quote: citation.quote,
                  note: citation.note,
                }),
                signal: ctrl.signal,
              });
            } catch (citErr) {
              console.error("Failed to attach citation:", citErr);
              // Continue with other citations even if one fails
            }
          })
        );
        // Clear citations after successful attachment
        setPendingCitations([]);
        // Notify listeners that citations changed
        window.dispatchEvent(new CustomEvent("citations:changed", { detail: { targetType: "argument", targetId: id } }));
      }
      
      // Build response for onCreatedDetail
      const responsePremises = hasStructuredPremises
        ? [
            { id: majorPremise!.id, text: majorPremise!.text },
            { id: minorPremise!.id, text: minorPremise!.text },
          ]
        : premises;
        
      onCreatedDetail?.({
        id,
        conclusion: {
          id: conclusionId,
          text: (conclusionClaim?.text ?? conclusionDraft) || conclusionId,
        },
        premises: responsePremises,
      });

      // 4) Attach CA if we launched in “attack” mode (use the *new* argument’s conclusion)
      if (attackContext) {
        if (attackContext.mode === "REBUTS") {
          await postCA(
            {
              deliberationId,
              conflictingClaimId: conclusionId,
              conflictedClaimId: attackContext.targetClaimId,
              legacyAttackType: "REBUTS",
              legacyTargetScope: "conclusion",
            },
            ctrl.signal
          );
        } else if (attackContext.mode === "UNDERCUTS") {
          await postCA(
            {
              deliberationId,
              conflictingClaimId: conclusionId,
              conflictedArgumentId: attackContext.targetArgumentId,
              legacyAttackType: "UNDERCUTS",
              legacyTargetScope: "inference",
            },
            ctrl.signal
          );
        } else if (attackContext.mode === "UNDERMINES") {
          await postCA(
            {
              deliberationId,
              conflictingClaimId: conclusionId,
              conflictedClaimId: attackContext.targetPremiseId,
              legacyAttackType: "UNDERMINES",
              legacyTargetScope: "premise",
            },
            ctrl.signal
          );
        }
      }

      const items = await getArgumentCQs(id);
      setCqs(items || []);
      window.dispatchEvent(
        new CustomEvent("claims:changed", { detail: { deliberationId } })
      );
    } catch (e: any) {
      setErr(e.message || "create_failed");
    } finally {
      setCreating(false);
      ctrl.abort();
    }
  }

  return (
    <div className="bg-transparent space-y-4 p-2 ">
      <div className="text-md font-semibold tracking-wide text-gray-900 ">
        Argument Composer
      </div>

      <div className="rounded-xl panel-edge-blue bg-indigo-50 p-4 ">
        <div className="text-[14px] text-gray-700 ">
          {selected ? (
            <>
              Using scheme: <b>{selected.name}</b>
            </>
          ) : (
            "Freeform argument"
          )}
        </div>
        <hr className="border-slate-500/50 my-2" />

        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 md:col-span-1">
            <span className="text-sm text-gray-800">Scheme</span>
            <SchemePickerWithHierarchy
              schemes={schemes}
              selectedKey={schemeKey}
              onSelect={(key) => setSchemeKey(key)}
            />
            {selected?.slotHints?.premises?.length ? (
              <div className="mt-1 flex gap-1 flex-wrap">
                {selected.slotHints.premises.map((p: any) => (
                  <span
                    key={p.role}
                    className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs"
                  >
                    {p.label}
                  </span>
                ))}
              </div>
            ) : null}
          </label>

          {/* Formal Argument Structure - shown when scheme is selected */}
          {selected && selected.formalStructure && (
            <div className="md:col-span-3 mt-2 p-3 rounded-lg border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/50">
              <div className="flex items-start gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-200">
                  <svg className="w-4 h-4 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                    Formal Structure
                  </h4>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    Follow this logical structure when constructing your argument
                  </p>
                </div>
              </div>
              <div className="space-y-2 mt-3">
                {selected.formalStructure.majorPremise && (
                  <div className="flex gap-2">
                    <span className="text-[11px] font-bold text-indigo-700 min-w-[90px]">Major Premise:</span>
                    <span className="text-[11px] text-slate-700 leading-relaxed">{selected.formalStructure.majorPremise}</span>
                  </div>
                )}
                {selected.formalStructure.minorPremise && (
                  <div className="flex gap-2">
                    <span className="text-[11px] font-bold text-indigo-700 min-w-[90px]">Minor Premise:</span>
                    <span className="text-[11px] text-slate-700 leading-relaxed">{selected.formalStructure.minorPremise}</span>
                  </div>
                )}
                {selected.formalStructure.conclusion && (
                  <div className="flex gap-2">
                    <span className="text-[11px] font-bold text-indigo-700 min-w-[90px]">Conclusion:</span>
                    <span className="text-[11px] text-slate-700 leading-relaxed">{selected.formalStructure.conclusion}</span>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ⇩ Conclusion: readable + change/pick control */}
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-sm text-gray-800">Conclusion</span>
            {/* A) edit mode OR no id → show text input */}
            {editingConclusion || !conclusionClaim?.id ? (
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 min-w-0  rounded-lg px-3 py-2 text-sm bg-white articlesearchfield"
                  placeholder="Type your conclusion…"
                  value={conclusionDraft}
                  onChange={(e) => setConclusionDraft(e.target.value)}
                />
                <button
                  className="text-xs px-2 py-2 rounded-lg border  btnv2--ghost bg-white"
                  onClick={() => setPickerConcOpen(true)}
                >
                  Pick Existing
                </button>
                {editingConclusion && (
                  <button
                    className="text-xs px-2 py-2 rounded-lg border btnv2--ghost bg-slate-50"
                    onClick={() => setEditingConclusion(false)}
                  >
                    Cancel
                  </button>
                )}
                <button
                  className="text-xs px-3 py-2 rounded-lg border btnv2 bg-white"
                  onClick={() => setExpandedConclusionEditor(true)}
                  title="Open rich editor for complex claims"
                >
                  ➾ Expand
                </button>
                
                <button
                  className="text-xs px-3 py-2 rounded-lg btnv2 bg-indigo-400 text-white"
                  disabled={!conclusionDraft.trim() || savingConclusion}
                  onClick={saveConclusionNow}
                  title="Save this text as a new claim"
                >
                  <Save className="inline-block w-3 h-3 gap-1 text-sm" />
                  {savingConclusion ? "Saving…" : "Save"}
                </button>
                
              </div>
            ) : (
              /* B) id present → show read-only row + actions */
               <div className="flex items-center gap-2">
    <div className="flex-1 min-w-0 border border-indigo-800/60 rounded-lg h-full py-1.5 px-2 text-sm bg-white/50 
    flex items-center justify-between shadow-sm shadow-slate-400/30">
      <span className="truncate">
        {currentConclusion ? (currentConclusion.text ?? currentConclusion.id) : ""}
      </span>
      {justPicked && (
        <span className="ml-2 text-[11px] text-emerald-700">
          Saved ✓
        </span>
      )}
    </div>
    <button className="text-xs px-2 py-2 rounded-lg btnv2--ghost bg-white" onClick={() => setPickerConcOpen(true)}>
      Pick existing
    </button>
    <button
      className="text-xs px-2 py-2 rounded-lg btnv2--ghost bg-white"
      onClick={() => {
        setEditingConclusion(true);
        setConclusionDraft(currentConclusion?.text ?? '');
      }}
    >
      Type new…
    </button>
                <button
                  className="text-xs px-2 py-2 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                  onClick={() => {
                    setConclusion(null); // ← unset locally + parent
                    setEditingConclusion(true);
                    setConclusionDraft("");
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </label>
        </div>

        <hr className="border-slate-500/50 my-3" />
        
        {/* Conditional rendering: Show structured major/minor inputs when scheme has formalStructure */}
        {selected && selected.formalStructure && selected.formalStructure.majorPremise && selected.formalStructure.minorPremise ? (
          <div className="mt-2 space-y-4">
            {/* Phase B: Axiom designation checkbox */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={premisesAreAxioms}
                  onChange={(e) => setPremisesAreAxioms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-amber-600 bg-white border-amber-300 rounded focus:ring-amber-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-amber-900">
                    Mark premises as axioms (indisputable)
                  </span>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Axioms are foundational premises that cannot be undermined and must be consistent with other axioms. 
                    Use for claims that are beyond dispute in this deliberation.
                  </p>
                </div>
              </label>
            </div>
            
            <div className="text-sm font-medium text-indigo-900 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Structured Premises (Walton-style)
            </div>
            
            {/* Major Premise */}
            <div>
              <label className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">P1: Major Premise</span>
                  <button
                    className="text-xs px-2 py-1 rounded-lg btnv2--ghost bg-white"
                    onClick={() => setPickerMajorOpen(true)}
                  >
                    Pick existing
                  </button>
                </div>
                {selected.formalStructure.majorPremise && (
                  <div className="text-[11px] text-indigo-700 italic bg-indigo-50/50 px-2 py-1 rounded border border-indigo-200">
                    Template: {selected.formalStructure.majorPremise}
                  </div>
                )}
                {majorPremise ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border border-emerald-600/60 rounded-lg py-2 px-3 text-sm bg-emerald-50/50 flex items-center justify-between">
                      <span className="truncate">{majorPremise.text}</span>
                    </div>
                    <button
                      className="text-xs px-2 py-1 rounded-lg border border-rose-200 text-rose-700 bg-rose-50"
                      onClick={() => setMajorPremise(null)}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg px-3 py-2 text-sm articlesearchfield"
                      placeholder="Enter major premise..."
                      value={majorPremiseDraft}
                      onChange={(e) => setMajorPremiseDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && majorPremiseDraft.trim())
                          addMajorPremiseFromDraft();
                      }}
                    />
                      <button
                className="text-xs px-5 rounded-lg btnv2 bg-white"
                onClick={() => setExpandedPremiseEditor(true)}
                title="Open rich editor for complex premises"
              >
                ➾ Expand
              </button>
                    <button
                      className="text-xs px-4 rounded-lg bg-white btnv2"
                      disabled={!majorPremiseDraft.trim()}
                      onClick={addMajorPremiseFromDraft}
                    >
                      ⊕ Add
                    </button>
                  </div>
                )}
              </label>
            </div>

            {/* Minor Premise */}
            <div>
              <label className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">P2: Minor Premise</span>
                  <button
                    className="text-xs px-2 py-1 rounded-lg btnv2--ghost bg-white"
                    onClick={() => setPickerMinorOpen(true)}
                  >
                    Pick existing
                  </button>
                </div>
                {selected.formalStructure.minorPremise && (
                  <div className="text-[11px] text-indigo-700 italic bg-indigo-50/50 px-2 py-1 rounded border border-indigo-200">
                    Template: {selected.formalStructure.minorPremise}
                  </div>
                )}
                {minorPremise ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border border-emerald-600/60 rounded-lg py-2 px-3 text-sm bg-emerald-50/50 flex items-center justify-between">
                      <span className="truncate">{minorPremise.text}</span>
                    </div>
                    <button
                      className="text-xs px-2 py-1 rounded-lg border border-rose-200 text-rose-700 bg-rose-50"
                      onClick={() => setMinorPremise(null)}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg px-3 py-2 text-sm articlesearchfield"
                      placeholder="Enter minor premise..."
                      value={minorPremiseDraft}
                      onChange={(e) => setMinorPremiseDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && minorPremiseDraft.trim())
                          addMinorPremiseFromDraft();
                      }}
                    />
                    <button
                className="text-xs px-5 rounded-lg btnv2 bg-white"
                onClick={() => setExpandedPremiseEditor(true)}
                title="Open rich editor for complex premises"
              >
                ➾ Expand
              </button>
                    <button
                      className="text-xs px-4 rounded-lg bg-white btnv2"
                      disabled={!minorPremiseDraft.trim()}
                      onClick={addMinorPremiseFromDraft}
                    >
                      ⊕ Add
                    </button>
                  </div>
                )}
              </label>
            </div>
          </div>
        ) : (
          /* Fallback: Freeform premises (original behavior) */
          <div className="mt-2">
            {/* Phase B: Axiom designation checkbox */}
            <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={premisesAreAxioms}
                  onChange={(e) => setPremisesAreAxioms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-amber-600 bg-white border-amber-300 rounded focus:ring-amber-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-amber-900">
                    Mark premises as axioms (indisputable)
                  </span>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Axioms are foundational premises that cannot be undermined and must be consistent with other axioms. 
                    Use for claims that are beyond dispute in this deliberation (e.g., established facts, definitions, or shared assumptions).
                  </p>
                </div>
              </label>
            </div>
            
            <div className="flex items-center justify-start gap-3">
              <span className="text-sm text-gray-800">Premises</span>
              <button
                className="text-xs px-2 py-1 rounded-lg btnv2--ghost bg-white"
                onClick={() => setPickerPremOpen(true)}
              >
                + Add from existing
              </button>
            </div>

            {/* NEW: quick add by typing */}
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1  rounded-lg px-3 py-2 text-sm articlesearchfield"
                placeholder="Add a premise"
                value={premDraft}
                onChange={(e) => setPremDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && premDraft.trim())
                    addPremiseFromDraft();
                }}
              />
              <button
                className="text-xs px-5 rounded-lg btnv2 bg-white"
                onClick={() => setExpandedPremiseEditor(true)}
                title="Open rich editor for complex premises"
              >
                ➾ Expand
              </button>
              <button
                className="text-xs px-5   rounded-lg bg-white btnv2"
                disabled={!premDraft.trim()}
                onClick={addPremiseFromDraft}
              >
                ⊕ Add
              </button>
            </div>

            {premises.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {premises.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-1 rounded-full panel-edge bg-white/30"
                  >
                    <span className="text-xs">{p.text || p.id}</span>
                    <button
                      className="text-[10px] text-slate-500 underline"
                      onClick={() => removePremise(p.id)}
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500 mt-2">No premises yet.</div>
            )}
          </div>
        )}

        <hr className="border-slate-500/50 mt-4 mb-2" />

        {/* CQ Preview Panel - shown when scheme is selected, before argument creation */}
        {selected && selected.cqs && selected.cqs.length > 0 && !argumentId && (
          <div className="my-4 p-4 rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-200">
                <svg className="w-5 h-5 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-orange-900 mb-1">
                  Critical Questions Preview
                </h4>
                <p className="text-xs text-orange-800 leading-relaxed">
                  This scheme comes with {selected.cqs.length} critical question{selected.cqs.length !== 1 ? "s" : ""} that will test your argument&apos;s strength. Review them before creating your argument.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {selected.cqs.slice(0, 4).map((cq, idx) => (
                <div 
                  key={cq.cqKey} 
                  className="flex items-start gap-2 p-2 bg-white/70 rounded-lg border border-orange-200"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-200 text-orange-800 text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 leading-relaxed">
                      {cq.text}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                        {cq.attackType}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {cq.targetScope}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {selected.cqs.length > 4 && (
                <div className="text-center pt-2">
                  <span className="text-xs font-medium text-orange-700">
                    ...+ {selected.cqs.length - 4} more question{selected.cqs.length - 4 !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Optional notes / warrant */}
        <label className="flex flex-col gap-2 mt-0">
          <span className="text-sm text-gray-800">Justification</span>
          <textarea
            className="w-full articlesearchfield rounded-lg text-xs px-2.5 py-2 mt-1"
            cols={3}
            value={notes}
            placeholder="If [premises], then [conclusion] (unless [exception])."
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {/* Citations - Use CitationCollector for evidence attachment */}
        <div className="mt-4">
          <CitationCollector
            citations={pendingCitations}
            onChange={setPendingCitations}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            className="px-5 py-2 text-xs tracking-wide font-medium rounded-full btnv2 bg-white disabled:opacity-50"
            disabled={creating || !canCreate}
            onClick={handleCreate}
          >
            {creating ? "Creating…" : "Create argument"}
          </button>
          {err && <span className="text-sm text-rose-700">{err}</span>}
        </div>

        {!!argumentId && !!cqs.length && (
          <div className="mt-4 border-t pt-3">
            {/* CQs section unchanged */}
          </div>
        )}
      </div>

      {/* Confidence & moves
      {hasConclusion && (
        <>
          <ClaimConfidence
            deliberationId={deliberationId}
            claimId={conclusionClaim.id!}
            mode="min"
            tau={0.7}
          />
          {hasConclusion && (
            <div
              className={!argumentId ? "opacity-60 pointer-events-none" : ""}
            >
              <LegalMoveToolbarAIF
                deliberationId={deliberationId}
                targetType="claim"
                targetId={conclusionClaim.id!}
                onPosted={() =>
                  window.dispatchEvent(
                    new CustomEvent("dialogue:moves:refresh", {
                      detail: { deliberationId },
                    } as any)
                  )
                }
              />
              {!argumentId && (
                <div className="text-xs text-slate-500 mt-1">
                  Create the argument first to enable GROUNDS/CLOSE here.
                </div>
              )}
            </div>
          )}
        </>
      )} */}

     

      {/* Premise picker modal
      <SchemeComposerPicker
        kind="claim"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(it) => {
          setPremises(ps => ps.some(p => p.id === it.id) ? ps : [...ps, { id: it.id, text: it.label }]);
          setPickerOpen(false);
        }}
      /> */}
      {/* Pickers (separate modals for clarity) */}
      <SchemeComposerPicker
        kind="claim"
        open={pickerConcOpen}
        onClose={() => setPickerConcOpen(false)}
        onPick={(it) => {
          setConclusion({ id: it.id, text: it.label });
          setConclusionDraft(it.label || "");
          setEditingConclusion(false); // switch to read-only row immediately
          setPickerConcOpen(false);

          // micro-feedback chip
          setJustPicked(true);
          setTimeout(() => setJustPicked(false), 1200);
        }}
      />
      <SchemeComposerPicker
        kind="claim"
        open={pickerPremOpen}
        onClose={() => setPickerPremOpen(false)}
        onPick={(it) => {
          setPremises((ps) =>
            ps.some((p) => p.id === it.id)
              ? ps
              : [...ps, { id: it.id, text: it.label }]
          );
          setPickerPremOpen(false);
        }}
      />
      <SchemeComposerPicker
        kind="claim"
        open={pickerMajorOpen}
        onClose={() => setPickerMajorOpen(false)}
        onPick={(it) => {
          setMajorPremise({ id: it.id, text: it.label });
          setMajorPremiseDraft("");
          setPickerMajorOpen(false);
        }}
      />
      <SchemeComposerPicker
        kind="claim"
        open={pickerMinorOpen}
        onClose={() => setPickerMinorOpen(false)}
        onPick={(it) => {
          setMinorPremise({ id: it.id, text: it.label });
          setMinorPremiseDraft("");
          setPickerMinorOpen(false);
        }}
      />

      
      {/* Expanded rich editor modal for complex conclusion claims */}
      <Dialog open={expandedConclusionEditor} onOpenChange={setExpandedConclusionEditor}>
        <DialogContent className="max-w-3xl bg-white">
          <DialogHeader>
            <DialogTitle>Compose Conclusion Claim</DialogTitle>
          </DialogHeader>
          <PropositionComposerPro
            deliberationId={deliberationId}
            onCreated={(prop) => {
              setConclusionDraft(prop.text);
              setConclusion({ id: prop.id, text: prop.text });
              setExpandedConclusionEditor(false);
              setEditingConclusion(false);
              window.dispatchEvent(
                new CustomEvent("claims:changed", { detail: { deliberationId } })
              );
            }}
            onPosted={() => setExpandedConclusionEditor(false)}
            placeholder="State your conclusion claim with rich formatting..."
          />
        </DialogContent>
      </Dialog>

      {/* Expanded rich editor modal for complex premise claims */}
      <Dialog open={expandedPremiseEditor} onOpenChange={setExpandedPremiseEditor}>
        <DialogContent className="max-w-3xl bg-white">
          <DialogHeader>
            <DialogTitle>Compose Premise Claim</DialogTitle>
          </DialogHeader>
          <PropositionComposerPro
            deliberationId={deliberationId}
            onCreated={(prop) => {
              setPremises((ps) => [...ps, { id: prop.id, text: prop.text }]);
              setPremDraft("");
              setExpandedPremiseEditor(false);
              window.dispatchEvent(
                new CustomEvent("claims:changed", { detail: { deliberationId } })
              );
            }}
            onPosted={() => setExpandedPremiseEditor(false)}
            placeholder="State your premise claim with rich formatting..."
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
