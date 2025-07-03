export type WorkflowAction = () => Promise<string | void>;

const registry: Record<string, WorkflowAction> = {};

export function registerWorkflowAction(name: string, action: WorkflowAction) {
  registry[name] = action;
}

export function getWorkflowAction(name: string): WorkflowAction | undefined {
  return registry[name];
}
