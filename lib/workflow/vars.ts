// lib/workflow/vars.ts
export function resolveTemplate(template: any, scope: any) {
    if (template == null) return template;
    if (typeof template !== "string") return template; // JSON fields handled as-is
    return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr) => {
      try {
        // very small, safe path resolver: payload.customer.email, outputs.stepId.field
        const path = expr.split(".").map(p => p.trim());
        let cur = scope;
        for (const seg of path) cur = cur?.[seg];
        return cur ?? "";
      } catch { return ""; }
    });
  }
  