import type { ElementRecord } from "@/lib/portfolio/types";

export type LintSeverity = "error" | "warning" | "info";

export type LintIssue = {
  id: string;                          // stable key
  severity: LintSeverity;
  message: string;
  elementId?: string;
  fix?: (dispatch: (a: any) => void) => void;    // optional quick-fix
};

function normalizeSupabasePublicUrl(u: string) {
  if (!u) return u;
  const fixed = u.includes("/storage/v1/object/public/")
    ? u
    : u.replace("/storage/v1/object/", "/storage/v1/object/public/");
  return encodeURI(fixed);
}

const isHttp = (s: string) => /^https?:\/\//i.test(s);

export function lintElements(elements: ElementRecord[]): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const el of elements) {
    // 1) zero size
    if (!el.width || !el.height) {
      issues.push({
        id: `size:${el.id}`,
        elementId: el.id,
        severity: "warning",
        message: "Element has zero width/height; it may not be visible.",
        fix: (dispatch) =>
          dispatch({
            type: "patch",
            id: el.id,
            patch: { width: el.width || 300, height: el.height || 200 },
          }),
      });
    }

    // 2) image src sanity
    if ((el as any).kind === "image") {
      const src = (el as any).src as string | undefined;
      if (!src) {
        issues.push({
          id: `img-empty:${el.id}`,
          elementId: el.id,
          severity: "warning",
          message: "Image has no source URL.",
        });
      } else if (!isHttp(src)) {
        issues.push({
          id: `img-http:${el.id}`,
          elementId: el.id,
          severity: "warning",
          message: "Image source is not http(s).",
        });
      } else if (!src.includes("/storage/v1/object/public/") && src.includes("/storage/v1/object/")) {
        issues.push({
          id: `img-supabase:${el.id}`,
          elementId: el.id,
          severity: "info",
          message: "Supabase image URL missing `/public/` segment. Will normalize.",
          fix: (dispatch) =>
            dispatch({
              type: "patch",
              id: el.id,
              patch: { src: normalizeSupabasePublicUrl(src) },
            }),
        });
      }
    }

    // 3) link href sanity
    if ((el as any).kind === "link") {
      const href = (el as any).href as string | undefined;
      if (href && !isHttp(href)) {
        issues.push({
          id: `link-http:${el.id}`,
          elementId: el.id,
          severity: "warning",
          message: "Link URL missing protocol; prepending https://",
          fix: (dispatch) =>
            dispatch({
              type: "patch",
              id: el.id,
              patch: { href: `https://${href}` },
            }),
        });
      }
    }

    // 4) gallery URLs sanity
    if ((el as any).kind === "component" && (el as any).component === "GalleryCarousel") {
      const urls = Array.isArray((el as any).props?.urls) ? ((el as any).props!.urls as string[]) : [];
      if (urls.length === 0) {
        issues.push({
          id: `gallery-empty:${el.id}`,
          elementId: el.id,
          severity: "warning",
          message: "Gallery has no images.",
        });
      } else {
        const bad = urls.filter((u) => !isHttp(u));
        if (bad.length) {
          issues.push({
            id: `gallery-http:${el.id}`,
            elementId: el.id,
            severity: "warning",
            message: "Gallery contains non-http(s) URLs; they may not render.",
          });
        }
        const needNormalize = urls.some((u) => u.includes("/storage/v1/object/") && !u.includes("/storage/v1/object/public/"));
        if (needNormalize) {
          issues.push({
            id: `gallery-supabase:${el.id}`,
            elementId: el.id,
            severity: "info",
            message: "Gallery Supabase URLs missing `/public/` segment. Will normalize.",
            fix: (dispatch) =>
              dispatch({
                type: "patch",
                id: el.id,
                patch: {
                  props: {
                    ...((el as any).props || {}),
                    urls: urls.map(normalizeSupabasePublicUrl),
                  },
                },
              }),
          });
        }
      }
    }
  }

  return issues;
}
