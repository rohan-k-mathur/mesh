import { vi, describe, it, expect, beforeEach } from "vitest";
import { getHeatmap } from "../heatmap";
import { prisma } from "@/lib/prismaclient";

vi.mock("@/lib/prismaclient", () => ({
  prisma: {
    section: {
      findMany: vi.fn(),
    },
  },
}));

const mockFindMany = (prisma.section.findMany as unknown as vi.Mock);

beforeEach(() => {
  mockFindMany.mockReset();
});

describe("getHeatmap", () => {
  it("queries sections within bounds", async () => {
    mockFindMany.mockResolvedValue([{ x: 1, y: 2, visitors: 3 }]);
    const result = await getHeatmap(0, 2, 0, 3);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        x: { gte: 0, lte: 2 },
        y: { gte: 0, lte: 3 },
      },
      select: { x: true, y: true, visitors: true },
    });
    expect(result).toEqual([{ x: 1, y: 2, visitors: 3 }]);
  });
});
