"use client";

/**
 * AI-Epistemic-Infrastructure Demo Page
 *
 * Explanatory walkthrough of Isonomia's AI-citation primitive: every
 * permalink as a machine-citable, dialectically-attested, content-hashed
 * epistemic artifact, exposed over MCP and content-negotiated HTTP.
 *
 * Illustrative — uses inline example payloads rather than hitting live
 * seeded data. For the live-data demo, point at one of the seeded
 * showcase chains (scripts/showcase/) directly.
 *
 * Accessible at: /test/ai-epistemic
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  BookMarked,
  Boxes,
  CheckCircle2,
  Cpu,
  Database,
  Eye,
  ExternalLink,
  FileJson,
  Fingerprint,
  Gauge,
  GitBranch,
  Globe,
  Hash,
  HelpCircle,
  Layers,
  Library,
  Link2,
  ListChecks,
  Lock,
  MessageCircle,
  MessageSquare,
  Network,
  PlugZap,
  Quote,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Terminal,
  Waypoints,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pt. 4 deliberation-scope widgets — dynamically imported so this demo page
// stays cheap on first paint and the SWR fetchers only fire when the user
// actually mounts them with a deliberation id.
const DeliberationStateCard = dynamic(
  () =>
    import("@/components/deliberation/DeliberationStateCard").then(
      (m) => m.DeliberationStateCard,
    ),
  { ssr: false, loading: () => <WidgetLoading label="DeliberationStateCard" /> },
);
const FrontierLane = dynamic(
  () =>
    import("@/components/deliberation/FrontierLane").then((m) => m.FrontierLane),
  { ssr: false, loading: () => <WidgetLoading label="FrontierLane" /> },
);

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT
// ─────────────────────────────────────────────────────────────────────────────

interface PillarCard {
  id: string;
  icon: LucideIcon;
  label: string;
  title: string;
  body: string;
  status: "shipped" | "partial" | "planned";
  evidence: string[];
}

const PILLARS: PillarCard[] = [
  {
    id: "machine-citable",
    icon: FileJson,
    label: "Pillar 1",
    title: "Machine-citable structured arguments",
    body:
      "Every permalink resolves to a structured AIF subgraph (claim, premises, scheme, evidence) — not just prose. LLMs cite a unit, not a webpage.",
    status: "shipped",
    evidence: [
      "Content negotiation: /a/{id} returns HTML, JSON-LD, AIF, or attestation",
      "?format=jsonld emits AIF + Schema.org composite",
      "?format=attestation returns the compact citation envelope",
    ],
  },
  {
    id: "verifiable-provenance",
    icon: Fingerprint,
    label: "Pillar 2",
    title: "Verifiable provenance, end-to-end",
    body:
      "Argument-level: sha256 over the canonical AIF subgraph plus an immutable @hash permalink. Evidence-level: server-side fetch hash + archive.org snapshot. Premise-level: counters surface unattested premises honestly.",
    status: "shipped",
    evidence: [
      "Argument contentHash = sha256 over canonical(claim, premises, scheme, evidence)",
      "Immutable URL: /a/{shortCode}@{hash}",
      "Evidence: contentSha256, archive.url, fetchedAt, contentType",
      "cite_argument exposes provenance.unattestedPremises",
    ],
  },
  {
    id: "dialectical-honesty",
    icon: Swords,
    label: "Pillar 3",
    title: "Dialectical honesty by construction",
    body:
      "The citation primitive ships with its opposition attached. Counter-arguments are surfaced inline, standing scores are classified (not raw floats), and an empty result is honestly empty rather than a false positive.",
    status: "shipped",
    evidence: [
      "cite_argument.strongestObjection (default: on)",
      "standingState: untested-default | tested-attacked | tested-survived | …",
      "find_counterarguments excludes same-conclusion-MOID self-counters",
      "?sort=dialectical_fitness re-ranks by tested-and-survived",
    ],
  },
  {
    id: "standards-grounded",
    icon: Library,
    label: "Pillar 4",
    title: "Standards-grounded interoperability",
    body:
      "AIF + JSON-LD + Schema.org + MCP. No bespoke formats. Any client that speaks one of these can consume Isonomia today.",
    status: "shipped",
    evidence: [
      "AIF context with aif:/as:/cq: prefixes",
      "Schema.org composite: Claim + ScholarlyArticle + ClaimReview",
      "MCP server (6 tools, stdio)",
      "OpenAPI 3.1 spec + Scalar docs at /api/v3/docs (B.3)",
    ],
  },
  {
    id: "shippable",
    icon: Sparkles,
    label: "Pillar 5",
    title: "Shippable on existing infrastructure",
    body:
      "Built on production Isonomia: existing argument graph, existing scheme catalog, existing permalinks. No migration, no second source of truth.",
    status: "shipped",
    evidence: [
      "54/54 attestation verifier passing",
      "37/37 MCP verifier passing",
      "MCP installable into Claude Desktop in three lines",
      "Seedable showcase chain via scripts/seed-showcase-chain.ts",
    ],
  },
  {
    id: "deliberation-honesty",
    icon: Eye,
    label: "Pillar 6",
    title: "Deliberation-scope readiness & honesty (Pt. 4)",
    body:
      "Above the per-argument primitive sits a deliberation-scope substrate: a structural fingerprint, a contested frontier, a missing-moves audit, chain-fragility projections, and a deterministic synthetic readout that refuses to summarise prematurely. Citing a deliberation, not just an argument, comes with the same honesty contract.",
    status: "shipped",
    evidence: [
      "DeliberationFingerprint (counts, depth, CQ coverage, AI-vs-human extraction split)",
      "ContestedFrontier (unanswered undercuts/undermines/CQs, terminal leaves)",
      "MissingMoveReport (per-argument + rollup) + ChainExposure (weakestLink)",
      "SyntheticReadout with deterministic honestyLine + refusalSurface (real graph node ids)",
      "Cross-deliberation aggregation rule (consistent\u2011IN / OUT / contested / undecided)",
      "AI-engagement telemetry \u2192 truthful articulationOnly chip",
      "DeliberationFingerprintCache (contentHash-keyed) + 30s SWR dedupe",
    ],
  },
];

interface TrackRow {
  id: string;
  label: string;
  title: string;
  status: "shipped" | "partial" | "planned";
  note?: string;
}

const TRACKS: { letter: string; name: string; rows: TrackRow[] }[] = [
  {
    letter: "A",
    name: "Make every permalink machine-first",
    rows: [
      { id: "A.1", label: "A.1", title: "Multi-format content negotiation", status: "shipped" },
      { id: "A.2", label: "A.2", title: "Rich JSON-LD (Claim + ScholarlyArticle + ClaimReview activation)", status: "shipped" },
      { id: "A.3", label: "A.3", title: "Stable content addressing (sha256, /a/{id}@{hash})", status: "shipped" },
      { id: "A.4", label: "A.4", title: "Evidence provenance hardening (fetch + hash + archive.org)", status: "shipped" },
    ],
  },
  {
    letter: "B",
    name: "Become the protocol surface LLMs reach for",
    rows: [
      { id: "B.1", label: "B.1", title: ".well-known/llms.txt + argument-graph", status: "shipped" },
      { id: "B.2", label: "B.2", title: "MCP server (search, get, claim, counters, cite, propose)", status: "shipped" },
      { id: "B.3", label: "B.3", title: "OpenAPI 3.1 spec", status: "shipped" },
      { id: "B.4", label: "B.4", title: "Attestation envelope on every retrieval", status: "shipped" },
    ],
  },
  {
    letter: "C",
    name: "Argument-native search & retrieval",
    rows: [
      { id: "C.1", label: "C.1", title: "Hybrid retrieval + dialectical-fitness re-rank", status: "partial", note: "Re-rank function shipped; Pinecone hybrid pending" },
      { id: "C.2", label: "C.2", title: "Stance retrieval (for / against)", status: "partial", note: "v0 textual; true negation index pending" },
      { id: "C.3", label: "C.3", title: "Counter-citation discovery in citation primitive", status: "shipped" },
      { id: "C.4", label: "C.4", title: "Public embedding artifact", status: "planned" },
    ],
  },
  {
    letter: "D",
    name: "Federated, signed, portable arguments",
    rows: [
      { id: "D.1", label: "D.1", title: "Cryptographically signed arguments (Ed25519)", status: "planned" },
      { id: "D.2", label: "D.2", title: "W3C Verifiable Credentials wrapping", status: "planned" },
      { id: "D.3", label: "D.3", title: "AIF/Argdown federation protocol", status: "planned" },
      { id: "D.4", label: "D.4", title: "Replication / archival partnerships", status: "planned" },
    ],
  },
  {
    letter: "E",
    name: "The scholarly-object UX",
    rows: [
      { id: "E.1", label: "E.1", title: "Citation block (APA/MLA/Chicago/BibTeX)", status: "partial", note: "Markdown citation in MCP; on-page formats pending" },
      { id: "E.2", label: "E.2", title: "DOI-style identifiers", status: "planned", note: "Content-hash substrate exists" },
      { id: "E.3", label: "E.3", title: "Argument-object landing-page polish", status: "partial" },
      { id: "E.4", label: "E.4", title: "Cited-by graph", status: "planned", note: "Awaits embed analytics (Phase 4.3)" },
    ],
  },
  {
    letter: "F",
    name: "Deliberation-scope readiness layer (Pt. 4)",
    rows: [
      { id: "F.1", label: "F.1", title: "DeliberationFingerprint + ContestedFrontier + MissingMoveReport", status: "shipped" },
      { id: "F.2", label: "F.2", title: "ChainExposure (weakestLink projection)", status: "shipped" },
      { id: "F.3", label: "F.3", title: "SyntheticReadout (deterministic honestyLine + refusalSurface)", status: "shipped" },
      { id: "F.4", label: "F.4", title: "Cross-deliberation aggregation (consistent-IN / OUT / contested)", status: "shipped" },
      { id: "F.5", label: "F.5", title: "AiDraftEngagement telemetry \u2192 articulationOnly chip", status: "shipped" },
      { id: "F.6", label: "F.6", title: "DeliberationFingerprintCache + SWR dedupe", status: "shipped" },
      { id: "F.7", label: "F.7", title: "7 new MCP tools + 6 new HTTP endpoints", status: "shipped" },
      { id: "F.8", label: "F.8", title: "MaterialCard + propose_materials (review-track)", status: "planned" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE PAYLOADS (illustrative; do not hit a live endpoint)
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_ATTESTATION = {
  permalink: "https://isonomia.app/a/Bx7kQ2mN",
  immutablePermalink:
    "https://isonomia.app/a/Bx7kQ2mN@7c1a4f0e2b9d8c6a5e4f3d2c1b0a9988",
  contentHash:
    "sha256:7c1a4f0e2b9d8c6a5e4f3d2c1b0a99887766554433221100ffeeddccbbaa9988",
  version: 3,
  retrievedAt: "2026-04-29T12:34:56Z",
  conclusion: {
    moid: "9f1b3a…",
    text: "Smartphone-based social media use is a primary cause of the post-2012 rise in adolescent depression and anxiety.",
  },
  scheme: { key: "cause_to_effect", name: "Argument from Cause to Effect" },
  premises: [
    { moid: "p1…", text: "Adolescent depression rose sharply post-2012…" },
    { moid: "p2…", text: "Jonathan Haidt has reviewed the literature…" },
    { moid: "p3…", text: "Several studies report a dose-response relationship…" },
  ],
  evidence: [
    {
      uri: "https://www.anxiousgeneration.com/book",
      contentSha256: "sha256:b3a2…",
      archive: { url: "https://web.archive.org/web/2026.../…", capturedAt: "2026-04-29T12:34:50Z" },
      fetchedAt: "2026-04-29T12:34:48Z",
    },
    { uri: "https://www.hhs.gov/sites/default/files/sg-youth-mental-health…", contentSha256: "sha256:7e5c…", archive: { url: "…" } },
    { uri: "https://jonathanhaidt.substack.com/p/the-evidence-keeps-piling-up", contentSha256: null, archive: { url: null } },
  ],
  dialecticalStatus: {
    incomingAttacks: 1,
    incomingSupports: 0,
    incomingAttackEdges: 1,
    criticalQuestionsRequired: 5,
    criticalQuestionsAnswered: 1,
    criticalQuestionsOpen: 4,
    isTested: true,
    testedness: "lightly_tested",
    standingScore: 0.62,
  },
  author: { username: "panand", name: "Dr. Priya Anand" },
};

const EXAMPLE_CITE = {
  permalink: "https://isonomia.app/a/Bx7kQ2mN",
  immutablePermalink:
    "https://isonomia.app/a/Bx7kQ2mN@7c1a4f0e2b9d8c6a5e4f3d2c1b0a9988",
  contentHash: "sha256:7c1a4f0e2b9d…",
  version: 3,
  retrievedAt: "2026-04-29T12:34:56Z",
  pullQuote:
    "Smartphone-based social media use is a primary cause of the post-2012 rise in adolescent depression and anxiety.",
  dialecticalStatus: {
    standingScore: 0.62,
    standingState: "tested-attacked",
    testedness: "lightly_tested",
    criticalQuestionsAnswered: 1,
    criticalQuestionsRequired: 5,
    incomingAttacks: 1,
    incomingSupports: 0,
  },
  provenance: {
    premiseCount: 3,
    evidenceAttachedCount: 3,
    evidenceWithProvenanceCount: 2,
    unattestedPremises: false,
  },
  strongestObjection: {
    permalink: "https://isonomia.app/a/Q9pT3nLk",
    shortCode: "Q9pT3nLk",
    conclusionText:
      "The available evidence shows only small, inconsistent associations between adolescent social media use and mental health outcomes, insufficient to establish smartphones as a primary cause.",
    scheme: "expert_opinion",
    dialecticalFitness: 1.25,
    attestationUrl:
      "https://isonomia.app/api/a/Q9pT3nLk/aif?format=attestation",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: TrackRow["status"] }) {
  const map = {
    shipped: { label: "shipped", cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    partial: { label: "partial", cls: "bg-amber-50 border-amber-200 text-amber-700" },
    planned: { label: "planned", cls: "bg-slate-50 border-slate-200 text-slate-500" },
  } as const;
  const m = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${m.cls}`}
    >
      {status === "shipped" && <CheckCircle2 className="w-3 h-3" />}
      {m.label}
    </span>
  );
}

function CodeBlock({
  language = "json",
  children,
}: {
  language?: string;
  children: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-950/95 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/80">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          {language}
        </span>
      </div>
      <pre className="text-[12px] leading-relaxed text-slate-100 px-4 py-3 overflow-x-auto font-mono whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTIONS
// ─────────────────────────────────────────────────────────────────────────────

function PillarsSection() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-800">The five pillars</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          What an Isonomia permalink means when an LLM cites it.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 border border-indigo-100">
                  <Icon className="w-5 h-5" />
                </div>
                <StatusPill status={p.status} />
              </div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                {p.label}
              </p>
              <h3 className="text-base font-semibold text-slate-800 mt-0.5 leading-snug">
                {p.title}
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{p.body}</p>
              <ul className="mt-3 space-y-1.5">
                {p.evidence.map((e) => (
                  <li
                    key={e}
                    className="flex items-start gap-1.5 text-[12px] text-slate-500"
                  >
                    <ArrowRight className="w-3 h-3 mt-1 text-slate-400 shrink-0" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TracksSection() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Roadmap tracks</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Five capability tracks, ordered by leverage. Each is independently
          shippable.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TRACKS.map((t) => (
          <div
            key={t.letter}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-3xl font-bold text-slate-300 leading-none">
                {t.letter}
              </span>
              <h3 className="text-sm font-semibold text-slate-700">{t.name}</h3>
            </div>
            <ul className="space-y-2">
              {t.rows.map((r) => (
                <li key={r.id} className="flex items-start gap-2.5">
                  <span className="text-[10px] font-mono font-semibold text-slate-400 mt-0.5 w-7 shrink-0">
                    {r.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] text-slate-700 leading-snug">
                        {r.title}
                      </span>
                      <StatusPill status={r.status} />
                    </div>
                    {r.note && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{r.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function PermalinkExplainer() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500" /> One URL, four representations
        </p>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          The same permalink resolves differently depending on what asks for it.
          Browsers get HTML; LLM clients get the AIF subgraph; citation managers
          get JSON-LD; and the compact attestation envelope is one query
          parameter away.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { hdr: "Accept: text/html", body: "Human page (claim, premises, scheme, evidence)" },
            { hdr: "Accept: application/ld+json", body: "Rich JSON-LD: Claim + ScholarlyArticle + AIF + ClaimReview" },
            { hdr: "Accept: application/json", body: "AIF graph (RA + I-nodes, conflict, support)" },
            { hdr: "?format=attestation", body: "Compact citation envelope (the LLM unit)" },
          ].map((row) => (
            <div
              key={row.hdr}
              className="rounded-md border border-slate-200 bg-slate-50/60 p-3"
            >
              <p className="text-[11px] font-mono text-indigo-700 mb-1">{row.hdr}</p>
              <p className="text-[12px] text-slate-600 leading-snug">{row.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Hash className="w-4 h-4 text-slate-500" /> Content addressing
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Every argument's canonical AIF subgraph is hashed (sha256, sorted-keys
          JSON). The hash and the version number ride alongside the permalink in
          response headers and an immutable URL form, so a citation can pin to
          the exact state of the argument at retrieval time.
        </p>
        <CodeBlock language="http">
{`HTTP/1.1 200 OK
Content-Type: application/json
ETag: "sha256:7c1a4f0e2b9d…"
Link: </a/Bx7kQ2mN@7c1a4f0e2b9d8c6a5e4f3d2c1b0a9988>; rel="canonical"
X-Isonomia-Content-Hash: sha256:7c1a4f0e2b9d…
X-Isonomia-Permalink-Version: 3`}
        </CodeBlock>
        <p className="text-[12px] text-slate-500">
          The mutable form (<span className="font-mono text-slate-700">/a/Bx7kQ2mN</span>) follows
          edits; the immutable form
          (<span className="font-mono text-slate-700">/a/Bx7kQ2mN@&lt;hash&gt;</span>) is forever.
        </p>
      </div>
    </div>
  );
}

function AttestationExplainer() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500" /> The attestation envelope
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          What an LLM should embed when it cites Isonomia. Verifiable, dated,
          and dialectically scored — the unit a careful reasoner would want.
        </p>
      </div>
      <CodeBlock>{JSON.stringify(EXAMPLE_ATTESTATION, null, 2)}</CodeBlock>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide mb-1">
            Argument-level provenance
          </p>
          <p className="text-[12px] text-slate-600 leading-snug">
            <span className="font-mono">contentHash</span> +{" "}
            <span className="font-mono">immutablePermalink</span> pin the exact
            graph state. <span className="font-mono">version</span> ratchets on
            each edit.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide mb-1">
            Evidence-level provenance
          </p>
          <p className="text-[12px] text-slate-600 leading-snug">
            <span className="font-mono">contentSha256</span> proves what the
            source said when fetched.{" "}
            <span className="font-mono">archive.url</span> survives link rot.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide mb-1">
            Dialectical state
          </p>
          <p className="text-[12px] text-slate-600 leading-snug">
            CQ counters, inbound attacks/supports,{" "}
            <span className="font-mono">testedness</span> bucket, and a{" "}
            <span className="font-mono">standingScore</span> that is{" "}
            <em>null</em> when there's no signal — never a misleading 1.0.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide mb-1">
            Author
          </p>
          <p className="text-[12px] text-slate-600 leading-snug">
            Stable handle for downstream citation. Future:{" "}
            <span className="font-mono">Ed25519</span> signature wraps the
            envelope (Track D.1).
          </p>
        </div>
      </div>
    </div>
  );
}

function CounterCitationExplainer() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-5">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600 shrink-0">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-800">
              No other citation system in the world does this
            </p>
            <p className="text-sm text-rose-700 mt-1 leading-relaxed">
              When an LLM calls{" "}
              <span className="font-mono">cite_argument</span>, the citation
              block arrives with the strongest known counter-argument
              <em> already attached</em>. There is no path to citing an
              Isonomia argument that hides what attacks it.
            </p>
          </div>
        </div>
      </div>
      <CodeBlock>{JSON.stringify(EXAMPLE_CITE, null, 2)}</CodeBlock>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-slate-500" /> standingState — readable, not raw
        </p>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          A naive consumer reading <span className="font-mono">standingScore: 1.0</span>{" "}
          might infer "this argument has survived everything." That can be
          misleading: a scheme requiring zero critical questions, with no
          inbound traffic, would also produce 1.0. So we classify:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { state: "untested-default", note: "scheme requires no CQs, no inbound traffic — score is null", cls: "border-slate-200 bg-slate-50 text-slate-600" },
            { state: "untested-supported", note: "no attacks yet, but supports present", cls: "border-blue-200 bg-blue-50 text-blue-700" },
            { state: "tested-attacked", note: "inbound attacks exist, some CQ work has been done", cls: "border-amber-200 bg-amber-50 text-amber-700" },
            { state: "tested-undermined", note: "attacked, no CQs answered yet", cls: "border-rose-200 bg-rose-50 text-rose-700" },
            { state: "tested-survived", note: "CQs answered, no live attacks", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
          ].map((row) => (
            <div
              key={row.state}
              className={`rounded-md border p-3 ${row.cls}`}
            >
              <p className="text-[12px] font-mono font-semibold">{row.state}</p>
              <p className="text-[11px] mt-0.5 leading-snug opacity-90">{row.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface LiveResult {
  argumentId: string;
  permalink: string;
  shortCode: string;
  version: number;
  text: string;
  conclusion: { claimId: string; moid: string; text: string } | null;
  scheme: { key: string; name: string; title?: string } | null;
  accessCount: number;
  createdAt: string | null;
  attestationUrl: string;
  dialecticalFitness?: number;
}

function LiveVerification() {
  const [results, setResults] = useState<LiveResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ count: number; sort: string; fetchedAt: string } | null>(
    null
  );

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/v3/search/arguments?sort=dialectical_fitness&limit=3",
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setResults(json.results ?? []);
      setMeta({
        count: json.count ?? 0,
        sort: json.query?.sort ?? "recent",
        fetchedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Live call against this server
              </p>
              <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
                Hits{" "}
                <span className="font-mono text-[12px] bg-white/60 px-1.5 py-0.5 rounded border border-emerald-200">
                  GET /api/v3/search/arguments?sort=dialectical_fitness&amp;limit=3
                </span>{" "}
                and renders the top three. Each row links to the live
                permalink and to its attestation envelope.
              </p>
            </div>
          </div>
          <button
            onClick={run}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {results === null ? "Run live query" : loading ? "Fetching…" : "Re-run"}
          </button>
        </div>
        {meta && (
          <p className="text-[11px] text-emerald-600 mt-3 font-mono">
            sort={meta.sort} · count={meta.count} · {meta.fetchedAt}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700">
          <span className="font-semibold">Fetch failed:</span> {error}
        </div>
      )}

      {results && results.length === 0 && !loading && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-[13px] text-slate-600">
          No public arguments returned. Seed a showcase chain via{" "}
          <span className="font-mono">scripts/seed-showcase-chain.ts</span>.
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div
              key={r.argumentId}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {r.scheme && (
                      <span className="text-[10px] uppercase font-semibold tracking-wide text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                        {r.scheme.name}
                      </span>
                    )}
                    {typeof r.dialecticalFitness === "number" && (
                      <span className="text-[10px] uppercase font-semibold tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                        fitness {r.dialecticalFitness.toFixed(2)}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">
                      v{r.version} · {r.shortCode}
                    </span>
                  </div>
                  {r.conclusion && (
                    <p className="text-[13px] text-slate-800 font-medium leading-snug mb-1">
                      {r.conclusion.text}
                    </p>
                  )}
                  {r.text && r.text !== r.conclusion?.text && (
                    <p className="text-[12px] text-slate-500 leading-snug line-clamp-2">
                      {r.text}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <a
                      href={r.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      <Link2 className="w-3 h-3" />
                      permalink
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <a
                      href={r.attestationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      attestation
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    {r.accessCount > 0 && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {r.accessCount} accesses
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results === null && !loading && !error && (
        <p className="text-[12px] text-slate-500 italic">
          Click <span className="font-semibold">Run live query</span> to call
          the local API. Nothing is fetched on page load.
        </p>
      )}
    </div>
  );
}

function McpExplainer() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <PlugZap className="w-4 h-4 text-slate-500" /> Argument primitive — 6 tools
        </p>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          The MCP server is a stateless wrapper over the public API.
          Installable into Claude Desktop, Cursor, Cline, Continue, or any
          MCP-speaking client in three lines of config.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: "search_arguments", desc: "Free-text search; supports sort=dialectical_fitness", icon: Search },
            { name: "get_argument", desc: "Full attestation envelope by permalink", icon: FileJson },
            { name: "get_claim", desc: "Claim by MOID + supporting permalinks", icon: Quote },
            { name: "find_counterarguments", desc: "Counter-arguments for a target claim; honest-empty", icon: Swords },
            { name: "cite_argument", desc: "Citation block + strongest objection + provenance counters", icon: Award },
            { name: "propose_argument", desc: "Create a new argument (token-gated)", icon: MessageCircle },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.name}
                className="rounded-md border border-slate-200 bg-slate-50/60 p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[12px] font-mono font-semibold text-slate-800">
                    {t.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">{t.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-5">
        <p className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-700" /> Deliberation primitive — 7 new tools (Pt. 4)
        </p>
        <p className="text-sm text-amber-800/90 leading-relaxed mb-4">
          The deliberation-scope substrate is exposed over the same MCP
          surface. These tools let an LLM ask <em>"is this debate ready to
          summarise?"</em> before it tries to.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: "get_deliberation_fingerprint", desc: "Counts, depth, CQ coverage, AI-vs-human extraction split", icon: Fingerprint },
            { name: "get_contested_frontier", desc: "Unanswered undercuts/undermines/CQs + terminal leaves", icon: Swords },
            { name: "get_missing_moves", desc: "Per-argument + rollup audit of structurally missing moves", icon: ListChecks },
            { name: "get_chains", desc: "Inference chains projected from the graph + weakestLink", icon: GitBranch },
            { name: "get_synthetic_readout", desc: "Editorial primitive: deterministic honestyLine + refusalSurface", icon: BookMarked },
            { name: "summarize_debate", desc: "Refusal-aware narrative; refuses with cited blockers when not ready", icon: MessageSquare },
            { name: "get_cross_context", desc: "Cross-deliberation acceptance: consistent-IN / OUT / contested", icon: Network },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.name}
                className="rounded-md border border-amber-200/80 bg-white/80 p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-[12px] font-mono font-semibold text-slate-800">
                    {t.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">{t.desc}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-md border border-amber-200/70 bg-white/60 p-3">
          <p className="text-[11px] uppercase font-semibold tracking-wide text-amber-800 mb-1.5">
            HTTP equivalents
          </p>
          <ul className="text-[11px] font-mono text-slate-700 space-y-0.5">
            <li>GET /api/v3/deliberations/&#123;id&#125;/fingerprint</li>
            <li>GET /api/v3/deliberations/&#123;id&#125;/frontier</li>
            <li>GET /api/v3/deliberations/&#123;id&#125;/missing-moves</li>
            <li>GET /api/v3/deliberations/&#123;id&#125;/chains</li>
            <li>GET /api/v3/deliberations/&#123;id&#125;/synthetic-readout</li>
            <li>GET /api/v3/deliberations/&#123;id&#125;/cross-context</li>
          </ul>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-500" /> Claude Desktop config
        </p>
        <CodeBlock language="json">{`{
  "mcpServers": {
    "isonomia": {
      "command": "node",
      "args": ["/abs/path/to/packages/isonomia-mcp/dist/server.js"],
      "env": {
        "ISONOMIA_BASE_URL": "https://isonomia.app",
        "ISONOMIA_API_TOKEN": "<optional, only for propose_argument>"
      }
    }
  }
}`}</CodeBlock>
      </div>
    </div>
  );
}

function FlowExplainer() {
  const steps = [
    {
      n: 1,
      title: "User asks an LLM about a contested issue",
      body: '"Is social media driving the teen mental health crisis?"',
      icon: HelpCircle,
    },
    {
      n: 2,
      title: "LLM searches Isonomia via MCP",
      body: "search_arguments(query, sort='dialectical_fitness') → ranked permalinks with attestation URLs",
      icon: Search,
    },
    {
      n: 3,
      title: "LLM fetches attestation envelopes",
      body: "get_argument(permalink) → AIF subgraph + content hash + dialectical state + provenance",
      icon: FileJson,
    },
    {
      n: 4,
      title: "LLM cites with the counter attached",
      body: "cite_argument(permalink) → markdown citation + standingState + strongestObjection",
      icon: Quote,
    },
    {
      n: 5,
      title: "User can verify, audit, and contest",
      body: "Click the immutable @hash URL → the exact state at citation time. File a counter-argument via propose_argument.",
      icon: ShieldCheck,
    },
  ];
  return (
    <div className="space-y-3">
      {steps.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.n}
            className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center">
                {s.n}
              </span>
              {s.n < steps.length && <span className="w-px h-6 bg-slate-200" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-800">{s.title}</p>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">{s.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

function WidgetLoading({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-[12px] text-slate-500">
      Loading <span className="font-mono">{label}</span>…
    </div>
  );
}

function DeliberationReadoutTab() {
  const [pendingId, setPendingId] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              Deliberation readiness — the layer above the citation primitive
            </p>
            <p className="text-sm text-amber-800/90 mt-1 leading-relaxed">
              The Pt. 4 substrate publishes a structural fingerprint, a
              contested frontier, a missing-moves audit, chain fragility, and
              cross-deliberation acceptance for any deliberation in the
              system. The widgets below mount the same primitives that ship
              inside DeepDive and the embeddable widget. Paste a deliberation
              id to see live data.
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={pendingId}
                onChange={(e) => setPendingId(e.target.value)}
                placeholder="deliberationId (uuid or slug)"
                className="flex-1 min-w-[240px] px-3 py-1.5 rounded-md border border-amber-300 bg-white text-[12px] font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                onClick={() => setActiveId(pendingId.trim() || null)}
                disabled={!pendingId.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Mount widgets
              </button>
              {activeId && (
                <button
                  onClick={() => setActiveId(null)}
                  className="text-[11px] text-amber-700 hover:text-amber-900 underline"
                >
                  unmount
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeId ? (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase font-semibold tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
              <Fingerprint className="w-3 h-3" /> DeliberationStateCard
            </p>
            <DeliberationStateCard deliberationId={activeId} />
          </div>
          <div>
            <p className="text-[11px] uppercase font-semibold tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
              <Swords className="w-3 h-3" /> FrontierLane
            </p>
            <FrontierLane deliberationId={activeId} />
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-slate-500 italic">
          No widgets mounted. Paste a deliberation id and click{" "}
          <span className="font-semibold">Mount widgets</span> to fetch live
          synthetic-readout + frontier data.
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500" /> Honesty invariants
        </p>
        <ul className="text-[12px] text-slate-600 leading-relaxed space-y-1.5 list-disc pl-5">
          <li>
            <span className="font-mono text-slate-800">honestyLine</span> is a
            deterministic template — no generative prose. The same fingerprint
            always renders the same string.
          </li>
          <li>
            <span className="font-mono text-slate-800">refusalSurface.blockerIds</span>{" "}
            cite real graph node ids. <span className="font-mono">summarize_debate</span>{" "}
            refuses with these citations rather than confabulating.
          </li>
          <li>
            <span className="font-mono text-slate-800">articulationOnly</span>{" "}
            chip is gated by 30-day rolling{" "}
            <span className="font-mono">AiDraftEngagement</span> — it only
            appears when humans have not actually engaged with AI-seeded
            drafts.
          </li>
          <li>
            Cross-deliberation aggregation rule:{" "}
            <span className="font-mono">consistent-IN</span> /{" "}
            <span className="font-mono">consistent-OUT</span> /{" "}
            <span className="font-mono">contested</span> /{" "}
            <span className="font-mono">undecided</span> — no implicit
            majority-wins.
          </li>
          <li>
            <span className="font-mono text-slate-800">DeliberationFingerprintCache</span>{" "}
            keyed by <span className="font-mono">contentHash</span> — cache
            hit is O(1); SWR dedupes within 30s.
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5">
        <p className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
          <Waypoints className="w-4 h-4 text-indigo-700" /> Embeddable surface
        </p>
        <p className="text-sm text-indigo-800/90 mt-1 leading-relaxed">
          The same primitives are wired into{" "}
          <a
            href="/test/embeddable-widget-pt4"
            className="underline font-semibold hover:text-indigo-900"
          >
            /test/embeddable-widget-pt4
          </a>{" "}
          (IsonomiaWidget §6) so any host page can render a deliberation
          readout in an iframe.
        </p>
      </div>
    </div>
  );
}

export default function AIEpistemicInfrastructurePage() {
  const [tab, setTab] = useState("permalink");
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-700 border border-indigo-500/20 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                AI-Epistemic Infrastructure
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 border border-emerald-200/80 text-emerald-700">
                Tracks A + B + C.3 + F shipped
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 border border-amber-200/80 text-amber-700">
                Pt. 4 deliberation readout live
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 border border-indigo-200/80 text-indigo-700">
                Four-week pitch deliverable
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              The argument primitive for AI citation
            </h1>
            <p className="text-base text-slate-600 max-w-3xl leading-relaxed">
              Every Isonomia permalink is an addressable, structured,
              verifiable, machine-citable epistemic artifact. It carries a
              canonical claim, attested evidence with provenance, a typed
              inference (scheme + critical questions), the dialectical context
              that has tested it, and a cryptographically stable identifier.
              LLMs need exactly this shape of unit when they cite.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: "Content-negotiated permalinks", color: "bg-indigo-100 text-indigo-700" },
                { label: "AIF + JSON-LD + Schema.org", color: "bg-violet-100 text-violet-700" },
                { label: "sha256 content addressing", color: "bg-fuchsia-100 text-fuchsia-700" },
                { label: "archive.org evidence snapshots", color: "bg-amber-100 text-amber-700" },
                { label: "MCP server (13 tools)", color: "bg-teal-100 text-teal-700" },
                { label: "Counter-citation by default", color: "bg-rose-100 text-rose-700" },
                { label: "Honest-empty failure mode", color: "bg-emerald-100 text-emerald-700" },
                { label: "Dialectical-fitness re-rank", color: "bg-yellow-100 text-yellow-700" },
                { label: "Synthetic readout (deterministic)", color: "bg-amber-100 text-amber-800" },
                { label: "Cross-deliberation aggregation", color: "bg-sky-100 text-sky-700" },
                { label: "AI-engagement telemetry", color: "bg-violet-100 text-violet-800" },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${chip.color}`}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          </div>

          {/* Vision callout */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-indigo-800 text-sm">Thesis</p>
                <p className="text-sm text-indigo-700 mt-1 leading-relaxed">
                  Citations today cite <em>prose</em>. URLs point at webpages
                  whose state can drift, whose evidence isn't hashed, whose
                  reasoning isn't typed, and whose opposition isn't surfaced.
                  Isonomia citations cite <em>adjudicated reasoning</em>: a
                  structured argument graph with provenance, dialectical
                  status, and the strongest known counter attached. This is
                  what scalable-oversight and retrieval-augmented systems need
                  — and it's standards-grounded, shippable today.
                </p>
              </div>
            </div>
          </div>

          {/* Pillars */}
          <PillarsSection />

          {/* End-to-end flow */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-800">
                End-to-end flow
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                What happens when a user asks an LLM about a contested issue
                with the Isonomia MCP server installed.
              </p>
            </div>
            <FlowExplainer />
          </section>

          {/* Roadmap tracks */}
          <TracksSection />

          {/* Deep-dive tabs */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Deep dive</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                The actual shapes — permalink contracts, attestation envelope,
                counter-citation reflex, and the MCP surface.
              </p>
            </div>
            <Tabs value={tab} onValueChange={setTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="permalink" className="gap-1.5">
                  <Link2 className="w-4 h-4" />
                  Permalink
                </TabsTrigger>
                <TabsTrigger value="attestation" className="gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Attestation
                </TabsTrigger>
                <TabsTrigger value="counter" className="gap-1.5">
                  <Swords className="w-4 h-4" />
                  Counter-citation
                </TabsTrigger>
                <TabsTrigger value="mcp" className="gap-1.5">
                  <PlugZap className="w-4 h-4" />
                  MCP
                </TabsTrigger>
                <TabsTrigger value="deliberation" className="gap-1.5">
                  <Eye className="w-4 h-4" />
                  Deliberation (Pt. 4)
                </TabsTrigger>
                <TabsTrigger value="live" className="gap-1.5">
                  <Activity className="w-4 h-4" />
                  Live verification
                </TabsTrigger>
              </TabsList>
              <TabsContent value="permalink">
                <PermalinkExplainer />
              </TabsContent>
              <TabsContent value="attestation">
                <AttestationExplainer />
              </TabsContent>
              <TabsContent value="counter">
                <CounterCitationExplainer />
              </TabsContent>
              <TabsContent value="mcp">
                <McpExplainer />
              </TabsContent>
              <TabsContent value="deliberation">
                <DeliberationReadoutTab />
              </TabsContent>
              <TabsContent value="live">
                <LiveVerification />
              </TabsContent>
            </Tabs>
          </section>

          {/* Audience callout */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-slate-500" /> Three audiences converge here
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  who: "Scalable-oversight researchers",
                  examples: "Schmidt Sciences, OpenPhil, ARIA, Anthropic Society & Alignment, METR",
                  need: "Argument-shaped artifacts that humans and AIs can co-evaluate",
                },
                {
                  who: "Retrieval-augmented LLM builders",
                  examples: "Perplexity, You, OpenAI, Anthropic, Google",
                  need: "Citations that point at adjudicated reasoning, not prose",
                },
                {
                  who: "Fact-checking & journalism",
                  examples: "ClaimReview consortium, Google Fact Check, IFCN signatories",
                  need: "Schema.org primitives backed by structured arguments at scale",
                },
              ].map((a) => (
                <div
                  key={a.who}
                  className="rounded-md border border-slate-200 bg-slate-50/60 p-3"
                >
                  <p className="text-[12px] font-semibold text-slate-800">{a.who}</p>
                  <p className="text-[11px] text-slate-500 mt-1 italic">{a.examples}</p>
                  <p className="text-[12px] text-slate-600 mt-2 leading-snug">{a.need}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div className="text-center text-[12px] text-slate-400 pb-4">
            <p className="flex items-center justify-center gap-1.5 flex-wrap">
              <Activity className="w-3 h-3" />
              Live verifiers: 54/54 attestation · 37/37 MCP
              <span className="mx-2">·</span>
              <a
                href="/test/living-thesis"
                className="text-indigo-500 hover:text-indigo-700 inline-flex items-center gap-1"
              >
                Living Thesis demo
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="mx-2">·</span>
              <a
                href="/test/embeddable-widget-pt4"
                className="text-amber-600 hover:text-amber-800 inline-flex items-center gap-1"
              >
                Embeddable widget (Pt. 4)
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
