// lib/dialogue/signature.ts
import crypto from "crypto";

// Deterministic JSON.stringify with sorted keys
export function stableStringify(value: any): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map(k => JSON.stringify(k)+":"+stableStringify(value[k])).join(",")}}`;
}

/**
 * Deterministic signature for a dialogue move to enable idempotent inserts.
 * Keep <= 255 chars; we use sha256 hex (64 chars).
 */
export function computeDialogueMoveSignature(input: {
  deliberationId: string;
  targetType: string;
  targetId: string;
  kind: string;
  actorId?: string | null;
  createdAt: Date;
  payload?: any;
}): string {
  const base = [
    input.deliberationId,
    input.targetType,
    input.targetId,
    input.kind,
    input.actorId ?? "",
    input.createdAt?.toISOString?.() ?? "",
    input.payload === undefined ? "" : stableStringify(input.payload),
  ].join("|");
  return crypto.createHash("sha256").update(base).digest("hex"); // 64 chars
}
