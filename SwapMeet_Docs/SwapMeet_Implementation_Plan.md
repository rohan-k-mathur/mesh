# SwapMeet Implementation Plan

This document distills the key actions required to build the **SwapMeet** module ("Mesh Bazaar") inside the current Mesh monorepo. It bridges the high‑level SRS with practical integration tasks so contributors know where to start and how pieces fit together.

## 1. Repository Integration

- **Monorepo packages**: follow the pattern in existing `apps/` and `services/` folders. Create `apps/swapmeet-web` for the Next.js frontend and `services/swapmeet-api` for API routes and business logic.
- **Database schema**: extend the Prisma models in `database` with tables listed in the SRS (`section`, `stall`, `item`, `offer`, `auction`, `order`). Use migration scripts in `scripts/`.
- **Realtime**: use Supabase Realtime channels as done in other features (see `lib/supaClient.ts`). Yjs documents per stall store chat and offer state.
- **Video streaming**: integrate LiveKit via `@livekit/components-react` similar to existing livestream nodes.
- **Payments**: reuse Stripe integration utilities under `services/stripe`. Add escrow ledger columns to Postgres with RLS rules.

## 2. Milestone Breakdown

The playbook in `SwapMeet_Steps.md` maps to ten blocks. Each block corresponds to a two–three day sprint. Suggested order:

1. **Foundation & Tooling** – scaffold packages, CI, environments.
2. **Macro Grid Navigation** – build `/market/[x]/[y]` routes with minimap overlay.
3. **Stall CRUD & Thumbnails** – seller dashboard, image uploads, presence badge.
4. **Stall Detail + CRDT** – chat panel, item grid, presence cursors.
5. **Live Video** – LiveKit room per stall, broadcast controls.
6. **Bargaining & Offers** – `/offer` command, counter flow.
7. **Checkout & Escrow** – Stripe checkout, order state machine.
8. **Flash Auctions** – Go microservice, Redis timers, bid UI.
9. **Governance Tools** – stewardship roles, moderation hooks.
10. **Analytics & Heat‑Map** – ClickHouse events, minimap overlay.

## 3. Development Tips

- **UI Components**: adopt Radix + shadcn/ui for headless primitives; keep styling consistent with existing Tailwind config.
- **State Management**: use tRPC + Zod across frontend and API for typed contracts. Light client state can live in Zustand stores.
- **Testing**: follow repository standards—Vitest for unit tests and Playwright for e2e flows. See `jest/` for setup examples.
- **CI/CD**: add GitHub Actions similar to other services. Helm charts deploy LiveKit and Supabase on EKS.

## 4. Acceptance Criteria (MVP)

1. Navigate ≥ 50 contiguous sections with cold load < 1 s.
2. Chat round‑trip ≤ 300 ms.
3. Offer lifecycle (create → accept → capture) succeeds > 99 % of attempts.
4. Flash auction handles ≥ 200 bids/min without missed high bid.
5. Zero P1 security issues in OWASP scan.

## 5. Next Steps

- Confirm SRS sign‑off from stakeholders.
- Begin Block 0 tasks (repo scaffold, CI pipeline).
- Schedule design review for stall detail UX.

This plan should be used alongside `SwapMeet_ProductPlaybook.md` and `SwapMeet_Steps.md` while implementing features. Update this file as progress is made.
