# Ludics-Deliberation Integration: User Testing Guide

This guide walks you through testing the complete ludics-deliberation integration system via the Mesh user interface.

---

## Prerequisites

1. **Start the development server:**
   ```bash
   yarn dev
   ```

2. **Ensure you have a test account** with access to create deliberations.

3. **Browser:** Chrome or Firefox recommended for best developer tools support.

---

## Test Flow 1: Basic Deliberation → Ludic Arena

### Step 1: Create a New Deliberation

1. Navigate to the **Deliberations** section (typically `/deliberations` or via the main navigation)
2. Click **"New Deliberation"** or **"Create"**
3. Fill in the deliberation details:
   - **Title:** "Test Renewable Energy Debate"
   - **Description:** "Testing ludics integration with a policy discussion"
   - **Type:** Choose "Discussion" or "Debate" if available
4. Click **Create/Start**

### Step 2: Add Initial Claims and Responses

1. In the deliberation view, add the **root claim:**
   > "We should transition to 100% renewable energy by 2035"

2. Add **supporting arguments** (these become positive polarity moves):
   - "Climate change requires urgent action"
   - "Renewable costs have dropped 90% in the last decade"
   - "Job creation in green sector exceeds fossil fuel losses"

3. Add **opposing arguments** (these become negative polarity moves):
   - "Grid reliability concerns with intermittent sources"
   - "Economic disruption to existing industries"
   - "Infrastructure upgrade costs are significant"

4. Create **nested responses** to build depth:
   - Under "Grid reliability concerns", add: "Battery storage technology is advancing rapidly"
   - Under "Economic disruption", add: "Transition programs can retrain workers"

### Step 3: View the Ludic Arena (LudicsPanel)

The ludics integration is in the **DeepDivePanelV2** component, specifically in the **LudicsPanel** tab.

1. Open a deliberation and navigate to the **Ludics** tab in the DeepDive panel (right sidebar)
2. **View Mode Toggle** - Look for the segmented control with three options:
   - **Forest**: Shows `LudicsForest` - grouped scopes with paginated designs
   - **Unified**: Shows `LociTreeWithControls` - merged view of all designs
   - **Split**: Shows individual design trees side-by-side

3. The tree display (`LociTreeLegacy`) shows:
   - **Tree structure** showing argument hierarchy as nested loci
   - **Polarity coloring via ActChips:** 
     - **PRO (Positive/P):** Green chips (`bg-emerald-50 border-emerald-400`)
     - **OPP (Negative/O):** Red/rose chips (`bg-rose-50 border-rose-400`)
     - **Daimon (†):** Gray chips (`bg-slate-50 border-slate-200`)
   - **Address labels** as `path` property (e.g., "0", "0.1", "0.1.2")
   - **Additive markers (⊕)** for choice points with amber ring highlight

4. **Heatmap visualization** - If trace data exists, loci show intensity stripes on the left indicating frequency/score

### Step 4: Verify Arena Properties

Check that the arena correctly shows:
- [ ] Root position at address `[]` (empty)
- [ ] Alternating polarities at each depth level
- [ ] Ramification arrows showing possible response paths
- [ ] All positions from the deliberation are represented

---

## Test Flow 2: Interactive Play Mode

### Step 1: Enter Play Mode

1. In the Ludics View, look for **"Play"** or **"Interact"** button
2. Select your role:
   - **Proponent (P):** You play positive polarity moves
   - **Opponent (O):** You play negative polarity moves
3. Choose opponent type:
   - **Manual:** Take turns with another user
   - **AI:** Play against an AI strategy

### Step 2: Make Moves

1. The interface should highlight **legal moves** (positions you can respond to)
2. Click on a legal position to make your move
3. Observe:
   - Turn indicator switching between P and O
   - Path building as moves accumulate
   - Current position highlighted in the arena

### Step 3: Observe Termination

Play until one of these conditions:
- **Stuck:** No legal moves available → Other player wins
- **Daimon (†):** Player gives up → Other player wins
- **Convergence:** Interaction reaches a natural end

### Step 4: View Interaction Result

After termination, check:
- [ ] Winner displayed correctly
- [ ] Termination reason shown (stuck, daimon, or complete)
- [ ] Full path/trace available for review

---

## Test Flow 3: Strategy & Design Testing

### Step 1: View Available Designs

1. Look for **"Strategies"** or **"Designs"** panel
2. You should see designs extracted from the deliberation:
   - Proponent designs (positive strategies)
   - Opponent designs (negative strategies)

### Step 2: Examine a Design

Click on a design to see:
- **Chronicles:** The branches/paths the design covers
- **Base address:** Where the design starts
- **Has Daimon:** Whether the design includes giving up
- **Completeness:** Whether all responses are covered

### Step 3: Run Design vs Design Simulation

1. Select a proponent design
2. Select an opponent design
3. Click **"Simulate"** or **"Run Interaction"**
4. Observe the automatic playthrough
5. Check the result:
   - Which design won?
   - What was the path taken?
   - Was it convergent or divergent?

---

## Test Flow 4: Path Extraction & Narrative

### Step 1: Complete an Interaction

Play through or simulate an interaction to completion.

### Step 2: View Extracted Path

1. Look for **"Path"** or **"Trace"** view
2. Verify:
   - All moves listed in order
   - Polarities alternate correctly
   - Addresses progress logically

