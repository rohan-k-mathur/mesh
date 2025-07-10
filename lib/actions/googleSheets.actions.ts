"use server";

import { google } from "googleapis";
import { getUserFromCookies } from "@/lib/serverutils";
import { saveIntegration } from "@/lib/actions/integration.actions";

function getClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth });
}

export async function appendRow({
  spreadsheetId,
  range,
  values,
  accessToken,
}: {
  spreadsheetId: string;
  range: string;
  values: (string | number)[];
  accessToken: string;
}) {
  const sheets = getClient(accessToken);
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
  accessToken,
}: {
  title: string;
  accessToken: string;
}) {
  const sheets = getClient(accessToken);
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
  accessToken,
}: {
  spreadsheetId: string;
  range: string;
  accessToken: string;
}) {
  const sheets = getClient(accessToken);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return res.data.values as (string | number)[][] | undefined;
}

export async function refreshSheetsAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Sheets environment variables not configured");
  }
  const client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost"
  );
  client.setCredentials({ refresh_token: refreshToken });
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Failed to retrieve access token");
  const user = await getUserFromCookies();
  if (user) {
    await saveIntegration({
      service: "googleSheets",
      credential: JSON.stringify({ accessToken: token }),
    });
  }
  return token;
}
