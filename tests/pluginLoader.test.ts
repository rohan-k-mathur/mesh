import { loadPlugins, PluginDescriptor } from "@/lib/pluginLoader";

test("loadPlugins collects descriptors", () => {
  const modules = {
    one: { descriptor: { type: "A", component: {}, config: {} } as PluginDescriptor },
    two: {},
    three: { descriptor: { type: "B", component: {}, config: { key: 1 } } as PluginDescriptor },
  };
  const result = loadPlugins(modules);
  expect(result).toHaveLength(2);
  expect(result[0].type).toBe("A");
  expect(result[1].type).toBe("B");
});