### Step 3: View Incarnation (Essential Core)

1. Find the **"Incarnation"** or **"Essential Moves"** view
2. This should be a subset of the full path
3. These are the "proof-relevant" moves that determined the outcome

### Step 4: Generate Narrative

1. Click **"Generate Narrative"** or **"Export as Story"**
2. Review the justified narrative:
   - Each step should have a justification
   - Speakers should alternate (Proponent/Opponent)
   - Conclusion should state the winner and why

### Step 5: Export Options

Try different export formats:
- [ ] **Markdown:** For documentation
- [ ] **JSON:** For API integration
- [ ] **Plain text:** For simple sharing

---

## Test Flow 5: Landscape Analysis

### Step 1: Access Landscape View

1. Find **"Landscape"** or **"Analysis"** tab
2. This should show strategic analysis of all positions

### Step 2: View Position Strength Heat Map

1. The heat map should color positions by strategic strength:
   - **Hot (red/orange):** Strong positions for current player
   - **Cool (blue/green):** Weak positions
   - **Neutral (gray):** Balanced positions

2. Hover over positions to see:
   - Win rate from simulations
   - Number of winning designs
   - Whether a winning strategy exists

### Step 3: Find Critical Points

1. Look for **"Critical Points"** markers
2. These are positions where the outcome hinges
3. They should be highlighted or marked specially

### Step 4: View Flow Paths

1. If available, view **flow paths** showing common interaction trajectories
2. Thicker/brighter paths indicate more frequent outcomes

### Step 5: Run Batch Simulations

1. Find **"Run Simulations"** option
2. Set simulation count (e.g., 100)
3. Run and observe:
   - Overall win rates for P vs O
   - Most common paths
   - Average interaction length

---

## Test Flow 6: Completeness Checking

### Step 1: Check Design Completeness

1. Select a design from the design panel
2. Look for **"Check Completeness"** option
3. Review results:
   - Is the design complete (covers all opponent responses)?
   - What gaps exist?
   - Suggested completions

### Step 2: Complete an Incomplete Design

1. If a design is incomplete, look for **"Complete Design"** option
2. The system should add daimon (†) moves where needed
3. Verify the completed design covers all branches

### Step 3: Check Behaviour Completeness

1. For a set of designs, check if they form a **behaviour**
2. A behaviour is closed under biorthogonal closure
3. The system should indicate if the set is complete

---

## Test Flow 7: Full Pipeline Verification

### End-to-End Test

1. **Create** a new deliberation with 5+ arguments
2. **View** in Ludics Arena mode
3. **Play** an interaction to completion
4. **Extract** the path
5. **Generate** narrative from path
6. **Analyze** landscape
7. **Export** results

### Verify at Each Step:
- [ ] No errors in console
- [ ] UI updates smoothly
- [ ] Data persists correctly
- [ ] All theoretical constraints satisfied

---

## Common Issues & Troubleshooting

### Arena Not Showing

- Refresh the page
- Check browser console for errors
- Verify deliberation has at least one position

### Polarity Colors Wrong

- Polarities are determined by tree depth
- Even depth = Positive (+)
- Odd depth = Negative (-)

### Play Mode Not Working

- Ensure you've selected a role (P or O)
- Check that legal moves are available
- Verify the interaction hasn't already terminated

### Narrative Generation Fails

- Ensure path has at least one action
- Check that path has valid alternating polarities
- Verify arena context is available

### Landscape Analysis Slow

- Reduce simulation count
- Check for very deep/wide arenas
- Consider filtering to subset of positions

---

## Developer Tools Verification

Open browser developer tools (F12) and check:

### Console
- No red errors during normal operation
- Ludics-related logs should show arena construction, interaction steps

### Network
- API calls to `/api/deliberation/*` succeeding
- No 500 errors on ludics endpoints

### React DevTools (if available)
- Ludics components rendering correctly
- State updates happening on moves

---

## Test Data Reset

To start fresh:
1. Create a new deliberation (don't modify existing ones during testing)
2. Or use the test/sandbox environment if available

---

## Reporting Issues

When reporting bugs, include:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser console errors** (screenshot or copy)
5. **Network tab errors** (if API-related)
6. **Deliberation ID** (for data inspection)

---

## Quick Reference: Ludics Terminology

| Term | Meaning |
|------|---------|
| **Arena** | The game board - all positions in a deliberation |
| **Position** | A single argument/claim in the tree |
| **Address** | Location in tree, e.g., [0,1,2] |
| **Polarity** | + (Proponent) or - (Opponent) |
| **Design** | A complete strategy for one player |
| **Chronicle** | A single branch/path in a design |
| **Daimon (†)** | "Give up" move - ends interaction |
| **Incarnation** | Essential core of a path (proof-relevant moves) |
| **Behaviour** | Set of designs closed under biorthogonal |
| **Convergent** | Interaction ended normally |
| **Divergent** | Interaction ended with player stuck |

---

## Success Criteria

Phase 7 testing is successful when:

- ✅ Deliberations transform correctly into ludic arenas
- ✅ Interactive play works with correct turn-taking
- ✅ Designs are extracted and can be simulated
- ✅ Paths are extracted with valid incarnations
- ✅ Narratives generate with proper justifications
- ✅ Landscape analysis provides meaningful strategic insight
- ✅ All exports (Markdown, JSON) produce valid output
- ✅ No crashes or data corruption during normal use
