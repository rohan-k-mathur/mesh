# Building Integration Modules

The state machine builder loads third‑party services from the `integrations/` folder. Each file exports an `integration` object describing available actions and triggers.

```ts
export const integration: IntegrationApp = {
  name: "slack",
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
