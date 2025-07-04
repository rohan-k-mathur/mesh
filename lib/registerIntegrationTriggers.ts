import { loadIntegrations } from "@/lib/integrationLoader";
import { IntegrationApp } from "@/lib/integrations/types";
import { emitWorkflowTrigger } from "@/lib/workflowTriggers";

export async function registerIntegrationTriggers(
  modules: Record<string, { integration?: IntegrationApp }>
) {
  const integrations = loadIntegrations(modules);
  for (const app of integrations) {
    for (const trigger of app.triggers ?? []) {
      const name = `${app.name}:${trigger.name}`;
      await trigger.onEvent((payload: any) => emitWorkflowTrigger(name, payload), {});
    }
  }
}
