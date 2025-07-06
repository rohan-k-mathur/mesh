import { EventEmitter } from "events";
import { runWorkflowWithSocket } from "@/lib/workflowSocketRunner";
import { scheduleWorkflow } from "@/lib/workflowScheduler";
import { createWorkflow, updateWorkflow } from "@/lib/actions/workflow.actions";

var mockPrisma: any;
jest.mock("@/lib/prismaclient", () => {
  mockPrisma = {
    $connect: jest.fn(),
    $transaction: jest.fn(async (actions: any[]) => {
      const results = await Promise.all(actions);
      return [
        { id: BigInt(1), ...(results[0] ?? {}) },
        { id: BigInt(2), ...(results[1] ?? {}) },
      ];
    }),
    workflow: {
      create: jest.fn(async ({ data }: any) => ({ id: BigInt(1), ...data })),
      update: jest.fn(async ({ where, data }: any) => ({ id: where.id, ...data })),
      findUniqueOrThrow: jest.fn(async ({ where }: any) => ({ id: where.id, owner_id: BigInt(2) })),
    },
    workflowState: {
      create: jest.fn(async ({ data }: any) => ({ id: BigInt(1), ...data })),
      findFirst: jest.fn(),
    },
    workflowTransition: {
      create: jest.fn(),
    },
  };
  return { prisma: mockPrisma };
});

jest.mock("@/lib/serverutils", () => ({
  getUserFromCookies: jest.fn(async () => ({ userId: BigInt(2) })),
}));

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

describe("createWorkflow", () => {
  it("stores workflow state at version 1", async () => {
    await createWorkflow({ name: "Test", graph: { nodes: [], edges: [] } });
    expect(mockPrisma.workflow.create).toHaveBeenCalled();
    expect(mockPrisma.workflowState.create).toHaveBeenCalledWith({
      data: { workflow_id: BigInt(1), version: 1, graph: { nodes: [], edges: [] } },
    });
  });
});

describe("updateWorkflow", () => {
  it("increments workflow state version", async () => {
    mockPrisma.workflowState.findFirst.mockResolvedValue({ version: 2 });
    await updateWorkflow({ id: BigInt(1), graph: { nodes: [], edges: [] } });
    expect(mockPrisma.workflow.update).toHaveBeenCalledWith({
      where: { id: BigInt(1) },
      data: { graph: { nodes: [], edges: [] } },
    });
    expect(mockPrisma.workflowState.create).toHaveBeenCalledWith({
      data: { workflow_id: BigInt(1), version: 3, graph: { nodes: [], edges: [] } },
    });
  });
});

describe("WebSocket execution updates", () => {
  it("emits updates for each executed node", async () => {
    const graph = { nodes: [{ id: "A", type: "start" }], edges: [] };
    const actions = { A: jest.fn() };
    const emitter = new EventEmitter();
    const updates: string[] = [];
    emitter.on("update", (id) => updates.push(id));
    await runWorkflowWithSocket(graph as any, actions, emitter);
    expect(updates).toEqual(["A"]);
  });
});

describe("scheduled execution", () => {
  jest.useFakeTimers();
  it("runs workflow after delay", () => {
    const graph = { nodes: [{ id: "A", type: "start" }], edges: [] };
    const actions = { A: jest.fn() };
    const emitter = new EventEmitter();
    const updates: string[] = [];
    emitter.on("update", (id) => updates.push(id));
    scheduleWorkflow(graph as any, actions, 1000, emitter);
    jest.advanceTimersByTime(1000);
    expect(updates).toEqual(["A"]);
  });
});
