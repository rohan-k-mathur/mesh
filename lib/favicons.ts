// Shared favicon + site-title config so every root layout stays in sync.
// Swap ACTIVE_FAVICON to try a different set without renaming files.

export const SITE_TITLE = "Isonomia";
export const SITE_DESCRIPTION =
  "Deliberation platform for epistemic infrastructure and democratic decision-making";

export type FaviconSet = "alt" | "default";
export const ACTIVE_FAVICON: FaviconSet = "alt";

export const FAVICON_SETS = {
  alt: {
    icon: [
      // Light/dark-aware: browser picks based on its own theme (tab bg color).
      // SVG line is a graceful fallback for browsers that ignore `media`.
      {
        url: "/favicons/favicon-alt-light.ico",
        sizes: "any",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicons/favicon-alt-dark.ico",
        sizes: "any",
        media: "(prefers-color-scheme: dark)",
      },
      { url: "/favicons/favicon-alt.svg", type: "image/svg+xml" },
      { url: "/favicons/favicon-96x96-alt.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicons/favicon-alt-light.ico",
    apple: "/favicons/web-app-manifest-192x192-alt.png",
  },
  default: {
    icon: [{ url: "/favicons/favicon-default.ico", sizes: "any" }],
    shortcut: "/favicons/favicon-default.ico",
  },
} as const;

export const siteIcons = FAVICON_SETS[ACTIVE_FAVICON];
