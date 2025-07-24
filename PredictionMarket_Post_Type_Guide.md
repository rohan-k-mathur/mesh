Below is a **ground‑up design package** for a “Prediction Market Post” that
conforms to – and extends – the architecture described in
`Creating_New_Post_Type_Guide.md`.
It is deliberately opinionated but modular, so you can start with the **MVP**
and iterate toward Kalshi‑ or Manifold‑level sophistication without rewiring
core pieces later.

---

## 1 Functional spec (MVP)

| Feature                    | Behaviour                                                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Question**               | Markdown string ≤ 140 chars (“Will SpaceX land Starship by 2025‑12‑31?”)                                                                                        |
| **Binary outcome**         | “YES / NO” market, continuous price ∈ $0 … 1$ mapped to `%‑chance`.                                                                                             |
| **Automated market maker** | LMSR with `b = liquidityParam` (see §3).                                                                                                                        |
| **Currency**               | In‑app *Credits* (integer, 1 credit = 1 ¢ or “play money”).                                                                                                     |
| **Lifecycle**              | `state: "open" → "closed" → "resolved"`.<br>`closesAt` auto‑closes trading.                                                                                     |
| **Resolution**             | Creator sets outcome *or* designates an “oracle” user. Admin override exists.                                                                                   |
| **UI**                     | • Post body shows question and live probability bar.<br>• “Trade” button opens modal: slider to buy / sell shares.<br>• Below the post: table of recent trades. |
| **Permissions**            | Anyone can trade while `state === "open"`. Only creator/oracle/admin can resolve.                                                                               |
| **Notifications**          | Push/email when (a) market resolves, (b) user trade executed, (c) large trade > threshold.                                                                      |

*Stretch goals (not blocking MVP):* multi‑outcome, liquidity rebates, comment‑anchored
trades, multi‑currency, API export etc.

---

## 2 Data model additions

### 2.1 SQL (Prisma style)

```ts
model Post {
  id          String   @id @default(cuid())
  authorId    String   @index
  createdAt   DateTime @default(now())
  type        PostType // "TEXT" | "IMAGE" | … | "PREDICTION"
  title       String?
  content     Json?    // existing inline payloads

  // --- Prediction‑specific one‑to‑one ---
  prediction  PredictionMarket?
}

model PredictionMarket {
  id           String   @id @default(cuid())
  postId       String   @unique
  question     String   @db.VarChar(140)
  closesAt     DateTime
  resolvesAt   DateTime?
  state        PredictionState @default(OPEN)
  outcome      MarketOutcome?  // YES | NO
  b            Float           // liquidity parameter
  yesPool      Float @default(0) // LMSR state variables
  noPool       Float @default(0)
  creatorId    String
  oracleId     String?

  trades       Trade[]
}

enum PredictionState { OPEN CLOSED RESOLVED }
enum MarketOutcome  { YES NO }

model Trade {
  id         String   @id @default(cuid())
  marketId   String   @index
  userId     String   @index
  side       MarketOutcome // YES or NO
  shares     Float         // δq bought (can be negative for sell)
  price      Float         // effective average price paid
  cost       Int           // credits debited (+) or refunded (-)
  createdAt  DateTime @default(now())
}
```

### 2.2 Why pools & LMSR?

LMSR maintains two numbers (`q_yes`, `q_no`). The instantaneous price of YES is

```
P_yes = exp(q_yes / b) / (exp(q_yes / b) + exp(q_no / b))
```

Buying Δq shares of YES increments `q_yes` until the user’s cost reaches their
slider amount.  All maths can be local to the **service layer**; the DB only
stores the resulting `yesPool`, `noPool`.

---

## 3 Backend service modules

> **Folder** `lib/prediction/`

| File          | Responsibility                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `lmsr.ts`     | Pure functions `getPrice({ yesPool, noPool, b })`, `buy({ side, shares, pools, b }) → { cost, newPools }`.                |
| `service.ts`  | Validates requests, writes `Trade` + updates pools, debits user credits (uses existing wallet service).                   |
| `resolver.ts` | Guarded mutation to set outcome and pay‑out winnings (YES holders receive `shares` credits each, NO holders get nothing). |
| `cron.ts`     | Nightly job auto‑closing markets whose `closesAt < now()` and still `OPEN`.                                               |

---

## 4 API routes

