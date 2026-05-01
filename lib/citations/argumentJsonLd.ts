/**
 * Argument JSON-LD builder
 *
 * Track A.2 of the AI-Epistemic-Infrastructure Roadmap.
 *
 * Produces the rich, composite JSON-LD that ships in the <head> of the
 * public argument page (/a/[identifier]). The graph is composed of:
 *   - The argument itself, typed as both a Schema.org CreativeWork /
 *     ScholarlyArticle / Claim (composite) and an aif:RA node
 *   - The conclusion claim and premise claims as Schema.org Claim and
 *     aif:InformationNode entries
 *   - The argumentation scheme (with stable scheme URI when available)
 *   - Evidence as Schema.org WebPage citations with provenance fields
 *   - The dialectical-status snapshot from the attestation envelope
 *   - Conditionally, a Schema.org ClaimReview when the argument has been
 *     dialectically tested (see argumentAttestation.computeIsTested)
 *
 * The graph deliberately uses both Schema.org and AIF vocabularies so that
 *   (a) Google / Bing / fact-check crawlers see Schema.org primitives, and
 *   (b) argumentation-research tools see AIF/Argdown-aliased terms.
 */

import type { ArgumentAttestation } from "./argumentAttestation";

const SCHEME_BASE_URI = "http://arg.tech/ont/schemes#";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://isonomia.app";

/**
 * Composite @context that exposes both Schema.org terms (the default
 * vocabulary, so unprefixed terms like `name` / `text` / `citation` are
 * Schema.org) and the AIF / argumentation-scheme namespaces under prefixes.
 */
function composeContext() {
  return [
    "https://schema.org",
    {
      aif: "http://www.arg.dundee.ac.uk/aif#",
      as: SCHEME_BASE_URI,
      cq: "http://arg.tech/ont/cq#",
      iso: `${BASE_URL}/ns#`,
      contentHash: "iso:contentHash",
      dialecticalStatus: "iso:dialecticalStatus",
      attestation: "iso:attestation",
      schemeKey: "as:appliesSchemeKey",
      hasCriticalQuestion: "as:hasCriticalQuestion",
    },
  ];
}

function schemeIri(schemeKey: string | null | undefined): string | null {
  if (!schemeKey) return null;
  return `${SCHEME_BASE_URI}${schemeKey}`;
}

function claimNode(claim: { claimId: string; moid: string | null; text: string }) {
  const id = claim.moid
    ? `${BASE_URL}/c/${claim.moid}`
    : `${BASE_URL}/claim/${claim.claimId}`;
  return {
    "@id": id,
    "@type": ["Claim", "aif:InformationNode"],
    text: claim.text,
    "aif:text": claim.text,
    ...(claim.moid ? { identifier: `moid:${claim.moid}` } : {}),
  };
}

function evidenceNode(e: ArgumentAttestation["evidence"][number]) {
  if (!e.uri) {
    return {
      "@type": "CreativeWork",
      name: e.title || e.citation || "Evidence",
      ...(e.citation ? { description: e.citation } : {}),
    };
  }
  return {
    "@type": "WebPage",
    url: e.uri,
    "@id": e.uri,
    name: e.title || e.uri,
    ...(e.citation ? { description: e.citation } : {}),
    ...(e.contentSha256 ? { identifier: e.contentSha256 } : {}),
    ...(e.archivedUrl
      ? {
          archivedAt: {
            "@type": "WebPage",
            url: e.archivedUrl,
            ...(e.archivedAt ? { dateCreated: e.archivedAt } : {}),
          },
        }
      : {}),
  };
}

/**
 * Build the rich composite JSON-LD for an argument. Returns a single
 * top-level object suitable for embedding in a `<script type="application/ld+json">`
 * tag. When the argument has been dialectically tested, the result is a
 * `@graph` array containing the primary argument node plus a ClaimReview.
 */
