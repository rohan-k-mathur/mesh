import { listWorkflows } from "@/lib/actions/workflow.actions";

var mockPrisma: any;

jest.mock("@/lib/prismaclient", () => {
  mockPrisma = { workflow: { findMany: jest.fn() } };
  return { prisma: mockPrisma };
});

jest.mock("@/lib/serverutils", () => ({
  getUserFromCookies: jest.fn(async () => ({ userId: BigInt(1) })),
}));

test("listWorkflows queries user workflows", async () => {
  const now = new Date();
  mockPrisma.workflow.findMany.mockResolvedValue([{ id: BigInt(1), name: "A", created_at: now }]);
  const result = await listWorkflows();
  expect(mockPrisma.workflow.findMany).toHaveBeenCalledWith({
    where: { owner_id: BigInt(1) },
    select: { id: true, name: true, created_at: true },
    orderBy: { created_at: "desc" },
  });
  expect(result[0].name).toBe("A");
});
