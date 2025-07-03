# Software Requirement Specification: State Machine Builder

## 1. Introduction
### 1.1 Purpose
This document details the requirements and architecture roadmap for a **State Machine Builder** in Mesh. The feature provides a graphical editor to orchestrate node execution with branching logic. It expands the "Advanced Node System" and enables automation workflows such as sending email notifications when product inventory runs low on a small ecommerce site.

### 1.2 Scope
The builder allows users to visually create states, connect them with transitions, and define conditional branches. During execution, the interface highlights the active state so users can monitor progress. Workflows are saved in the database and can trigger existing node types or custom plug‑ins.

### 1.3 References
- `Advanced_Node_System_SRS.md`
- `Mesh_Roadmap.md`
- Existing node components in `components/nodes`

## 2. Overall Description
The State Machine Builder is an extension of the React Flow canvas. Users drag nodes representing states onto the canvas, then draw edges to indicate execution order. Each edge can include a condition (e.g., inventory `< 5`). A dedicated panel lists state properties and transition rules. When a workflow runs, the builder animates which state is active and shows output from each step. A state machine might automate tasks across services, similar to Zapier or Automatisch.

## 3. System Features
### 3.1 Graphical Editor
- **Description:** Canvas-based UI powered by React Flow.
- **Requirements:**
  - Drag‑and‑drop to place states.
  - Click‑and‑drag to create transitions.
  - Side panel to edit labels, conditions, and linked node actions.

### 3.2 State and Transition Management
- **Description:** Define unique states and the edges between them.
- **Requirements:**
  - States store an associated node type or action to execute.
  - Transitions may specify a `condition` expression evaluating runtime data.
  - Support multiple outgoing transitions per state for branching logic.

### 3.3 Execution Visualization
- **Description:** Highlight active state during workflow execution.
- **Requirements:**
  - Animate the current state node.
  - Display logs or outputs below the canvas.
  - Allow step‑through debugging and pausing.

### 3.4 Workflow Persistence and Sharing
- **Description:** Save state machine graphs to the database.
- **Requirements:**
  - Workflows belong to a user or room and can be shared via links.
  - Version history retains previous edits.
  - Permissions restrict who may run or modify a workflow.

### 3.5 Example Automation
- **Scenario:** A shop owner wants an email when inventory for a product drops below a threshold.
- **Steps:**
  1. Create a "Check Inventory" state linked to a script that reads product counts.
  2. Add a conditional transition `inventory < 5` to an "Send Email" state.
  3. On the "Send Email" state, attach an email‑sending node with message details.
  4. Optionally loop back to "Check Inventory" with a delay state for periodic checks.

## 4. External Interface Requirements
### 4.1 User Interfaces
- Builder canvas and side panels within the Mesh web app.
- Modals for creating and editing states and transitions.

### 4.2 Hardware Interfaces
- Standard browsers with pointer input.

### 4.3 Software Interfaces
- React Flow for graph rendering.
- Supabase or similar backend for storing workflows.
- Existing node execution APIs to run actions.

### 4.4 Communication Interfaces
- HTTPS requests for saving workflows and triggering server actions.
- WebSocket channels to stream live state updates during execution.

## 5. Functional Requirements
1. **FR1:** Users shall create, edit, and delete states on the canvas.
2. **FR2:** Users shall connect states with transitions that may include conditions.
3. **FR3:** The builder shall persist workflows so they can be loaded and reused.
4. **FR4:** During execution, the current state shall be visually highlighted.
5. **FR5:** The execution engine shall process transitions in order, evaluating conditions to decide the next state.
6. **FR6:** Users shall be able to trigger workflows manually or schedule them at intervals.

## 6. Non-Functional Requirements
- **Performance:** Visual updates and execution steps should respond within 200 ms.
- **Security:** Only authorized users may modify or run a workflow. Sensitive data (e.g., API tokens) must be encrypted in storage.
- **Reliability:** Workflows should resume gracefully after reconnection.
- **Usability:** Provide intuitive drag‑and‑drop controls and clear status indicators.

## 7. System Architecture
1. **Frontend Components**
   - React Flow canvas for graph editing.
   - Sidebar panels for state details and transition conditions.
   - Execution viewer overlay to display active state and logs.
2. **Backend Services**
   - Database tables for states, transitions, and workflow metadata.
   - API routes to create, update, retrieve, and run workflows.
   - Execution engine that interprets the stored graph and calls node actions.
3. **Data Model**
   - `Workflow` – id, owner, name, version.
   - `State` – id, workflowId, actionType, config.
   - `Transition` – id, fromState, toState, condition.
4. **Execution Flow**
   - Client requests to start a workflow.
   - Server loads the state machine and begins execution, emitting state updates.
   - Client visualizes the active state and displays output logs.

## 8. Testing Plan
- Unit tests for parsing and executing state machines.
- Integration tests for saving and loading workflows via API routes.
- UI tests ensuring states and transitions render correctly and highlight during execution.
- Continuous linting with `npm run lint`.

## 9. Future Considerations
- Marketplace for sharing workflow templates.
- Hooks to integrate with external services (email, storage, payments).
- Support exporting and importing workflows as JSON files.

Using Automatisch as a reference to help guide development: Automatisch’s open-source repository describes it as a “business automation tool” that lets you connect services like Twitter and Slack to automate workflows. It emphasizes that automation should be easy and inexpensive, without needing programming knowledge. A key benefit is the ability to keep data on your own servers, making it attractive for organizations with strict privacy requirements. The README also highlights that being open source means anyone can contribute and there’s no vendor lock-in.

The documentation (available at https://automatisch.io/docs/) walks through concepts such as installation, key concepts, creating flows, advanced configuration, and how to build integrations. It describes how flows are composed of triggers and actions, running about every 15 minutes (with plans for more real‑time updates if supported by third-party services). Although the site notes “All rights reserved,” it outlines where to find information on app folder structure, authentication, global variables, and integration examples.

Based on these resources, a robust approach for integrating third-party automation features into a state machine builder could include:

Flow-based abstraction – Model each automation as a sequence of steps similar to Automatisch’s flows, starting from triggers (e.g., a new message or event) and moving through actions (e.g., posting to Slack).

Pluggable integration modules – Follow Automatisch’s pattern of defining integrations (apps) with clear configuration, authentication, and triggers/actions so they can be added or removed easily.

Self-hosted or cloud – Consider supporting self-hosting to keep user data local, matching the repository’s emphasis on privacy.

Open contribution model – Encourage contributions to new integrations, taking cues from Automatisch’s open-source community approach.

Interval or event-driven execution – Provide scheduling similar to the 15‑minute polling approach, but plan for near‑real‑time updates when third-party APIs allow it.

Extensive documentation – Create clear guides for developers on how to build new integrations—covering folder structure, global variables, auth mechanisms, and usage examples—mirroring the structure in Automatisch’s docs.

By examining Automatisch’s README and docs, these strategies can help design a state machine builder that accommodates diverse third-party services while remaining extensible and community driven. 

Links: https://github.com/automatisch/automatisch and https://automatisch.io/docs/

