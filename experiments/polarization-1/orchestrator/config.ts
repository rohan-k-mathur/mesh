/**
 * orchestrator/config.ts
 *
 * Loads runtime configuration: agent identities, deliberation pin, model
 * tier, base URLs. All paths are resolved relative to the experiment root
 * (`experiments/polarization-1/`).
 *
 * Design constraint: NEVER read process.env directly outside this module.
 * Tests set EXPERIMENT_ROOT to a fixture dir and rely on this module's
 * single source of truth.
 */

import { readFileSync, existsSync } from "fs";
import path from "path";

export type ModelTier = "dev" | "prod";

export interface AgentIdentity {
  role: string; // "claim-analyst" | "advocate-a" | ...
  userId: string;
  authId: string;
  displayName: string;
  email: string;
  idToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AgentsRuntime {
  labelPrefix: string;
  provisionedAt: string;
  agents: AgentIdentity[];
}

export interface DeliberationRuntime {
  deliberationId: string;
  /** Set by the experimenter when the deliberation is for real data collection.
   *  When true, the orchestrator refuses to advance any phase under model-tier=dev. */
  experimentMode: boolean;
  /** Optional: bound evidence stack id (mirrors DeliberationEvidenceContext). */
  evidenceStackId?: string | null;
  createdAt?: string;
  notes?: string;
}

export interface OrchestratorConfig {
  experimentRoot: string;
  runtimeDir: string;
  isonomiaBaseUrl: string;
  anthropicApiKey: string;
  anthropicModelDev: string;
  anthropicModelProd: string;
  modelTier: ModelTier;
  agents: AgentsRuntime;
  deliberation: DeliberationRuntime;
}

const DEFAULT_DEV_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_PROD_MODEL = "claude-opus-4-5-20251101";

export function readJson<T>(filePath: string): T {
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export interface LoadConfigOptions {
  modelTier?: ModelTier;
  experimentRoot?: string;
}

export function loadConfig(opts: LoadConfigOptions = {}): OrchestratorConfig {
  const experimentRoot =
    opts.experimentRoot ??
    process.env.EXPERIMENT_ROOT ??
    path.resolve(__dirname, "..");
  const runtimeDir = path.join(experimentRoot, "runtime");

  const agentsPath = path.join(runtimeDir, "agents.json");
  if (!existsSync(agentsPath)) {
    throw new Error(
      `runtime/agents.json not found at ${agentsPath}. Run \`npm run provision:agents\` first.`,
    );
  }
  const agents = readJson<AgentsRuntime>(agentsPath);

  const deliberationPath = path.join(runtimeDir, "deliberation.json");
  let deliberation: DeliberationRuntime;
  if (existsSync(deliberationPath)) {
    deliberation = readJson<DeliberationRuntime>(deliberationPath);
  } else {
    // Allow CLI utilities like `state` to short-circuit before a deliberation
    // exists. Phase commands themselves call `requireDeliberation()` below.
    deliberation = { deliberationId: "", experimentMode: false };
  }

  const modelTier: ModelTier =
    opts.modelTier ?? ((process.env.MODEL_TIER as ModelTier) || "dev");

  const isonomiaBaseUrl = (
    process.env.ISONOMIA_BASE_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY || "";

  return {
    experimentRoot,
    runtimeDir,
    isonomiaBaseUrl,
    anthropicApiKey,
    anthropicModelDev: process.env.ANTHROPIC_MODEL_DEV || DEFAULT_DEV_MODEL,
    anthropicModelProd: process.env.ANTHROPIC_MODEL_PROD || DEFAULT_PROD_MODEL,
    modelTier,
    agents,
    deliberation,
  };
}

export function requireDeliberation(cfg: OrchestratorConfig): DeliberationRuntime & { deliberationId: string } {
  if (!cfg.deliberation.deliberationId) {
    throw new Error(
      `runtime/deliberation.json missing or has empty deliberationId. ` +
        `Create the deliberation and write its id to ${path.join(cfg.runtimeDir, "deliberation.json")} before running phases.`,
    );
  }
  return cfg.deliberation as DeliberationRuntime & { deliberationId: string };
}

export function modelFor(cfg: OrchestratorConfig): string {
  return cfg.modelTier === "prod" ? cfg.anthropicModelProd : cfg.anthropicModelDev;
}

export function agentByRole(cfg: OrchestratorConfig, role: string): AgentIdentity {
  const a = cfg.agents.agents.find((x) => x.role === role);
  if (!a) {
    throw new Error(
      `Agent role "${role}" not found in runtime/agents.json. ` +
        `Available: ${cfg.agents.agents.map((x) => x.role).join(", ")}`,
    );
  }
  return a;
}
