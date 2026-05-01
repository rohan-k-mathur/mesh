# Ludics Integration Strategy: Automatic vs. Opt-In

**Date**: November 3, 2025  
**Context**: Pre-Phase 1 architectural decision  
**Question**: Should Ludics be automatic/transparent or require explicit user opt-in?

---

## TL;DR Recommendation

**Use a hybrid approach: Automatic Background Processing + Progressive Enhancement UI**

- ✅ **Automatic**: Compile and sync Ludics data in the background whenever dialogue moves happen
- ✅ **Progressive**: Show Ludics annotations/insights only when users need them (badges, overlays)
- ✅ **Opt-In (UI only)**: Users can explicitly open the Ludics tab or enable advanced features
- ❌ **NOT opt-in for data**: Don't require users to "turn on Ludics" to get the benefits

**Key Insight**: The current system **already does automatic compilation** (`autoCompile: true` on every dialogue move), but the UI forces users to manually open the Ludics tab. We should invert this: keep auto-compilation but surface insights automatically.

---

## Current State Analysis

### What Already Happens Automatically

From examining the codebase:

1. **Automatic Compilation Triggers**:
```typescript
// app/api/dialogue/move/route.ts (line 517)
if (autoCompile && !(dedup && (kind === 'WHY' || kind === 'GROUNDS'))) {
  await compileFromMoves(deliberationId).catch(() => {});
}
if (autoStep) {
  // ... runs stepper automatically
}
```

2. **UI Components Set autoCompile=true**:
```typescript
// components/dialogue/command-card/CommandCard.tsx
autoCompile: true,
autoStep: true,

// components/claims/CriticalQuestions.tsx
autoCompile: true,
autoStep: true,

// components/dialogue/DialogicalPanel.tsx
autoCompile: true,
autoStep: true,
```

3. **Background Hooks Already Running**:
```typescript
// app/_startup/ludics-hooks.ts
Hooks.onTraversal(({ dialogueId, status, pairs }) => {
  console.debug('[ludics] traversal', { dialogueId, status, pairs: pairs.length });
});
```

**Conclusion**: The system **already automatically compiles** Ludics data on every move. The problem is **visibility**, not automation.

---

## The Problem: Ludics is Hidden

### Current User Flow (Problematic)

```
User makes argument/claim
    ↓
Dialogue move created
    ↓
Ludics compiles in background ✅ (automatic)
    ↓
Ludics trace exists in DB ✅ (automatic)
    ↓
User sees... NOTHING ❌ (requires manual tab switch)
    ↓
User must explicitly:
  1. Click "Ludics" tab in DeepDivePanel
  2. Wait for compile-step to re-run
  3. Scroll through 1200-line UI
  4. Manually interpret traces
```

**User Experience**: "What's Ludics? Why should I care?"

### What Users Actually Need

Users don't need to understand Ludics **theory**. They need to see **actionable insights**:

- ✅ "This argument is **decisive** in the debate"
- ✅ "Your claim at locus 0.1.2 has **no valid response** (suggestion: add grounds)"
- ✅ "This interaction **diverged** (suggestion: revise or concede)"
- ✅ "Your arguments are **orthogonal** (compatible for synthesis)"
- ✅ "This commitment **contradicts** an earlier one"

**Key Principle**: Surface **insights**, hide **machinery**.

---

## Recommended Strategy: Hybrid Approach

### Architecture: Three Layers

#### 1. **Background Layer** (Always Active)
**No user intervention required. Runs automatically.**

```typescript
// On every DialogueMove creation:
POST /api/dialogue/move
  ↓
1. Create DialogueMove
2. Create/update AifNode (Phase 1 addition)
3. compileFromMoves() → creates LudicAct + LudicDesign
4. Sync to AifNode.ludicActId (Phase 1 addition)
5. stepInteraction() → generates trace
6. Store insights in cache/DB:
   - Decisive steps
   - Orthogonality status
   - Daimon hints
   - Commitment deltas
```

**Implementation**:
```typescript
// app/api/dialogue/move/route.ts (expand existing block)
if (autoCompile) {
  await compileFromMoves(deliberationId);
  
  // NEW: Sync to AIF immediately
  await fetch('/api/ludics/sync-to-aif', {
    method: 'POST',
    body: JSON.stringify({ deliberationId })
  }).catch(() => {}); // Don't fail move if sync fails
  
  // NEW: Cache insights for UI
  const insights = await computeLudicsInsights(deliberationId);
  await redis.set(`ludics:insights:${deliberationId}`, JSON.stringify(insights), 'EX', 300);
}
```

