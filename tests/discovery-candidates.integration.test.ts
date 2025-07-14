import { NextRequest } from "next/server";

let mockRedis: any;
let mockKnn: any;

jest.mock("@/util/postgresVector", () => {
  mockKnn = jest.fn();
  return { knn: mockKnn };
});

jest.mock("@/lib/redis", () => {
  const store: Record<string, string> = {};
  mockRedis = {
    get: jest.fn(async (k: string) => store[k] || null),
    setex: jest.fn(async (k: string, ttl: number, v: string) => {
      store[k] = v;
    }),
    del: jest.fn(),
  };
  return { __esModule: true, default: mockRedis, getOrSet: async (k: string, ttl: number, fn: () => Promise<any>) => {
    if (store[k]) return JSON.parse(store[k]);
    const val = await fn();
    store[k] = JSON.stringify(val);
    return val;
  } };
});

jest.mock("@/lib/serverutils", () => ({
  getUserFromCookies: jest.fn(async () => ({ userId: 1 })),
}));

describe("/api/v2/discovery/candidates", () => {
  it("caches knn results", async () => {
    const { GET } = await import("@/app/api/v2/discovery/candidates/route");
    mockKnn.mockResolvedValue([
      { userId: 1, score: 1 },
      { userId: 2, score: 0.8 },
    ]);
    const req = new NextRequest(
      new URL("http://localhost/api/v2/discovery/candidates?k=1"),
    );
    const res1 = await GET(req);
    const body1 = await res1.json();
    expect(body1).toEqual([{ userId: 2, score: 0.8 }]);
    const res2 = await GET(req);
    await res2.json();
    expect(mockKnn).toHaveBeenCalledTimes(1);
  });
});
