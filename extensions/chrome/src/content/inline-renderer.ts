// ─────────────────────────────────────────────────────────────────────────────
// Content script — Inline rich preview renderer
//
// Renders Isonomia argument/claim preview cards next to detected links.
// Uses Shadow DOM for full style isolation from the host page.
// ─────────────────────────────────────────────────────────────────────────────

import type { ArgumentMeta, ClaimMeta, DetectedLink } from "../shared/types";

/**
 * Render a rich preview card for an argument, injected after the link element.
 * Uses Shadow DOM so host page styles cannot interfere.
 */
export function renderArgumentCard(
  link: DetectedLink,
  meta: ArgumentMeta
): void {
  const card = createCardHost(link.element);
  const shadow = card.attachShadow({ mode: "closed" });

  const claimText = meta.conclusion?.text || meta.text;
  const truncatedClaim =
    claimText.length > 180 ? claimText.slice(0, 180) + "…" : claimText;

  shadow.innerHTML = `
    <style>${getCardStyles()}</style>
    <div class="iso-card">
      <div class="iso-card-header">
        <div class="iso-badge">ARGUMENT</div>
        ${
          meta.confidence !== null
            ? `<div class="iso-confidence">${meta.confidence}% confidence</div>`
            : ""
        }
      </div>
      <div class="iso-claim">${escapeHtml(truncatedClaim)}</div>
      <div class="iso-meta">
        ${
          meta.evidenceCount > 0
            ? `<span class="iso-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                ${meta.evidenceCount} source${meta.evidenceCount !== 1 ? "s" : ""}
              </span>`
            : ""
        }
        ${
          meta.scheme
            ? `<span class="iso-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                ${escapeHtml(meta.scheme)}
              </span>`
            : ""
        }
        ${
          meta.author
            ? `<span class="iso-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ${escapeHtml(meta.author.name)}
              </span>`
            : ""
        }
      </div>
      <div class="iso-footer">
        <span class="iso-brand">isonomia.app</span>
        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="iso-view-link">
          View argument →
        </a>
      </div>
    </div>
  `;
}

/**
 * Render a rich preview card for a claim.
 */
export function renderClaimCard(link: DetectedLink, meta: ClaimMeta): void {
  const card = createCardHost(link.element);
  const shadow = card.attachShadow({ mode: "closed" });

  const truncatedText =
    meta.text.length > 180 ? meta.text.slice(0, 180) + "…" : meta.text;

  shadow.innerHTML = `
    <style>${getCardStyles()}</style>
    <div class="iso-card">
      <div class="iso-card-header">
        <div class="iso-badge iso-badge-claim">CLAIM</div>
        <div class="iso-moid">${escapeHtml(meta.moid)}</div>
      </div>
      <div class="iso-claim">${escapeHtml(truncatedText)}</div>
      <div class="iso-meta">
        ${
          meta.evidenceCount > 0
            ? `<span class="iso-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                ${meta.evidenceCount} source${meta.evidenceCount !== 1 ? "s" : ""}
              </span>`
            : ""
        }
        ${
          meta.supportCount > 0 || meta.attackCount > 0
            ? `<span class="iso-meta-item">
                ↑${meta.supportCount} ↓${meta.attackCount}
              </span>`
            : ""
        }
        ${
          meta.author
            ? `<span class="iso-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ${escapeHtml(meta.author.name)}
              </span>`
            : ""
        }
      </div>
      <div class="iso-footer">
        <span class="iso-brand">isonomia.app</span>
        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="iso-view-link">
          View claim →
        </a>
      </div>
    </div>
  `;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a host element for the Shadow DOM card */
function createCardHost(anchorElement: HTMLAnchorElement): HTMLDivElement {
  const host = document.createElement("div");
  host.className = "isonomia-preview-host";
  host.style.display = "block";
  host.style.margin = "8px 0";
  host.style.maxWidth = "560px";

  // Insert after the anchor's parent paragraph/comment element,
  // or directly after the anchor if no suitable parent
  const parent = anchorElement.closest("p, .md, .comment, [data-testid]");
  if (parent && parent.parentNode) {
    parent.parentNode.insertBefore(host, parent.nextSibling);
  } else {
    anchorElement.insertAdjacentElement("afterend", host);
  }

  return host;
}

/** Escape HTML special characters to prevent XSS */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/** Scoped CSS for the preview card (inside Shadow DOM) */
function getCardStyles(): string {
  return `
    :host {
      all: initial;
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .iso-card {
      border: 1px solid #e0e7ef;
      border-left: 3px solid #0ea5e9;
      border-radius: 8px;
      padding: 12px 14px;
      background: linear-gradient(135deg, #f8fafc 0%, #f0f7ff 100%);
      font-size: 13px;
      line-height: 1.45;
      color: #334155;
      max-width: 100%;
      box-sizing: border-box;
    }

    .iso-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .iso-badge {
      display: inline-flex;
      align-items: center;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: #dbeafe;
      color: #1d4ed8;
    }

    .iso-badge-claim {
      background: #ede9fe;
      color: #6d28d9;
    }

    .iso-confidence {
      font-size: 11px;
      font-weight: 600;
      color: #059669;
      background: #d1fae5;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .iso-moid {
      font-size: 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      color: #94a3b8;
    }

    .iso-claim {
      font-size: 13px;
      font-weight: 500;
      color: #1e293b;
      line-height: 1.4;
      margin-bottom: 8px;
    }

    .iso-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .iso-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: #64748b;
    }

    .iso-meta-item svg {
      flex-shrink: 0;
    }

    .iso-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
    }

    .iso-brand {
      font-size: 10px;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .iso-view-link {
      font-size: 11px;
      font-weight: 600;
      color: #0284c7;
      text-decoration: none;
    }

    .iso-view-link:hover {
      text-decoration: underline;
    }

    @media (prefers-color-scheme: dark) {
      .iso-card {
        background: linear-gradient(135deg, #1e293b 0%, #1a2332 100%);
        border-color: #334155;
        border-left-color: #0ea5e9;
        color: #cbd5e1;
      }
      .iso-claim { color: #f1f5f9; }
      .iso-badge { background: #1e3a5f; color: #7dd3fc; }
      .iso-badge-claim { background: #2e1065; color: #c4b5fd; }
      .iso-confidence { background: #064e3b; color: #6ee7b7; }
      .iso-meta-item { color: #94a3b8; }
      .iso-footer { border-top-color: #334155; }
      .iso-brand { color: #64748b; }
      .iso-view-link { color: #38bdf8; }
    }
  `;
}