**Benefits**:
- ✅ Always up-to-date (no "refresh" button needed)
- ✅ No user action required
- ✅ Fast (cached insights)
- ✅ AIF graph always has ludics metadata

**Performance**: Already runs on every move; Phase 1 adds ~10-20ms for AIF sync (acceptable).

---

#### 2. **Progressive Enhancement Layer** (Automatic Display)
**Show insights where users naturally look. No opt-in required.**

**A) Argument Cards (ArgumentCardV2)**

Add subtle badges **automatically**:

```tsx
// components/arguments/ArgumentCardV2.tsx
export function ArgumentCardV2({ argument }: Props) {
  const { data: ludicsData } = useSWR(`/api/ludics/insights/${argument.id}`);
  
  return (
    <div className="argument-card">
      {/* Existing content */}
      
      {/* NEW: Ludics badges (always visible if data exists) */}
      {ludicsData?.decisive && (
        <Badge variant="decisive" tooltip="This argument is decisive in the debate trace">
          ⚡ Decisive
        </Badge>
      )}
      {ludicsData?.locusPath && (
        <Badge variant="outline" tooltip="Dialogue position in interaction tree">
          📍 {ludicsData.locusPath}
        </Badge>
      )}
      {ludicsData?.needsResponse && (
        <Badge variant="warning" tooltip="No valid response found">
          ⚠️ Needs Response
        </Badge>
      )}
    </div>
  );
}
```

**B) AIF Diagrams (with overlay toggle)**

```tsx
// components/aif/AifDiagramViewerDagre.tsx
export function AifDiagramViewerDagre({ deliberationId }: Props) {
  const [showLudics, setShowLudics] = useLocalStorage('aif:showLudics', true); // Default ON
  
  return (
    <>
      <DiagramToolbar>
        <Toggle checked={showLudics} onChange={setShowLudics}>
          Show Interaction Trace
        </Toggle>
      </DiagramToolbar>
      
      <Diagram nodes={nodes} edges={edges}>
        {showLudics && <LudicsOverlay deliberationId={deliberationId} />}
      </Diagram>
    </>
  );
}
```

**Overlay shows**:
- Dashed lines for interaction pairs
- Highlighted nodes for decisive steps
- Color-coded edges (convergent=green, divergent=red)
- Tooltips: "Step 3 in trace: Positive act at 0.1"

**C) Commitment Panels (inline warnings)**

```tsx
// components/dialogue/CommitmentDelta.tsx (already exists!)
// Enhance to show contradictions automatically:
{contradictions.length > 0 && (
  <Alert variant="warning">
    ⚠️ {contradictions.length} contradicting commitments detected
    <Button variant="link" onClick={() => setShowDetails(true)}>
      View Details
    </Button>
  </Alert>
)}
```

**Benefits**:
- ✅ Users see insights **in context**
- ✅ No manual tab-switching
- ✅ Toggleable for power users (but defaults ON)
- ✅ Graceful degradation (no badges if no data)

---

#### 3. **Deep-Dive Layer** (Explicit Opt-In)
**Advanced tools require user to open Ludics tab. This is appropriate.**

Keep the current LudicsPanel as a **power-user tool**:

```
DeepDivePanelV2
  ├─ Models Tab (default, shows arguments with badges)
  ├─ Diagrams Tab (shows AIF with overlay)
  ├─ **Ludics Tab** ← Explicit opt-in for deep analysis
  │   ├─ TraceRibbon (full step-by-step)
  │   ├─ LociTree (tree visualization)
  │   ├─ BehaviourInspector (orthogonality analysis)
  │   ├─ DefenseTree (strategic analysis)
  │   └─ JudgeConsole (moderator tools)
  └─ Settings Tab
```

**When users click Ludics tab**:
1. Show **onboarding tooltip** (first time only):
   ```
   💡 Ludics Panel
   This tab shows the formal interaction structure of your debate.
   Use it to:
   - See which arguments are decisive
   - Check for contradictions
   - Analyze response patterns
   ```
2. Load full panel (can be lazy-loaded for performance)

**Benefits**:
- ✅ Doesn't overwhelm beginners
- ✅ Power users get full control
- ✅ Clear separation: insights (automatic) vs. tools (opt-in)

---

## Implementation Plan

### Phase 1a: Background Processing (Week 1)

