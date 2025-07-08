import { executeWorkflow, WorkflowGraph } from "@/lib/workflowExecutor";
import analyticsTemplate from "@/templates/analytics-dashboard.json";
import analyticsIntegration from "@/integrations/AnalyticsIntegration";

test("runs analytics dashboard workflow", async () => {
  const graph = analyticsTemplate.graph as WorkflowGraph;
  const actions: Record<string, () => Promise<string | void>> = {};
  for (const action of analyticsIntegration.actions) {
    actions[`analytics:${action.name}`] = action.run as any;
  }
  actions["gmail:sendEmail"] = async () => "Email sent";
  actions["slack:sendMessage"] = async () => "Slack sent";
  const executed = await executeWorkflow(graph, actions);
  expect(executed).toEqual([
    "fetchShopify",
    "fetchInstagram",
    "fetchTikTok",
    "aggregate",
    "report",
    "email",
  ]);
});

