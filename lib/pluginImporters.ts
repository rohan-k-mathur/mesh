import { PluginDescriptor } from "./pluginLoader";

const importers: Record<string, () => Promise<{ descriptor?: PluginDescriptor }>> = {};

declare const require: any;

if (typeof require !== "undefined" && require.context) {
  console.log("pluginImporters: using require.context");
  const ctx = require.context("../plugins", false, /\\.tsx$/);
  ctx.keys().forEach((key: string) => {
    importers[key] = () => Promise.resolve(ctx(key));
  });
  console.log("pluginImporters: loaded", Object.keys(importers));
} else if (typeof import.meta !== "undefined" && (import.meta as any).glob) {
  console.log("pluginImporters: using import.meta.glob");
  const modules = (import.meta as any).glob("../plugins/*.tsx");
  Object.keys(modules).forEach((key) => {
    importers[key] = modules[key] as () => Promise<{ descriptor?: PluginDescriptor }>;
  });
  console.log("pluginImporters: loaded", Object.keys(importers));
} else {
  console.log("pluginImporters: no loader api found");
}

export default importers;
