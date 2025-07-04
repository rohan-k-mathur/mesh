import { emitWorkflowTrigger, registerWorkflowTrigger } from "@/lib/workflowTriggers";

test("registered trigger callbacks fire", () => {
  const fn = jest.fn();
  registerWorkflowTrigger("demo:event", fn);
  emitWorkflowTrigger("demo:event", { a: 1 });
  expect(fn).toHaveBeenCalledWith({ a: 1 });
});
