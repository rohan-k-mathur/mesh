/** @jest-environment jsdom */
import { render, screen, fireEvent } from "@testing-library/react";
import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";

it("adds a new state and triggers save", async () => {
  const onSave = jest.fn(async () => ({ id: "1" }));
  render(<WorkflowBuilder onSave={onSave} />);
  fireEvent.click(screen.getByText("Add State"));
  fireEvent.click(screen.getByText("Save"));
  expect(onSave).toHaveBeenCalledWith({
    nodes: expect.arrayContaining([expect.objectContaining({ id: "state-1" })]),
    edges: [],
  });
});
