import { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolvePermalink } from "@/lib/citations/permalinkService";
import {
  buildArgumentAttestation,
  type ArgumentAttestation,
} from "@/lib/citations/argumentAttestation";
import {
  buildArgumentJsonLd,
  buildCitationMetaTags,
} from "@/lib/citations/argumentJsonLd";
import {
  toApa,
  toMla,
  toChicago,
  toBibTeX,
  toRis,
  toCslJson,
} from "@/lib/citation/formats";
import CitationExportWidget from "@/components/citation/CitationExportWidget";
import { prisma } from "@/lib/prismaclient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ identifier: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://isonomia.app";

/**
 * Track A.1 — content negotiation.
 *
 * Browsers asking for HTML get the page; AI agents and JSON-LD consumers
 * asking for `application/ld+json` (or anyone passing `?format=aif|jsonld|attestation`)
 * get redirected to the machine-citable representation at /api/a/[id]/aif.
 */
function prefersJsonLd(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;
  const accept = acceptHeader.toLowerCase();
  // Only treat as JSON-LD preference when *not* asking for HTML at all
  if (accept.includes("text/html")) return false;
  return (
    accept.includes("application/ld+json") ||
    accept.includes("application/json") ||
    accept.includes("application/aif+json")
  );
}

function parseFormatParam(
  raw: string | string[] | undefined
): "aif" | "jsonld" | "attestation" | null {
  const v = (Array.isArray(raw) ? raw[0] : raw || "").toLowerCase();
  if (v === "aif") return "aif";
  if (v === "jsonld" || v === "json-ld" || v === "rich") return "jsonld";
  if (v === "attestation" || v === "envelope") return "attestation";
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { identifier } = await params;

  const resolved = await resolvePermalink(identifier);
  let argumentId = identifier;
  if (resolved) argumentId = resolved.argumentId;

  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: {
      text: true,
      conclusion: { select: { text: true } },
      deliberation: { select: { title: true } },
    },
  });

  if (!argument) {
    return { title: "Argument not found — Isonomia" };
  }

  const conclusionText = argument.conclusion?.text ?? null;
  const title = conclusionText
    ? `${conclusionText.slice(0, 80)}${conclusionText.length > 80 ? "…" : ""}`
    : argument.text.slice(0, 80) + (argument.text.length > 80 ? "…" : "");

  const ogImageUrl = `${BASE_URL}/api/og/argument/${identifier}`;
  const embedUrl = `${BASE_URL}/embed/argument/${identifier}`;
  const canonicalUrl = `${BASE_URL}/a/${identifier}`;
  const aifUrl = `${BASE_URL}/api/a/${identifier}/aif`;

  return {
    title: `${title} — Isonomia`,
    description: argument.text.slice(0, 200),
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: canonicalUrl,
      types: {
        "application/json+oembed": `${BASE_URL}/api/oembed?url=${encodeURIComponent(embedUrl)}`,
        "application/ld+json": `${aifUrl}?format=aif`,
        "application/json": `${aifUrl}?format=attestation`,
      },
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: `${title} — Isonomia`,
      description: argument.text.slice(0, 200),
      siteName: "Isonomia",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Isonomia`,
      description: argument.text.slice(0, 200),
      images: [ogImageUrl],
    },
  };
}

export default async function ArgumentPage({ params, searchParams }: PageProps) {
  const { identifier } = await params;
  const sp = (await searchParams) || {};

  // ---- Track A.1: content negotiation ----
  // Explicit ?format= query wins over Accept-header sniffing.
  const explicitFormat = parseFormatParam(sp.format);
  if (explicitFormat) {
    redirect(`${BASE_URL}/api/a/${identifier}/aif?format=${explicitFormat}`);
  }
  // Note: headers() is async in Next.js 15 but compatible when awaited.
  const h = await headers();
  if (prefersJsonLd(h.get("accept"))) {
    redirect(`${BASE_URL}/api/a/${identifier}/aif?format=aif`);
  }

  const resolved = await resolvePermalink(identifier);
  let argumentId = identifier;
  if (resolved) argumentId = resolved.argumentId;

  // Build the attestation envelope in parallel with the page-render query;
  // we still hydrate the page from the existing fetch (richer relations) but
  // the JSON-LD now derives from the canonical attestation primitive.
  const attestationPromise: Promise<ArgumentAttestation | null> =
    buildArgumentAttestation(argumentId, identifier);

  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: {
      id: true,
      text: true,
      confidence: true,
      conclusion: {
        select: {
          id: true,
          text: true,
          moid: true,
          ClaimEvidence: {
            select: { id: true, title: true, uri: true, citation: true },
            take: 10,
          },
        },
      },
      premises: {
        select: {
          isImplicit: true,
          claim: { select: { id: true, text: true, moid: true } },
        },
        take: 10,
      },
      argumentSchemes: {
        select: {
          isPrimary: true,
          scheme: { select: { id: true, name: true, title: true, summary: true } },
        },
        orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
        take: 3,
      },
      deliberation: { select: { id: true, title: true } },
      permalink: { select: { shortCode: true, permalinkUrl: true, accessCount: true } },
    },
  });

  const canonicalUrl = `${BASE_URL}/a/${identifier}`;
  const embedUrl = `${BASE_URL}/embed/argument/${identifier}`;

  if (!argument) {
    return (
      <main className="page">
        <style>{pageStyles()}</style>
        <div className="not-found">
          <h1>Argument not found</h1>
          <p>This argument may have been removed or the link is invalid.</p>
          <Link href={BASE_URL}>← Back to Isonomia</Link>
        </div>
      </main>
    );
  }

  const confidence =
    argument.confidence !== null && argument.confidence !== undefined
      ? Math.round(argument.confidence * 100)
      : null;

  const primaryScheme = argument.argumentSchemes.find((s) => s.isPrimary) ||
    argument.argumentSchemes[0];

  // ---- Track A.2: rich composite JSON-LD via attestation envelope ----
  // Falls back to a minimal CreativeWork node if attestation building failed
  // (defensive — should not happen in practice).
  const attestation = await attestationPromise;
  const jsonLd = attestation
    ? buildArgumentJsonLd(attestation)
    : {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        url: canonicalUrl,
        name: argument.conclusion?.text
          ? `Argument: ${argument.conclusion.text.slice(0, 100)}`
          : "Argument",
        text: argument.text,
      };

  const citationMetaTags = attestation
    ? buildCitationMetaTags(attestation)
    : [];

  const iframeEmbed = `<iframe src="${embedUrl}" width="600" height="400" frameborder="0" style="border:1px solid #e5e7eb;border-radius:8px;" title="Isonomia Argument" loading="lazy"></iframe>`;

  return (
    <main className="page">
      <style>{pageStyles()}</style>

      {/* JSON-LD (rich composite: Schema.org + AIF + attestation envelope) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Citation meta tags for Zotero / Google Scholar / scholarly tooling */}
      {citationMetaTags.map((tag) => (
        <meta key={tag.name} name={tag.name} content={tag.content} />
      ))}

      {/* Track A.1 \u2014 alternate machine-citable representations */}
      <link
        rel="alternate"
        type="application/ld+json"
        href={`${BASE_URL}/api/a/${identifier}/aif?format=aif`}
        title="AIF-JSON-LD subgraph"
      />
      <link
        rel="alternate"
        type="application/ld+json"
        href={`${BASE_URL}/api/a/${identifier}/aif?format=jsonld`}
        title="Rich composite JSON-LD"
      />
      <link
        rel="alternate"
        type="application/json"
        href={`${BASE_URL}/api/a/${identifier}/aif?format=attestation`}
        title="Attestation envelope"
      />

      {/* Track AI-EPI E.1 — citation format alternates (Zotero/citation.js pick these up) */}
      <link
        rel="alternate"
        type="application/vnd.citationstyles.csl+json"
        href={`${BASE_URL}/api/a/${identifier}/cite?format=csl`}
        title="CSL-JSON citation"
      />
      <link
        rel="alternate"
        type="application/x-bibtex"
        href={`${BASE_URL}/api/a/${identifier}/cite?format=bibtex`}
        title="BibTeX citation"
      />
      <link
        rel="alternate"
        type="application/x-research-info-systems"
        href={`${BASE_URL}/api/a/${identifier}/cite?format=ris`}
        title="RIS citation"
      />

      {/* Nav bar */}
      <nav className="topnav">
        <a href={BASE_URL} className="brand">
          <span className="brand-mesh">Isonomia</span>
          <span className="brand-sub">Digital Agora</span>
        </a>
        <div className="nav-actions">
          <a
            href={`${BASE_URL}/deliberations/${argument.deliberation.id}`}
            className="btn btn-ghost"
          >
            View deliberation
          </a>
          <a href={`${BASE_URL}/signup`} className="btn btn-primary">
            Join & respond
          </a>
        </div>
      </nav>

      <div className="content">

        {/* Breadcrumb / context */}
        <div className="breadcrumb">
          <span className="badge-type">Argument</span>
          {argument.deliberation.title && (
            <>
              <span className="breadcrumb-sep">·</span>
              <a
                href={`${BASE_URL}/deliberations/${argument.deliberation.id}`}
                className="breadcrumb-link"
              >
                {argument.deliberation.title}
              </a>
            </>
          )}
        </div>

        {/* Conclusion claim (hero) */}
        {argument.conclusion && (
          <section className="conclusion-hero">
            <p className="conclusion-label">Conclusion</p>
            <h1 className="conclusion-text">{argument.conclusion.text}</h1>
            {argument.conclusion.moid && (
              <a
                href={`${BASE_URL}/c/${argument.conclusion.moid}`}
                className="claim-link"
              >
                View claim page →
              </a>
            )}
          </section>
        )}

        {/* Argument core */}
        <section className="argument-section">
          <div className="section-header">
            <h2 className="section-title">Argument</h2>
            {confidence !== null && (
              <div className="confidence-pill">
                <div
                  className="confidence-dot"
                  style={{
                    background:
                      confidence >= 70
                        ? "#10b981"
                        : confidence >= 40
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                />
                {confidence}% confidence
              </div>
            )}
          </div>

          {confidence !== null && (
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{ width: `${confidence}%` }}
              />
            </div>
          )}

          <p className="argument-text">{argument.text}</p>

          {primaryScheme && (
            <div className="scheme-badge">
              <span className="scheme-icon">⟨⟩</span>
              <span className="scheme-name">
                {primaryScheme.scheme.name || primaryScheme.scheme.title}
              </span>
              {primaryScheme.scheme.summary && (
                <span className="scheme-summary">
                  — {primaryScheme.scheme.summary.slice(0, 120)}
                </span>
              )}
            </div>
          )}
        </section>

        {/* Premises */}
        {argument.premises.length > 0 && (
          <section className="card-section">
            <h3 className="card-section-title">
              Premises ({argument.premises.length})
            </h3>
            <ul className="premise-list">
              {argument.premises.map(({ claim, isImplicit }) => (
                <li key={claim.id} className="premise-item">
                  {isImplicit && (
                    <span className="implicit-tag">unstated</span>
                  )}
                  <span className="premise-text">{claim.text}</span>
                  {claim.moid && (
                    <a
                      href={`${BASE_URL}/c/${claim.moid}`}
                      className="claim-mini-link"
                    >
                      ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Evidence */}
        {argument.conclusion?.ClaimEvidence &&
          argument.conclusion.ClaimEvidence.length > 0 && (
            <section className="card-section">
              <h3 className="card-section-title">
                Supporting evidence ({argument.conclusion.ClaimEvidence.length})
              </h3>
              <div className="evidence-grid">
                {argument.conclusion.ClaimEvidence.map((ev) => (
                  <a
                    key={ev.id}
                    href={ev.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="evidence-card"
                  >
                    <div className="evidence-title">
                      {ev.title || ev.uri}
                    </div>
                    {ev.citation && (
                      <div className="evidence-citation">{ev.citation}</div>
                    )}
                    <div className="evidence-uri">{ev.uri}</div>
                  </a>
                ))}
              </div>
            </section>
          )}

        {/* CTA section */}
        <section className="cta-section">
          <div className="cta-inner">
            <div className="cta-text">
              <h3 className="cta-heading">Join the deliberation on Isonomia</h3>
              <p className="cta-sub">
                Support, challenge, or extend this argument with structured
                reasoning in the Digital Agora.
              </p>
            </div>
            <div className="cta-buttons">
              <a href={`${BASE_URL}/signup`} className="btn btn-primary cta-btn">
                Respond on Isonomia
              </a>
              <a
                href={`${BASE_URL}/deliberations/${argument.deliberation.id}`}
                className="btn btn-ghost cta-btn"
              >
                View full deliberation
              </a>
            </div>
          </div>
        </section>

        {/* Track AI-EPI E.1 — citation export widget */}
        {attestation && (
          <CitationExportWidget
            isoId={attestation.isoId}
            isoUrl={attestation.isoUrl}
            shortCode={attestation.identifier}
            citeEndpoint={`${BASE_URL}/api/a/${identifier}/cite`}
            citations={{
              apa: toApa(attestation),
              mla: toMla(attestation),
              chicago: toChicago(attestation),
              bibtex: toBibTeX(attestation),
              ris: toRis(attestation),
              csl: JSON.stringify(toCslJson(attestation), null, 2),
            }}
          />
        )}

        {/* Embed code */}
        <section className="embed-section">
          <h3 className="card-section-title">Embed this argument</h3>
          <pre className="embed-code">{iframeEmbed}</pre>
          <p className="embed-hint">
            Copy and paste into any website or forum that supports HTML.
          </p>
        </section>

        {/* Footer */}
        <footer className="page-footer">
          <a href={BASE_URL} className="footer-brand">
            Isonomia
          </a>
          <span className="footer-sep">·</span>
          <span className="footer-meta">
            Argument #{argument.permalink?.shortCode ?? argument.id.slice(0, 8)}
          </span>
          {argument.permalink?.accessCount != null && (
            <>
              <span className="footer-sep">·</span>
              <span className="footer-meta">
                {argument.permalink.accessCount} view
                {argument.permalink.accessCount !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </footer>
      </div>
    </main>
  );
}

function pageStyles(): string {
  return `
    *, *::before, *::after { box-sizing: border-box; }

    html { scroll-behavior: smooth; }

    body {
      margin: 0;
      padding: 0;
      background: #f8fafc;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      font-size: 15px;
      line-height: 1.6;
    }

    a { color: inherit; }

    .page { min-height: 100vh; }

    /* Nav */
    .topnav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .brand {
      display: flex;
      align-items: baseline;
      gap: 6px;
      text-decoration: none;
    }

    .brand-mesh {
      font-size: 18px;
      font-weight: 800;
      color: #6366f1;
      letter-spacing: -0.03em;
    }

    .brand-sub {
      font-size: 13px;
      color: #94a3b8;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: background 0.15s, color 0.15s;
    }

    .btn-ghost {
      background: transparent;
      color: #475569;
    }

    .btn-ghost:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .btn-primary {
      background: #6366f1;
      color: #fff;
    }

    .btn-primary:hover {
      background: #4f46e5;
    }

    /* Content wrapper */
    .content {
      max-width: 760px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
    }

    .badge-type {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: #eef2ff;
      color: #4338ca;
    }

    .breadcrumb-sep {
      color: #cbd5e1;
    }

    .breadcrumb-link {
      font-size: 13px;
      color: #64748b;
      text-decoration: none;
    }

    .breadcrumb-link:hover {
      color: #6366f1;
      text-decoration: underline;
    }

    /* Conclusion hero */
    .conclusion-hero {
      margin-bottom: 32px;
    }

    .conclusion-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #94a3b8;
      margin: 0 0 8px 0;
    }

    .conclusion-text {
      font-size: 26px;
      font-weight: 700;
      line-height: 1.3;
      margin: 0 0 12px 0;
      color: #0f172a;
    }

    .claim-link {
      font-size: 13px;
      color: #6366f1;
      text-decoration: none;
    }

    .claim-link:hover {
      text-decoration: underline;
    }

    /* Argument section */
    .argument-section {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #94a3b8;
      margin: 0;
    }

    .confidence-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }

    .confidence-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .confidence-bar {
      height: 3px;
      background: #e0e7ff;
      border-radius: 2px;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      background: #6366f1;
      border-radius: 2px;
    }

    .argument-text {
      font-size: 16px;
      line-height: 1.7;
      color: #1e293b;
      margin: 0 0 16px 0;
    }

    .scheme-badge {
      display: flex;
      align-items: baseline;
      gap: 6px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 13px;
    }

    .scheme-icon {
      color: #6366f1;
      font-weight: 700;
    }

    .scheme-name {
      font-weight: 600;
      color: #374151;
    }

    .scheme-summary {
      color: #6b7280;
      font-size: 12px;
    }

    /* Premises & evidence cards */
    .card-section {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 16px;
    }

    .card-section-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #94a3b8;
      margin: 0 0 14px 0;
    }

    .premise-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .premise-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .implicit-tag {
      flex-shrink: 0;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #9ca3af;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .premise-text {
      font-size: 14px;
      color: #374151;
      flex: 1;
    }

    .claim-mini-link {
      color: #6366f1;
      text-decoration: none;
      font-size: 12px;
      flex-shrink: 0;
    }

    .evidence-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .evidence-card {
      display: block;
      padding: 12px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      text-decoration: none;
      transition: border-color 0.15s;
    }

    .evidence-card:hover {
      border-color: #6366f1;
    }

    .evidence-title {
      font-size: 13px;
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .evidence-citation {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 2px;
    }

    .evidence-uri {
      font-size: 11px;
      color: #94a3b8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Not found */
    .not-found {
      max-width: 480px;
      margin: 120px auto;
      padding: 0 24px;
      text-align: center;
    }

    .not-found h1 { font-size: 22px; margin-bottom: 8px; }
    .not-found p { color: #64748b; margin-bottom: 20px; }
    .not-found a { color: #6366f1; text-decoration: none; }

    /* CTA */
    .cta-section {
      margin: 24px 0;
    }

    .cta-inner {
      background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%);
      border: 1px solid #c7d2fe;
      border-radius: 16px;
      padding: 28px;
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .cta-text { flex: 1; min-width: 200px; }

    .cta-heading {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 6px 0;
      color: #1e1b4b;
    }

    .cta-sub {
      font-size: 14px;
      color: #4c1d95;
      opacity: 0.7;
      margin: 0;
    }

    .cta-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .cta-btn {
      white-space: nowrap;
    }

    /* Embed code */
    .embed-section {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 24px;
    }

    .embed-code {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      white-space: pre-wrap;
      word-break: break-all;
      color: #374151;
      margin: 0 0 10px 0;
    }

    .embed-hint {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
    }

    /* Footer */
    .page-footer {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      color: #94a3b8;
      padding-top: 24px;
    }

    .footer-brand {
      color: #6366f1;
      text-decoration: none;
      font-weight: 600;
    }

    .footer-sep { color: #e2e8f0; }

    .footer-meta { color: #94a3b8; }
  `;
}
