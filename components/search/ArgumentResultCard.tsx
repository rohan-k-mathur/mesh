/**
 * Server-rendered card for a single argument search result.
 *
 * Surfaces the substrate-product features (per
 * /memories/repo/isonomia-substrate-product-claim.md): standingState,
 * dialecticalFitness, attestationUrl, and a deep link into counter-arg
 * discovery (`?against={moid}`). Synthesis-quality features are
 * intentionally absent.
 */
import Link from "next/link";
import type { StandingState } from "@/lib/citations/argumentAttestation";

export type SearchResult = {
  argumentId: string;
  permalink: string;
  shortCode: string;
  version: number;
  text: string;
  conclusion: { claimId: string; moid: string | null; text: string } | null;
  scheme: { key: string; name: string | null; title: string | null } | null;
  standingState: StandingState;
  accessCount: number;
  createdAt: string | null;
  attestationUrl: string;
  lexicalCoverage?: { matched: number; outOf: number };
  hybrid?: {
    rrfScore: number;
    sparseRank: number | null;
    denseRank: number | null;
    denseDistance: number | null;
  };
  dialecticalFitness?: number;
  fitnessBreakdown?: Record<string, number> | null;
  /**
   * Phase 5 — counter-citation discovery. Present iff the request
   * passed `include_strongest_counter=1`. `null` is honest: "we looked
   * and there is no structural contester on file."
   */
  strongestCounter?: {
    argumentId: string;
    shortCode: string;
    permalink: string;
    attestationUrl: string;
    conclusion: { claimId: string; moid: string | null; text: string } | null;
    source: "edge" | "conflict" | "edge+conflict";
  } | null;
};

const STANDING_LABELS: Record<StandingState, { label: string; tone: string }> = {
  "tested-survived": { label: "Tested · Survived", tone: "good" },
  "tested-attacked": { label: "Tested · Under attack", tone: "warn" },
  "tested-undermined": { label: "Tested · Undermined", tone: "bad" },
  "untested-supported": { label: "Untested · Supported", tone: "neutral" },
  "untested-default": { label: "Untested", tone: "muted" },
};

function truncate(s: string, n: number): string {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

export default function ArgumentResultCard({
  result,
}: {
  result: SearchResult;
}) {
  const standing = STANDING_LABELS[result.standingState] ?? STANDING_LABELS["untested-default"];
  const conclusionText = result.conclusion?.text ?? null;
  const argumentText = result.text;
  const moid = result.conclusion?.moid ?? null;
  const counterHref = moid
    ? `/search/arguments?against=${encodeURIComponent(moid)}`
    : null;

  return (
    <article className={`result-card tone-${standing.tone}`}>
      <header className="card-head">
        <span className={`standing-badge tone-${standing.tone}`}>
          {standing.label}
        </span>
        {result.scheme?.key ? (
          <span className="scheme-badge" title={result.scheme.title ?? undefined}>
            {result.scheme.title || result.scheme.name || result.scheme.key}
          </span>
        ) : null}
        {typeof result.dialecticalFitness === "number" ? (
          <span
            className="fitness-chip"
            title="Dialectical fitness — CQs answered + supports − attacks − conflicts + provenance"
          >
            fitness {result.dialecticalFitness.toFixed(2)}
          </span>
        ) : null}
        {result.hybrid ? (
          <span
            className="hybrid-chip"
            title={`RRF ${result.hybrid.rrfScore.toFixed(3)} · sparse #${result.hybrid.sparseRank ?? "—"} · dense #${result.hybrid.denseRank ?? "—"}`}
          >
            hybrid
          </span>
        ) : null}
      </header>

      {conclusionText ? (
        <Link href={`/a/${result.shortCode}`} className="conclusion-link">
          <h2 className="conclusion">{truncate(conclusionText, 240)}</h2>
        </Link>
      ) : null}

      {argumentText && argumentText !== conclusionText ? (
        <p className="argument-text">{truncate(argumentText, 320)}</p>
      ) : null}

      {result.strongestCounter !== undefined ? (
        result.strongestCounter ? (
          <aside
            className="strongest-counter"
            title={`Structural contester (${result.strongestCounter.source})`}
          >
            <span className="sc-label">Strongest counter:</span>{" "}
            <Link
              href={`/a/${result.strongestCounter.shortCode}`}
              className="sc-link"
            >
              {truncate(
                result.strongestCounter.conclusion?.text ??
                  `/a/${result.strongestCounter.shortCode}`,
                200,
              )}
            </Link>
          </aside>
        ) : (
          <aside className="strongest-counter empty" title="No structural contester on file">
            <span className="sc-label">Strongest counter:</span>{" "}
            <span className="sc-empty">none on file</span>
          </aside>
        )
      ) : null}

      <footer className="card-foot">
        <Link href={`/a/${result.shortCode}`} className="permalink">
          /a/{result.shortCode}
        </Link>
        <span className="meta-sep">·</span>
        <span className="meta">v{result.version}</span>
        <span className="meta-sep">·</span>
        <a
          href={result.attestationUrl}
          className="attestation-link"
          rel="nofollow noopener"
          title="Compact citation envelope (JSON)"
        >
          attestation
        </a>
        {counterHref ? (
          <>
            <span className="meta-sep">·</span>
            <Link
              href={counterHref}
              className="counter-link"
              title="Search arguments that contest this conclusion"
            >
              counter-arguments
            </Link>
          </>
        ) : null}
        {result.lexicalCoverage ? (
          <>
            <span className="meta-sep">·</span>
            <span className="meta">
              {result.lexicalCoverage.matched}/{result.lexicalCoverage.outOf} terms
            </span>
          </>
        ) : null}
      </footer>
    </article>
  );
}
