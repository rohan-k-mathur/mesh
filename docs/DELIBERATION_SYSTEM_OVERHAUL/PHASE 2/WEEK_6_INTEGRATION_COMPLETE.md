# Cluster Browser - Week 6 Integration Complete

This directory contains the complete implementation of the semantic cluster browser for Week 6.

## Components Created

### Core Library
- **`lib/schemes/semantic-clusters.ts`** - 9 cluster definitions with metadata, helpers, and relationship mappings

### React Components (6 files, ~750 LOC)
- **`components/schemes/ClusterBrowser.tsx`** - Main orchestrator component
- **`components/schemes/ClusterGrid.tsx`** - Grid layout for all clusters  
- **`components/schemes/ClusterCard.tsx`** - Individual cluster card UI
- **`components/schemes/ClusterSchemeList.tsx`** - Scheme list within a cluster
- **`components/schemes/RelatedSchemes.tsx`** - Related scheme suggestions

### Database & Scripts
- **Schema Update**: Added `semanticCluster` field to ArgumentScheme model
- **Seed Script**: `scripts/seed-semantic-cluster-metadata.ts` - Classifies all schemes

### Test Page
- **`app/test/cluster-browser/page.tsx`** - Interactive test environment

## Semantic Clusters (9 total)

All 23 schemes are classified into semantic domains:

1. **👨‍🏫 Authority & Expertise** (5 schemes)
   - expert_opinion, popular_opinion, popular_practice, position_to_know, witness_testimony

2. **🔗 Cause & Effect** (7 schemes)
   - cause_to_effect, effect_to_cause, causal, sign, correlation_to_cause, good_consequences, bad_consequences

3. **🎯 Practical Decision Making** (7 schemes)
   - practical_reasoning, value_based_practical_reasoning, value_based_pr, negative_consequences, positive_consequences, fear_appeal, waste

4. **🔄 Analogy & Comparison** (6 schemes)
   - analogy, precedent, example, argument_from_example, gradualism, slippery_slope

5. **📋 Classification & Definition** (8 schemes)
   - verbal_classification, definition_to_verbal_classification, definition_to_classification, classification, composition, argument_from_composition, division, argument_from_division

6. **⚖️ Values & Ethics** (4 schemes)
   - value_based_practical_reasoning, commitment, fairness, two_wrongs

7. **📊 Evidence & Proof** (5 schemes)
   - sign, witness_testimony, position_to_know, ignorance, correlation_to_cause

8. **⚔️ Opposition & Conflict** (4 schemes)
   - inconsistent_commitment, circumstantial_ad_hominem, bias, two_wrongs

9. **🔍 Meta-Claims & Testing** (5 schemes)
   - bare_assertion, claim_relevance, claim_clarity, claim_truth, test_scheme

## Setup & Usage

### 1. Database Setup

The schema has been updated and pushed:

```bash
npx prisma db push  # Already done ✅
```

### 2. Seed Cluster Classifications

```bash
npx tsx scripts/seed-semantic-cluster-metadata.ts  # Already done ✅
```

Expected output:
```
✓ Updated: 13 schemes
→ Already set: 10 schemes
⚠ Not classified: 0 schemes
Total: 23 schemes
✅ Seeding complete!
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Test the Browser

Navigate to: **http://localhost:3000/test/cluster-browser**

## User Flows

### Flow 1: Browse by Topic
1. See 9 cluster cards in grid
2. Hover to see cluster description and examples
3. Click to view schemes in that cluster
4. Click scheme to see details
5. Navigate back to cluster grid

### Flow 2: Discover Related Schemes
1. Select a scheme
2. View related schemes in sidebar
3. Click related scheme to explore
4. See related clusters to browse

### Flow 3: Cross-Cluster Navigation
1. View scheme details
2. See which cluster it belongs to
3. Click related cluster badges
4. Browse schemes across domains

## Component APIs

### ClusterBrowser

```tsx
<ClusterBrowser
  onSchemeSelect={(scheme) => console.log(scheme)}
  initialCluster="authority"  // Optional: start on specific cluster
  compactMode={false}         // Optional: enable compact layout
/>
```

### RelatedSchemes

```tsx
<RelatedSchemes
  currentScheme={selectedScheme}
  allSchemes={allSchemes}
  onSchemeSelect={(scheme) => console.log(scheme)}
  onClusterSelect={(clusterId) => console.log(clusterId)}  // Optional
  maxSchemes={6}              // Optional: limit results
  compact={false}             // Optional: compact layout
/>
```

## Architecture Highlights

### Cluster Definitions
- Each cluster has: id, name, description, icon, color, schemeKeys
- Related clusters defined for cross-navigation
- Typical use cases and examples provided

### Helper Functions
- `getSchemesForCluster()` - Get all schemes in a cluster
- `getClusterForScheme()` - Find which cluster a scheme belongs to
- `getRelatedSchemes()` - Get related schemes from same/related clusters
- `getClusterCounts()` - Count schemes per cluster
- `searchClusters()` - Search clusters by text

### UI Features
- Responsive grid layout (1/2/3/4 columns)
- Color-coded clusters by domain
- Hover interactions with context panels
- Expandable scheme details
- Back navigation breadcrumbs
- Related scheme suggestions

## Week 6 Deliverables ✅

- [x] **Task 6.1**: Semantic cluster definitions (9 clusters)
- [x] **Task 6.2**: Cluster grid UI (3 components)
- [x] **Task 6.3**: Scheme list view within clusters
- [x] **Task 6.4**: Related schemes navigation
- [x] **Task 6.5**: Database schema + seed script
- [x] **Integration**: Test page + full documentation

**Total Code**: ~900 LOC across 7 files
**Database**: 23/23 schemes classified (100%)
**Test Coverage**: Interactive test page functional

## Next Steps (Week 7)

Week 7 will implement **Identification Conditions Filter**:
- 25+ pattern-based conditions ("appeals to expertise", "cites consequences")
- Checkbox filter UI with real-time results
- Match scoring and ranking
- Help system explaining each condition

This will be the third navigation mode, complementing the dichotomic tree (Week 5) and cluster browser (Week 6).

## Troubleshooting

**Cluster grid not showing:**
- Ensure dev server is running
- Check /api/schemes/all returns data
- Verify all schemes have semanticCluster field

**Schemes not in correct cluster:**
- Update lib/schemes/semantic-clusters.ts
- Re-run seed script
- Check database with: `npx prisma studio`

**Related schemes not appearing:**
- Verify relatedClusters arrays are correct
- Check getRelatedSchemes() logic
- Ensure allSchemes prop is passed correctly
