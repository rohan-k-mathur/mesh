// lib/workflow/registry.defaults.ts
import { registerAction, registerTrigger } from "./registry";

registerTrigger({
  id: "trigger.onClick",
  displayName: "Manual Trigger",
  inputs: [],
});

registerAction({
  id: "gmail.sendEmail",
  displayName: "Gmail · Send Email",
  provider: "gmail",
  inputs: [
    { key: "to", label: "To", type: "email", required: true, placeholder: "{{payload.customer.email}}" },
    { key: "subject", label: "Subject", type: "string", required: true },
    { key: "message", label: "Message", type: "text", required: true },
  ],
  run: async (ctx, inputs) => {
    const { to, subject, message } = {
      to: ctx.eval(inputs.to),
      subject: ctx.eval(inputs.subject),
      message: ctx.eval(inputs.message),
    };
    const { email, accessToken } = ctx.creds; // from Connections (section 5)
    await sendEmail({ from: email, to, subject, message, accessToken });
    return { delivered: true };
  }
});

registerAction({
  id: "sheets.appendRow",
  displayName: "Google Sheets · Append Row",
  provider: "googleSheets",
  inputs: [
    { key: "spreadsheetId", label: "Spreadsheet ID", type: "string", required: true },
    { key: "range", label: "Range (e.g. Sheet1!A1:C1)", type: "string", required: true },
    { key: "values", label: "Comma separated values", type: "string", required: true, placeholder: "{{payload.id}},{{payload.email}},{{payload.total}}" },
  ],
  run: async (ctx, inputs) => {
    const { spreadsheetId, range, values } = {
      spreadsheetId: ctx.eval(inputs.spreadsheetId),
      range: ctx.eval(inputs.range),
      values: String(ctx.eval(inputs.values)).split(",").map(v => v.trim()),
    };
    const { accessToken } = ctx.creds;
    await appendRow({ spreadsheetId, range, values, accessToken });
    return { appended: values.length };
  }
});
