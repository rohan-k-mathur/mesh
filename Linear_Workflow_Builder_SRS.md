# Software Requirement Specification: Linear Workflow Builder

## 1. Introduction
### 1.1 Purpose
This document defines the requirements and architecture for a linear workflow automation builder in Mesh. The goal is to provide a straightforward interface where users chain triggers and actions vertically on a scrolling page. It complements the existing state machine builder but focuses on a linear layout without React Flow.

### 1.2 Scope
The builder enables users to create workflows composed of trigger and action cards, connect third‑party services, and execute or schedule the flow. It supports parallel branches, saved templates, and integration configuration.

### 1.3 References
- `Flowstate_Flow_Builder.md`
- `Analytics_Dashboard_Flow_Builder_SRS.md`
- `Plugin_Architecture_SRS.md`

## 2. Overall Description
Users assemble workflows by adding cards to an infinite scroll page. A toolbar at the top provides buttons such as **Add Trigger**, **Add Action**, **Connect Accounts**, **Configure Integrations**, and **Add Parallel Branch**. Each card contains dropdowns and inputs that change based on the selected trigger or action. Cards are chained vertically, with plus buttons to add the next step or branch. The final card includes a **Run** button to execute the flow.

## 3. Product Development Roadmap
1. **Prototype Layout** – Build the infinite scrolling page with basic card components and toolbar.
2. **Dynamic Card Logic** – Implement dropdowns that reveal input fields based on selected options.
3. **Parallel Branching** – Allow cards to spawn siblings on the same row when **Add Parallel Branch** is chosen.
4. **Account Connections** – Integrate OAuth flows and store credentials securely.
5. **Workflow Execution** – Serialize the card chain and execute actions server‑side.
6. **Saving & Loading** – Create API routes to persist workflows and list saved flows.
7. **Template Library** – Provide starter workflows that users can load and customize.
8. **Analytics & Logging** – Record run history and display logs for each card.

## 4. System Features
### 4.1 Linear Layout
- Infinite scrolling page renders cards in a single column.
- Toolbar remains sticky at the top for easy access.

### 4.2 Trigger and Action Cards
- Each card has a dropdown to choose the trigger or action type.
- Additional inputs appear based on the selection (e.g., fields for API keys or conditions).
- A plus icon below the card opens a modal to add the next card.

### 4.3 Parallel Branches
- Selecting **Add Parallel Branch** adds a sibling card on the same row.
- Branches can contain their own sequence of cards executed after the original trigger.

### 4.4 Integration Management
- **Connect Accounts** and **Configure Integrations** open modals for OAuth flows or API key entry.
- Stored credentials are reused across workflows.

### 4.5 Workflow Execution & Persistence
- Clicking **Run** sends the serialized workflow to a serverless function that executes each step.
- Users can save flows, load existing ones, and create new flows from templates.

## 5. External Interface Requirements
### 5.1 User Interfaces
- Next.js pages under `/workflows` host the builder.
- Modals and dropdowns use existing component libraries.
- Execution status and logs appear beneath each card during a run.

### 5.2 Hardware Interfaces
- No special hardware requirements beyond standard web browsers.

### 5.3 Software Interfaces
- OAuth providers and third‑party APIs for integrations.
- Supabase or database APIs for storing workflows and credentials.

### 5.4 Communication Interfaces
- WebSocket or HTTP endpoints to trigger workflows and stream logs.

## 6. Functional Requirements
1. The system shall render a new trigger card when **Add Trigger** is clicked.
2. The system shall display relevant input fields after a trigger or action is selected.
3. The system shall allow adding a chain of action cards using the plus icon.
4. The system shall support creating parallel branches from any card.
5. The system shall store workflow definitions in the database.
6. The system shall execute workflows and report success or failure per card.
7. The system shall let users save, load, and delete flows.

## 7. Non-Functional Requirements
- **Performance:** Page interactions should remain responsive with dozens of cards.
- **Security:** Credentials must be encrypted at rest and never exposed client‑side.
- **Reliability:** Workflow execution should resume or fail gracefully if a step errors.
- **Usability:** Cards and toolbar buttons must be accessible via keyboard and screen readers.
- **Maintainability:** Follow coding conventions and ensure `npm run lint` passes.

## 8. System Architecture
The builder is a React component tree with state managed via a central store. Each card component describes its type, configuration, and position. When a workflow is run, the client sends the serialized structure to API routes that invoke back‑end action handlers. Integrations are loaded via the plug‑in architecture, allowing new triggers and actions to be added without core changes. Workflow data and run logs are stored in Supabase tables. Real‑time updates during execution are streamed over WebSocket channels.

## 9. User Flows
1. **Create New Flow**
   - Navigate to `/workflows/new`.
   - Click **Add Trigger** and configure the trigger.
   - Click the plus icon to add an action or parallel branch.
   - Repeat until the workflow is complete, then save.
2. **Run Existing Flow**
   - Load a saved flow from the dashboard.
   - Review the card chain and click **Run**.
   - Monitor progress as each card reports success or failure.
3. **Manage Integrations**
   - Use **Connect Accounts** to authorize new services.
   - Configure integration settings via the toolbar.

## 10. Testing Plan
- Unit tests for card components and workflow serialization logic.
- Integration tests executing sample workflows end‑to‑end.
- API tests for saving and loading flows.
- Continuous linting with `npm run lint` before every commit.

## 11. Future Considerations
- Drag‑and‑drop reordering of cards.
- Conditional branching beyond simple parallel branches.
- Versioning of workflows and collaborative editing.

## 12. Priority Integrations
To help small businesses streamline operations, the first release will support these third‑party apps:

- **Google Sheets** – store and manipulate workflow data.
- **Gmail** – send automated emails from workflows.
- **Slack** – post notifications to team channels.
- **HubSpot** – manage leads and CRM activities.
- **QuickBooks Online** – sync invoices and expenses.
- **Stripe** – process payments within workflows.
- **Shopify** – handle e‑commerce orders and inventory.
- **Calendly** – automate meeting scheduling.
- **Notion** – organize internal documents and tasks.
- **ChatGPT (OpenAI)** – generate content and respond with AI.

These integrations cover communication, sales, payments and scheduling, giving small businesses an efficient starting toolkit.
