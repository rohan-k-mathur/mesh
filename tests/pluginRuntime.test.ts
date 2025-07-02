import useStore from "@/lib/reactflow/store";
import { PluginDescriptor } from "@/lib/pluginLoader";

test("registerPlugins updates store", () => {
  useStore.getState().registerPlugins([]);
  const plugins: PluginDescriptor[] = [
    { type: "X", component: {}, config: {} },
  ];
  useStore.getState().registerPlugins(plugins);
  expect(useStore.getState().pluginDescriptors).toEqual(plugins);
});
