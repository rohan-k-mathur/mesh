import { registerWorkflowAction } from "@/lib/workflowActions";
import { fetchLatestIssue } from "@/lib/actions/github.actions";
import { sendSlackMessage } from "@/lib/actions/slack.actions";

export function registerDefaultWorkflowActions() {
  registerWorkflowAction("github:latestIssue", async () => {
    const repo = process.env.GITHUB_REPO ?? "";
    const token = process.env.GITHUB_TOKEN;
    return fetchLatestIssue({ repo, token });
  });

  registerWorkflowAction("slack:sendMessage", async () => {
    const url = process.env.SLACK_WEBHOOK_URL ?? "";
    await sendSlackMessage({ webhookUrl: url, text: "New issue created" });
  });

  registerWorkflowAction("createRandomLineGraph", async () => {
    // action handled in WorkflowRunner
  });
}
