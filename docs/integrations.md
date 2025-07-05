# Building Integration Modules

The state machine builder loads third‑party services from the `integrations/` folder. Each file exports an `integration` object describing available actions and triggers.

```ts
export const integration: IntegrationApp = {
  name: "slack",
  description: "Post messages to Slack",
  actions: [
    {
      name: "sendMessage",
      run: async (params, creds) => {
        // use creds.webhookUrl
      },
    },
  ],
};
```

## Folder Structure
- `integrations/` – place each integration module here.
- `lib/integrations/` – shared types and loaders.

## Global Variables and Auth
Integration actions receive a `credentials` object so implementations can pass API keys or tokens. Credentials may come from environment variables or the `integrations` table.

## Database Table

The `integrations` table is defined in `schema.prisma`. Apply it to your
Supabase database using `npx prisma db push` and ensure the
`anon`/`authenticated` roles have read and write access. Without proper
permissions you may see errors such as `permission denied for schema public`
when loading or saving integration credentials.

## Usage
Actions are referenced in workflows as `<integration>:<action>`. Register modules with `registerIntegrationActions`.

## Submitting Integrations

Third‑party integrations should include metadata so they can appear in the marketplace listing.

- Place your module in the `integrations/` folder and export an `integration` object.
- Provide `name` and `description` fields along with at least one action or trigger.
- Keep external dependencies minimal and document any setup steps in a README.
- Submit a pull request describing the integration and its use cases.
## Triggers

Integrations can emit events that start workflows. Export `triggers` with `onEvent` handlers:

```ts
export const integration: IntegrationApp = {
  name: "slack",
  triggers: [
    {
      name: "message",
      onEvent: async (cb) => {
        // call cb when a message event occurs
      },
    },
  ],
};
```

Use `registerIntegrationTriggers` to subscribe to these events.

## Gmail API Setup

The Gmail integration uses OAuth tokens to send mail on a user's behalf.

1. Create an OAuth client in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add the credentials to `.env` as `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN`. Optionally set `GMAIL_REDIRECT_URI` (defaults to `http://localhost`).
3. Run `yarn gmail-token` to generate a fresh access token. Save the credentials using the **Connect Account** modal with the JSON format:
   ```json
   {
     "email": "user@gmail.com",
     "accessToken": "<token from script>"
   }
   ```

The workflow action `gmail:sendEmail` reads these credentials to send messages through the Gmail API.
