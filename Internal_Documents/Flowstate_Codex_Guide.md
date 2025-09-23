Below is a Codex‑centric implementation playbook that maps every major capability in the Flow Builder v2 SRS to concrete, high‑leverage prompts and automated test steps. You can copy‑and‑paste each prompt (or adapt it slightly) inside the https://chatgpt.com/codex workspace, execute, inspect diff, run generated tests, and commit. Where helpful, I include “Expected Codex behaviour” so you know what a successful response should look like.

0  Ground Rules for Prompting Codex
Guideline	Why it matters	Example
State the file paths explicitly	Codex can open/append the right modules	“Create apps/web/src/pages/flows/[id]/GraphView.tsx …”
Describe the acceptance test before the code	Increases the chance Codex follows TDD	“First, generate a Jest test that fails because the miniMap prop is missing…”
Reference project conventions	Ensures style consistency	“Use zod for schema validation as elsewhere in /libs/shared/z.”
Limit one ‘unit of work’ per prompt	Smaller, auditable diffs	Break large features into sub‑prompts
Ask for comments & doc blocks	Future maintainability	“Add JSDoc to all public functions”
1  Bootstrap Prompts (once per session)
Prompt 1 – Load Context “Search the repository for FlowBuilder and DSL implementations and summarise the current folder layout. Then list the main data models related to flows.” Expected: Codex prints a concise directory tree and TypeScript interface list so it “knows what exists”.
Prompt 2 – Load SRS & Roadmap “Open docs/SRS_FlowBuilder_v2.md and the latest README. Summarise the key requirements and milestones in <300 words.” Expected: Codex caches high‑level goals for subsequent reasoning.

2  Sprint‑by‑Sprint Prompt Library
2.1 Sprint 0 – Telemetry & Shadow Mode
Prompt A – Instrument Events
Add user‑interaction telemetry to the existing v1 builder:
1. Identify all buttons under `components/LinearBuilder/*`.
2. Wrap each onClick with `trackEvent()` from `/libs/telemetry`.
3. Emit event names: "add_trigger", "add_action", "save_flow", "run_flow".
Write Jest tests in `apps/web/__tests__/telemetry.test.ts` to assert that:
- trackEvent is called with correct args when buttons are clicked.
Expected: Modified components + new unit tests that mock trackEvent.
Prompt B – Record Shadow Runs
Create a new serverless function `api/shadowRun.ts`:
- Accepts serialized DSL.
- Stores payload in Postgres table `shadow_runs`.
- Returns 202 Accepted.
Generate Prisma model + migration.
Create integration tests using `supertest` to ensure 202 and DB insert.

2.2 Sprint 1 – Dual‑View MVP
Task	Sample Codex Prompt
Create Graph⇌List state synchroniser	“Implement a React hook useFlowSync in libs/flow-builder/src/useFlowSync.ts that accepts a GraphState and a ListState, merges them into a single FlowDSL, and returns updater fns. Add exhaustive unit tests.”
Mini‑map component	“Generate MiniMap.tsx using react-flow-minimap library, matching design tokens in /tailwind.config.ts. Include storybook story.”
Outline/Search pane	“Create a resizable right‑drawer at components/OutlinePane.tsx listing node names, searchable. Clicking jumps viewport to node (ReactFlow reactflowRef.fitView({nodes:[...]})). Include Cypress E2E that types in search and asserts viewport change.”
2.3 Sprint 2 – Copilot v1 (NL → Draft Flow)
1. Generate OpenAI client wrapper
Add `libs/ai/openaiClient.ts` exporting `generateFlowFromPrompt(prompt: string): Promise<FlowDSL>`.
Use model `gpt-4o`, temperature 0.2.
Unit test with mocked `createChatCompletion` to return a canned DSL.
2. Integrate Sidebar
Under `pages/flows/[id]/CopilotSidebar.tsx`, render a chat window:
- Uses `react-hook-form`.
- On submit: call `generateFlowFromPrompt`, diff against current DSL via `jsondiffpatch`, and highlight insertions in yellow.
Add RTL tests covering optimistic UI state.

2.4 Sprint 3 – Temporal Orchestrator
Step	Codex Prompt
Install Temporal	“Add @temporalio/client and @temporalio/worker. Scaffold a worker in services/orchestrator/index.ts that runs FlowExecutionWorkflow.”
Convert DSL to Temporal Workflow	“Implement libs/orchestrator/compileDslToTemporal.ts that walks DSL JSON and produces generator‑based workflow code using proxyActivities. Include 3 unit tests with sample DSL.”
Retry & Cron policies	“Extend FlowExecutionWorkflow to read node.retryPolicy and node.schedule. Include integration test using Temporal test‑server.”
2.5 Sprint 4 – Versioning & Diff
Prompt – Git‑style Commits
Create `libs/versioning`:
- `commitFlow(flowId, dsl, authorId)` → new row in `flow_versions`.
- `getDiff(oldId, newId)` → JSON diff via `fast-json-patch`.
Expose REST endpoints `/api/flows/:id/versions`.
Add Cypress test: make edit, save, open diff modal, expect highlighted changes.

