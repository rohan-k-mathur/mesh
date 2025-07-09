"use server";

import { google } from "googleapis";

export async function appendRow({
  spreadsheetId,
  range,
  values,
  apiKey,
}: {
  spreadsheetId: string;
  range: string;
  values: (string | number)[];
  apiKey: string;
}) {
  const sheets = google.sheets({ version: "v4", auth: apiKey });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [values],
    },
  });
}
