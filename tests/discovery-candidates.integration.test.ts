import { NextRequest } from "next/server";

var mockPrisma: any;
var mockIndex: any;

jest.mock("@/lib/prismaclient", () => {
  mockPrisma = { userEmbedding: { findUnique: jest.fn() } };
  return { prisma: mockPrisma };
});

jest.mock("@/lib/serverutils", () => ({
  getUserFromCookies: jest.fn(async () => ({ userId: BigInt(1) })),
}));

jest.mock("@/lib/pineconeClient", () => ({
  getPineconeIndex: jest.fn(async () => mockIndex),
}));

describe("/api/v2/discovery/candidates", () => {
  it("returns pinecone matches", async () => {
    const { GET } = await import("@/app/api/v2/discovery/candidates/route");
    mockPrisma.userEmbedding.findUnique.mockResolvedValue({ embedding: [0, 1] });
    mockIndex = {
      query: jest.fn(async () => ({
        matches: [
          { id: "1", score: 1 },
          { id: "2", score: 0.8 },
        ],
      })),
    } as any;

    const req = new NextRequest(
      new URL("http://localhost/api/v2/discovery/candidates?k=1"),
    );
    const res = await GET(req);
    const body = await res.json();
    expect(mockIndex.query).toHaveBeenCalledWith({ topK: 2, vector: [0, 1] });
    expect(body).toEqual([{ userId: 2, score: 0.8 }]);
  });
});
