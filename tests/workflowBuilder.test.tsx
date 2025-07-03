/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";


it("adds a new state and triggers save", async () => {
  const onSave = jest.fn(async () => ({ id: "1" }));
  render(<WorkflowBuilder onSave={onSave} />);
  fireEvent.click(screen.getByText("Add State"));
  await act(async () => {
    fireEvent.click(screen.getByText("Save"));
  });
  expect(onSave).toHaveBeenCalledWith({
    nodes: expect.arrayContaining([expect.objectContaining({ id: "state-1" })]),
    edges: [],
  });
});

it("imports workflow JSON", async () => {
  const onSave = jest.fn(async () => ({ id: "1" }));
  render(<WorkflowBuilder onSave={onSave} />);
  const file = new File([
    JSON.stringify({
      nodes: [{ id: "n1", data: { label: "n1" }, position: { x: 0, y: 0 } }],
      edges: [],
    }),
  ], "wf.json", { type: "application/json" });
  const input = screen.getByLabelText("Import Workflow");
  fireEvent.change(input, { target: { files: [file] } });
  await act(async () => {});
  await act(async () => {
    fireEvent.click(screen.getByText("Save"));
  });
  expect(onSave).toHaveBeenCalled();
});
