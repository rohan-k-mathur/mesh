/**
 * agents/rebuttal.ts
 *
 * Phase-3 (Dialectical Testing) agent runner shared by Advocate A and
 * Advocate B. Loads the role's Phase-3 system prompt, renders the user
 * message per the prompt's §3 input contract (FRAMING, OPPONENT_ARGUMENTS,
 * EVIDENCE_CORPUS, YOUR_TASK), calls Anthropic, parses + validates the
 * JSON response against a per-role parameterized Zod schema (built in
 * `rebuttal-schema.ts`), and retries once on hard-validation failure
 * (per the experiment's two-attempt rule).
 *
 * Refusals are returned to the caller (not thrown) — the phase driver
 * persists them to `runtime/refusals/phase-3-{role}-refusal.json` and
 * decides whether to abort.
 */

import { readFileSync } from "fs";
import path from "path";
import type { ZodError } from "zod";

import { AnthropicClient, extractJson } from "../anthropic-client";
import type { OrchestratorConfig } from "../config";
import { modelFor } from "../config";
import type { RoundLogger } from "../log/round-logger";
import {
  buildRebuttalOutputSchema,
  RebuttalRefusalZ,
  isRebuttalRefusal,
  type RebuttalOutput,
  type RebuttalRefusal,
  type RebuttalSchemaOpts,
} from "./rebuttal-schema";

export class RebuttalValidationError extends Error {
  attempts: number;
  rawResponses: string[];
  zodErrors: ZodError[];
  constructor(message: string, opts: { attempts: number; rawResponses: string[]; zodErrors: ZodError[] }) {
    super(message);
    this.attempts = opts.attempts;
    this.rawResponses = opts.rawResponses;
    this.zodErrors = opts.zodErrors;
  }
}

export type RebuttalAgentRole = "advocate-a" | "advocate-b";

export interface RebuttalTurnInput {
  /** "advocate-a" or "advocate-b" — selects the prompt file and the schema's role discriminator. */
  role: RebuttalAgentRole;
  /** Path to the role's Phase-3 system prompt (relative to experimentRoot). */
  promptPath: string;
  /** Renders into the `## FRAMING` section of the user message. */
  framing: string;
  /**
   * Renders into the `## OPPONENT_ARGUMENTS` section. Built by the phase
   * driver from the OPPOSING advocate's Phase-2 output (the format is
   * documented in §3 of each Phase-3 prompt).
   */
  opponentArgumentsPrompt: string;
  /** Renders into the `## EVIDENCE_CORPUS` section. */
  evidenceCorpusPrompt: string;
  /** Schema-binding parameters (opposing arguments, CQ catalog, allowed citation tokens). */
  schemaOpts: Omit<RebuttalSchemaOpts, "advocateRole">;
  cfg: OrchestratorConfig;
  llm: AnthropicClient;
  logger: RoundLogger;
}

export interface RebuttalTurnResult {
  response: RebuttalOutput | RebuttalRefusal;
  rawText: string;
  usage: { inputTokens: number; outputTokens: number };
  attempts: number;
}

