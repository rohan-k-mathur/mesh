/**
 * orchestrator/index.ts
 *
 * CLI entrypoint for the polarization-1 multi-agent deliberation
 * orchestrator. Per Stage-1 §4.5 + §4.6.
 *
 * Usage:
 *   yarn orchestrator preflight
 *   yarn orchestrator state
 *   yarn orchestrator phase 1 [--max-rounds N]
 *   yarn orchestrator phase 2
 *   yarn orchestrator dry-run phase N --round R
 *   yarn orchestrator export-final-state
 *
 * Global flags:
 *   --model-tier=dev|prod   (default: dev; required to be 'prod' when
 *                            runtime/deliberation.json has experimentMode=true)
 *   --experiment-root PATH  (default: ../ relative to this file)
 *
 * Phase implementations live in `phases/phase-N-*.ts` and are not all
 * present yet — Phase 1 lands in step 6 of the implementation plan.
 */

import path from "path";

import { loadConfig, requireDeliberation, modelFor, type ModelTier } from "./config";
import { IsonomiaClient } from "./isonomia-client";
import { AnthropicClient } from "./anthropic-client";
import { RoundLogger } from "./log/round-logger";
import { fetchState } from "./state/refresh";

// ────────────────────────────────────────────────────────────────────────────
// Tiny CLI parser
// ────────────────────────────────────────────────────────────────────────────

interface ParsedArgs {
  positional: string[];
  flags: Record<string, string | true>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq >= 0) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith("--")) {
          flags[a.slice(2)] = next;
          i++;
        } else {
          flags[a.slice(2)] = true;
        }
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

// ────────────────────────────────────────────────────────────────────────────
// Pre-flight validation (Stage-1 §4.6)
// ────────────────────────────────────────────────────────────────────────────

interface PreflightResult {
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; detail?: string }>;
}

async function runPreflight(opts: {
  modelTier: ModelTier;
  experimentRoot?: string;
  requireDeliberation?: boolean;
  minEvidenceSources?: number;
}): Promise<PreflightResult> {
  const checks: PreflightResult["checks"] = [];
  const cfg = loadConfig({ modelTier: opts.modelTier, experimentRoot: opts.experimentRoot });

  // 1. Anthropic key present.
  checks.push({
    name: "ANTHROPIC_API_KEY present",
    ok: !!cfg.anthropicApiKey,
    detail: cfg.anthropicApiKey ? undefined : "Set ANTHROPIC_API_KEY in .env",
  });

  // 2. agents.json — already loaded by loadConfig, but verify each token works.
  const iso = new IsonomiaClient(cfg);
  for (const a of cfg.agents.agents) {
    try {
      const me = await iso.getMe(a.role);
      checks.push({
        name: `Agent ${a.role} authenticates against ${cfg.isonomiaBaseUrl}/api/me`,
        ok: !!me?.uid,
        detail: me?.uid ? `uid=${me.uid}` : undefined,
      });
    } catch (err) {
      checks.push({
        name: `Agent ${a.role} authenticates against ${cfg.isonomiaBaseUrl}/api/me`,
        ok: false,
        detail: (err as Error)?.message?.slice(0, 200),
      });
    }
  }

  // 3. Schemes catalog reachable.
  try {
    const schemes = await iso.getSchemes(cfg.agents.agents[0].role);
    const arr = Array.isArray(schemes) ? schemes : (schemes as any)?.schemes ?? [];
    checks.push({
      name: "GET /api/schemes returns a non-empty list",
      ok: Array.isArray(arr) && arr.length > 0,
      detail: `count=${Array.isArray(arr) ? arr.length : 0}`,
    });
  } catch (err) {
    checks.push({
      name: "GET /api/schemes returns a non-empty list",
      ok: false,
      detail: (err as Error)?.message?.slice(0, 200),
    });
  }

  // 4. deliberation.json — only required for phase commands.
  if (opts.requireDeliberation) {
    if (!cfg.deliberation.deliberationId) {
      checks.push({
        name: "runtime/deliberation.json present with deliberationId",
        ok: false,
        detail: "Create the deliberation and write its id to runtime/deliberation.json",
      });
    } else {
      checks.push({
        name: "runtime/deliberation.json present with deliberationId",
        ok: true,
        detail: cfg.deliberation.deliberationId,
      });
      // Tier guard: prod required when experimentMode.
      if (cfg.deliberation.experimentMode && cfg.modelTier !== "prod") {
        checks.push({
          name: "Model tier matches deliberation.experimentMode",
          ok: false,
          detail: "deliberation.experimentMode=true but modelTier=dev — refuse to advance.",
        });
      }
      // Evidence corpus floor.
      const min = opts.minEvidenceSources ?? 15;
      try {
        const ec = await iso.getEvidenceContext(cfg.deliberation.deliberationId, {
          role: cfg.agents.agents[0].role,
        });
        checks.push({
          name: `Evidence context bound with ≥ ${min} sources`,
          ok: (ec.stack?.sourceCount ?? 0) >= min,
          detail: `stack=${ec.stack?.id} sourceCount=${ec.stack?.sourceCount}`,
        });
      } catch (err) {
        checks.push({
          name: `Evidence context bound with ≥ ${min} sources`,
          ok: false,
          detail: (err as Error)?.message?.slice(0, 200),
        });
      }
    }
  }

  return { ok: checks.every((c) => c.ok), checks };
}

