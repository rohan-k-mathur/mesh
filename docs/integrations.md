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
2. Set the `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` variables in `.env.local`.
3. Generate an access token for the Gmail account and save it using the **Connect Account** modal with the JSON format:
   ```json
   {
     "email": "user@gmail.com",
     "accessToken": "ya29..."
   }
   ```

The workflow action `gmail:sendEmail` reads these credentials to send messages through the Gmail API.