export function buildArgumentJsonLd(att: ArgumentAttestation): Record<string, unknown> {
  const context = composeContext();

  const aifEndpoint = `${BASE_URL}/api/a/${att.identifier}/aif`;
  const conclusion = att.conclusion;
  const premiseNodes = att.premises.map(claimNode);
  const conclusionGraphNode = conclusion ? claimNode(conclusion) : null;

  const schemeNode = att.scheme
    ? {
        "@id": schemeIri(att.scheme.key) || `${BASE_URL}/scheme/${att.scheme.id}`,
        "@type": ["DefinedTerm", "aif:Scheme"],
        name: att.scheme.title || att.scheme.name || att.scheme.key || "Argumentation Scheme",
        ...(att.scheme.key ? { termCode: att.scheme.key } : {}),
      }
    : null;

  const headlineText =
    (conclusion?.text && conclusion.text.length > 0 ? conclusion.text : null) ??
    "Argument";

  const argumentNode: Record<string, unknown> = {
    "@id": att.permalink,
    "@type": ["CreativeWork", "ScholarlyArticle", "Claim", "aif:RA"],
    url: att.permalink,
    sameAs: [att.immutablePermalink, aifEndpoint].filter(Boolean),
    identifier: [
      { "@type": "PropertyValue", propertyID: "iso:permalink", value: att.identifier },
      { "@type": "PropertyValue", propertyID: "iso:contentHash", value: att.contentHash },
      { "@type": "PropertyValue", propertyID: "iso:version", value: String(att.version) },
    ],
    name: headlineText.slice(0, 140),
    headline: headlineText.slice(0, 140),
    abstract: headlineText,
    text: conclusion?.text || headlineText,
    ...(att.confidence !== null
      ? {
          "iso:confidence": att.confidence,
        }
      : {}),
    ...(att.createdAt ? { dateCreated: att.createdAt, datePublished: att.createdAt } : {}),
    ...(att.updatedAt ? { dateModified: att.updatedAt } : {}),
    ...(att.author?.displayName || att.author?.id
      ? {
          author: {
            "@type": "Person",
            ...(att.author.displayName ? { name: att.author.displayName } : {}),
            ...(att.author.id ? { identifier: att.author.id } : {}),
          },
        }
      : {}),
    publisher: {
      "@type": "Organization",
      name: "Isonomia",
      url: BASE_URL,
    },
    ...(att.deliberation
      ? {
          isPartOf: {
            "@type": "CreativeWork",
            "@id": `${BASE_URL}/deliberations/${att.deliberation.id}`,
            name: att.deliberation.title || "Deliberation",
            url: `${BASE_URL}/deliberations/${att.deliberation.id}`,
          },
        }
      : {}),
    ...(conclusionGraphNode
      ? {
          about: conclusionGraphNode,
          "aif:hasConclusion": conclusionGraphNode["@id"],
        }
      : {}),
    ...(premiseNodes.length
      ? {
          "iso:premises": premiseNodes,
          "aif:hasPremise": premiseNodes.map((n: any) => n["@id"]),
        }
      : {}),
    ...(schemeNode
      ? {
          "aif:usesScheme": schemeNode,
          schemeKey: att.scheme?.key ?? null,
        }
      : {}),
    ...(att.evidence.length
      ? {
          citation: att.evidence.map(evidenceNode),
        }
      : {}),
    contentHash: att.contentHash,
    dialecticalStatus: {
      "@type": "PropertyValue",
      "iso:incomingAttacks": att.dialecticalStatus.incomingAttacks,
      "iso:incomingAttackEdges": att.dialecticalStatus.incomingAttackEdges,
      "iso:incomingSupports": att.dialecticalStatus.incomingSupports,
      "iso:criticalQuestionsRequired": att.dialecticalStatus.criticalQuestionsRequired,
      "iso:criticalQuestionsAnswered": att.dialecticalStatus.criticalQuestionsAnswered,
      "iso:criticalQuestionsOpen": att.dialecticalStatus.criticalQuestionsOpen,
      "iso:standingScore": att.dialecticalStatus.standingScore,
      "iso:isTested": att.dialecticalStatus.isTested,
    },
    attestation: {
      "@type": "PropertyValue",
      "iso:permalink": att.permalink,
      "iso:immutablePermalink": att.immutablePermalink,
      "iso:contentHash": att.contentHash,
      "iso:version": att.version,
      "iso:retrievedAt": att.retrievedAt,
    },
  };

  // Conditional ClaimReview emission: only when dialectically tested.
  // This gates the strongest Schema.org signal behind a real activation rule.
  if (att.dialecticalStatus.isTested && conclusion) {
    const reviewNode = {
      "@type": "ClaimReview",
      "@id": `${att.permalink}#review`,
      url: att.permalink,
      datePublished: att.updatedAt || att.createdAt || att.retrievedAt,
      author: {
        "@type": "Organization",
        name: "Isonomia",
        url: BASE_URL,
      },
      claimReviewed: conclusion.text,
      itemReviewed: {
        "@type": "Claim",
        text: conclusion.text,
        ...(conclusion.moid ? { identifier: `moid:${conclusion.moid}` } : {}),
        ...(att.author?.displayName
          ? {
              author: { "@type": "Person", name: att.author.displayName },
            }
          : {}),
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: att.dialecticalStatus.standingScore ?? 0,
        bestRating: 1,
        worstRating: 0,
        ratingExplanation:
          `Standing score derived from ${att.dialecticalStatus.criticalQuestionsAnswered} of ` +
          `${att.dialecticalStatus.criticalQuestionsRequired} critical questions answered, ` +
          `${att.dialecticalStatus.incomingAttacks} inbound attacks, ` +
          `${att.dialecticalStatus.incomingSupports} inbound supports.`,
      },
    };

    return {
      "@context": context,
      "@graph": [argumentNode, reviewNode],
    };
  }

  return {
    "@context": context,
    ...argumentNode,
  };
}

/**
 * Build the <meta name="citation_*"> tag set for Zotero / Google Scholar
 * auto-detection. (Track E.1 — done as a small bonus alongside A.2 since it
 * costs almost nothing once the attestation envelope is built.)
 */
export function buildCitationMetaTags(
  att: ArgumentAttestation
): Array<{ name: string; content: string }> {
  const tags: Array<{ name: string; content: string }> = [];
  const title = att.conclusion?.text || "Argument";
  tags.push({ name: "citation_title", content: title });
  tags.push({ name: "citation_public_url", content: att.permalink });
  tags.push({ name: "citation_fulltext_html_url", content: att.permalink });
  tags.push({ name: "citation_abstract_html_url", content: att.permalink });
  tags.push({ name: "citation_publisher", content: "Isonomia" });
  if (att.author?.displayName) {
    tags.push({ name: "citation_author", content: att.author.displayName });
  }
  if (att.createdAt) {
    tags.push({
      name: "citation_publication_date",
      content: att.createdAt.split("T")[0],
    });
    tags.push({ name: "citation_date", content: att.createdAt.split("T")[0] });
  }
  for (const e of att.evidence) {
    if (e.uri) tags.push({ name: "citation_reference", content: e.uri });
  }
  // Custom Isonomia identifiers
  tags.push({ name: "iso_permalink", content: att.permalink });
  tags.push({ name: "iso_content_hash", content: att.contentHash });
  tags.push({ name: "iso_version", content: String(att.version) });
  return tags;
}
