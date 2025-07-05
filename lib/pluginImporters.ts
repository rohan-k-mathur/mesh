import { PluginDescriptor } from "./pluginLoader";

const importers: Record<string, () => Promise<{ descriptor?: PluginDescriptor }>> = {};

if (typeof require !== "undefined" && (require as any).context) {
  const ctx = (require as any).context("../plugins", false, /\\.tsx$/);
  ctx.keys().forEach((key: string) => {
    const path = `../plugins/${key.replace("./", "")}`;
    importers[key] = () => import(path);
  });
}

export default importers;