**Tasks**:
1. ✅ Already works: `autoCompile` runs on every move
2. **NEW**: Add AIF sync to move endpoint:
   ```typescript
   // app/api/dialogue/move/route.ts
   if (autoCompile) {
     await compileFromMoves(deliberationId);
     await syncLudicsToAif(deliberationId); // NEW
   }
   ```
3. **NEW**: Create insights endpoint:
   ```typescript
   // app/api/ludics/insights/[argumentId]/route.ts
   GET /api/ludics/insights/:argumentId
   // Returns: { decisive, locusPath, needsResponse, orthogonal, ... }
   ```
4. **NEW**: Cache insights in Redis (5min TTL)

**DoD**:
- [ ] Every DialogueMove triggers AIF sync
- [ ] Insights endpoint returns in <50ms (cached)
- [ ] No user action required

---

### Phase 1b: Progressive Enhancement (Week 2)

**Tasks**:
1. Add badges to ArgumentCardV2:
   ```tsx
   {ludicsData?.decisive && <Badge>⚡ Decisive</Badge>}
   ```
2. Add LudicsOverlay to AifDiagramViewerDagre:
   ```tsx
   {showLudics && <LudicsOverlay />}
   ```
3. Enhance CommitmentDelta with contradiction warnings
4. Add tooltips explaining each badge

**DoD**:
- [ ] Badges visible on all argument cards (if data exists)
- [ ] Diagram overlay toggleable (defaults ON)
- [ ] Tooltips help users understand insights
- [ ] No manual compile needed

---

### Phase 1c: Settings & Opt-Out (Week 2)

**Give users control without requiring opt-in**:

```tsx
// components/deliberations/DeliberationSettingsPanel.tsx
export function DeliberationSettingsPanel({ deliberationId }: Props) {
  const [showLudicsInsights, setShowLudicsInsights] = useState(true); // Default ON
  
  return (
    <SettingsCard title="Interaction Analysis">
      <Toggle 
        checked={showLudicsInsights}
        onChange={setShowLudicsInsights}
        label="Show interaction insights"
        description="Display badges and overlays for argument interaction structure"
      />
      
      {showLudicsInsights && (
        <div className="mt-4 space-y-2">
          <Checkbox label="Show decisive step badges" defaultChecked />
          <Checkbox label="Show locus paths" defaultChecked />
          <Checkbox label="Show diagram overlay" defaultChecked />
          <Checkbox label="Warn about contradictions" defaultChecked />
        </div>
      )}
    </SettingsCard>
  );
}
```

**Key**: Users can **turn off** badges, but they're **on by default**.

**DoD**:
- [ ] Setting persists in `Deliberation.ludicInsightsEnabled` (new column)
- [ ] When disabled, badges/overlays hidden
- [ ] LudicsPanel still accessible (deep-dive always available)

---

## Comparison: Opt-In vs. Automatic

### ❌ Full Opt-In Approach (NOT Recommended)

**How it would work**:
```tsx
// User must explicitly enable Ludics
<DeliberationSettingsPanel>
  <Toggle label="Enable Ludics Analysis" defaultChecked={false} />
</DeliberationSettingsPanel>

// If disabled:
// - No compilation
// - No badges
// - No insights
// - Ludics tab hidden
```

**Problems**:
1. **Discovery problem**: New users never know Ludics exists
2. **Data gap**: If user enables later, need to backfill (slow)
3. **Inconsistent experience**: Some arguments have insights, others don't
4. **Wasted computation**: Already compiling on every move; why hide results?
5. **Fragmentation**: Power users get insights, beginners don't (widens skill gap)

**When opt-in makes sense**:
- ✅ Expensive features (e.g., "Enable AI summaries" costs $$)
- ✅ Experimental features (e.g., "Beta: Try new algorithm")
- ✅ Privacy-sensitive features (e.g., "Share my data")

**Ludics is none of these**: It's cheap (already running), stable (not experimental), and local (no privacy issue).

---

### ✅ Automatic + Progressive (Recommended)

**How it works**:
```tsx
// Always running in background
POST /api/dialogue/move → compileFromMoves() → syncToAif() → cache insights

// Badges appear automatically (if data exists)
<ArgumentCardV2>
  {insights?.decisive && <Badge>⚡ Decisive</Badge>}
</ArgumentCardV2>

// Users can opt-out if desired
<Settings>
  <Toggle label="Show interaction insights" defaultChecked={true} />
</Settings>
```

