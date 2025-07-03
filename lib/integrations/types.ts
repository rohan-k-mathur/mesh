export interface IntegrationAction {
  name: string;
  run: (params: any, credentials: Record<string, any>) => Promise<any>;
}

export interface IntegrationTrigger {
  name: string;
  onEvent: (
    callback: (payload: any) => void,
    credentials: Record<string, any>
  ) => Promise<void>;
}

export interface IntegrationApp {
  name: string;
  actions?: IntegrationAction[];
  triggers?: IntegrationTrigger[];
}