| Route                      | Method | Auth                 | Purpose                                               |                         |
| -------------------------- | ------ | -------------------- | ----------------------------------------------------- | ----------------------- |
| `/api/market`              | POST   | user                 | Create market – payload `{ question, closesAt, b? }`. |                         |
| `/api/market/{id}/trade`   | POST   | user                 | Body \`{ side:"YES"                                   | "NO", credits\:Int }\`. |
| `/api/market/{id}/resolve` | POST   | creator/oracle/admin | \`{ outcome:"YES"                                     | "NO" }\`.               |
| `/api/market/{id}`         | GET    | public               | Returns full market + trades (paginated).             |                         |

*Implementation:* Next‑API route or tRPC mutation – follow existing pattern.

---

## 5 Front‑end integration (per *Creating\_New\_Post\_Type\_Guide.md*)

### 5.1 Builder / Composer: `components/forms/CreatePredictionPost.tsx`

* Fields: **Question**, **Close date‑time**, **Liquidity slider** (b).
* On submit → POST `/api/market` → returns `postId` → push to feed.

*Note:* This is **not** inside the drag‑and‑drop portfolio builder; it follows
the normal “create‑post” flow.

### 5.2 Feed card: `components/cards/PredictionMarketCard.tsx`

```tsx
export default function PredictionMarketCard({ post }: { post: PostWithMarket }) {
  const [price, setPrice] = useState(post.prediction.currentPrice);

  // live updates via Pusher/WS optional
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold">{post.prediction.question}</h3>

      {/* probability bar */}
      <div className="h-3 rounded bg-gray-200 relative overflow-hidden">
        <div
          className="bg-green-500 absolute inset-y-0 left-0"
          style={{ width: `${price * 100}%` }}
        />
      </div>
      <div className="text-xs text-gray-600">{Math.round(price * 100)} % YES</div>

      <button
        className="btn-primary w-full"
        onClick={() => openTradeModal(post.prediction)}
        disabled={post.prediction.state !== "OPEN"}
      >
        {post.prediction.state === "OPEN" ? "Trade" : "Closed"}
      </button>

      {post.prediction.state === "RESOLVED" && (
        <div className="text-sm font-medium">
          Outcome: {post.prediction.outcome}
        </div>
      )}
    </div>
  );
}
```

### 5.3 Trade modal: `components/modals/TradePredictionModal.tsx`

1. Slider 0–maxCredits → converts to shares via LMSR quote (`buyPreview()`).
2. Shows `Δ%` price impact and post‑trade probability.
3. Calls `/api/market/{id}/trade` on confirm.
4. Stores recent trades in SWR cache → optimistic update of price bar.

### 5.4 Market page `[slug]?view=market`

Full depth chart, trade history, comment section.

---

## 6 Credits wallet hooks

Re‑use the project’s existing wallet table:

* `wallet.balance` updated in same DB transaction as new `Trade`.
* Out‑of‑credits → 402 error surfaced in modal.

---

## 7 Permissions & security

| Threat              | Mitigation                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Oracle self‑dealing | All trades by `oracleId` are blocked after `closesAt`.                                        |
| Double‑spend        | Trades & credit debits committed in a single SQL transaction with `FOR UPDATE` on wallet row. |
| Price‑spam          | `b` lower‑bounded (e.g. 50) so first trader can’t move price 0 → 100 for 1 credit.            |
| Front‑run outcome   | Creator cannot trade after hitting **Resolve** endpoint (DB constraint).                      |

---

## 8 Testing strategy

* **Unit** – deterministic LMSR maths (property tests with fast‑check).
* **API** – Supertest suite: create → trade → resolve → payouts add up.
* **Cypress** – End‑to‑end: user A creates, user B trades, admin resolves.
* **Load** – k6 script: 1 k rps trades, DB CPU bound? adjust `b`.

---

## 9 Incremental roadmap

| Sprint | Deliverable                                                             |
| ------ | ----------------------------------------------------------------------- |
| 1      | DB migration, service & API, minimal card (probability + Trade modal).  |
| 2      | Resolution workflow, wallet payouts, notifications.                     |
| 3      | Depth chart, trade comments, CSV export.                                |
| 4      | Multi‑outcome, liquidity incentives, leaderboard / profit charts.       |
| 5      | Real‑money pilot (Kalshi‑style CFTC compliance), KYC, withdrawal rails. |

---

## 10 Code snippets you can paste today

### 10.1 `lib/prediction/lmsr.ts`

```ts
export function priceYes(qYes: number, qNo: number, b: number) {
  const expYes = Math.exp(qYes / b);
  const expNo  = Math.exp(qNo  / b);
  return expYes / (expYes + expNo);
}

export function costToBuy(
  side: "YES" | "NO",
  delta: number,
  qYes: number,
  qNo: number,
  b: number,
) {
  const C = (qY: number, qN: number) =>
    b * Math.log(Math.exp(qY / b) + Math.exp(qN / b));
  const costBefore = C(qYes, qNo);
  const costAfter  =
    side === "YES" ? C(qYes + delta, qNo) : C(qYes, qNo + delta);
  return costAfter - costBefore;
}
```

### 10.2 `pages/api/market/[id]/trade.ts` (simplified)

```ts
export default authed(async (req, res, { user }) => {
  invariant(req.method === "POST", 405);
  const { side, credits } = req.body;
  const market = await prisma.predictionMarket.findUnique({ where: { id: req.query.id }});
  invariant(market.state === "OPEN", 400, "Market closed");

  // binary search for shares matching spend
  let lo = 0, hi = 1_000;        // cap max shares
  for (let i=0;i<30;i++){
    const mid = (lo+hi)/2;
    const cost = costToBuy(side, mid, market.yesPool, market.noPool, market.b);
    cost > credits ? hi = mid : lo = mid;
  }
  const shares = lo;
  const cost   = Math.ceil(costToBuy(side, shares, market.yesPool, market.noPool, market.b));

  await prisma.$transaction(async tx => {
    const wallet = await tx.wallet.findUnique({ where: { userId: user.id }, select: { balance:true }, lock:true});
    invariant(wallet.balance >= cost, 402, "Insufficient credits");

    await tx.wallet.update({ where:{ userId:user.id }, data:{ balance: { decrement: cost } }});
    await tx.trade.create({ data:{ marketId: market.id, userId:user.id, side, shares, cost, price: cost/shares }});
    await tx.predictionMarket.update({
      where:{ id: market.id },
      data: side==="YES"? { yesPool: { increment: shares } } : { noPool:{ increment: shares } }
    });
  });

  res.json({ ok:true });
});
```

---

### Green‑light checklist before you ship the first version

* [ ] Migration applied on staging; old posts unaffected.
* [ ] `npm run generate` updates Prisma client.
* [ ] Wallet debits & payouts reconciled (credits in = credits out).
* [ ] Accessibility: slider + inputs reachable by keyboard.
* [ ] Legal footer updated (“Not investment advice”).

---

**That’s the full blueprint.**
Wire the tables & service layer exactly once, and every *variant* (multi‑choice,
play‑money, real‑money, conditional market, tournament) will drop in as a thin
UI change.  Happy building – and may the best forecasters win!
