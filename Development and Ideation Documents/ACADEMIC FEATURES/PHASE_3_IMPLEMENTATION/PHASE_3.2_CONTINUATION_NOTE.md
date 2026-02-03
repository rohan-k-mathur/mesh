# Phase 3.2 Argument Citations - Implementation Continuation Note

**Last Updated:** February 2, 2026  
**Status:** ✅ COMPLETE - All Chunks (1-8) + UI Components Implemented

---

## Context

We implemented **Phase 3.2: Argument-Level Citations** (now Phase 3.3 in `IMPLEMENTATION_PROGRESS_ACADEMIC.md`) from the roadmap in `PHASE_3_IMPLEMENTATION/PHASE_3.2_ARGUMENT_CITATIONS.md`. This is separate from the "Export Formats" feature (Phase 3.2 in that doc) which was already complete.

**Goal:** Enable scholars to cite specific arguments with stable permalinks, track citation relationships, and visualize citation graphs.

---

## Completed (All Chunks 1-8 + UI Components)

| Chunk | Component | Location | Status |
|-------|-----------|----------|--------|
| 1 | Schema Models | `lib/models/schema.prisma` (lines ~8250-8365) | ✅ |
| | - `ArgCitationType` enum | SUPPORT, EXTENSION, APPLICATION, CONTRAST, REBUTTAL, REFINEMENT, METHODOLOGY, CRITIQUE | ✅ |
| | - `ArgumentCitation` model | Junction table for citations between arguments | ✅ |
| | - `ArgumentPermalink` model | Stable URLs with shortCode + slug | ✅ |
| | - `ArgumentCitationMetrics` model | Citation counts by type | ✅ |
| | - Argument relations added | `citationsMade`, `citationsReceived`, `permalink`, `citationMetrics` | ✅ |
| 2 | Types | `lib/citations/argumentCitationTypes.ts` | ✅ |
| 3 | Permalink Service | `lib/citations/permalinkService.ts` | ✅ |
| 4 | Citation Service | `lib/citations/argumentCitationService.ts` | ✅ |
| 5 | Citation Graph Service | `lib/citations/citationGraphService.ts` | ✅ |
| 6 | API Routes | See below | ✅ |
| 7 | React Query Hooks | `lib/citations/argumentCitationHooks.ts` | ✅ |
| 8 | Documentation Update | `IMPLEMENTATION_PROGRESS_ACADEMIC.md` (Phase 3.3) | ✅ |
| UI | UI Components | `components/citations/argument/` | ✅ |

**Schema validated:** `npx prisma validate` passes ✅  
**Database migrated:** `npx prisma db push` applied ✅

---

## API Routes (Chunk 6)

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/arguments/[argumentId]/arg-citations` | GET, POST | List/create citations | ✅ |
| `/api/arguments/[argumentId]/arg-citations/[citationId]` | GET, DELETE, PATCH | Citation CRUD | ✅ |
| `/api/arguments/[argumentId]/permalink` | GET | Get/create permalink | ✅ |
| `/api/arguments/[argumentId]/citation-graph` | GET | Get citation graph | ✅ |
| `/api/a/[identifier]` | GET | Resolve permalink (redirect) | ✅ |
| `/api/deliberations/[id]/citation-graph` | GET | Get deliberation graph | ✅ |

---

## Key Files Reference

```
lib/citations/
├── anchorTypes.ts              # Existing (different feature)
├── argumentCitationTypes.ts    # NEW - Types for arg citations
├── argumentCitationService.ts  # NEW - Citation CRUD & metrics
├── permalinkService.ts         # NEW - Permalink generation
├── citationGraphService.ts     # NEW - Graph building & path finding
├── argumentCitationHooks.ts    # NEW - React Query hooks
├── evidenceBalance.ts          # Existing (different feature)
├── formatters.ts               # Existing (different feature)
└── navigation.ts               # Existing (different feature)

app/api/arguments/[argumentId]/
├── arg-citations/
│   ├── route.ts                # GET/POST citations
│   └── [citationId]/route.ts   # GET/DELETE/PATCH single citation
├── permalink/route.ts          # GET permalink with citation formats
└── citation-graph/route.ts     # GET citation graph

app/api/a/[identifier]/
└── route.ts                    # Permalink resolver

app/api/deliberations/[id]/
└── citation-graph/route.ts     # GET deliberation citation graph

components/citations/argument/
├── index.ts                    # Barrel exports
├── ArgumentCitationBadge.tsx   # Type badge + CitationTypeSelector
├── ArgumentCitationCard.tsx    # Card, CompactCard, List components
├── PermalinkCopyButton.tsx     # Copy URL/citation formats dropdown
├── ArgumentCitationGraphViewer.tsx  # Interactive SVG graph + stats
└── CreateCitationModal.tsx     # Create citation modal + QuickCiteButton

lib/models/schema.prisma        # Schema with new models (end of file)
```

---

## UI Components (Complete)

| Component | Description | Status |
|-----------|-------------|--------|
| `ArgumentCitationBadge` | Color-coded type badges with tooltips | ✅ |
| `CitationTypeSelector` | Type picker for all 8 citation types | ✅ |
| `ArgumentCitationCard` | Full citation display with direction, annotation | ✅ |
| `ArgumentCitationCardCompact` | Compact version for lists | ✅ |
| `ArgumentCitationList` | List component with empty state | ✅ |
| `PermalinkCopyButton` | Dropdown for URL, APA, MLA, Chicago, BibTeX | ✅ |
| `PermalinkDisplay` | Shows short permalink with copy button | ✅ |
| `ArgumentCitationGraphViewer` | Interactive SVG with zoom/pan | ✅ |
| `CitationGraphStats` | Citation type counts summary | ✅ |
| `CreateCitationModal` | Search, select type, add annotation | ✅ |
| `QuickCiteButton` | One-click "Cite" button | ✅ |

---

## Next Steps

1. ~~**Database Migration:** Run `npx prisma db push` to apply schema changes~~ ✅ Complete
2. ~~**UI Components:** Create UI components for citation display~~ ✅ Complete
3. **Integration:** Add citation buttons to ArgumentCard and related components
4. **Testing:** Write unit tests for services and API routes

---

## Roadmap Reference

- Full spec: `PHASE_3_IMPLEMENTATION/PHASE_3.2_ARGUMENT_CITATIONS.md`
- Part 2: `PHASE_3.2_ARGUMENT_CITATIONS_PART2.md` (API routes & UI components)
- Progress tracker: `IMPLEMENTATION_PROGRESS_ACADEMIC.md` (Phase 3.3 section)
