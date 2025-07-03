import { loadIntegrations } from "@/lib/integrationLoader";
import { IntegrationApp } from "@/lib/integrations/types";
import { registerWorkflowAction } from "@/lib/workflowActions";

export function registerIntegrationActions(
  modules: Record<string, { integration?: IntegrationApp }>
) {
  const integrations = loadIntegrations(modules);
  for (const app of integrations) {
    for (const action of app.actions ?? []) {
      const name = `${app.name}:${action.name}`;
      registerWorkflowAction(name, async () => {
        await action.run({}, {});
      });
    }
  }
}
