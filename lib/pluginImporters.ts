import { PluginDescriptor } from "./pluginLoader";

const importers: Record<string, () => Promise<{ descriptor?: PluginDescriptor }>> = {};

declare const require: any;

if (typeof require !== "undefined" && require.context) {
  const ctx = require.context("../plugins", false, /\\.tsx$/);
  ctx.keys().forEach((key: string) => {
    const path = `../plugins/${key.replace("./", "")}`;
    importers[key] = () => import(path);
  });
} else if (typeof import.meta !== "undefined" && (import.meta as any).glob) {
  const modules = (import.meta as any).glob("../plugins/*.tsx");
  Object.keys(modules).forEach((key) => {
    importers[key] = modules[key] as () => Promise<{ descriptor?: PluginDescriptor }>;
  });
}

export default importers;