**Benefits**:
1. ✅ **Zero friction**: Users get insights immediately
2. ✅ **Progressive disclosure**: Start with badges → click for details → open Ludics tab
3. ✅ **Always consistent**: Every argument has same metadata
4. ✅ **Educational**: Badges teach users about argument structure
5. ✅ **Opt-out preserves choice**: Power users can disable if distracting

---

## User Personas & Needs

### Persona 1: Casual User (80% of users)
**Goal**: "I just want to make good arguments"

**Needs**:
- ❌ **Doesn't need** Ludics theory
- ❌ **Doesn't need** LociTree visualizations
- ✅ **Does need** "Your argument needs a response" warnings
- ✅ **Does need** "This point is decisive" highlights

**Solution**: Automatic badges + tooltips. No manual actions.

---

### Persona 2: Engaged Participant (15% of users)
**Goal**: "I want to understand the debate structure"

**Needs**:
- ❌ **Doesn't need** Full Ludics formalism
- ✅ **Does need** Diagram overlays (who attacked whom)
- ✅ **Does need** Contradiction warnings
- ✅ **Might explore** Ludics tab out of curiosity

**Solution**: Diagram overlay (default ON) + occasional Ludics tab visits.

---

### Persona 3: Power User / Moderator (5% of users)
**Goal**: "I want to formally analyze and moderate this debate"

**Needs**:
- ✅ **Does need** Full LudicsPanel
- ✅ **Does need** Stepper controls (compile/step/orthogonality)
- ✅ **Does need** JudgeConsole (force concessions, close branches)
- ✅ **Does need** BehaviourInspector (uniformity, saturation)

**Solution**: Explicit Ludics tab + advanced tools. This is already opt-in.

---

## Migration Path (for existing deliberations)

**Challenge**: Some deliberations already have moves but no Ludics data.

**Solution**: Backfill on-demand

```typescript
// app/api/ludics/insights/[argumentId]/route.ts
export async function GET(req: NextRequest, { params }: { params: { argumentId: string } }) {
  const argumentId = params.argumentId;
  
  // Check cache first
  const cached = await redis.get(`ludics:insights:${argumentId}`);
  if (cached) return NextResponse.json(JSON.parse(cached));
  
  // Check if Ludics data exists
  const ludicAct = await prisma.ludicAct.findFirst({
    where: { metaJson: { path: ['targetId'], equals: argumentId } }
  });
  
  if (!ludicAct) {
    // Backfill: compile moves for this deliberation
    const argument = await prisma.argument.findUnique({ 
      where: { id: argumentId },
      select: { deliberationId: true }
    });
    
    if (argument) {
      await compileFromMoves(argument.deliberationId);
      await syncLudicsToAif(argument.deliberationId);
    }
  }
  
  // Now compute insights
  const insights = await computeInsightsForArgument(argumentId);
  await redis.set(`ludics:insights:${argumentId}`, JSON.stringify(insights), 'EX', 300);
  
  return NextResponse.json(insights);
}
```

**User Experience**:
1. User opens old deliberation
2. Badges don't appear (no data yet)
3. First request to `/api/ludics/insights/:id` triggers backfill
4. Badges appear within 1-2 seconds
5. Subsequent loads are instant (cached)

**Performance**: Backfill is lazy (only when requested) and cached (fast thereafter).

---

## Settings Hierarchy

Users can control visibility at **3 levels** (coarse → fine):

### Level 1: Deliberation Settings (Coarse)
```tsx
<DeliberationSettingsPanel>
  <Toggle label="Enable Interaction Analysis" defaultChecked={true} />
</DeliberationSettingsPanel>
```
- Affects: All users in this deliberation
- Stored: `Deliberation.ludicsInsightsEnabled`
- When disabled: No badges, no overlays, Ludics tab still accessible

### Level 2: User Preferences (Medium)
```tsx
<UserSettingsPanel>
  <Toggle label="Show Ludics insights by default" defaultChecked={true} />
</UserSettingsPanel>
```
- Affects: This user across all deliberations (if delib allows)
- Stored: `UserSettings.prefs.ludicsInsightsVisible`
- When disabled: User sees no badges even if delib has them enabled

### Level 3: Per-Feature Toggles (Fine)
```tsx
<DiagramToolbar>
  <Toggle label="Show interaction overlay" defaultChecked={true} />
</DiagramToolbar>
```
- Affects: This specific view (diagram only)
- Stored: localStorage `aif:showLudics`
- When disabled: Overlay hidden, badges still show elsewhere

**Precedence**: User > Deliberation > Feature default

