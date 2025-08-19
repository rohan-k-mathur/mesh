// lib/workflow/registry.ts
export type FieldType = "string" | "text" | "email" | "number" | "boolean" | "select" | "json";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  default?: any;
}

export interface RunContext {
  payload: any;
  outputs: Record<string, any>;
  creds?: any;
  eval: (v: any) => any; // variable resolver for {{ }} & JSON
}

export interface ActionDef {
  id: string;                 // "gmail.sendEmail"
  displayName: string;        // "Gmail · Send Email"
  provider?: string;          // "gmail"
  inputs: FieldDef[];
  requiredScopes?: string[];
  run: (ctx: RunContext, inputs: Record<string, any>) => Promise<any>;
}

export interface TriggerDef {
  id: string;                 // "trigger.onClick" | "trigger.cron"
  displayName: string;
  inputs: FieldDef[];
}

const ACTIONS = new Map<string, ActionDef>();
const TRIGGERS = new Map<string, TriggerDef>();

export const registerTrigger = (def: TriggerDef) => TRIGGERS.set(def.id, def);

export const getActionDef = (id: string) => ACTIONS.get(id);
export const getTriggerDef = (id: string) => TRIGGERS.get(id);
export const listActionDefs = () => Array.from(ACTIONS.values());
export const listTriggerDefs = () => Array.from(TRIGGERS.values());

export const registerAction = (def: ActionDef) => {
    if (!ACTIONS.has(def.id)) ACTIONS.set(def.id, def);
  };
  