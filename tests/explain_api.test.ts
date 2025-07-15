import { NextRequest } from "next/server";

process.env.UPSTASH_REDIS_REST_URL = "http://localhost";
process.env.UPSTASH_REDIS_REST_TOKEN = "token";

describe("why api", () => {
  let store: Record<string, string>;
  beforeEach(() => {
    jest.resetModules();
    store = {};
    jest.doMock("child_process", () => ({
      execFile: (_cmd: string, _args: string[], cb: any) => cb(null, JSON.stringify({ FAV_ARTIST_OVERLAP: 0.9, RECENT_SWIPE_RIGHT: 0.1 }), "")
    }));
    jest.doMock("@/lib/redis", () => ({
      __esModule: true,
      default: {
        get: jest.fn(async (k: string) => store[k] || null),
        setex: jest.fn(async (k: string, _t: number, v: string) => { store[k] = v; }),
      },
    }));
    jest.doMock("@upstash/ratelimit", () => ({
      Ratelimit: class { limit = jest.fn(async () => ({ success: true })); constructor(){} static tokenBucket(){ return null; } },
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  test("explainReturnsBothLocales", async () => {
    const { GET } = await import("@/app/api/v2/discovery/why/[targetId]/route");
    const req = new NextRequest(new URL("http://localhost/api/v2/discovery/why/abc?viewerId=1"));
    const res = await GET(req, { params: { targetId: "abc" } });
    const body = await res.json();
    expect(body.reason_en).toBeDefined();
    expect(body.reason_es).toBeDefined();
  });

  test("cacheHitShortCircuits", async () => {
    const { GET } = await import("@/app/api/v2/discovery/why/[targetId]/route");
    const req = new NextRequest(new URL("http://localhost/api/v2/discovery/why/abc?viewerId=1"));
    await GET(req, { params: { targetId: "abc" } });
    await GET(req, { params: { targetId: "abc" } });
    const cp = await import("child_process");
    expect((cp.execFile as jest.Mock).mock.calls.length).toBe(1);
  });
});
