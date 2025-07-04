/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WorkflowRunner from "@/components/workflow/WorkflowRunner";
import { WorkflowGraph } from "@/lib/workflowExecutor";

(require as any).context = () => {
  const fn = () => ({});
  fn.keys = () => [] as string[];
  return fn;
};

test.skip("shows executed nodes when running", async () => {
  const graph: WorkflowGraph = {
    nodes: [
      { id: "A", type: "start" },
      { id: "B", type: "end" },
    ],
    edges: [{ id: "e1", source: "A", target: "B" }],
  };
  render(<WorkflowRunner graph={graph} />);
  fireEvent.click(screen.getByText("Run"));
  await waitFor(() => {
    expect(screen.getByText("Executed A")).toBeInTheDocument();
    expect(screen.getByText("Executed B")).toBeInTheDocument();
  });
});
