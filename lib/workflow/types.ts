// lib/workflow/types.ts
export type StepKind = "trigger" | "action" | "condition" | "delay" | "join";

export type JoinMode = "all" | "any" | "race"; // how to continue when multiple inbound edges exist

export type JSONExpr = any; // We'll evaluate with json-logic later

export interface StepUIHint {
  row: number;
  col: number; // parallel siblings share row, differ in col
}

export interface Step {
  id: string;
  kind: StepKind;
  ref: string;                // registry id, e.g. "gmail.sendEmail" or "trigger.onClick"
  name?: string;              // user label
  inputs?: Record<string, any>;
  expr?: JSONExpr;            // used if kind === "condition"
  join?: JoinMode;            // used if kind === "join"
  ui?: StepUIHint;            // layout only
}

export interface Edge {
  id: string;
  from: string;               // step.id
  to: string;                 // step.id
  condition?: JSONExpr;       // edge-level condition; omitted => always true
}

export interface Workflow {
  id?: string;
  name?: string;
  steps: Step[];
  edges: Edge[];
}