import {
  executeWorkflow,
  WorkflowGraph,
  defaultEvaluate,
} from "@/lib/workflowExecutor";

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

it("evaluates conditions using context", async () => {
  const graph: WorkflowGraph = {
    nodes: [
      { id: "A", type: "start" },
      { id: "B", type: "x" },
      { id: "C", type: "y" },
    ],
    edges: [
      { id: "e1", source: "A", target: "B", condition: "flag" },
      { id: "e2", source: "A", target: "C", condition: "!flag" },
    ],
  };
  const order: string[] = [];
  const actions = {
    A: async () => order.push("A"),
    B: async () => order.push("B"),
    C: async () => order.push("C"),
  };
  const ctx = { flag: true };
  const result = await executeWorkflow(graph, actions, defaultEvaluate, ctx);
  expect(result).toEqual(["A", "B"]);
  expect(order).toEqual(["A", "B"]);
});

it("takes alternate path when condition fails", async () => {
  const graph: WorkflowGraph = {
    nodes: [
      { id: "A", type: "start" },
      { id: "B", type: "x" },
      { id: "C", type: "y" },
    ],
    edges: [
      { id: "e1", source: "A", target: "B", condition: "count > 5" },
      { id: "e2", source: "A", target: "C" },
    ],
  };
  const order: string[] = [];
  const actions = {
    A: async () => order.push("A"),
    B: async () => order.push("B"),
    C: async () => order.push("C"),
  };
  const ctx = { count: 3 };
  const result = await executeWorkflow(graph, actions, defaultEvaluate, ctx);
  expect(result).toEqual(["A", "C"]);
  expect(order).toEqual(["A", "C"]);
});
it("executes actions by name", async () => {
  const graph: WorkflowGraph = {
    nodes: [
      { id: "n1", type: "x", action: "first" },
      { id: "n2", type: "y", action: "second" },
    ],
    edges: [{ id: "e1", source: "n1", target: "n2" }],
  };
  const order: string[] = [];
  const actions = {
    first: async () => order.push("A"),
    second: async () => order.push("B"),
  };
  const result = await executeWorkflow(graph, actions);
  expect(result).toEqual(["n1", "n2"]);
  expect(order).toEqual(["A", "B"]);
});
