# SwapMeet – Phase 2 Task List
*(covers remaining Block 1 work + Block 2 “Stall CRUD & Thumbnails”)*

## 1. Macro Grid Navigation (finish Block 1)
- [ ] Arrow buttons + WASD keys (`components/GridNavControls.tsx`)
- [ ] Minimap canvas with heat‑map overlay (`components/Minimap.tsx`)
- [ ] Heat‑map API route `/api/heatmap`
- [ ] Teleport to busy section helper
- [ ] SWR neighbour prefetch for instant navigation

## 2. Stall CRUD & Thumbnails (Block 2)
- [ ] Seller dashboard route `/dashboard/stalls`
- [ ] TanStack Table listing stalls
- [ ] Create / Edit modal with Zod validation
- [ ] Prisma uniqueness constraint on `sectionId + sellerId`
- [ ] Supabase Storage bucket `stall-images`
- [ ] ImageDropzone + blurhash generation
- [ ] Presence badge via Supabase Realtime

## 3. Migrations
- [ ] `ALTER TABLE section ADD COLUMN visitors INT DEFAULT 0;`
- [ ] `CREATE TABLE stall_image (…)` *if multiple images per stall*
- [ ] `CREATE UNIQUE INDEX idx_stall_section ON "Stall"(seller_id, section_id);`

## 4. Testing
- [ ] Vitest unit tests for `getHeatmap`
- [ ] Playwright e2e: create stall → image upload → appears on section page
- [ ] k6: 1 k simultaneous heat‑map pings

## 5. Definition of Done
1. Navigate 11×11 grid smoothly (<1 s p95).
2. Minimap renders live visitor squares updating every 3 s.
3. Seller can CRUD stalls and images; thumbnail shows in section.
4. Online badge toggles within 2 s when seller joins/leaves stall.


Task	Focus
T1	Arrow/WASD nav, SWR prefetch, commit & PR
T2	Heat‑map table + API + minimap canvas
T3	Seller dashboard scaffold, Prisma constraint
T4	Stall form modal, Supabase upload flow
T5	Presence badge realtime; unit & e2e tests
T6	Buffer / bug‑fix / PR review; merge & tag v0.2.0

After Phase 2
Proceed to Block 3 in the Implementation Plan (Stall Detail + CRDT).
Remember to update SwapMeet_Implementation_Plan.md progress tables and increment the version field in each package.json.

Happy coding—once you commit SwapMeet_Phase2_Task_List.md and kick off Task 1 items, the grid should start feeling like a living market 