function printPreflight(r: PreflightResult): void {
  for (const c of r.checks) {
    const mark = c.ok ? "✓" : "✗";
    process.stdout.write(`  ${mark} ${c.name}`);
    if (c.detail) process.stdout.write(`  — ${c.detail}`);
    process.stdout.write("\n");
  }
  process.stdout.write(r.ok ? "\nPreflight: OK\n" : "\nPreflight: FAILED\n");
}

// ────────────────────────────────────────────────────────────────────────────
// Commands
// ────────────────────────────────────────────────────────────────────────────

async function cmdPreflight(args: ParsedArgs) {
  const tier = (args.flags["model-tier"] as ModelTier) || "dev";
  const root = args.flags["experiment-root"] as string | undefined;
  const r = await runPreflight({
    modelTier: tier,
    experimentRoot: root,
    requireDeliberation: true,
  });
  printPreflight(r);
  if (!r.ok) process.exit(1);
}

async function cmdState(args: ParsedArgs) {
  const tier = (args.flags["model-tier"] as ModelTier) || "dev";
  const root = args.flags["experiment-root"] as string | undefined;
  const cfg = loadConfig({ modelTier: tier, experimentRoot: root });
  const delib = requireDeliberation(cfg);
  const iso = new IsonomiaClient(cfg);
  const role = cfg.agents.agents[0].role;
  const state = await fetchState(iso, delib.deliberationId, { role });
  process.stdout.write(JSON.stringify(state, null, 2) + "\n");
}

async function cmdPhase(phaseNum: number, args: ParsedArgs) {
  const tier = (args.flags["model-tier"] as ModelTier) || "dev";
  const root = args.flags["experiment-root"] as string | undefined;

  const pre = await runPreflight({
    modelTier: tier,
    experimentRoot: root,
    requireDeliberation: true,
    minEvidenceSources: phaseNum >= 2 ? 15 : 0,
  });
  if (!pre.ok) {
    printPreflight(pre);
    process.exit(1);
  }

  // Lazy-load the phase module so missing phases produce a clear error
  // before construction of clients.
  const phaseFile = phaseNameFor(phaseNum);
  let mod: any;
  try {
    mod = await import(`./phases/${phaseFile}`);
  } catch (err) {
    const msg = (err as Error)?.message ?? String(err);
    process.stderr.write(
      `Phase ${phaseNum} not implemented yet (looking for ./phases/${phaseFile}).\n` +
        `  Underlying error: ${msg}\n`,
    );
    process.exit(2);
  }
  if (typeof mod.runPhase !== "function") {
    process.stderr.write(`./phases/${phaseFile} does not export runPhase()\n`);
    process.exit(2);
  }

  const cfg = loadConfig({ modelTier: tier, experimentRoot: root });
  const delib = requireDeliberation(cfg);
  const iso = new IsonomiaClient(cfg);
  const llm = new AnthropicClient(cfg.anthropicApiKey);
  const logger = RoundLogger.forRound({
    runtimeDir: cfg.runtimeDir,
    phase: phaseNum,
    round: 0,
  });
  logger.event("phase_start", {
    phase: phaseNum,
    model: modelFor(cfg),
    modelTier: cfg.modelTier,
    deliberationId: delib.deliberationId,
  });

  const result = await mod.runPhase({
    cfg,
    iso,
    llm,
    deliberationId: delib.deliberationId,
    maxRounds: args.flags["max-rounds"] ? Number(args.flags["max-rounds"]) : undefined,
  });

  logger.event("phase_complete", { phase: phaseNum, result });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

function phaseNameFor(n: number): string {
  switch (n) {
    case 1: return "phase-1-topology";
    case 2: return "phase-2-arguments";
    case 3: return "phase-3-attacks";
    case 4: return "phase-4-concessions";
    default: throw new Error(`Unknown phase ${n}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Entrypoint
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args.positional[0];

  if (!cmd) {
    process.stderr.write(usage());
    process.exit(2);
  }

  try {
    switch (cmd) {
      case "preflight":
        return await cmdPreflight(args);
      case "state":
        return await cmdState(args);
      case "phase": {
        const n = Number(args.positional[1]);
        if (!Number.isInteger(n) || n < 1) {
          process.stderr.write("Usage: orchestrator phase <N>\n");
          process.exit(2);
        }
        return await cmdPhase(n, args);
      }
      default:
        process.stderr.write(`Unknown command: ${cmd}\n\n${usage()}`);
        process.exit(2);
    }
  } catch (err) {
    process.stderr.write(`Error: ${(err as Error)?.message ?? String(err)}\n`);
    process.exit(1);
  }
}

function usage(): string {
  return [
    "Usage: orchestrator <command> [args]",
    "",
    "Commands:",
    "  preflight                      Validate runtime config + auth + evidence corpus",
    "  state                          Print composed deliberation state JSON (no LLM calls)",
    "  phase <N> [--max-rounds N]     Run phase N",
    "",
    "Global flags:",
    "  --model-tier=dev|prod          Default: dev (refuses to run experimentMode=true)",
    "  --experiment-root PATH         Override experiment root (defaults to ../)",
    "",
    `Resolved root: ${path.resolve(__dirname, "..")}`,
    "",
  ].join("\n");
}

main();
