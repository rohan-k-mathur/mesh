import { executeWorkflow, WorkflowGraph } from "@/lib/workflowExecutor";

it("executes nodes in sequence", async () => {
  const graph: WorkflowGraph = {
    nodes: [
      { id: "A", type: "start" },
      { id: "B", type: "middle" },
      { id: "C", type: "end" },
    ],
    edges: [
      { id: "e1", source: "A", target: "B" },
      { id: "e2", source: "B", target: "C" },
    ],
  };
  const order: string[] = [];
  const actions = {
    A: async () => order.push("A"),
    B: async () => order.push("B"),
    C: async () => order.push("C"),
  };
  const result = await executeWorkflow(graph, actions);
  expect(result).toEqual(["A", "B", "C"]);
  expect(order).toEqual(["A", "B", "C"]);
});

it("handles conditional branches", async () => {
  const graph: WorkflowGraph = {
    nodes: [
      { id: "A", type: "start" },
      { id: "B", type: "branch" },
      { id: "C", type: "alt" },
    ],
    edges: [
      { id: "e1", source: "A", target: "B", condition: "t" },
      { id: "e2", source: "A", target: "C", condition: "f" },
    ],
  };
  const order: string[] = [];
  const actions = {
    A: async () => order.push("A"),
    B: async () => order.push("B"),
    C: async () => order.push("C"),
  };
  const result = await executeWorkflow(graph, actions, (c) => c === "t");
  expect(result).toEqual(["A", "B"]);
  expect(order).toEqual(["A", "B"]);
});

it("triggers actions in saved order", async () => {
  const graph: WorkflowGraph = {
    nodes: [
      { id: "start", type: "x" },
      { id: "mid", type: "y" },
      { id: "end", type: "z" },
    ],
    edges: [
      { id: "e1", source: "start", target: "mid" },
      { id: "e2", source: "mid", target: "end" },
    ],
  };
  const executed: string[] = [];
  const actions = {
    start: async () => executed.push("start"),
    mid: async () => executed.push("mid"),
    end: async () => executed.push("end"),
  };
  await executeWorkflow(graph, actions);
  expect(executed).toEqual(["start", "mid", "end"]);
});
