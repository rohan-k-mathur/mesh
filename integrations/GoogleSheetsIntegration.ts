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
        creds: { accessToken: string }
      ) => {
        await appendRow({
          spreadsheetId: params.spreadsheetId,
          range: params.range,
          values: params.values,
          accessToken: creds.accessToken,
        });
      },
    },
    {
      name: "createSpreadsheet",
      run: async (params: { title: string }, creds: { accessToken: string }) => {
        return await createSpreadsheet({ title: params.title, accessToken: creds.accessToken });
      },
    },
    {
      name: "readRange",
      run: async (
        params: { spreadsheetId: string; range: string },
        creds: { accessToken: string }
      ) => {
        return await readRange({
          spreadsheetId: params.spreadsheetId,
          range: params.range,
          accessToken: creds.accessToken,
        });
      },
    },
  ],
};

export default integration;
