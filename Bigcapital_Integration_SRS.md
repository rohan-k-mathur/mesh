# Software Requirement Specification: Bigcapital Integration

## 1. Introduction
### 1.1 Purpose
This document describes how the open source accounting platform [Bigcapital](https://github.com/bigcapitalhq/bigcapital) integrates into Mesh. Bigcapital is included as a Git submodule under the `bigcapital/` directory and referenced in `package.json` via Yarn workspaces. The goal is to expose Bigcapital's financial functions as local modules usable within the PageFlow builder so workflows can automate accounting tasks without external API calls or reliance on the Bigcapital cloud.

### 1.2 Scope
The integration covers:
1. Fetching the Bigcapital repository as a submodule and installing it as a workspace dependency.
2. Library modules for creating invoices, recording expenses and retrieving balances by calling Bigcapital code directly.
3. PageFlow actions and triggers that use those modules.
4. Configuration of Bigcapital environment variables and database connections.

### 1.3 References
- [Bigcapital Documentation](https://docs.bigcapital.app/)
- [Bigcapital Repository](https://github.com/bigcapitalhq/bigcapital)
- `Plugin_Architecture_SRS.md`
- `Linear_Workflow_Builder_SRS.md`

## 2. Overall Description
Bigcapital is an AGPL licensed accounting and inventory system. A copy of the project lives in `bigcapital/` and builds alongside Mesh as part of the Yarn workspace. Mesh imports server packages from this directory rather than communicating over HTTP. The `BigcapitalIntegration` module registers workflow actions (e.g. `createInvoice`) and triggers using these local function calls. Application settings such as database credentials are stored in `bigcapital/.env`.

## 3. System Features
### 3.1 Bigcapital Actions
- **createInvoice** – Generate an invoice for a customer with line items and due date.
- **recordExpense** – Log an expense transaction with account and amount.
- **fetchBalance** – Retrieve account balances for generating reports.

### 3.2 Bigcapital Triggers
- **invoicePaid** – Fires when an invoice is marked paid in Bigcapital.
- **lowInventory** – Emits when an item stock level falls below a threshold.

### 3.3 Credential Management
- Environment variables in `bigcapital/.env` configure the database connection and authentication keys.
- Sensitive values are encrypted in the database similar to other integrations.

### 3.4 PageFlow Integration
- Actions and triggers become selectable options in the PageFlow builder.
- Steps can mix Bigcapital functions with existing workflow actions.
- Logs from executed functions appear in the builder output panel.

## 4. External Interface Requirements
### 4.1 User Interfaces
- **Integration Modal** – Allows configuring Bigcapital database credentials.
- **PageFlow Builder** – Presents Bigcapital actions/triggers in the step selector and provides fields for invoice data or expense details.

### 4.2 Hardware Interfaces
- No special hardware requirements. Mesh and the Bigcapital packages run on standard servers or containers.

### 4.3 Software Interfaces
- Direct imports from Bigcapital workspace packages.
- Existing Mesh integration loader and workflow executor libraries.

### 4.4 Communication Interfaces
- Internal function calls between Mesh and Bigcapital modules.
- Optional event hooks emitted by Bigcapital packages for triggers.

## 5. Non-Functional Requirements
- **Performance:** Actions should complete within 2 seconds under normal load without network latency.
- **Security:** Credentials are encrypted at rest and never logged.
- **Reliability:** Retry logic handles transient database failures. Workflows log errors and continue processing other steps.
- **Maintainability:** Implementation follows repository coding conventions and passes `npm run lint`.

## 6. User Flows
1. **Configure Bigcapital** – User initializes the submodule, copies `.env.example` to `.env` and sets database credentials.
2. **Build Workflow** – In PageFlow, the user adds steps such as `onClick` → `bigcapital:createInvoice`. The builder prompts for customer name, items and totals.
3. **Run Flow** – When triggered, Mesh calls Bigcapital functions directly. Success or error responses are displayed in the log section.
4. **Trigger on Events** – When an invoice is paid, Bigcapital emits an event that triggers a PageFlow which may send an email or update a spreadsheet.

## 7. System Architecture
1. **Bigcapital Workspace**
   - Managed as a Git submodule and listed under `workspaces` in `package.json`.
   - Environment variables are loaded from `bigcapital/.env`.
2. **Integration Module**
   - `integrations/BigcapitalIntegration.ts` imports functions from Bigcapital packages.
   - Registers actions and triggers using those functions.
3. **PageFlow Execution**
   - Existing workflow executor maps action names like `bigcapital:createInvoice` to the imported functions.

## 8. Product Development Roadmap
1. **Research & Setup**
   - Review Bigcapital docs and fetch the submodule with `git submodule update --init --recursive`.
   - Copy `.env.example` to `.env`, set database credentials and run `yarn install`.
2. **Library Wrappers**
   - Create TypeScript helpers for invoices, expenses and account queries.
   - Write unit tests for these helpers.
3. **Integration Module**
   - Export available actions and triggers through `BigcapitalIntegration.ts`.
   - Register the module in `integrations/index.ts`.
4. **Credential UI**
   - Extend the Integrations modal to edit values stored in `bigcapital/.env`.
5. **PageFlow Support**
   - Add Bigcapital actions and triggers to the builder dropdowns.
6. **Testing & Beta**
   - Run end‑to‑end tests creating invoices and recording expenses via workflows.
   - Invite a small set of users to trial the integration and gather feedback.
7. **Public Release**
   - Document usage in README and promote to all Mesh users.

## 9. Testing Plan
- **Unit Tests** for the library helpers and event handling.
- **Integration Tests** executing PageFlows with Bigcapital actions.
- Continuous linting with `npm run lint` to enforce code quality.

## 10. Future Considerations
- Support additional Bigcapital modules such as payroll and inventory transfers.
- Provide a full Bigcapital dashboard inside Mesh using embedded pages.
- Consider exposing optional API endpoints if remote access becomes necessary.
