# Prediction Market Development Playbook

This document summarizes the step‑by‑step implementation plan for delivering the Prediction Market features on Mesh. It captures the agreed roadmap, dependencies and acceptance criteria so the entire team can coordinate pull requests and QA.

## A. At‑a‑Glance Roadmap

```
DB Migrations  →  Wallet Ledger  →  Service Layer (core logic)  →  API routes/tRPC
                   ↑                                            ↓
       Cron & Jobs (auto‑close)                Front‑End (trade modal, live bar)
                   ↑                                            ↓
         Resolution Admin UI             Notifications, Analytics, Tests
```

Merge features bottom‑up following the dependency arrows.

## B. Prerequisite Checks

- Verify `wallet` table exists with `balance_cents` and `locked_cents` columns.
- Confirm `PredictionMarket` and `Trade` migrations are deployed on staging.
- Feature flag `predictionMarkets` created in LaunchDarkly.
- Environment variables `MARKET_CRON_SECRET` and `NEXT_PUBLIC_MARKETS_WS` are set in staging.

## C. Implementation Steps

### 1. Database & Ledger Hardening

1. Create a row‑level lock function `lock_wallet(user_id)` in a migration.
2. Add composite index `idx_trade_market_user` on `Trade(marketId, userId)`.
3. Create `ResolutionLog` table for auditing payouts.

### 2. Service Layer Completion

- Implement `placeTrade` using Prisma transactions with wallet locking.
- Add `resolveMarket` helper to credit winners and emit websocket events.
- Cron script `scripts/closeMarkets.ts` auto‑closes past‑due markets.

### 3. API / tRPC Routes

| Route                        | Method | Notes                                   |
| ---------------------------- | ------ | --------------------------------------- |
| `/api/market/[id]/trade`     | POST   | Authenticated; returns shares + new prob |
| `/api/market/[id]/resolve`   | POST   | Creator/oracle/admin only               |
| `/api/market/[id]`           | GET    | Public, cached 60 s                     |

### 4. Front‑End Features

- **Trade modal** with Radix slider and optimistic updates.
- **Live probability bar** refreshed via SWR every 5 s.
- **Resolution panel** for authorised users once a market is closed.

### 5. Notifications

Insert notifications during `resolveMarket` and subscribe on the client to toast results.

### 6. Analytics

Emit `market_traded` and `market_resolved` events to Segment → ClickHouse. Materialised view tracks P&L per user.

### 7. Testing Matrix

- Unit tests with Vitest for LMSR math.
- Integration tests with Supertest covering trade errors.
- Concurrency test with k6 to ensure pool never goes negative.
- E2E tests with Playwright for full trading/resolution flow.

### 8. Security & Rate Limiting

- Limit `/trade` to 10 requests per minute per user.
- Idempotency key on `/resolve` stored in Redis for 15 minutes.
- Ignore client‑supplied probabilities; always compute server‑side.

### 9. Release & Feature Flag Roll‑out

1. Deploy to staging with two demo markets seeded.
2. After QA sign‑off enable flag for internal staff only.
3. Gradually ramp traffic to beta users over two days.
4. Monitor error budget and latency dashboards.

## D. Acceptance Criteria

1. Trade latency < 300 ms (95‑th percentile) with 50 concurrent users.
2. Payout integrity: total wallet balances unchanged after resolve (±0.01%).
3. Cron closes 100% of due markets within a 10 minute window.
4. UI reflects new probability within 5 s of trade.
5. No unauthorised resolution; rate limiter blocks spam trades.

