import React from "react";
import "@testing-library/jest-dom";
(require as any).context = jest.fn(() => ({
  keys: () => [],
}));
jest.mock("@/lib/supabaseclient", () => ({ supabase: {} }));
jest.mock("@supabase/supabase-js", () => ({}));
jest.mock("@xyflow/react", () => {
  const React = require("react");
  return {
    ReactFlow: ({ children }: any) => React.createElement("div", null, children),
    Background: () => React.createElement("div", null, "background"),
    Controls: () => React.createElement("div", null, "controls"),
    MiniMap: () => React.createElement("div", null, "minimap"),
    addEdge: jest.fn((edge: any, edges: any[]) => edges.concat(edge)),
    useNodesState: (initial: any[]) => React.useState(initial),
    useEdgesState: (initial: any[]) => React.useState(initial),
    useReactFlow: () => ({ screenToFlowPosition: (pos: any) => pos }),
    BackgroundVariant: { Dots: "dots" },
  };
});
