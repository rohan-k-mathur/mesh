# Phase 6D User Guide
## Using Scheme Hierarchies and Clustering in the Admin Interface

---

## Quick Start

### Accessing the Admin Interface

1. Navigate to: `http://localhost:3002/admin/schemes`
2. You'll see two view modes:
   - **List View** (default): Traditional filtered list
   - **Hierarchy View** (new): Tree visualization with families

---

## Creating a Child Scheme

### Step-by-Step

1. **Click "Create Scheme"** (top right, blue button)

2. **Fill in basic information**:
   ```
   Scheme Key: expert_opinion_medical
   Display Name: Medical Expert Opinion
   Summary: Argument from medical expert testimony
   ```

3. **Set taxonomy fields** (optional):
   ```
   Purpose: state_of_affairs
   Source: external
   Material Relation: authority
   Reasoning Type: inductive
   ```

4. **Configure clustering** (new in Phase 6D):
   ```
   Parent Scheme: [Select] "Argument from Expert Opinion"
   Cluster Tag: authority_family
   ☑ Inherit critical questions from parent scheme
   ```

5. **Add premises and CQs** (as usual)

6. **Click "Create Scheme"**

### Result

Your new scheme will:
- Appear under "Argument from Expert Opinion" in Hierarchy View
- Inherit all parent CQs (e.g., "Is the expert credible?")
- Be grouped in the "authority_family" cluster
- Show in filtered lists when cluster tag is selected

---

## Understanding the Hierarchy View

### Legend

- **● Purple bullet**: Root scheme (no parent)
- **↳ Gray arrow**: Child scheme (has parent)
- **Indentation**: Shows depth in hierarchy (24px per level)
- **+inherited badge**: This scheme inherits parent CQs
- **Blue badge**: Cluster family tag

### Example Tree

```
● Practical Reasoning (practical_reasoning_family) [9 CQs]
  ├─ ↳ Value-Based Practical Reasoning [12 CQs] +inherited
  ├─ ↳ Positive Consequences [8 CQs] +inherited
  └─ ↳ Negative Consequences [10 CQs] +inherited
      └─ ↳ Slippery Slope Argument [4 CQs] +inherited
```

**Reading the Tree**:
- **Practical Reasoning** is the root (● symbol)
- **Value-Based PR**, **Pos Cons**, **Neg Cons** are direct children (one level deep)
- **Slippery Slope** is a grandchild (two levels deep, under Neg Cons)
- All children have **+inherited** badge → they inherit parent CQs
- All are in **practical_reasoning_family** cluster

---

## Using Filters and Controls

### Cluster Filter

**Purpose**: Show only schemes in a specific family

**How to Use**:
1. Type cluster tag in filter box (e.g., "practical_reasoning_family")
2. Or click a cluster badge in the summary section
3. Tree updates to show only matching schemes
4. Clear filter to see all schemes again

**Autocomplete**: Type and see suggestions from existing cluster tags

### Expand/Collapse All

**Purpose**: Quick navigation in large hierarchies

**Expand All**: Shows all children at all levels
**Collapse All**: Hides all children, shows only roots

**Individual Nodes**: Click chevron (▶ or ▼) next to scheme name

---

## Editing Parent-Child Relationships

### Reparenting a Scheme

1. **List View** → Click **Edit** (pencil icon)
2. Scroll to **"Scheme Clustering & Hierarchy"**
3. **Change Parent Scheme**: Select new parent from dropdown
4. **Update Cluster Tag**: (optional) Change to match new parent's family
5. **Toggle Inheritance**: Check/uncheck if needed
6. **Click "Update Scheme"**

### Making a Root Scheme

1. Follow steps above
2. Set **Parent Scheme** to **"No parent (root scheme)"**
3. **Cluster Tag** can remain (roots can have cluster tags)
4. **Inherit CQs** becomes irrelevant (no parent to inherit from)

### Removing from Cluster

