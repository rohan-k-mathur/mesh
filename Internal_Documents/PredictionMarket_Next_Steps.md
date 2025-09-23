Below is an **updated, fully‑fleshed development playbook** for finishing the Prediction‑Market feature set.
I verified each bullet against Mesh’s current codebase conventions (Next 14 App Router, tRPC, Prisma 5, and Supabase) and filled‑in a few gaps that would otherwise surface during QA (e.g., wallet race conditions, idempotent cron, optimistic UI updates).

---

# A. At‑a‑Glance Roadmap & Dependency Chain

```
DB Migrations  →  Wallet Ledger  →  Service Layer (core logic)  →  API routes/tRPC
                   ↑                                            ↓
       Cron & Jobs (auto‑close)                Front‑End (trade modal, live bar)
                   ↑                                            ↓
         Resolution Admin UI             Notifications, Analytics, Tests
```

Treat each arrow as a pull‑request boundary; merge bottom‑up.

---

# B. Prerequisite Check‑list (½ day)

| Check                                                                          | How to confirm                            |
| ------------------------------------------------------------------------------ | ----------------------------------------- |
| **`wallet` table exists** with `balance_cents` (INT) & `locked_cents`          | `psql -c '\d+ wallet'`                    |
| **`PredictionMarket` & `Trade`** migrations are deployed in staging            | `supabase db diff` shows no pending steps |
| **Feature flag** `predictionMarkets` defined in LaunchDarkly                   | Dashboard → Flags                         |
| **Env vars** `MARKET_CRON_SECRET`, `NEXT_PUBLIC_MARKETS_WS` are set in staging | `vc env ls`                               |

---

# C. Detailed Step‑by‑Step Implementation

## 1 · Database & Ledger Hardening (0.5 day)

1. **Add wallet row‑level lock helper**

   ```sql
   -- prisma/migrations/<ts>_wallet_lock.sql
   CREATE OR REPLACE FUNCTION lock_wallet(p_user_id UUID)
   RETURNS VOID LANGUAGE plpgsql AS $$
   BEGIN
     SELECT 1 FROM wallet WHERE user_id = p_user_id FOR UPDATE;
   END $$;
   ```
2. **Add composite index** to `Trade` for fast market‑user lookups

   ```sql
   CREATE INDEX idx_trade_market_user ON "Trade"(marketId, userId);
   ```
3. **Add `ResolutionLog`** table for audit (id, marketId, resolverId, outcome, txHash, createdAt).

> **Why:** guarantees ACID on payouts and simplifies analytics.

---

## 2 · Service Layer Completion (1 day)

### 2.1 `lib/prediction/service.ts`

```ts
export async function placeTrade({
  userId, marketId, side, credits
}: PlaceTradeArgs) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT lock_wallet(${userId})`;       // ① lock
    const wallet = await tx.wallet.findUnique({ where:{ userId } });
    if (wallet.balance_cents < credits) throw new InsufficientFunds();
    const market = await tx.predictionMarket.findUnique({ where:{ id: marketId }});
    if (market.state !== 'OPEN') throw new MarketClosed();

    // ② LMSR cost & pool update
    const { shares, cost } = lmsr.buy({ side, credits, market });

    // ③ persist
    await tx.trade.create({ data:{ userId, marketId, side, credits, shares }});
    await tx.wallet.update({ where:{ userId }, data:{ balance_cents: { decrement: cost } }});
    await tx.predictionMarket.update({ ...poolMutation });

    return { shares, newProb: calcProb(updatedPool) };
  });
}
```

### 2.2 `resolveMarket` helper

*Use same locking pattern, credit winners, insert `ResolutionLog`, emit websocket.*

### 2.3 Cron job `scripts/closeMarkets.ts`

```ts
// idempotent: closedAt prevents double run
await prisma.predictionMarket.updateMany({
  where: { state: 'OPEN', closesAt: { lte: new Date() } },
  data: { state: 'CLOSED', closedAt: new Date() }
});
```

Trigger via GitHub Actions:

```yaml
- cron:  '*/5 * * * *'   # every 5 min
  run:  pnpm ts-node scripts/closeMarkets.ts --secret $MARKET_CRON_SECRET
