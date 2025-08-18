// lib/workflow/registry.compat.ts
import { registerAction } from "./registry";
import { getWorkflowAction } from "@/lib/workflowActions";

export function exposeLegacyActionAsDef(id: string, displayName: string, provider?: string) {
  registerAction({
    id,
    displayName,
    provider,
    inputs: [], // legacy had none; keep empty
    run: async () => {
      const legacy = getWorkflowAction(id);
      if (!legacy) throw new Error(`Legacy action not found: ${id}`);
      await legacy();
      return null;
    }
  });
}