---

## Example User Journeys

### Journey 1: New User Makes First Argument

```
1. User creates argument: "We should ban plastic bags"
   → POST /api/dialogue/move (autoCompile=true)
   → compileFromMoves() runs
   → LudicAct created at locus "0.1"
   → synced to AifNode
   
2. ArgumentCardV2 renders
   → Fetches /api/ludics/insights/:id
   → Shows badge: "📍 0.1"
   → Tooltip: "This is the first positive claim in the debate"
   
3. User hovers badge → sees tooltip → learns about locus
   
4. User continues debate (badges appear on all arguments)
   
5. After 5 moves, user notices "⚡ Decisive" badge
   → Clicks "Why is this decisive?"
   → Modal shows: "This argument has no valid counterargument"
   
6. User now understands: decisive = strong position
   → Future badges make sense (progressive learning)
```

**No opt-in required. User learned by doing.**

---

### Journey 2: Power User Wants Deep Analysis

```
1. User has been using badges for weeks
   
2. Notices "Ludics" tab in DeepDivePanelV2
   → Clicks tab (first time)
   → Sees onboarding tooltip
   
3. Explores TraceRibbon
   → Sees full interaction trace
   → Clicks step 3 → ActInspector shows details
   
4. Uses JudgeConsole
   → Forces concession on weak argument
   → Trace updates (convergent)
   
5. Opens BehaviourInspector
   → Checks orthogonality
   → Sees "Designs are compatible ✓"
   
6. User now has full Ludics toolkit
   → But started with simple badges
```

**Opt-in for advanced tools, not for basic insights.**

---

### Journey 3: User Finds Badges Distracting

```
1. User sees badges on all arguments
   
2. Finds them distracting ("What's a locus?")
   
3. Opens Deliberation Settings
   → Toggles "Show interaction insights" OFF
   
4. Badges disappear
   → User can focus on content
   
5. Later, user wonders "Which argument is strongest?"
   → Toggles insights back ON
   → Sees "⚡ Decisive" badge
   → Clicks to learn more
   
6. User now appreciates badges (re-enabled)
```

**Opt-out preserves choice without hiding features from others.**

---

## Implementation Checklist

### Week 1: Background Processing
- [ ] Extend AifNode schema (`ludicActId`, `locusPath`, `locusRole`)
- [ ] Add AIF sync to `/api/dialogue/move` (after compileFromMoves)
- [ ] Create `/api/ludics/insights/:argumentId` endpoint
- [ ] Implement insight computation (decisive, needsResponse, orthogonal)
- [ ] Add Redis caching for insights (5min TTL)
- [ ] Test: Create move → verify AifNode created with ludicActId

### Week 2: Progressive UI
- [ ] Add badges to ArgumentCardV2 (decisive, locus, needsResponse)
- [ ] Add tooltips explaining each badge
- [ ] Create LudicsOverlay component
- [ ] Integrate overlay in AifDiagramViewerDagre (toggleable)
- [ ] Enhance CommitmentDelta with contradiction warnings
- [ ] Test: Badges appear automatically, tooltips work

### Week 3: Settings & Polish
- [ ] Add `Deliberation.ludicsInsightsEnabled` column (default true)
- [ ] Update DeliberationSettingsPanel with toggle
- [ ] Add per-feature toggles (diagram overlay, badges)
- [ ] Implement backfill logic for old deliberations
- [ ] Add onboarding tooltip for Ludics tab (first visit)
- [ ] Test: Toggle works, backfill runs on-demand

---

## Conclusion

**Recommendation: Automatic + Progressive Enhancement**

✅ **Automatic background processing**: Always compile, always sync to AIF  
✅ **Progressive UI**: Show insights where users naturally look (badges, overlays)  
✅ **Opt-out (not opt-in)**: Users can disable if distracting, but defaults ON  
✅ **Deep-dive tools remain opt-in**: LudicsPanel is for power users  

**Rationale**:
1. **Already running**: System compiles on every move; hiding results makes no sense
2. **Educational**: Badges teach users about argument structure
3. **Low friction**: No setup required, works immediately
4. **Respects choice**: Users can disable if needed
5. **Scales with expertise**: Casual users see badges, power users get full tools

**Anti-pattern to avoid**: Requiring users to "enable Ludics" before seeing any benefits. This creates a discovery problem and widens the skill gap between power users and beginners.

**Next Step**: Review this strategy, then proceed to Phase 1 implementation (AIF integration + automatic badge display).
