import { IntegrationApp } from "@/lib/integrations/types";
import { sendEmail } from "@/lib/actions/gmail.actions";

export const integration: IntegrationApp = {
  name: "gmail",
  description: "Send emails using the Gmail API",
  actions: [
    {
      name: "sendEmail",
      run: async (
        params: { to: string; subject: string; message: string },
        creds: { email: string; accessToken: string }
      ) => {
        await sendEmail({
          from: creds.email,
          to: params.to,
          subject: params.subject,
          message: params.message,
          accessToken: creds.accessToken,
        });
      },
    },
  ],
};

export default integration;