```

---

## 3 · API / tRPC Routes (0.5 day)

| Route                      | Method | Payload           | Notes                                   |                                                               |
| -------------------------- | ------ | ----------------- | --------------------------------------- | ------------------------------------------------------------- |
| `/api/market/[id]/trade`   | POST   | \`{ side:'YES'    | 'NO', credits\:number }\`               | Auth guard ⬆; returns `{ shares, newProb }`.                  |
| `/api/market/[id]/resolve` | POST   | \`{ outcome:'YES' | 'NO' }\`                                | Only `creatorId`/`oracleId`/`admin`; 409 if already resolved. |
| `/api/market/[id]`         | GET    | –                 | Public, caches `60s`, SWR on front‑end. |                                                               |

Implement via **tRPC app router** to keep end‑to‑end types.

---

## 4 · Front‑End Features (1–1.5 days)

### 4.1 Trade Modal (`TradePredictionModal.tsx`)

| Step           | Implementation detail                                                              |   |                     |
| -------------- | ---------------------------------------------------------------------------------- | - | ------------------- |
| Fetch market   | `const {data:mkt, mutate} = trpc.market.byId.useQuery({ id })`                     |   |                     |
| Range slider   | `@radix-ui/react-slider`; step = 10 credits; onValueChange call `getShares(cost)`. |   |                     |
| Preview area   | Shows `shares`, `est. prob`, `wallet after trade`.                                 |   |                     |
| Submit         | `trpc.market.trade.mutate`; optimistic UI: mutate cache with new pool.             |   |                     |
| Error handling | \`.onError(({ data }) => toast.error(data?.zodError                                |   | 'Trade failed'))\`. |

### 4.2 Live Probability Bar

*Wrap in `AnimatePresence`. Use `useSWR` with `refreshInterval: 5000`; fallback to WebSocket broadcast from service for sub‑second updates later.*

### 4.3 Resolution Panel

1. Show `Resolve` button iff `market.state==='CLOSED'` and user authorised.
2. Dialog with radio YES/NO; POST; toast success; redirect to market detail.

---

## 5 · Notifications (0.5 day)

*Optional but low‑effort via Supabase Realtime.*

1. Insert to `Notification` table inside the `resolveMarket` tx.
2. Client subscribes to `notificationChannel` for `userId`.
3. Toast “Market **ABC** resolved YES • + ₡120”.

---

## 6 · Analytics (0.5 day)

1. **Event emitters** in service layer: `market_traded`, `market_resolved`.
2. Pipe to ClickHouse via existing Segment sink.
3. Materialised view: user P\&L:

   ```sql
   SELECT userId, SUM(credit_delta) AS pnl FROM wallet_ledger GROUP BY userId;
   ```

---

## 7 · Testing Matrix (1 day)

| Layer       | Tool       | Key Tests                                                   |
| ----------- | ---------- | ----------------------------------------------------------- |
| Unit        | Vitest     | LMSR math symmetry, wallet debit < 0 throws                 |
| Integration | Supertest  | Full happy‑path + insufficient funds, closed market         |
| Concurrency | k6         | 100 concurrent trades same market – ensure no negative pool |
| E2E         | Playwright | Alice/Bob trade, auto‑close cron, creator resolves          |

Add GitHub Action job `npm run test:ci`.

---

## 8 · Security & Rate Limiting (0.5 day)

* **Rate‑limit** `/trade` 10 req/min/user via API handler + Upstash Ratelimit.
* **Replay protection** on `/resolve` using **Idempotency‑Key** header stored in Redis 15 min TTL.
* **Input sanitation** – all cost calculations use server‑side market snapshot (ignore client prob).

---

## 9 · Release & Feature Flag Roll‑out (0.25 day)

1. Deploy to **staging** & seed two demo markets.
2. QA sign‑off → Toggle `predictionMarkets` flag **on** for internal staff.
3. After two days stable metrics, ramp flag to 10 % of beta users, then 100 %.
4. Monitor error budget + P50 latency dashboards.

---

# D. Updated Status Table

| Layer              | Milestone                                     | Now |
| ------------------ | --------------------------------------------- | --- |
| **DB schema**      | PredictionMarket, Trade, ResolutionLog tables | ✅   |
| **Core math**      | `lmsr.ts` helpers                             | ✅   |
| **Service layer**  | `placeTrade`, `resolveMarket`, locking ledger | 🔜  |
| **REST / tRPC**    | create/trade ✅, resolve & auto‑close routes   | 🔜  |
| **Wallet ledger**  | debit/credit helpers, row lock                | 🔜  |
| **Cron / jobs**    | market auto‑close 5‑min worker                | 🔜  |
| **UI – create**    | creation form                                 | ✅   |
| **UI – feed card** | live price bar w/SWR                          | 🔜  |
| **UI – trade**     | Trade modal, optimistic update                | 🔜  |
| **UI – resolve**   | Oracle panel                                  | 🔜  |
| **Notifications**  | Realtime user toast                           | ⭐   |
| **Analytics**      | P\&L materialised view                        | ⭐   |

---

# E. Day‑by‑Day Sprint Outline (5 developer days)

| Day    | Dev Focus                                                 | QA / Product             |
| ------ | --------------------------------------------------------- | ------------------------ |
| **D1** | DB hardening, wallet helpers, migrate; PR 1               | Review schema            |
| **D2** | Complete service layer + tests; PR 2                      | Approve & merge          |
| **D3** | API routes + cron; PR 3                                   | Trigger staging cron run |
| **D4** | Front‑end (trade modal, bar) + resolution UI; PR 4        | Manual UI pass           |
| **D5** | Notifications, analytics, rate‑limits; full E2E run; PR 5 | Sign‑off & flag on       |

---

## Final Acceptance Criteria

1. **Trade latency** < 300 ms (95‑th) with 50 concurrent users.
2. **Payout integrity** – sum(wallet balances) unchanged pre/post resolve ±0.01 %.
3. **Cron** closes 100 % of due markets within 10 min window.
4. **UI** reflects new probability within 5 s of trade (feed & detail).
5. **Security** – no unauthorised resolve; repeated spam trades blocked at limiter.

Deliver on those five and the prediction‑market feature is production‑ready.

---

Happy shipping—ping me for code snippets or live pairing if any step blocks the squad!
