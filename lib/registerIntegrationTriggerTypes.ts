import { loadIntegrations } from "@/lib/integrationLoader";
import { IntegrationApp } from "@/lib/integrations/types";
import { registerWorkflowTriggerType } from "@/lib/workflowTriggers";

export function registerIntegrationTriggerTypes(
  modules: Record<string, { integration?: IntegrationApp }>
) {
  const integrations = loadIntegrations(modules);
  for (const app of integrations) {
    for (const trigger of app.triggers ?? []) {
      registerWorkflowTriggerType(`${app.name}:${trigger.name}`);
    }
  }
}
