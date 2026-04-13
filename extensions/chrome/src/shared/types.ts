// ─────────────────────────────────────────────────────────────────────────────
// Shared type definitions for the Isonomia Chrome extension
// ─────────────────────────────────────────────────────────────────────────────

/** Argument metadata returned by the API */
export interface ArgumentMeta {
  id: string;
  text: string;
  confidence: number | null;
  scheme: string | null;
  author: { name: string; username: string } | null;
  conclusion: { text: string; moid: string } | null;
  evidenceCount: number;
  supportCount: number;
  challengeCount: number;
  deliberation: { title: string } | null;
  permalink: PermalinkInfo | null;
}

/** Claim metadata returned by the API */
export interface ClaimMeta {
  id: string;
  text: string;
  moid: string;
  author: { name: string; username: string } | null;
  evidenceCount: number;
  supportCount: number;
  attackCount: number;
}

/** Permalink info */
export interface PermalinkInfo {
  shortCode: string;
  slug: string | null;
  fullUrl: string;
  version: number;
  accessCount: number;
}

/** Quick argument creation request */
export interface QuickArgumentRequest {
  claim: string;
  evidence: { url: string; title?: string; quote?: string }[];
  reasoning?: string;
  deliberationId?: string;
  isPublic?: boolean;
}

/** Quick argument creation response */
export interface QuickArgumentResponse {
  ok: boolean;
  argument: { id: string; text: string; confidence: number | null };
  claim: { id: string; text: string; moid: string };
  permalink: { shortCode: string; slug: string; url: string };
  embedCodes: {
    link: string;
    iframe: string;
    markdown: string;
    plainText: string;
  };
}

/** URL unfurl response */
export interface UnfurlResponse {
  ok: boolean;
  data: {
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    url: string;
    favicon: string | null;
  };
}

/** Message types between extension components */
export type ExtensionMessage =
  | {
      type: "PREFILL_ARGUMENT";
      payload: {
        claim: string;
        evidenceUrl: string;
        pageTitle: string;
      };
    }
  | {
      type: "FETCH_ARGUMENT_META";
      identifier: string;
    }
  | {
      type: "FETCH_CLAIM_META";
      moid: string;
    }
  | {
      type: "AUTH_STATE_CHANGED";
      isLoggedIn: boolean;
    }
  | {
      type: "OPEN_POPUP_WITH_PREFILL";
      payload: {
        claim: string;
        evidenceUrl: string;
        pageTitle: string;
      };
    };

/** Stored auth state */
export interface StoredAuth {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
  };
}

/** Extension settings */
export interface ExtensionSettings {
  /** Enable inline previews on supported platforms */
  previewsEnabled: boolean;
  /** Per-site overrides (domain → enabled) */
  siteOverrides: Record<string, boolean>;
  /** Default theme for injected cards */
  previewTheme: "light" | "dark" | "auto";
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  previewsEnabled: false,
  siteOverrides: {},
  previewTheme: "auto",
};

/** Detected Isonomia link on a page */
export interface DetectedLink {
  url: string;
  type: "argument" | "claim";
  identifier: string;
  element: HTMLAnchorElement;
}
