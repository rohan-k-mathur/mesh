import { IntegrationApp } from "@/lib/integrations/types";
import { sendSlackMessage } from "@/lib/actions/slack.actions";

export const integration: IntegrationApp = {
  name: "slack",
  actions: [
    {
      name: "sendMessage",
      run: async (params: { text: string }, creds: { webhookUrl: string }) => {
        await sendSlackMessage({ webhookUrl: creds.webhookUrl, text: params.text });
      },
    },
  ],
};

export default integration;