1. Edit scheme
2. **Clear Cluster Tag** field (delete text)
3. Scheme still has parent/child relationships
4. Won't appear in cluster filter results

---

## Statistics Dashboard

Located at top of Hierarchy View:

```
┌──────────────────────────────────────────────────────┐
│ Total Schemes: 45    Root Schemes: 12               │
│ Child Schemes: 33    Cluster Families: 5            │
└──────────────────────────────────────────────────────┘
```

**Metrics**:
- **Total Schemes**: All schemes in database
- **Root Schemes**: Schemes with no parent (depth 0)
- **Child Schemes**: Schemes with a parent (depth 1+)
- **Cluster Families**: Number of unique cluster tags

---

## Best Practices

### Naming Cluster Tags

**Good**:
- `practical_reasoning_family`
- `authority_family`
- `similarity_family`

**Bad**:
- `PracticalReasoning` (use snake_case, not PascalCase)
- `pr` (too short, not descriptive)
- `practical reasoning family` (no spaces, use underscores)

### Organizing Hierarchies

**Recommended Structure**:
```
Root (General Scheme)
 ├─ Child 1 (Specialized Variant)
 ├─ Child 2 (Another Variant)
 └─ Child 3 (Different Context)
     └─ Grandchild (Highly Specific)
```

**Avoid**:
- Very deep hierarchies (4+ levels) → hard to navigate
- Circular references (A → B → A's parent) → confuses users
- Orphan children (parent deleted) → automatically become roots

### CQ Inheritance Strategy

**When to Enable Inheritance** (`inheritCQs = true`):
- Child is a specialization of parent (e.g., Medical Expert Opinion → Expert Opinion)
- Parent CQs are still relevant (e.g., "Is the expert credible?" applies to medical experts)
- Want to avoid duplicating CQs

**When to Disable Inheritance** (`inheritCQs = false`):
- Child diverges significantly from parent structure
- Parent CQs don't make sense in child context
- Need complete control over which CQs apply

---

## Common Workflows

### Workflow 1: Creating a Scheme Family

**Goal**: Establish a new cluster with multiple related schemes

**Steps**:
1. **Create root scheme**:
   - Key: `analogy_reasoning`
   - Cluster Tag: `analogy_family`
   - Parent: None

2. **Create child schemes**:
   - `similarity_analogy` (parent: analogy_reasoning, cluster: analogy_family)
   - `a_fortiori` (parent: analogy_reasoning, cluster: analogy_family)
   - `precedent` (parent: analogy_reasoning, cluster: analogy_family)

3. **View in Hierarchy**:
   - Filter by `analogy_family`
   - See all 4 schemes in tree structure

### Workflow 2: Finding All Schemes in a Family

**Goal**: See all schemes related to a specific concept

**Steps**:
1. Switch to **Hierarchy View**
2. Scroll to **Cluster Family Summary** (bottom)
3. Click badge (e.g., **"practical_reasoning_family (5)"**)
4. Tree shows only those 5 schemes
5. Use **Expand All** to see full hierarchy

### Workflow 3: Moving a Scheme to a Different Family

**Goal**: Reclassify a scheme into a different cluster

**Steps**:
1. **List View** → **Edit** scheme
2. Change **Cluster Tag**: `causal_family` → `practical_reasoning_family`
3. (Optional) Change **Parent** to match new family
4. **Save**
5. In Hierarchy View, filter by old cluster → scheme gone
6. Filter by new cluster → scheme appears

---

## Troubleshooting

### "No schemes found" in Hierarchy View

**Cause**: Cluster filter is too restrictive

**Solution**: Clear the cluster filter input box

---

### Scheme appears multiple times in tree

**Cause**: Circular reference (shouldn't happen, but possible via API)

**Solution**: Edit one of the schemes to break the cycle (set parent to None)

---

### Can't find inherited CQs in form

**Cause**: Inherited CQs only shown via API, not in form

**Solution**: Use GET `/api/schemes/{id}/cqs?includeInherited=true` to see full CQ list

---

### Child scheme doesn't inherit parent CQs

**Check**:
1. Is **"Inherit CQs"** checkbox enabled?
2. Does parent have CQs? (Check parent scheme's CQ list)
3. Is parent-child relationship correct? (Check Hierarchy View)

**Solution**: Edit child scheme, ensure checkbox is checked and parent is selected

---

## Keyboard Shortcuts

(When Hierarchy View is focused)

- **Tab**: Navigate between filter input and buttons
- **Enter**: Toggle expand/collapse on focused chevron
- **Escape**: Clear cluster filter

---

## API Endpoints (For Advanced Users)

### Get Scheme with CQ Inheritance

```http
GET /api/schemes/{schemeId}/cqs?includeInherited=true
```

**Response**:
```json
{
  "cqs": [
    { "cqKey": "own_cq_1", "text": "...", "inherited": false, "fromScheme": "self" },
    { "cqKey": "parent_cq_1", "text": "...", "inherited": true, "fromScheme": "practical_reasoning" }
  ],
  "summary": { "total": 18, "own": 4, "inherited": 14 }
}
```

### Get Scheme Cluster (Family Tree)

```typescript
// In code:
import { getSchemeCluster } from "@/lib/argumentation/schemeInference";

const cluster = await getSchemeCluster("slippery_slope_id");
// Returns:
// {
//   ancestors: [{ id, key, name, depth: 1 }, { id, key, name, depth: 2 }],
//   descendants: [],
//   clusterMembers: [{ id, key, name, clusterTag }]
// }
```

---

## Future Features (Not Yet Implemented)

- [ ] Drag-and-drop reparenting in Hierarchy View
- [ ] Bulk cluster tag assignment
- [ ] Export hierarchy as JSON/GraphML
- [ ] CQ inheritance preview in form (before saving)
- [ ] Visual diff when changing parent (show CQ changes)

---

## Support

**Questions?**
- Check `PHASE_6D_IMPLEMENTATION_SUMMARY.md` for technical details
- See `ARGUMENTATION_SCHEMES_GAP_ANALYSIS.md` for theoretical background
- Run test script: `npx tsx scripts/test-scheme-creator-ui.ts`

**Found a bug?**
- Check console for errors
- Try refreshing the page
- Clear cluster filter and retry
- Ensure Prisma client is up-to-date: `npx prisma generate`

---

## Examples of Well-Structured Hierarchies

### Authority Family
```
● Argument from Expert Opinion (authority_family)
  ├─ ↳ Argument from Medical Expert
  ├─ ↳ Argument from Legal Expert
  └─ ↳ Argument from Scientific Authority
      └─ ↳ Argument from Peer-Reviewed Study
```

### Practical Reasoning Family
```
● Practical Reasoning (Goal→Means→Ought) (practical_reasoning_family)
  ├─ ↳ Value-Based Practical Reasoning
  ├─ ↳ Argument from Positive Consequences
  └─ ↳ Argument from Negative Consequences
      └─ ↳ Slippery Slope Argument
```

### Causal Family
```
● Argument from Cause to Effect (causal_family)
  ├─ ↳ Argument from Correlation
  ├─ ↳ Argument from Sign
  └─ ↳ Argument from Waste
```

---

## Conclusion

Phase 6D provides powerful tools for managing complex argumentation scheme ontologies. By leveraging parent-child relationships and cluster families, you can:

- **Reduce redundancy** (inherit CQs instead of duplicating)
- **Organize semantically** (group related schemes)
- **Visualize structure** (see the full taxonomy at a glance)
- **Enable advanced inference** (cluster-aware scheme detection)

**Next**: Phase 7 will add dialogue type integration, enabling context-aware scheme recommendations based on discussion type (persuasion, deliberation, inquiry, negotiation).
