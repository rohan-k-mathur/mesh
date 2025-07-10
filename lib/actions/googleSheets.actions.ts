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

export async function createSpreadsheet({
  title,
  apiKey,
}: {
  title: string;
  apiKey: string;
}) {
  const sheets = google.sheets({ version: "v4", auth: apiKey });
  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
    },
  });
  return res.data.spreadsheetId;
}

export async function readRange({
  spreadsheetId,
  range,
  apiKey,
}: {
  spreadsheetId: string;
  range: string;
  apiKey: string;
}) {
  const sheets = google.sheets({ version: "v4", auth: apiKey });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return res.data.values as (string | number)[][] | undefined;
}
