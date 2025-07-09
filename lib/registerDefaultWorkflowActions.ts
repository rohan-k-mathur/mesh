import { registerWorkflowAction } from "@/lib/workflowActions";
import { sendEmail } from "@/lib/actions/gmail.actions";

const from = process.env.GMAIL_FROM ?? "";
const to = process.env.GMAIL_TO ?? "";
const subject = process.env.GMAIL_SUBJECT ?? "";
const message = process.env.GMAIL_MESSAGE ?? "";
const accessToken = process.env.GMAIL_ACCESS_TOKEN ?? "";

export function registerDefaultWorkflowActions() {
  registerWorkflowAction("createRandomLineGraph", async () => {
    // action handled in WorkflowRunner
  });
  registerWorkflowAction("gmail:sendEmail", async () => {
    if (!from || !to || !accessToken) return;
    await sendEmail({ from, to, subject, message, accessToken });
  });
}

