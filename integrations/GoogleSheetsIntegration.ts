import { IntegrationApp } from "@/lib/integrations/types";
import { appendRow } from "@/lib/actions/googleSheets.actions";

export const integration: IntegrationApp = {
  name: "googleSheets",
  description: "Interact with Google Sheets to store and retrieve data",
  actions: [
    {
      name: "appendRow",
      run: async (
        params: { spreadsheetId: string; range: string; values: (string | number)[] },
        creds: { apiKey: string }
      ) => {
        await appendRow({
          spreadsheetId: params.spreadsheetId,
          range: params.range,
          values: params.values,
          apiKey: creds.apiKey,
        });
      },
    },
  ],
};

export default integration;
