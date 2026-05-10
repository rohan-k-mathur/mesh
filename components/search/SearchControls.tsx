"use client";

/**
 * Client-side filter form for the public argument search page.
 *
 * Submits as a plain GET form so the resulting URL (and its results) is
 * shareable, bookmarkable, and crawlable. No client-side data fetching —
 * the server page reads `searchParams` and renders.
 *
 * Phase 1 controls: query, scheme, sort, mode (lexical/hybrid).
 * Phase 2 controls: tested_only, min_cq_satisfied, min_evidence, since/until.
 */
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export type SearchControlsProps = {
  /** Initial query string. */
  initialQ: string;
  /** Initial scheme key (free-text for now; populated dropdown comes later). */
  initialScheme: string;
  /** Initial sort key. */
  initialSort: "recent" | "dialectical_fitness";
  /** Initial retrieval mode. */
  initialMode: "hybrid" | "lexical" | "vector";
  /** Phase 2 — only return arguments that have been challenged. */
  initialTestedOnly?: boolean;
  /** Phase 2 — minimum SATISFIED critical questions. */
  initialMinCq?: string;
  /** Phase 2 — minimum provenance-anchored evidence rows. */
  initialMinEvidence?: string;
  /** Phase 2 — ISO date lower bound on createdAt. */
  initialSince?: string;
  /** Phase 2 — ISO date upper bound on createdAt. */
  initialUntil?: string;
};

export default function SearchControls({
  initialQ,
  initialScheme,
  initialSort,
  initialMode,
  initialTestedOnly = false,
  initialMinCq = "",
  initialMinEvidence = "",
  initialSince = "",
  initialUntil = "",
}: SearchControlsProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(initialQ);
  const [scheme, setScheme] = useState(initialScheme);
  const [sort, setSort] = useState<typeof initialSort>(initialSort);
  const [mode, setMode] = useState<typeof initialMode>(initialMode);
  const [testedOnly, setTestedOnly] = useState(initialTestedOnly);
  const [minCq, setMinCq] = useState(initialMinCq);
  const [minEvidence, setMinEvidence] = useState(initialMinEvidence);
  const [since, setSince] = useState(initialSince);
  const [until, setUntil] = useState(initialUntil);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (scheme.trim()) next.set("scheme", scheme.trim());
    if (sort !== "recent") next.set("sort", sort);
    if (mode !== "hybrid") next.set("mode", mode);
    if (testedOnly) next.set("tested_only", "1");
    if (minCq.trim() && Number(minCq) > 0) next.set("min_cq_satisfied", String(Math.floor(Number(minCq))));
    if (minEvidence.trim() && Number(minEvidence) > 0) next.set("min_evidence", String(Math.floor(Number(minEvidence))));
    if (since.trim()) next.set("since", since.trim());
    if (until.trim()) next.set("until", until.trim());
    // Preserve `against` if the caller arrived in counter-arg discovery mode.
    const against = params?.get("against");
    if (against) next.set("against", against);
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `/search/arguments?${qs}` : "/search/arguments");
    });
  }

  return (
    <form onSubmit={submit} className="search-controls" role="search">
      <div className="row primary-row">
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search arguments — try 'social media adolescent depression'"
          aria-label="Search query"
          className="q-input"
          autoFocus
        />
        <button
          type="submit"
          className="submit-btn"
          disabled={isPending}
        >
          {isPending ? "Searching…" : "Search"}
        </button>
      </div>

      <div className="row filters-row">
        <label className="filter">
          <span className="filter-label">Scheme</span>
          <input
            type="text"
            name="scheme"
            value={scheme}
            onChange={(e) => setScheme(e.target.value)}
            placeholder="any"
            aria-label="Argumentation scheme key"
            className="filter-input"
            list="known-schemes"
          />
          <datalist id="known-schemes">
            <option value="expert_opinion" />
            <option value="cause_to_effect" />
            <option value="analogy" />
            <option value="practical_reasoning" />
            <option value="position_to_know" />
            <option value="popular_opinion" />
            <option value="sign" />
            <option value="example" />
          </datalist>
        </label>

        <label className="filter">
          <span className="filter-label">Sort</span>
          <select
            name="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof initialSort)}
            className="filter-input"
            aria-label="Sort order"
          >
            <option value="recent">Most recent</option>
            <option value="dialectical_fitness">
              Dialectical fitness (tested-survived)
            </option>
          </select>
        </label>

        <label className="filter">
          <span className="filter-label">Mode</span>
          <select
            name="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof initialMode)}
            className="filter-input"
            aria-label="Retrieval mode"
          >
            <option value="hybrid">Hybrid (recommended)</option>
            <option value="lexical">Match exact words</option>
            <option value="vector">Semantic only</option>
          </select>
        </label>
      </div>

      <details className="quality-details">
        <summary>Quality filters</summary>
        <div className="row filters-row">
          <label className="filter checkbox-filter">
            <input
              type="checkbox"
              checked={testedOnly}
              onChange={(e) => setTestedOnly(e.target.checked)}
            />
            <span>Only tested arguments</span>
          </label>
          <label className="filter">
            <span className="filter-label">Min answered CQs</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={minCq}
              onChange={(e) => setMinCq(e.target.value)}
              placeholder="0"
              className="filter-input"
              aria-label="Minimum SATISFIED critical questions"
            />
          </label>
          <label className="filter">
            <span className="filter-label">Min evidence (with provenance)</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={minEvidence}
              onChange={(e) => setMinEvidence(e.target.value)}
              placeholder="0"
              className="filter-input"
              aria-label="Minimum provenance-anchored evidence rows"
            />
          </label>
          <label className="filter">
            <span className="filter-label">Since</span>
            <input
              type="date"
              value={since}
              onChange={(e) => setSince(e.target.value)}
              className="filter-input"
              aria-label="Created on or after"
            />
          </label>
          <label className="filter">
            <span className="filter-label">Until</span>
            <input
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className="filter-input"
              aria-label="Created on or before"
            />
          </label>
        </div>
      </details>

      <style>{`
        .search-controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: stretch; }
        .primary-row { gap: 8px; }
        .q-input {
          flex: 1 1 320px;
          min-width: 0;
          padding: 12px 14px;
          font-size: 15px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #fff;
          color: #0f172a;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .q-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
        .submit-btn {
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: #6366f1;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .submit-btn:hover { background: #4f46e5; }
        .submit-btn:disabled { background: #94a3b8; cursor: wait; }

        .filters-row {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .filter {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1 1 180px;
          min-width: 0;
        }
        .filter-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .filter-input {
          padding: 8px 10px;
          font-size: 13px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background: #fff;
          color: #0f172a;
          outline: none;
        }
        .filter-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
        }
        .quality-details {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          padding: 8px 12px;
        }
        .quality-details summary {
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 0;
        }
        .quality-details[open] summary { margin-bottom: 8px; }
        .quality-details .filters-row { background: transparent; border: none; padding: 0; }
        .checkbox-filter {
          flex-direction: row;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #0f172a;
        }
        .checkbox-filter input { margin: 0; }
      `}</style>
    </form>
  );
}