export async function runRebuttalTurn(input: RebuttalTurnInput): Promise<RebuttalTurnResult> {
  const promptPath = path.isAbsolute(input.promptPath)
    ? input.promptPath
    : path.join(input.cfg.experimentRoot, input.promptPath);
  const systemPrompt = readFileSync(promptPath, "utf8");
  const model = modelFor(input.cfg);

  const advocateRole: "A" | "B" = input.role === "advocate-a" ? "A" : "B";
  const outputSchema = buildRebuttalOutputSchema({ ...input.schemaOpts, advocateRole });

  const userMessage = renderUserMessage({
    framing: input.framing,
    opponentArguments: input.opponentArgumentsPrompt,
    evidence: input.evidenceCorpusPrompt,
    role: input.role,
  });

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    { role: "user", content: userMessage },
  ];

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const rawResponses: string[] = [];
  const zodErrors: ZodError[] = [];

  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await input.llm.chat({
      system: systemPrompt,
      messages,
      model,
      // Same temperature as Phase 2: moderate diversity, strict JSON.
      temperature: 0.4,
      // Phase-3 outputs are typically smaller than Phase-2 (≤16 cqResponses
      // + ≤12 rebuttals × ≤4 premises). 12k tokens is comfortable headroom.
      maxTokens: 12000,
      logger: input.logger,
      agentRole: input.role,
    });
    totalInputTokens += res.usage.inputTokens;
    totalOutputTokens += res.usage.outputTokens;
    rawResponses.push(res.text);

    let parsed: unknown;
    try {
      parsed = extractJson(res.text);
    } catch (err) {
      const msg = (err as Error).message;
      input.logger.event("agent_validation_failure", {
        agent: input.role,
        attempt,
        kind: "json-extract",
        phase: 3,
        error: msg,
      });
      if (attempt === 2) {
        throw new RebuttalValidationError(
          `${input.role}: could not extract JSON after ${attempt} attempts: ${msg}`,
          { attempts: attempt, rawResponses, zodErrors },
        );
      }
      messages.push({ role: "assistant", content: res.text });
      messages.push({
        role: "user",
        content:
          `Your last response could not be parsed as JSON: ${msg}\n\n` +
          `Re-emit the response per the prompt's §4 output contract: a single JSON object, ` +
          `optionally inside a \`\`\`json fence, with no prose before or after.`,
      });
      input.logger.event("agent_retry", { agent: input.role, attempt: attempt + 1, phase: 3, reason: "json-extract" });
      continue;
    }

    // Try refusal first (cheap, distinctive shape).
    const refusalAttempt = RebuttalRefusalZ.safeParse(parsed);
    if (refusalAttempt.success) {
      input.logger.event("agent_parsed_output", {
        agent: input.role,
        attempt,
        phase: 3,
        kind: "refusal",
        output: refusalAttempt.data,
      });
      return {
        response: refusalAttempt.data,
        rawText: res.text,
        usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
        attempts: attempt,
      };
    }

    // Try the full output schema.
    const validation = outputSchema.safeParse(parsed);
    if (validation.success) {
      input.logger.event("agent_parsed_output", {
        agent: input.role,
        attempt,
        phase: 3,
        kind: "rebuttal-output",
        cqResponseCount: validation.data.cqResponses.length,
        rebuttalCount: validation.data.rebuttals.length,
      });
      return {
        response: validation.data,
        rawText: res.text,
        usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
        attempts: attempt,
      };
    }

    zodErrors.push(validation.error);
    input.logger.event("agent_validation_failure", {
      agent: input.role,
      attempt,
      phase: 3,
      kind: "zod",
      issues: validation.error.issues,
    });

    if (attempt === 2) {
      throw new RebuttalValidationError(
        `${input.role}: hard-validation failed after 2 attempts. Last issues:\n${formatZodIssues(validation.error)}`,
        { attempts: attempt, rawResponses, zodErrors },
      );
    }
    messages.push({ role: "assistant", content: res.text });
    messages.push({ role: "user", content: validationFollowupMessage(validation.error) });
    input.logger.event("agent_retry", { agent: input.role, attempt: attempt + 1, phase: 3, reason: "zod" });
  }

  // Unreachable.
  throw new Error(`${input.role}: unreachable end of retry loop`);
}

export { isRebuttalRefusal };

// ─────────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────────

function renderUserMessage(opts: {
  framing: string;
  opponentArguments: string;
  evidence: string;
  role: RebuttalAgentRole;
}): string {
  const taskLine =
    opts.role === "advocate-a"
      ? "You are Advocate A (causal-link position). Produce a Phase-3 RebuttalOutput per §4 of your system prompt. Emit a single JSON object only — no prose before, after, or between."
      : "You are Advocate B (skeptical position). Produce a Phase-3 RebuttalOutput per §4 of your system prompt. Emit a single JSON object only — no prose before, after, or between.";

  return [
    "## FRAMING",
    "",
    opts.framing.trim(),
    "",
    "## OPPONENT_ARGUMENTS",
    "",
    opts.opponentArguments.trim(),
    "",
    "## EVIDENCE_CORPUS",
    "",
    opts.evidence.trim(),
    "",
    "## YOUR_TASK",
    "",
    taskLine,
  ].join("\n");
}

function formatZodIssues(err: ZodError): string {
  return err.issues
    .map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`)
    .slice(0, 12)
    .join("\n");
}

function validationFollowupMessage(err: ZodError): string {
  return [
    "Your last response failed validation. Issues:",
    "",
    formatZodIssues(err),
    "",
    "Re-emit the COMPLETE response (not a diff) addressing every issue. Same schema, single JSON object, no prose.",
  ].join("\n");
}
