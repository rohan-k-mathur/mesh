# Integration Development Notes

This document summarizes the steps followed when implementing the Slack integration for the Linear Workflow Builder. It can serve as a reference for automating future integrations.

## Environment Setup
- Run `yarn install` to install dependencies (Node.js 18+).
- Lint the codebase with `npm run lint` before committing.

## Integration Structure
- Modules live in `integrations/` and export an `integration` object of type `IntegrationApp`.
- Shared types are defined in `lib/integrations/types.ts`.
- Actions and triggers are implemented under `lib/actions/`.
- The loader in `lib/integrationLoader.ts` collects modules and is used by `registerIntegrationActions`.

## Slack Integration Steps
1. Create `integrations/SlackIntegration.ts` exporting an `IntegrationApp`.
2. Implement actions using helper functions from `lib/actions` (e.g., `sendSlackMessage`).
3. Actions receive `params` and `creds` objects to pass dynamic data and credentials.
4. Credentials can be stored via the IntegrationConfigModal which POSTs to `/api/integrations`.
5. Register the module by importing it through dynamic imports where workflows are executed or built.
6. Include the action in workflow templates (`slack:sendMessage`).

## Google Sheets Integration Steps
1. Create `integrations/GoogleSheetsIntegration.ts` exporting an `IntegrationApp`.
2. Add helper functions in `lib/actions/googleSheets.actions.ts` using the `googleapis` library.
3. Implement actions such as `appendRow` that call the Sheets API.
4. Authenticate using an OAuth access token stored via `ConnectAccountModal` or environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.).
5. Register the module with `registerIntegrationActions` so workflow cards can use `googleSheets:appendRow`.
6. Newly created spreadsheets are stored in the Google Drive of the authenticated account and appear under <https://docs.google.com/spreadsheets/>.
7. Follow SRS requirements on security and reliability when handling spreadsheet data.

-## Production Considerations
- Store credentials securely in the database (see `docs/integrations.md`).
- Use environment variables for tokens when possible.
- Ensure actions return promises and handle errors gracefully.
- Add unit tests for loaders and action registration.

## Automation Ideas
- Provide a CLI script that scaffolds a new integration module with boilerplate code.
- Automatically generate action registration and sample template entries.