2.6 Sprint 5 – Plugin SDK (alpha)
1. Manifest Generator
Generate `create-flowstate-plugin` CLI using `commander`.
When run, scaffolds:
- plugin.json (name, scopes, config schema)
- src/index.ts (trigger/action stubs with Zod schema validation)
Add unit test for scaffold output.
2. Runtime Sandbox
In `services/plugin-runtime`, spin up a vm2 sandbox executing uploaded plugin bundles.
Write security test ensuring plugin cannot access `process.env`.

2.7 Sprint 6 – Marketplace & Billing
Area	Prompt
Marketplace UI	“Build /pages/marketplace/index.tsx grid of plugins fetched from /api/plugins. Include install button: POST /api/plugins/:id/install.”
Stripe Connect hooks	“Create webhook handler api/stripe/webhook.ts. On invoice.payment_succeeded, mark plugin usage in Postgres.”
E2E tests	“Using Cypress + Stripe test keys, simulate plugin purchase flow end‑to‑end.”
2.8 Sprint 7 – AI Auto‑Healing
Enhance orchestrator:
- On activity failure, call `ai/diagnoseError` passing stack trace + last payload.
- If suggestion includes `"action": "refresh_token"`, trigger token refresh flow then resume.
Integration test: simulate 401 error, expect auto‑resume and success.

2.9 Sprint 8 – Governance Policies (OPA)
Add OPA sidecar `services/policy-engine`.
Create policy `no_pii_to_public_slack.rego`.
Write unit test using `opa-wasm` to evaluate policy locally.
Add check in `compileDslToTemporal`: throw if DSL violates policy at compile‑time.

2.10 Sprint 9 – Optimization Engine
Create micro‑service `services/optimizer`:
- Runs nightly job scanning flows with `abTest:true`.
- Generates variant suggestions via `ai/generateVariants`.
- Push suggestions to Copilot inbox.
Add Jest test for bandit algorithm selection convergence.

2.11 Sprint 10 – Advanced Collaboration
Extend Yjs doc to include `comments` map keyed by nodeId.
Create `CommentThread.tsx`, live cursors via Liveblocks presence API.
RTL tests for presence indicators.

2.12 Sprint 11 – GA Launch Hardening
Write load test script with k6:
- 10k concurrent flow triggers/min.
Use Codex to split runner pool into shards via Redis Streams.
Generate Grafana dashboard JSON and commit under `/ops/grafana`.

3  Automated Regression Suite (Reusable Prompt)
Prompt – “Run All Tests & Lint” “Execute pnpm test --runInBand && pnpm lint. If any failure, list failed tests first. Attempt to auto‑fix ESLint errors using repository ESLint config and re‑run lint.” Integrate this command into GitHub Actions via .github/workflows/ci.yaml.

4  Smoke‑Test Script (Post‑Deploy)
Prompt – Canary Flow “Create or update cloud function services/canary/createCanaryFlow.ts that:
1. Generates trivial DSL timer → writeRowToTable.
2. Publishes it; waits 5 min; asserts row exists.
3. Sends Slack alert if failed. Schedule every 30 min with Temporal Cron.”

5  Meta‑Prompt for Unblocking
Prompt – “Debug failing Temporal worker” “Open services/orchestrator/index.ts; show last 40 commit diffs. The worker exits with UnhandledPromiseRejection. Investigate root cause and patch with correct await connection.close() semantics. Write regression test.”
Codex will retrieve diff, pinpoint the leak, and patch the file.

✨ Tip
When a generated diff is large, add:
“Stop after each logical chunk; ask me ‘Continue?’ before proceeding.”
This keeps PRs reviewable.

6  Acceptance Checklist Runner
Prompt – Verify SRS Acceptance Criteria “Open docs/SRS_FlowBuilder_v2.md → section 14 ‘Acceptance Criteria Checklist’. For each item: • Locate or generate automated test. • Mark ☑︎ if exists and passing, ☐ otherwise. Produce markdown table docs/acceptance_status.md.”
Execute before every sprint demo.

7  Continual Learning Loop
At the end of each sprint, issue:
Prompt – “Reflect & Refine” “Analyse merged PRs in sprint‑X label. Summarise common lint violations, flaky tests, or architecture issues. Generate an Engineering RFC proposing 2–3 improvements for sprint‑(X+1).”

8  Final Words
Using Codex as shown turns it into a full‑cycle pair engineer:
1. Context ingestion – prime with repo + SRS.
2. TDD‑driven prompts – write failing tests first.
3. Incremental delivery – one module per prompt.
4. Automated verification – CI, canaries, acceptance runner.
Follow the library above, adapt prompt wording to your voice, and Flowstate’s next‑gen builder will converge from spec → shipping software with maximum velocity and minimum regressions.
