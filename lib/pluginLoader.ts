export interface PluginDescriptor {
  type: string;
  component: unknown;
  config: Record<string, unknown>;
}

export function loadPlugins(modules: Record<string, { descriptor?: PluginDescriptor }>): PluginDescriptor[] {
  return Object.values(modules)
    .filter((m) => m && m.descriptor)
    .map((m) => m.descriptor!) as PluginDescriptor[];
}
