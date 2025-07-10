# Software Requirement Specification: Bigcapital Integration

## 1. Introduction
### 1.1 Purpose
This document describes how the open source accounting platform [Bigcapital](https://github.com/bigcapitalhq/bigcapital) will be integrated into Mesh. Bigcapital is cloned under the `bigcapital/` directory and run locally with Docker. The goal is to expose Bigcapital's financial features as workflow actions and triggers within the PageFlow builder so users can automate accounting tasks without relying on the Bigcapital cloud.

### 1.2 Scope
The integration covers:
1. Cloning the Bigcapital repository and running its Docker compose stack locally.
2. Library modules for creating invoices, recording expenses and retrieving balances by calling the local service.
3. PageFlow actions and triggers that use those modules.
4. User interfaces for connecting to the self‑hosted instance.

### 1.3 References
- [Bigcapital Documentation](https://docs.bigcapital.app/)
- [Bigcapital Repository](https://github.com/bigcapitalhq/bigcapital)
- `Plugin_Architecture_SRS.md`
- `Linear_Workflow_Builder_SRS.md`

## 2. Overall Description
Bigcapital is an AGPL licensed accounting and inventory system. A full copy of the project lives in `bigcapital/` and is started with `docker compose`. Mesh communicates with the local service through REST and GraphQL endpoints exposed on the internal Docker network. The integration adds a `BigcapitalIntegration` module that registers workflow actions (e.g. `createInvoice`) and triggers (e.g. `invoicePaid`). Connection details are stored in the existing integrations table.

## 3. System Features
### 3.1 Bigcapital Actions
- **createInvoice** – Generate an invoice for a customer with line items and due date.
- **recordExpense** – Log an expense transaction with account and amount.
- **fetchBalance** – Retrieve account balances for generating reports.

### 3.2 Bigcapital Triggers
- **invoicePaid** – Fires when an invoice is marked paid in Bigcapital.
- **lowInventory** – Emits when an item stock level falls below a threshold.

### 3.3 Credential Management
- Users provide the local Bigcapital URL and login credentials configured in the `bigcapital/.env` file.
- These values are encrypted in the database similar to other integrations.

### 3.4 PageFlow Integration
- Actions and triggers become selectable options in the PageFlow builder.
- Steps can mix Bigcapital functions with existing workflow actions.
- Logs from Bigcapital requests appear in the builder output panel.

## 4. External Interface Requirements
### 4.1 User Interfaces
- **Integration Modal** – Allows adding a Bigcapital connection and testing credentials.
- **PageFlow Builder** – Presents Bigcapital actions/triggers in the step selector and provides fields for invoice data or expense details.

### 4.2 Hardware Interfaces
- No special hardware requirements. Both Mesh and Bigcapital run on standard servers or Docker containers.

### 4.3 Software Interfaces
- HTTPS requests to the Bigcapital API (`/api/graphql` and REST endpoints).
- Existing Mesh integration loader and workflow executor libraries.

### 4.4 Communication Interfaces
- Mesh calls the local Bigcapital REST and GraphQL endpoints over HTTP on the Docker network.
- Webhooks from the Bigcapital container are received via `/api/webhooks/bigcapital`.

## 5. Non-Functional Requirements
- **Performance:** Each action should complete within 2 seconds under normal API load.
- **Security:** Credentials are encrypted at rest and never logged. Webhook payloads are verified using shared secrets.
- **Reliability:** Retry logic handles transient API failures. Workflows log errors and continue processing other steps.
- **Maintainability:** Implementation follows repository coding conventions and passes `npm run lint`.

## 6. User Flows
1. **Connect Account** – User opens the Integrations modal, selects Bigcapital and enters the URL, email and password for the local instance. Mesh stores these values securely.
2. **Build Workflow** – In PageFlow, the user adds steps such as `onClick` → `bigcapital:createInvoice`. The builder prompts for customer name, items and totals.
3. **Run Flow** – When triggered, Mesh sends requests to the self‑hosted Bigcapital service. Success or error responses are displayed in the log section.
4. **Webhook Trigger** – When an invoice is paid, Bigcapital sends a webhook to Mesh, triggering a PageFlow that may send an email or update a spreadsheet.

## 7. System Architecture
1. **Bigcapital Service**
   - Deployed via `docker compose -f bigcapital/docker-compose.prod.yml -p bigcapital up -d`.
   - Environment variables are loaded from `bigcapital/.env`.
   - Exposes REST and GraphQL endpoints on an internal network.
2. **API Wrapper**
   - A new module under `lib/actions/bigcapital.actions.ts` wraps common calls like `createInvoice` and `recordExpense`.
   - Uses `fetch` to hit the local service URLs defined in the integration settings.
3. **Integration Module**
   - `integrations/BigcapitalIntegration.ts` implements the `IntegrationApp` interface.
   - Registers actions and triggers using the wrapper functions.
4. **Webhook Handler**
   - API route `/api/webhooks/bigcapital` verifies events from Bigcapital and enqueues matching PageFlow triggers.
5. **PageFlow Execution**
   - Existing workflow executor maps action names like `bigcapital:createInvoice` to the API wrapper methods.

## 8. Product Development Roadmap
1. **Research & Setup**
   - Review Bigcapital docs and clone the repository into `bigcapital/`.
   - Copy `.env.example` to `.env`, adjust credentials, then run `docker compose -f docker-compose.prod.yml -p bigcapital up -d`.
2. **API Wrapper**
   - Implement TypeScript functions for invoices, expenses and account queries.
   - Write unit tests with mocked responses.
3. **Integration Module**
   - Create `BigcapitalIntegration.ts` exporting available actions and triggers.
   - Register the module in `integrations/index.ts`.
4. **Credential UI**
   - Extend the Integrations modal to accept the self‑hosted URL, email and password, plus webhook secret configuration.
5. **PageFlow Support**
   - Add Bigcapital actions and triggers to the builder dropdowns.
   - Display form fields for invoice data, expense details and stock thresholds.
6. **Webhook Implementation**
   - Create the `/api/webhooks/bigcapital` route and link triggers to PageFlow executions.
7. **Testing & Beta**
   - Run end‑to‑end tests creating invoices and recording expenses via workflows.
   - Invite a small set of users to trial the integration and gather feedback.
8. **Public Release**
   - Document usage in README and promote to all Mesh users.

## 9. Testing Plan
- **Unit Tests** for the API wrapper and webhook verification.
- **Integration Tests** executing PageFlows with Bigcapital actions.
- **Webhook Tests** ensuring external events correctly trigger flows.
- Continuous linting with `npm run lint` to enforce code quality.

## 10. Future Considerations
- Support additional Bigcapital modules such as payroll and inventory transfers.
- Provide a full Bigcapital dashboard inside Mesh using embedded pages.
- Consider caching common queries to reduce API calls and improve performance.
