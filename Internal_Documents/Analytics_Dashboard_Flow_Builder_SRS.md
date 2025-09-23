# Software Requirement Specification: Analytics Dashboard Flow Builder

## 1. Introduction
### 1.1 Purpose
This document defines the requirements and development roadmap for an **Analytics Dashboard Flow Builder**. The feature provides a workflow template that aggregates commerce and social metrics, generates reports, and delivers them via email or Slack. It demonstrates how the Flowstate builder can power automated analytics inside Mesh.

### 1.2 Scope
The Analytics Dashboard Flow Builder is an extension of the existing state machine builder. It ships with preconfigured nodes that pull sales data from Shopify, fetch metrics from Instagram and TikTok, aggregate the information, generate a report, and send the results to stakeholders. The template serves as a starting point for more advanced workflows that analyze trends and predict popular products.

### 1.3 References
- `Mesh_Roadmap.md`
- `Flowstate_Flow_Builder.md`
- `AnalyticsIntegration.ts`
- Existing workflow templates in `templates/`

## 2. Overall Description
Users begin with a drag‑and‑drop editor where the analytics template is loaded by default. Each state in the graph represents an action—fetching data, aggregating metrics, generating a report, or distributing the report. When executed on a schedule, the workflow collects data from connected services and delivers an automated summary. Predictive insights can be added as AI nodes that run lightweight models to forecast product trends and customer behavior.

## 3. System Features
### 3.1 Template Initialization
- **Description:** A starter graph prepopulates the builder with nodes for Shopify, Instagram, TikTok, data aggregation, and report delivery.
- **Requirements:**
  - Users can modify the template by adding or removing nodes.
  - Integration actions are loaded from the `integrations` folder.

### 3.2 Data Aggregation and Reporting
- **Description:** Data fetched from APIs is stored in an analytics database (BigQuery or PostgreSQL). A report generation node compiles metrics and recommendations.
- **Requirements:**
  - Scheduled jobs trigger data collection weekly or monthly.
  - Reports are formatted as Markdown or PDF and sent via Gmail or Slack actions.

### 3.3 AI‑Driven Insights
- **Description:** Optional nodes run predictive models to surface trends.
- **Requirements:**
  - Lightweight ML functions predict product popularity and customer segments.
  - Results are included in the generated report.

### 3.4 Execution and Scheduling
- **Description:** Workflows can run immediately or on a cron schedule.
- **Requirements:**
  - Users specify schedules in the builder’s UI.
  - The server executes workflows and stores run history.

## 4. Software Architecture
1. **Frontend Components**
   - `WorkflowBuilder` renders the canvas and manages nodes and edges.
   - `TemplatePicker` lets users switch between starter templates.
   - `NewWorkflowClient` initializes the analytics template and handles save actions.
2. **Backend Services**
   - API routes in `app/api/workflows` create and fetch workflows.
   - Integration actions defined in `integrations/` handle external API calls.
   - Scheduled tasks aggregate data and invoke the workflow executor.
3. **Data Model**
   - `Workflow` – stores the graph and metadata.
   - `WorkflowRun` – records each execution and output.
   - `AnalyticsData` – tables for Shopify sales, social metrics, and generated reports.
4. **Execution Flow**
   - The client requests to run a workflow.
   - The server loads integration credentials and executes each node in sequence.
   - Results are saved and optionally sent to email or Slack.

## 5. Product Development Roadmap
1. **MVP Builder** – Provide the analytics template, manual execution, and saving to the database.
2. **Scheduling Support** – Add cron triggers so reports can be generated weekly or monthly.
3. **Predictive Insights** – Integrate basic ML functions that forecast trends.
4. **Unified Dashboard** – Display aggregated analytics and AI recommendations in a single view.
5. **Template Marketplace** – Allow users to share and import workflow templates.

## 6. User Flows
1. **Create Workflow**
   - Navigate to `/workflows/new`.
   - Select the Analytics Dashboard template or another starter template.
   - Customize nodes, set a schedule, and save.
2. **Run Workflow**
   - Trigger immediately or wait for the scheduled job.
   - Monitor execution and view logs as each state completes.
3. **View Report**
   - Receive an email or Slack message with the report link.
   - Open the unified dashboard to see aggregated metrics and predictions.

## 7. Testing Plan
- Unit tests for integration actions and workflow execution.
- API tests for creating, retrieving, and scheduling workflows.
- UI tests ensuring the builder loads templates and saves correctly.
- Continuous linting with `npm run lint` before commits.

