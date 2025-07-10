import { IntegrationApp } from "@/lib/integrations/types";
import {
  appendRow,
  createSpreadsheet,
  readRange,
} from "@/lib/actions/googleSheets.actions";

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
    {
      name: "createSpreadsheet",
      run: async (params: { title: string }, creds: { apiKey: string }) => {
        return await createSpreadsheet({ title: params.title, apiKey: creds.apiKey });
      },
    },
    {
      name: "readRange",
      run: async (
        params: { spreadsheetId: string; range: string },
        creds: { apiKey: string }
      ) => {
        return await readRange({
          spreadsheetId: params.spreadsheetId,
          range: params.range,
          apiKey: creds.apiKey,
        });
      },
    },
  ],
};

export default integration;
