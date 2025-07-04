import { registerIntegrationTriggers } from "@/lib/registerIntegrationTriggers";
import { registerWorkflowTrigger } from "@/lib/workflowTriggers";
import { IntegrationApp } from "@/lib/integrations/types";

test("registerIntegrationTriggers subscribes to events", async () => {
  const onEvent = jest.fn(async (cb) => {
    cb({ msg: "hi" });
  });
  const modules = {
    one: {
      integration: {
        name: "test",
        triggers: [{ name: "ping", onEvent }],
      } as IntegrationApp,
    },
  };
  const handler = jest.fn();
  registerWorkflowTrigger("test:ping", handler);
  await registerIntegrationTriggers(modules);
  expect(onEvent).toHaveBeenCalled();
  expect(handler).toHaveBeenCalledWith({ msg: "hi" });
});
