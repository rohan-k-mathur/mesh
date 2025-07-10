"use server";

import { google } from "googleapis";
import { getUserFromCookies } from "@/lib/serverutils";
import {
  saveIntegration,
  fetchIntegrations,
} from "@/lib/actions/integration.actions";

export async function sendEmail({
  from,
  to,
  subject,
  message,
  accessToken,
}: {
  from: string;
  to: string;
  subject: string;
  message: string;
  accessToken: string;
}) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const raw = [
    `From: <${from}>`,
    `To: <${to}>`,
    `Subject: ${subject}`,
    "",
    message,
  ]
    .join("\n")
    .replace(/\r?\n/g, "\r\n");

  const encodedMessage = Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });
}

export async function refreshGmailAccessToken() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail environment variables not configured");
  }
  const client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GMAIL_REDIRECT_URI ?? "http://localhost"
  );
  client.setCredentials({ refresh_token: refreshToken });
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Failed to retrieve access token");
  let email = process.env.GMAIL_FROM ?? "";
  const user = await getUserFromCookies();
  if (user) {
    const list = await fetchIntegrations();
    const gmail = list.find((i) => i.service === "gmail");
    if (gmail) {
      try {
        const cred = JSON.parse(gmail.credential);
        if (cred.email) email = cred.email;
      } catch {
        // ignore parse errors
      }
    }
  }
  if (user) {
    await saveIntegration({
      service: "gmail",
      credential: JSON.stringify({ email, accessToken: token }),
    });
  }
  return { email, accessToken: token };
}
