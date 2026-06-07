/**
 * Phase 3.3 \u2014 robots.txt for the public argument graph.
 *
 * Allow rules:
 *   - /a/*               public argument permalinks (the citation unit)
 *   - /c/*               public claims by canonical MOID
 *   - /search/arguments  the consumer search surface
 *   - /api/v3/search/    so LLM agents discovering via the OpenAPI spec
 *                        can hit the JSON endpoint directly
 *   - /api/a/.../aif     attestation/jsonld/aif representations
 *   - /api/c/            claim JSON
 *   - /.well-known/      argument-graph manifest + llms.txt
 *
 * Disallow rules:
 *   - /api/*             everything else under /api (auth, internal, etc.)
 *   - /test/*            implementation-test scratch pages
 *   - /quick             personal compose surface
 *
 * Sitemap pointer: emitted so crawlers (including Bing) discover the
 * sitemap without webmaster-tools registration.
 */
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://isonomia.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/a/",
          "/c/",
          "/search/arguments",
          "/api/v3/search/",
          // Match all /api/a/{shortCode}/aif representations.
          "/api/a/",
          "/api/c/",
          "/.well-known/",
        ],
        disallow: [
          "/api/auth/",
          "/api/_cron/",
          "/api/internal/",
          "/api/admin/",
          "/test/",
          "/quick",
          // App-shell internals that aren't meant to be discovered.
          "/inbox",
          "/settings",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
