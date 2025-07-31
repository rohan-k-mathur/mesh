import { jest } from "@jest/globals";
import { placeTrade, resolveMarket } from "@/packages/server/src/prediction/service";
import { calcSharesForSpend, priceYes } from "@/lib/prediction/lmsr";

// Simple in-memory mock of prisma
const db = {
  market: {
    id: "m1",
    yesPool: 0,
    noPool: 0,
    b: 100,
    state: "OPEN" as const,
    creatorId: BigInt(1),
    oracleId: null as bigint | null,
  },
  wallet: { userId: BigInt(1), balanceCents: 1000, lockedCents: 0 },
  trades: [] as any[],
  logs: [] as any[],
};

jest.mock("@/lib/prismaclient", () => {
  const prisma = {
    $transaction: async (fn: any) => fn(prisma),
    $executeRaw: async () => {},
    predictionMarket: {
      findUniqueOrThrow: async ({ where: { id } }: any) => {
        if (db.market.id !== id) throw new Error("not found");
        return { ...db.market };
      },
      update: async ({ where: { id }, data }: any) => {
        if (db.market.id !== id) throw new Error("not found");
        if (data.yesPool?.increment) db.market.yesPool += data.yesPool.increment;
        if (data.noPool?.increment) db.market.noPool += data.noPool.increment;
        if (data.state) db.market.state = data.state;
        if (data.outcome) (db.market as any).outcome = data.outcome;
        if (data.resolvesAt) (db.market as any).resolvesAt = data.resolvesAt;
        return { ...db.market };
      },
    },
    wallet: {
      findUnique: async ({ where: { userId } }: any) => {
        return userId === db.wallet.userId ? { ...db.wallet } : null;
      },
      update: async ({ where: { userId }, data }: any) => {
        if (userId !== db.wallet.userId) throw new Error("not found");
        if (data.balanceCents?.decrement) db.wallet.balanceCents -= data.balanceCents.decrement;
        if (data.balanceCents?.increment) db.wallet.balanceCents += data.balanceCents.increment;
        return { ...db.wallet };
      },
    },
    trade: {
      create: async ({ data }: any) => {
        const t = { id: String(db.trades.length + 1), ...data };
        db.trades.push(t);
        return t;
      },
      findMany: async ({ where: { marketId } }: any) => db.trades.filter((t) => t.marketId === marketId),
    },
    resolutionLog: {
      create: async ({ data }: any) => {
        db.logs.push(data);
        return data;
      },
    },
  };
  return { prisma };
});

describe("prediction service", () => {
  beforeEach(() => {
    db.market.yesPool = 0;
    db.market.noPool = 0;
    db.market.state = "OPEN";
    db.wallet.balanceCents = 1000;
    db.trades.length = 0;
    db.logs.length = 0;
  });

  test("buying 100¢ of YES moves price up", async () => {
    const { newYesProb } = await placeTrade({ marketId: "m1", userId: BigInt(1), spendCents: 100, side: "YES" });
    expect(newYesProb).toBeGreaterThan(0.5);
  });

  test("wallet debits equal LMSR bank", async () => {
    const res = await placeTrade({ marketId: "m1", userId: BigInt(1), spendCents: 100, side: "YES" });
    const totalDebit = 1000 - db.wallet.balanceCents;
    const C = (y: number, n: number) => db.market.b * Math.log(Math.exp(y / db.market.b) + Math.exp(n / db.market.b));
    const liability = C(db.market.yesPool, db.market.noPool) - C(0, 0);
    expect(totalDebit).toBeCloseTo(liability, 0);
    expect(res.shares).toBeCloseTo(calcSharesForSpend({ yesPool: 0, noPool: 0, b: 100, spend: 100, side: "YES" }).deltaQ, 3);
  });

  test("resolution pays per share and preserves credits", async () => {
    const trade = await placeTrade({ marketId: "m1", userId: BigInt(1), spendCents: 100, side: "YES" });
    const preTotal = db.wallet.balanceCents;
    const { payouts, totalPaid } = await resolveMarket({ marketId: "m1", outcome: "YES", resolverId: BigInt(1) });
    expect(payouts).toBe(1);
    expect(totalPaid).toBe(Math.floor(trade.shares));
    expect(db.wallet.balanceCents).toBe(preTotal + Math.floor(trade.shares));
  });
});
