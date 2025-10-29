# Phase 3: UI/UX Integration

**Duration:** 4-6 weeks  
**Priority:** 🟠 High  
**Status:** 📋 Planning  
**Progress:** 0/20 tasks (0%)  

**Estimated Effort:** 42.5 hours  
**Risk Level:** Medium (UI complexity, integration testing)  
**Dependencies:** Phase 2 complete (all backend APIs ready)

---

## 🎯 Objective

Phase 3 integrates Phase 2 backend features into the user interface, creating polished, intuitive components that expose dialogue tracking, temporal decay, Dempster-Shafer modes, assumption management, NLI configuration, and hom-set analysis to end users.

**Key Goals:**
1. Build UI components for all Phase 2 features (dialogue state, decay indicators, DS visualization, assumption panels, hom-set displays)
2. Integrate Phase 2 APIs into existing workflows (DiagramViewer, ArgumentCard, DeliberationSettings)
3. Add user feedback mechanisms (loading states, error handling, tooltips, help text)
4. Implement comprehensive testing (unit, integration, E2E)
5. Create user documentation and in-app guidance

**Why This Phase Matters:**
- Makes Phase 2 backend features accessible to users (backend without UI is invisible)
- Enables research-grade dialogue analysis through visual tools
- Provides temporal awareness (users see when arguments are stale)
- Unlocks belief revision workflows via assumption management UI
- Prepares for Phase 4 (advanced features) and Phase 5 (DDF protocol)

**Success Criteria:**
- All Phase 2 backend features exposed in UI
- < 2s load time for all new components
- Zero TypeScript/lint errors
- Comprehensive test coverage (>80% for new components)
- User documentation complete
- Accessibility (WCAG AA compliance)

---

## 📊 Task Overview

| Subsection | Tasks | Effort | Priority | Description |
|-----------|-------|--------|---------|-------------|
| **3.1 Dialogue State Visualization** | 4 tasks | 9h | 🔴 Critical | Display dialogue move completion, answered attacks, response votes |
| **3.2 Temporal Decay UI** | 3 tasks | 6.5h | 🟠 High | Decay indicators, stale warnings, decay explanation tooltips |
| **3.3 Dempster-Shafer Visualization** | 3 tasks | 8h | 🟠 High | DS mode toggle integration, belief/plausibility display, interval charts |
| **3.4 Assumption Management UI** | 4 tasks | 9h | 🔴 Critical | AssumptionCard enhancements, lifecycle actions, active assumptions panel |
| **3.5 Hom-Set Analysis Display** | 3 tasks | 5h | 🟢 Medium | HomSetConfidencePanel integration, morphism visualization, aggregate metrics |
| **3.6 Testing & Documentation** | 3 tasks | 5h | 🔴 Critical | Unit tests, integration tests, user documentation |

**Total:** 20 tasks, 42.5 hours

---

## 📋 Task Breakdown

### 3.1 Dialogue State Visualization (4 tasks, 9 hours)

Expose dialogue tracking data through visual components showing which attacks have been answered, move completion status, and response vote aggregates.

---

#### Task 3.1.1: Dialogue State Badge Component

**Priority:** 🔴 Critical  
**Effort:** 2.5 hours  
**Files:**
- `/components/dialogue/DialogueStateBadge.tsx` (new)
- `/components/arguments/ArgumentCard.tsx` (integrate badge)

**Current State:** 
Phase 2.1 created `/app/api/deliberations/[id]/dialogue-state/route.ts` API that returns dialogue state for arguments. No UI component exists yet to display this data.

**Implementation:**

```tsx
// /components/dialogue/DialogueStateBadge.tsx
"use client";
import * as React from "react";
import { Check, X, Clock, AlertCircle } from "lucide-react";

interface DialogueStateBadgeProps {
  deliberationId: string;
  argumentId: string;
  // Optional: Pre-fetched state (avoids API call)
  initialState?: {
    totalAttacks: number;
    answeredAttacks: number;
    moveComplete: boolean;
    lastResponseAt?: string;
  };
}

/**
 * Displays dialogue state for an argument:
 * - Green check: All attacks answered (moveComplete = true)
 * - Yellow clock: Some attacks answered (partial)
 * - Red X: No attacks answered
 * - Tooltip shows details (X/Y attacks answered)
 */
export function DialogueStateBadge({
  deliberationId,
  argumentId,
  initialState,
}: DialogueStateBadgeProps) {
  const [state, setState] = React.useState(initialState);
  const [loading, setLoading] = React.useState(!initialState);

  React.useEffect(() => {
    if (initialState) return; // Use pre-fetched data

    const fetchState = async () => {
      try {
        const res = await fetch(
          `/api/deliberations/${deliberationId}/dialogue-state?argumentId=${argumentId}`
        );
        if (res.ok) {
          const data = await res.json();
          setState(data.state);
        }
      } catch (err) {
        console.error("Failed to fetch dialogue state:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchState();
  }, [deliberationId, argumentId, initialState]);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1 text-xs text-slate-400">
        <Clock className="w-3 h-3 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!state) return null;

  const { totalAttacks, answeredAttacks, moveComplete } = state;

  // Determine badge color and icon
  const badge = moveComplete
    ? { icon: Check, color: "text-green-600 bg-green-50 border-green-200", label: "Complete" }
    : answeredAttacks > 0
    ? { icon: Clock, color: "text-yellow-600 bg-yellow-50 border-yellow-200", label: "Partial" }
    : { icon: X, color: "text-red-600 bg-red-50 border-red-200", label: "Pending" };

  const Icon = badge.icon;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${badge.color}`}
      title={`${answeredAttacks}/${totalAttacks} attacks answered`}
    >
      <Icon className="w-3 h-3" />
      <span>{answeredAttacks}/{totalAttacks}</span>
    </div>
  );
}
```

**Integration into ArgumentCard**:

```tsx
// /components/arguments/ArgumentCard.tsx (add to card header)
import { DialogueStateBadge } from "@/components/dialogue/DialogueStateBadge";

// Inside ArgumentCard component:
<div className="flex items-center justify-between">
  <h3 className="text-sm font-semibold">{title}</h3>
  
  {/* Phase 3.1: Dialogue state badge */}
  {deliberationId && (
    <DialogueStateBadge
      deliberationId={deliberationId}
      argumentId={id}
    />
  )}
</div>
```

**Acceptance Criteria:**
- [ ] DialogueStateBadge component displays correct icon/color based on moveComplete status
- [ ] Badge shows "X/Y attacks answered" in tooltip
- [ ] Badge integrates into ArgumentCard header without layout issues
- [ ] API call only fires if initialState not provided (optimization)
- [ ] Loading state displays spinner
- [ ] Badge updates when dialogue state changes (via parent re-render)

**Dependencies:** Phase 2.1 (dialogue state API)  
**Blocks:** Task 3.1.2

---

#### Task 3.1.2: Answered Attacks Panel

**Priority:** 🟠 High  
**Effort:** 3 hours  
**Files:**
- `/components/dialogue/AnsweredAttacksPanel.tsx` (new)
- `/components/arguments/ArgumentDetailView.tsx` (integrate panel)

**Current State:**
Dialogue state API returns list of attacks with `answered: boolean` flag. No UI exists to show this list to users.

**Implementation:**

```tsx
// /components/dialogue/AnsweredAttacksPanel.tsx
"use client";
import * as React from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface Attack {
  attackId: string;
  attackerTitle: string;
  attackType: "rebut" | "undercut" | "concede";
  answered: boolean;
  responseId?: string;
  responseTitle?: string;
}

interface AnsweredAttacksPanelProps {
  deliberationId: string;
  argumentId: string;
}

/**
 * Displays a list of all attacks on an argument,
 * showing which have been answered (GROUNDS response exists).
 * 
 * Phase 3.1: Dialogue tracking visualization.
 */
export function AnsweredAttacksPanel({
  deliberationId,
  argumentId,
}: AnsweredAttacksPanelProps) {
  const [attacks, setAttacks] = React.useState<Attack[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAttacks = async () => {
      try {
        const res = await fetch(
          `/api/deliberations/${deliberationId}/dialogue-state?argumentId=${argumentId}`
        );
        if (res.ok) {
          const data = await res.json();
          setAttacks(data.state.attacks || []);
        }
      } catch (err) {
        console.error("Failed to fetch attacks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttacks();
  }, [deliberationId, argumentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Clock className="w-4 h-4 animate-spin text-slate-400" />
      </div>
    );
  }

  if (attacks.length === 0) {
    return (
      <div className="text-sm text-slate-500 p-4 text-center">
        No attacks on this argument.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-700">
        Attacks & Responses ({attacks.filter(a => a.answered).length}/{attacks.length} answered)
      </h4>

      <div className="space-y-1">
        {attacks.map((attack) => (
          <div
            key={attack.attackId}
            className={`flex items-start gap-2 p-2 rounded border ${
              attack.answered
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            {attack.answered ? (
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-700">
                  {attack.attackType.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500">
                  from "{attack.attackerTitle}"
                </span>
              </div>

              {attack.answered && attack.responseTitle && (
                <div className="text-xs text-slate-600 mt-1">
                  → Answered by "{attack.responseTitle}"
                </div>
              )}

              {!attack.answered && (
                <div className="text-xs text-slate-500 mt-1 italic">
                  No GROUNDS response yet
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Panel displays all attacks on an argument
- [ ] Answered attacks show green checkmark + response title
- [ ] Unanswered attacks show red X + "No GROUNDS response yet"
- [ ] Attack type (REBUT/UNDERCUT/CONCEDE) clearly labeled
- [ ] Panel shows "X/Y answered" summary count
- [ ] Empty state for arguments with no attacks
- [ ] Panel integrates into ArgumentDetailView or expandable section

**Dependencies:** Phase 2.1 (dialogue state API), Task 3.1.1  
**Blocks:** Task 3.1.3

---

#### Task 3.1.3: Response Vote Display

**Priority:** 🟢 Medium  
**Effort:** 2 hours  
**Files:**
- `/components/dialogue/ResponseVoteWidget.tsx` (new)
- `/components/arguments/ArgumentCard.tsx` (integrate widget)

**Current State:**
Phase 2.1 created `ResponseVote` model and API for recording votes on response quality. No UI exists for displaying aggregate votes.

**Implementation:**

```tsx
// /components/dialogue/ResponseVoteWidget.tsx
"use client";
import * as React from "react";
import { ThumbsUp, ThumbsDown, Flag } from "lucide-react";

interface ResponseVoteWidgetProps {
  responseId: string;
  initialVotes?: {
    upvotes: number;
    downvotes: number;
    flags: number;
  };
}

/**
 * Displays aggregate response votes (upvote/downvote/flag counts).
 * Phase 3.1: Response quality visualization.
 */
export function ResponseVoteWidget({
  responseId,
  initialVotes,
}: ResponseVoteWidgetProps) {
  const [votes, setVotes] = React.useState(initialVotes || {
    upvotes: 0,
    downvotes: 0,
    flags: 0,
  });

  React.useEffect(() => {
    if (initialVotes) return;

    const fetchVotes = async () => {
      try {
        const res = await fetch(`/api/responses/${responseId}/votes`);
        if (res.ok) {
          const data = await res.json();
          setVotes(data);
        }
      } catch (err) {
        console.error("Failed to fetch response votes:", err);
      }
    };

    fetchVotes();
  }, [responseId, initialVotes]);

  const netScore = votes.upvotes - votes.downvotes;

  return (
    <div className="inline-flex items-center gap-3 text-xs">
      {/* Upvotes */}
      <div className="flex items-center gap-1 text-green-600">
        <ThumbsUp className="w-3 h-3" />
        <span>{votes.upvotes}</span>
      </div>

      {/* Net Score */}
      <div className={`font-medium ${netScore >= 0 ? "text-green-600" : "text-red-600"}`}>
        {netScore >= 0 ? "+" : ""}{netScore}
      </div>

      {/* Downvotes */}
      <div className="flex items-center gap-1 text-red-600">
        <ThumbsDown className="w-3 h-3" />
        <span>{votes.downvotes}</span>
      </div>

      {/* Flags (if any) */}
      {votes.flags > 0 && (
        <div className="flex items-center gap-1 text-orange-600">
          <Flag className="w-3 h-3" />
          <span>{votes.flags}</span>
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Widget displays upvote/downvote/flag counts
- [ ] Net score calculated and color-coded (green positive, red negative)
- [ ] Flags only shown if > 0
- [ ] Widget integrates into ArgumentCard for GROUNDS responses
- [ ] API call deferred if initialVotes provided (optimization)
- [ ] Compact layout (fits in card footer)

**Dependencies:** Phase 2.1 (ResponseVote model), Task 3.1.2  
**Blocks:** None

---

#### Task 3.1.4: Dialogue State Filter in DiagramViewer

**Priority:** 🟢 Medium  
**Effort:** 1.5 hours  
**Files:**
- `/components/agora/DiagramViewer.tsx` (add filter controls)

**Current State:**
DiagramViewer shows all arguments. No way to filter by dialogue state (e.g., "show only arguments with unanswered attacks").

**Implementation:**

```tsx
// /components/agora/DiagramViewer.tsx (add filter controls)

// New state:
const [dialogueFilter, setDialogueFilter] = React.useState<"all" | "complete" | "incomplete">("all");

// Filter logic:
const filteredArguments = React.useMemo(() => {
  if (dialogueFilter === "all") return arguments;
  
  return arguments.filter((arg) => {
    const state = dialogueStates[arg.id]; // Assume fetched via API
    if (!state) return true;
    
    if (dialogueFilter === "complete") return state.moveComplete;
    if (dialogueFilter === "incomplete") return !state.moveComplete;
    return true;
  });
}, [arguments, dialogueFilter, dialogueStates]);

// UI controls (toolbar):
<div className="flex items-center gap-2">
  <label className="text-xs font-medium text-slate-700">Dialogue State:</label>
  <select
    value={dialogueFilter}
    onChange={(e) => setDialogueFilter(e.target.value as any)}
    className="text-xs border border-slate-300 rounded px-2 py-1"
  >
    <option value="all">All Arguments</option>
    <option value="complete">Complete (all attacks answered)</option>
    <option value="incomplete">Incomplete (pending attacks)</option>
  </select>
</div>
```

**Acceptance Criteria:**
- [ ] Filter dropdown shows "All", "Complete", "Incomplete"
- [ ] Filter applies to diagram nodes (hides/shows based on moveComplete)
- [ ] Filter state persists during session (localStorage)
- [ ] Filter updates in real-time when arguments added/removed
- [ ] Tooltip explains filter options

**Dependencies:** Phase 2.1 (dialogue state API), Task 3.1.1  
**Blocks:** None

---

### 3.2 Temporal Decay UI (3 tasks, 6.5 hours)

Visualize temporal confidence decay with indicators showing argument staleness, decay factors, and configurable decay parameters.

---

#### Task 3.2.1: Stale Argument Indicator Enhancement

**Priority:** 🔴 Critical  
**Effort:** 2.5 hours  
**Files:**
- `/components/arguments/ArgumentCard.tsx` (enhance existing stale indicator)
- `/components/arguments/StaleArgumentBadge.tsx` (new, extracted component)

**Current State:**
Phase 2.2 added basic stale indicator to ArgumentCard (yellow badge if `lastUpdatedAt > 30 days`). Needs enhancement: decay factor display, tooltip with formula, visual decay severity.

**Implementation:**

```tsx
// /components/arguments/StaleArgumentBadge.tsx
"use client";
import * as React from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { daysSinceUpdate, calculateDecayFactor } from "@/lib/confidence/decayConfidence";

interface StaleArgumentBadgeProps {
  lastUpdatedAt: Date | string;
  decayConfig?: {
    halfLife: number;
    minConfidence: number;
  };
}

/**
 * Enhanced stale argument indicator with decay factor display.
 * Phase 3.2: Temporal decay visualization.
 */
export function StaleArgumentBadge({
  lastUpdatedAt,
  decayConfig = { halfLife: 90, minConfidence: 0.1 },
}: StaleArgumentBadgeProps) {
  const date = typeof lastUpdatedAt === "string" ? new Date(lastUpdatedAt) : lastUpdatedAt;
  const days = daysSinceUpdate(date);
  const decayFactor = calculateDecayFactor(days, decayConfig);
  
  // Severity levels
  const severity =
    days > 90 ? "critical" : days > 30 ? "warning" : "normal";

  if (days <= 7) return null; // Don't show for recent arguments

  const severityStyles = {
    critical: {
      icon: AlertTriangle,
      color: "text-red-600 bg-red-50 border-red-200",
      label: "Critically Stale",
    },
    warning: {
      icon: Clock,
      color: "text-yellow-600 bg-yellow-50 border-yellow-200",
      label: "Stale",
    },
    normal: {
      icon: Clock,
      color: "text-slate-600 bg-slate-50 border-slate-200",
      label: "Aging",
    },
  };

  const style = severityStyles[severity];
  const Icon = style.icon;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${style.color}`}
      title={`Last updated ${days} days ago. Decay factor: ${decayFactor.toFixed(2)}× (half-life: ${decayConfig.halfLife} days)`}
    >
      <Icon className="w-3 h-3" />
      <span>{days}d old</span>
      <span className="text-[10px] opacity-75">
        ({(decayFactor * 100).toFixed(0)}%)
      </span>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Badge shows days since last update
- [ ] Badge displays decay factor percentage (e.g., "45%")
- [ ] Three severity levels: normal (7-30d), warning (30-90d), critical (>90d)
- [ ] Tooltip shows formula: "Decay = 0.5^(days / halfLife)"
- [ ] Badge hidden for arguments < 7 days old
- [ ] Configurable halfLife via props

**Dependencies:** Phase 2.2 (decay functions)  
**Blocks:** Task 3.2.2

---

#### Task 3.2.2: Decay Explanation Tooltip

**Priority:** 🟠 High  
**Effort:** 2.5 hours  
**Files:**
- `/components/confidence/DecayExplanationTooltip.tsx` (new)
- `/components/confidence/ConfidenceExplanation.tsx` (integrate decay)

**Current State:**
ConfidenceExplanation component exists (Phase 1) but doesn't include temporal decay in formula breakdown.

**Implementation:**

```tsx
// /components/confidence/DecayExplanationTooltip.tsx
"use client";
import * as React from "react";
import { Info } from "lucide-react";

interface DecayExplanationTooltipProps {
  ageInDays: number;
  decayFactor: number;
  halfLife: number;
  minConfidence: number;
}

/**
 * Tooltip explaining temporal decay formula and parameters.
 * Phase 3.2: User education on temporal reasoning.
 */
export function DecayExplanationTooltip({
  ageInDays,
  decayFactor,
  halfLife,
  minConfidence,
}: DecayExplanationTooltipProps) {
  return (
    <div className="max-w-sm">
      <div className="font-semibold text-sm mb-2">Temporal Decay</div>
      
      <div className="text-xs space-y-2">
        <p>
          Confidence decays over time when arguments lack recent support or updates.
        </p>

        <div className="bg-slate-800 text-white p-2 rounded font-mono text-[10px]">
          decay = 0.5<sup>(age / halfLife)</sup>
          <br />
          decay = 0.5<sup>({ageInDays} / {halfLife})</sup>
          <br />
          decay = {decayFactor.toFixed(3)}
        </div>

        <dl className="space-y-1">
          <div className="flex justify-between">
            <dt className="text-slate-600">Age:</dt>
            <dd className="font-medium">{ageInDays} days</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Half-life:</dt>
            <dd className="font-medium">{halfLife} days</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Min floor:</dt>
            <dd className="font-medium">{(minConfidence * 100).toFixed(0)}%</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Current factor:</dt>
            <dd className="font-medium">{(decayFactor * 100).toFixed(1)}%</dd>
          </div>
        </dl>

        <p className="text-slate-600 italic">
          Tip: Update argument premises or add supporting evidence to reset decay.
        </p>
      </div>
    </div>
  );
}
```

**Integration into ConfidenceExplanation**:

```tsx
// /components/confidence/ConfidenceExplanation.tsx (update formula)

// Add decay term to formula display:
<div className="formula">
  confidence = base × premises × CQ × <span className="text-yellow-600">decay</span> × (1 - undercut) × (1 - rebut)
</div>

// Add decay breakdown section:
{explanation.temporalDecay && (
  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
    <div className="flex items-center gap-2">
      <Info className="w-4 h-4 text-yellow-600" />
      <span className="text-sm font-medium">Temporal Decay Applied</span>
    </div>
    <DecayExplanationTooltip {...explanation.temporalDecay} />
  </div>
)}
```

**Acceptance Criteria:**
- [ ] Tooltip displays decay formula with LaTeX/formatted math
- [ ] Shows age, half-life, min floor, current decay factor
- [ ] Formula explanation uses actual values (not placeholders)
- [ ] Integrates into existing ConfidenceExplanation component
- [ ] Tooltip accessible via info icon or hover
- [ ] "Tip" text explains how to reset decay

**Dependencies:** Phase 2.2 (decay API), Task 3.2.1  
**Blocks:** Task 3.2.3

---

#### Task 3.2.3: Decay Configuration UI in DeliberationSettings

**Priority:** 🟢 Medium  
**Effort:** 1.5 hours  
**Files:**
- `/components/deliberations/DeliberationSettingsPanel.tsx` (add decay config section)

**Current State:**
DeliberationSettingsPanel exists with DS mode toggle and NLI threshold slider (Phase 2.3, 2.5). Missing: decay configuration (halfLife, minConfidence, enable/disable).

**Implementation:**

```tsx
// /components/deliberations/DeliberationSettingsPanel.tsx (add section)

// New state:
const [decayEnabled, setDecayEnabled] = React.useState(true);
const [decayHalfLife, setDecayHalfLife] = React.useState(90);
const [decayMinConfidence, setDecayMinConfidence] = React.useState(0.1);

// API call:
const handleDecayUpdate = async () => {
  // PUT /api/deliberations/[id]/settings
  await fetch(`/api/deliberations/${deliberationId}/settings`, {
    method: "PUT",
    body: JSON.stringify({
      rulesetJson: {
        confidence: {
          temporalDecay: {
            enabled: decayEnabled,
            halfLife: decayHalfLife,
            minConfidence: decayMinConfidence,
          },
        },
      },
    }),
  });
};

// UI (new section after NLI threshold):
<div className="border-t pt-4">
  <h3 className="text-sm font-semibold mb-3">Temporal Decay</h3>

  {/* Enable/Disable Toggle */}
  <div className="flex items-center justify-between mb-3">
    <label className="text-sm">Enable temporal decay</label>
    <input
      type="checkbox"
      checked={decayEnabled}
      onChange={(e) => setDecayEnabled(e.target.checked)}
    />
  </div>

  {decayEnabled && (
    <>
      {/* Half-Life Slider */}
      <div className="mb-3">
        <label className="text-sm">
          Half-life: {decayHalfLife} days
        </label>
        <input
          type="range"
          min="7"
          max="180"
          step="1"
          value={decayHalfLife}
          onChange={(e) => setDecayHalfLife(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Min Confidence Slider */}
      <div className="mb-3">
        <label className="text-sm">
          Min confidence floor: {(decayMinConfidence * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.05"
          value={decayMinConfidence}
          onChange={(e) => setDecayMinConfidence(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    </>
  )}
</div>
```

**Acceptance Criteria:**
- [ ] Toggle to enable/disable decay
- [ ] Half-life slider (7-180 days, default 90)
- [ ] Min confidence slider (0-50%, default 10%)
- [ ] Settings save to `rulesetJson.confidence.temporalDecay`
- [ ] Settings apply immediately to all confidence calculations
- [ ] Tooltip explains what half-life means

**Dependencies:** Phase 2.2 (decay logic), Task 3.2.2  
**Blocks:** None

---

### 3.3 Dempster-Shafer Visualization (3 tasks, 8 hours)

Visualize Dempster-Shafer epistemic intervals with belief/plausibility displays, interval charts, and DS mode toggle integration.

---

#### Task 3.3.1: DS Mode Toggle Integration in DiagramViewer

**Priority:** 🟠 High  
**Effort:** 2.5 hours  
**Files:**
- `/components/agora/DiagramViewer.tsx` (integrate DS mode display)
- `/components/confidence/ConfidenceDisplay.tsx` (add DS interval mode)

**Current State:**
Phase 2.3 added DS mode toggle to DeliberationSettingsPanel and `computeBelief()`/`computePlausibility()` functions. DiagramViewer still only displays single confidence value (not [bel, pl] intervals).

**Implementation:**

```tsx
// /components/agora/DiagramViewer.tsx (fetch DS mode)

const [dsMode, setDsMode] = React.useState(false);

React.useEffect(() => {
  const fetchSettings = async () => {
    const res = await fetch(`/api/deliberations/${deliberationId}/settings`);
    if (res.ok) {
      const data = await res.json();
      setDsMode(data.dsMode ?? false);
    }
  };
  fetchSettings();
}, [deliberationId]);

// Pass dsMode to ConfidenceDisplay components:
<ConfidenceDisplay
  value={confidence}
  dsMode={dsMode}
  belief={argument.belief}
  plausibility={argument.plausibility}
/>
```

```tsx
// /components/confidence/ConfidenceDisplay.tsx (add DS mode)

interface ConfidenceDisplayProps {
  value: number; // Single confidence (standard mode)
  dsMode?: boolean;
  belief?: number; // DS lower bound
  plausibility?: number; // DS upper bound
}

export function ConfidenceDisplay({
  value,
  dsMode = false,
  belief,
  plausibility,
}: ConfidenceDisplayProps) {
  if (dsMode && belief !== undefined && plausibility !== undefined) {
    // DS Mode: Show interval [bel, pl]
    return (
      <div className="flex items-center gap-1 text-xs">
        <span className="text-slate-600">Bel:</span>
        <span className="font-semibold text-green-600">
          {(belief * 100).toFixed(1)}%
        </span>
        <span className="text-slate-400">–</span>
        <span className="text-slate-600">Pl:</span>
        <span className="font-semibold text-blue-600">
          {(plausibility * 100).toFixed(1)}%
        </span>
      </div>
    );
  }

  // Standard Mode: Single confidence
  return (
    <div className="text-xs">
      <span className="text-slate-600">Conf:</span>
      <span className="font-semibold text-indigo-600">
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] DiagramViewer fetches `dsMode` from deliberation settings
- [ ] ConfidenceDisplay shows [bel, pl] interval when dsMode=true
- [ ] Standard confidence shown when dsMode=false
- [ ] Interval visually distinct (different colors for bel vs pl)
- [ ] Tooltip explains "Belief = lower bound, Plausibility = upper bound"
- [ ] Toggle updates all argument displays in real-time

**Dependencies:** Phase 2.3 (DS mode backend), Task 3.2.3  
**Blocks:** Task 3.3.2

---

#### Task 3.3.2: DS Interval Chart Component

**Priority:** 🟠 High  
**Effort:** 3.5 hours  
**Files:**
- `/components/confidence/DSIntervalChart.tsx` (new)
- `/components/arguments/ArgumentDetailView.tsx` (integrate chart)

**Current State:**
DS intervals displayed as text "[0.45, 0.78]" but no visual representation. Chart needed to show uncertainty range.

**Implementation:**

```tsx
// /components/confidence/DSIntervalChart.tsx
"use client";
import * as React from "react";

interface DSIntervalChartProps {
  belief: number; // Lower bound (0-1)
  plausibility: number; // Upper bound (0-1)
  width?: number;
  height?: number;
}

/**
 * Visualizes Dempster-Shafer epistemic interval as a horizontal bar.
 * Phase 3.3: DS mode visualization.
 * 
 * Layout:
 * [====Belief====][~~~Uncertainty~~~][====Disbelief====]
 *  0%            bel                 pl                 100%
 */
export function DSIntervalChart({
  belief,
  plausibility,
  width = 300,
  height = 40,
}: DSIntervalChartProps) {
  const beliefPercent = belief * 100;
  const plausibilityPercent = plausibility * 100;
  const uncertaintyPercent = plausibilityPercent - beliefPercent;
  const disbeliefPercent = 100 - plausibilityPercent;

  return (
    <div className="space-y-2">
      {/* Bar Chart */}
      <div
        className="flex rounded overflow-hidden border border-slate-300"
        style={{ width, height }}
      >
        {/* Belief (green) */}
        {beliefPercent > 0 && (
          <div
            className="bg-green-500 flex items-center justify-center text-white text-xs font-semibold"
            style={{ width: `${beliefPercent}%` }}
            title={`Belief: ${beliefPercent.toFixed(1)}%`}
          >
            {beliefPercent > 10 && `${beliefPercent.toFixed(0)}%`}
          </div>
        )}

        {/* Uncertainty (yellow) */}
        {uncertaintyPercent > 0 && (
          <div
            className="bg-yellow-400 flex items-center justify-center text-slate-800 text-xs font-semibold"
            style={{ width: `${uncertaintyPercent}%` }}
            title={`Uncertainty: ${uncertaintyPercent.toFixed(1)}%`}
          >
            {uncertaintyPercent > 10 && `${uncertaintyPercent.toFixed(0)}%`}
          </div>
        )}

        {/* Disbelief (red) */}
        {disbeliefPercent > 0 && (
          <div
            className="bg-red-500 flex items-center justify-center text-white text-xs font-semibold"
            style={{ width: `${disbeliefPercent}%` }}
            title={`Disbelief: ${disbeliefPercent.toFixed(1)}%`}
          >
            {disbeliefPercent > 10 && `${disbeliefPercent.toFixed(0)}%`}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>Belief: {beliefPercent.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-400 rounded" />
          <span>Uncertainty: {uncertaintyPercent.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span>Disbelief: {disbeliefPercent.toFixed(1)}%</span>
        </div>
      </div>

      {/* Interpretation */}
      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
        {uncertaintyPercent < 10 && (
          <span>✅ <strong>Low uncertainty:</strong> Strong evidence for or against.</span>
        )}
        {uncertaintyPercent >= 10 && uncertaintyPercent < 30 && (
          <span>⚠️ <strong>Moderate uncertainty:</strong> Some conflicting evidence.</span>
        )}
        {uncertaintyPercent >= 30 && (
          <span>❌ <strong>High uncertainty:</strong> Significant conflicting evidence or lack of data.</span>
        )}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Chart displays three segments: belief (green), uncertainty (yellow), disbelief (red)
- [ ] Segment widths proportional to percentages
- [ ] Legend shows exact percentages for each segment
- [ ] Tooltip on hover shows segment name + percentage
- [ ] Interpretation text explains uncertainty level (low/moderate/high)
- [ ] Chart integrates into ArgumentDetailView when dsMode=true

**Dependencies:** Phase 2.3 (DS computation), Task 3.3.1  
**Blocks:** Task 3.3.3

---

#### Task 3.3.3: DS Explanation Tooltip

**Priority:** 🟢 Medium  
**Effort:** 2 hours  
**Files:**
- `/components/confidence/DSExplanationTooltip.tsx` (new)
- `/components/confidence/ConfidenceExplanation.tsx` (integrate DS section)

**Current State:**
ConfidenceExplanation component exists but doesn't explain DS theory or how belief/plausibility are computed.

**Implementation:**

```tsx
// /components/confidence/DSExplanationTooltip.tsx
"use client";
import * as React from "react";
import { Info } from "lucide-react";

interface DSExplanationTooltipProps {
  belief: number;
  plausibility: number;
  masses?: Record<string, number>; // Optional: mass assignments for each premise
}

/**
 * Tooltip explaining Dempster-Shafer theory and belief/plausibility computation.
 * Phase 3.3: User education on DS mode.
 */
export function DSExplanationTooltip({
  belief,
  plausibility,
  masses,
}: DSExplanationTooltipProps) {
  const uncertainty = plausibility - belief;

  return (
    <div className="max-w-md">
      <div className="font-semibold text-sm mb-2">Dempster-Shafer Mode</div>
      
      <div className="text-xs space-y-2">
        <p>
          DS theory represents confidence as an <strong>interval [Bel, Pl]</strong> rather than a single value.
          This captures uncertainty from conflicting or incomplete evidence.
        </p>

        <dl className="space-y-1 bg-slate-800 text-white p-2 rounded">
          <div className="flex justify-between font-mono">
            <dt>Belief (Bel):</dt>
            <dd>{(belief * 100).toFixed(1)}%</dd>
          </div>
          <div className="flex justify-between font-mono">
            <dt>Plausibility (Pl):</dt>
            <dd>{(plausibility * 100).toFixed(1)}%</dd>
          </div>
          <div className="flex justify-between font-mono">
            <dt>Uncertainty:</dt>
            <dd>{(uncertainty * 100).toFixed(1)}%</dd>
          </div>
        </dl>

        <div className="space-y-1">
          <p><strong>Belief:</strong> Minimum confidence based on supporting evidence only.</p>
          <p><strong>Plausibility:</strong> Maximum confidence assuming uncertain evidence supports the claim.</p>
          <p><strong>Uncertainty:</strong> Range between Bel and Pl, representing conflicting or missing evidence.</p>
        </div>

        {masses && Object.keys(masses).length > 0 && (
          <div className="mt-2">
            <p className="font-medium mb-1">Mass Assignments:</p>
            <ul className="text-[10px] space-y-0.5 font-mono">
              {Object.entries(masses).map(([premise, mass]) => (
                <li key={premise}>
                  m({premise}) = {mass.toFixed(3)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-slate-300 italic mt-2">
          DS mode is useful when dealing with expert opinions, sensor data, or arguments with varying reliability.
        </p>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Tooltip explains DS theory basics (intervals, uncertainty)
- [ ] Displays Bel, Pl, and Uncertainty values
- [ ] Explains what each value represents (minimum/maximum confidence)
- [ ] Optionally shows mass assignments for premises
- [ ] Integrates into ConfidenceExplanation component
- [ ] Accessible via info icon when dsMode=true

**Dependencies:** Phase 2.3 (DS computation), Task 3.3.2  
**Blocks:** None

---

### 3.4 Assumption Management UI (4 tasks, 9 hours)

Build comprehensive UI for managing AssumptionUse lifecycle: creation, tracking, acceptance/retraction/challenge actions, and active assumptions panel.

---

#### Task 3.4.1: AssumptionCard Lifecycle Actions

**Priority:** 🔴 Critical  
**Effort:** 2.5 hours  
**Files:**
- `/components/assumptions/AssumptionCard.tsx` (add action buttons)

**Current State:**
Phase 2.6 created basic AssumptionCard component but Phase 2.4 created lifecycle APIs (accept/retract/challenge). Need to wire action buttons to these APIs.

**Implementation:**

```tsx
// /components/assumptions/AssumptionCard.tsx (add action buttons)

const [status, setStatus] = React.useState(assumption.status);
const [loading, setLoading] = React.useState(false);

const handleAction = async (action: "accept" | "retract" | "challenge") => {
  setLoading(true);
  try {
    const res = await fetch(`/api/assumptions/${assumption.id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUserId,
        reason: action === "challenge" ? "User-initiated challenge" : undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setStatus(data.status);
      onUpdate?.(data); // Notify parent component
    }
  } catch (err) {
    console.error(`Failed to ${action} assumption:`, err);
  } finally {
    setLoading(false);
  }
};

// Action buttons (conditionally shown based on status):
<div className="flex items-center gap-2 mt-3">
  {status === "proposed" && (
    <>
      <button
        onClick={() => handleAction("accept")}
        disabled={loading}
        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
      >
        Accept
      </button>
      <button
        onClick={() => handleAction("challenge")}
        disabled={loading}
        className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 disabled:opacity-50"
      >
        Challenge
      </button>
    </>
  )}

  {status === "accepted" && (
    <button
      onClick={() => handleAction("retract")}
      disabled={loading}
      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
    >
      Retract
    </button>
  )}

  {status === "challenged" && (
    <button
      onClick={() => handleAction("accept")}
      disabled={loading}
      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
    >
      Accept (Override Challenge)
    </button>
  )}

  {/* Status Badge */}
  <div className={`ml-auto px-2 py-1 rounded text-xs font-medium ${
    status === "accepted" ? "bg-green-100 text-green-700" :
    status === "retracted" ? "bg-red-100 text-red-700" :
    status === "challenged" ? "bg-yellow-100 text-yellow-700" :
    "bg-slate-100 text-slate-700"
  }`}>
    {status.toUpperCase()}
  </div>
</div>
```

**Acceptance Criteria:**
- [ ] "Accept" button shown for proposed/challenged assumptions
- [ ] "Challenge" button shown for proposed assumptions
- [ ] "Retract" button shown for accepted assumptions
- [ ] Buttons disabled during API call (loading state)
- [ ] Status badge updates immediately after action
- [ ] Parent component notified via onUpdate callback
- [ ] Error handling displays toast notification

**Dependencies:** Phase 2.4 (lifecycle APIs)  
**Blocks:** Task 3.4.2

---

#### Task 3.4.2: Active Assumptions Panel

**Priority:** 🔴 Critical  
**Effort:** 3 hours  
**Files:**
- `/components/assumptions/ActiveAssumptionsPanel.tsx` (new)
- `/app/(authenticated)/deliberations/[id]/assumptions/page.tsx` (new route)

**Current State:**
Phase 2.4 created `/api/deliberations/[id]/assumptions/active` API to fetch active assumptions. No UI panel exists to display them.

**Implementation:**

```tsx
// /components/assumptions/ActiveAssumptionsPanel.tsx
"use client";
import * as React from "react";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { AssumptionCard } from "./AssumptionCard";

interface ActiveAssumptionsPanelProps {
  deliberationId: string;
}

/**
 * Displays all active (accepted) assumptions for a deliberation.
 * Phase 3.4: Assumption lifecycle management UI.
 */
export function ActiveAssumptionsPanel({
  deliberationId,
}: ActiveAssumptionsPanelProps) {
  const [assumptions, setAssumptions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAssumptions = async () => {
      try {
        const res = await fetch(`/api/deliberations/${deliberationId}/assumptions/active`);
        if (res.ok) {
          const data = await res.json();
          setAssumptions(data.assumptions);
        }
      } catch (err) {
        console.error("Failed to fetch assumptions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssumptions();
  }, [deliberationId]);

  const handleAssumptionUpdate = (updatedAssumption: any) => {
    setAssumptions((prev) =>
      prev.map((a) => (a.id === updatedAssumption.id ? updatedAssumption : a))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (assumptions.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 rounded-lg border border-slate-200">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-600">
          No active assumptions in this deliberation.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Assumptions are propositions accepted for the sake of argument.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Active Assumptions ({assumptions.length})
        </h3>
        <div className="text-xs text-slate-500">
          These assumptions are currently accepted in this deliberation
        </div>
      </div>

      <div className="grid gap-3">
        {assumptions.map((assumption) => (
          <AssumptionCard
            key={assumption.id}
            assumption={assumption}
            onUpdate={handleAssumptionUpdate}
          />
        ))}
      </div>
    </div>
  );
}
```

**Page Route**:

```tsx
// /app/(authenticated)/deliberations/[id]/assumptions/page.tsx
import { ActiveAssumptionsPanel } from "@/components/assumptions/ActiveAssumptionsPanel";

export default function AssumptionsPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Assumption Management</h1>
        <p className="text-sm text-slate-600 mt-1">
          View and manage assumptions accepted in this deliberation
        </p>
      </div>

      <ActiveAssumptionsPanel deliberationId={params.id} />
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Panel fetches and displays all active assumptions
- [ ] Empty state when no assumptions exist
- [ ] Each assumption shows status badge (ACCEPTED/CHALLENGED/RETRACTED)
- [ ] Panel updates when assumption status changes
- [ ] Loading state shows spinner
- [ ] Panel accessible via deliberation navigation menu
- [ ] Route `/deliberations/[id]/assumptions` created

**Dependencies:** Phase 2.4 (active assumptions API), Task 3.4.1  
**Blocks:** Task 3.4.3

---

#### Task 3.4.3: Assumption Dependency Graph

**Priority:** 🟢 Medium  
**Effort:** 2.5 hours  
**Files:**
- `/components/assumptions/AssumptionDependencyGraph.tsx` (new)

**Current State:**
Arguments can depend on assumptions, but no visualization exists to show which arguments rely on which assumptions.

**Implementation:**

```tsx
// /components/assumptions/AssumptionDependencyGraph.tsx
"use client";
import * as React from "react";
import { ArrowRight } from "lucide-react";

interface AssumptionDependencyGraphProps {
  deliberationId: string;
  assumptionId: string;
}

/**
 * Visualizes which arguments depend on a specific assumption.
 * Phase 3.4: Assumption impact analysis.
 */
export function AssumptionDependencyGraph({
  deliberationId,
  assumptionId,
}: AssumptionDependencyGraphProps) {
  const [dependentArguments, setDependentArguments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDependencies = async () => {
      try {
        // Query arguments that reference this assumption
        const res = await fetch(
          `/api/arguments?deliberationId=${deliberationId}&assumptionId=${assumptionId}`
        );
        if (res.ok) {
          const data = await res.json();
          setDependentArguments(data.arguments);
        }
      } catch (err) {
        console.error("Failed to fetch dependencies:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDependencies();
  }, [deliberationId, assumptionId]);

  if (loading) return <div className="text-xs text-slate-400">Loading dependencies...</div>;

  if (dependentArguments.length === 0) {
    return (
      <div className="text-xs text-slate-500 italic">
        No arguments depend on this assumption yet.
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
      <div className="text-xs font-semibold text-blue-700 mb-2">
        Dependent Arguments ({dependentArguments.length})
      </div>
      <div className="space-y-1">
        {dependentArguments.map((arg) => (
          <div
            key={arg.id}
            className="flex items-center gap-2 text-xs text-slate-700"
          >
            <ArrowRight className="w-3 h-3 text-blue-500" />
            <span className="font-medium">{arg.title}</span>
            <span className="text-slate-500">
              (conf: {(arg.confidence * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-slate-600 mt-2 italic">
        ⚠️ Retracting this assumption will affect all dependent arguments.
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Graph shows all arguments that depend on assumption
- [ ] Each argument displays title and current confidence
- [ ] Warning shown if assumption has dependents
- [ ] Empty state for assumptions with no dependents
- [ ] Clicking argument navigates to ArgumentDetailView
- [ ] Graph updates when arguments are added/removed

**Dependencies:** Phase 2.4 (AssumptionUse model), Task 3.4.2  
**Blocks:** Task 3.4.4

---

#### Task 3.4.4: Assumption Creation Form

**Priority:** 🟠 High  
**Effort:** 1 hour  
**Files:**
- `/components/assumptions/CreateAssumptionForm.tsx` (new)
- `/components/assumptions/ActiveAssumptionsPanel.tsx` (integrate form)

**Current State:**
Phase 2.4 created backend for assumption lifecycle but no UI form exists to create new assumptions.

**Implementation:**

```tsx
// /components/assumptions/CreateAssumptionForm.tsx
"use client";
import * as React from "react";
import { Plus } from "lucide-react";

interface CreateAssumptionFormProps {
  deliberationId: string;
  onCreated?: (assumption: any) => void;
}

/**
 * Form for creating new assumptions (propositions accepted for argument's sake).
 * Phase 3.4: Assumption lifecycle UI.
 */
export function CreateAssumptionForm({
  deliberationId,
  onCreated,
}: CreateAssumptionFormProps) {
  const [content, setContent] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Assumption content is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/assumptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliberationId,
          content: content.trim(),
          description: description.trim() || undefined,
          status: "proposed",
        }),
      });

      if (res.ok) {
        const assumption = await res.json();
        setContent("");
        setDescription("");
        onCreated?.(assumption);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create assumption");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      <h4 className="text-sm font-semibold mb-3">Create New Assumption</h4>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-700">
            Assumption Content *
          </label>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g., We assume all participants act in good faith"
            className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional context or justification..."
            rows={2}
            className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {loading ? "Creating..." : "Create Assumption"}
        </button>
      </div>
    </form>
  );
}
```

**Acceptance Criteria:**
- [ ] Form has content field (required) and description field (optional)
- [ ] Submit button disabled during API call
- [ ] Error message displayed if creation fails
- [ ] Form clears after successful creation
- [ ] New assumption appears in ActiveAssumptionsPanel immediately
- [ ] Form validates content is not empty
- [ ] Placeholder text guides user input

**Dependencies:** Phase 2.4 (assumption creation API), Task 3.4.2  
**Blocks:** None

---

### 3.5 Hom-Set Analysis Display (3 tasks, 5 hours)

Integrate hom-set confidence visualization, showing aggregate metrics and morphism analysis for categorical argument structure.

---

#### Task 3.5.1: HomSetConfidencePanel Integration

**Priority:** 🟢 Medium  
**Effort:** 1.5 hours  
**Files:**
- `/components/arguments/ArgumentDetailView.tsx` (integrate panel)
- `/components/agora/HomSetConfidencePanel.tsx` (minor updates)

**Current State:**
Phase 2.6 created HomSetConfidencePanel component but it's not integrated into any views. Need to add it to ArgumentDetailView.

**Implementation:**

```tsx
// /components/arguments/ArgumentDetailView.tsx (add hom-set section)

// Import panel:
import { HomSetConfidencePanel } from "@/components/agora/HomSetConfidencePanel";

// Add section after confidence display:
<div className="mt-6">
  <h3 className="text-sm font-semibold text-slate-700 mb-3">
    Categorical Analysis
  </h3>
  <HomSetConfidencePanel
    argumentId={argument.id}
    deliberationId={argument.deliberationId}
  />
</div>
```

**Acceptance Criteria:**
- [ ] Panel appears in ArgumentDetailView below main content
- [ ] Panel shows aggregate hom-set confidence
- [ ] Panel displays incoming/outgoing morphisms
- [ ] Panel hidden if no edges exist (empty state)
- [ ] Panel collapsible to save space
- [ ] Loading state shows spinner while fetching data

**Dependencies:** Phase 2.6 (HomSetConfidencePanel component)  
**Blocks:** Task 3.5.2

---

#### Task 3.5.2: Morphism Visualization Cards

**Priority:** 🟢 Medium  
**Effort:** 2 hours  
**Files:**
- `/components/agora/MorphismCard.tsx` (new)
- `/components/agora/HomSetConfidencePanel.tsx` (use MorphismCard)

**Current State:**
HomSetConfidencePanel lists morphisms as plain text. Need richer cards showing edge type, confidence, source/target arguments.

**Implementation:**

```tsx
// /components/agora/MorphismCard.tsx
"use client";
import * as React from "react";
import { ArrowRight, Shield, Slash, ThumbsDown, HandShake } from "lucide-react";

interface MorphismCardProps {
  morphism: {
    id: string;
    sourceArgumentId: string;
    targetArgumentId: string;
    edgeType: "support" | "rebut" | "undercut" | "concede";
    confidence: number;
    sourceTitle?: string;
    targetTitle?: string;
  };
  direction: "incoming" | "outgoing";
}

/**
 * Displays a single morphism (edge) with edge type icon and confidence.
 * Phase 3.5: Categorical hom-set visualization.
 */
export function MorphismCard({ morphism, direction }: MorphismCardProps) {
  const edgeIcons = {
    support: { Icon: Shield, color: "text-green-600 bg-green-50 border-green-200" },
    rebut: { Icon: Slash, color: "text-red-600 bg-red-50 border-red-200" },
    undercut: { Icon: ThumbsDown, color: "text-orange-600 bg-orange-50 border-orange-200" },
    concede: { Icon: HandShake, color: "text-blue-600 bg-blue-50 border-blue-200" },
  };

  const { Icon, color } = edgeIcons[morphism.edgeType];
  const otherArgTitle =
    direction === "incoming" ? morphism.sourceTitle : morphism.targetTitle;

  return (
    <div className={`flex items-center gap-3 p-2 rounded border ${color}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase">
            {morphism.edgeType}
          </span>
          {direction === "incoming" && <ArrowRight className="w-3 h-3 text-slate-400" />}
        </div>
        <div className="text-xs text-slate-600 truncate">
          {direction === "incoming" ? "from" : "to"} "{otherArgTitle}"
        </div>
      </div>

      <div className="text-xs font-semibold">
        {(morphism.confidence * 100).toFixed(0)}%
      </div>
    </div>
  );
}
```

**Update HomSetConfidencePanel**:

```tsx
// Use MorphismCard instead of plain list:
<div className="space-y-2">
  <h4 className="text-xs font-medium text-slate-700">Incoming Morphisms</h4>
  {incomingMorphisms.map((m) => (
    <MorphismCard key={m.id} morphism={m} direction="incoming" />
  ))}
</div>

<div className="space-y-2 mt-4">
  <h4 className="text-xs font-medium text-slate-700">Outgoing Morphisms</h4>
  {outgoingMorphisms.map((m) => (
    <MorphismCard key={m.id} morphism={m} direction="outgoing" />
  ))}
</div>
```

**Acceptance Criteria:**
- [ ] Cards display edge type with appropriate icon (support/rebut/undercut/concede)
- [ ] Cards color-coded by edge type (green/red/orange/blue)
- [ ] Cards show source/target argument title (truncated if long)
- [ ] Cards display morphism confidence percentage
- [ ] Direction indicator (incoming vs outgoing)
- [ ] Cards clickable to navigate to related argument

**Dependencies:** Phase 2.6 (hom-set API), Task 3.5.1  
**Blocks:** Task 3.5.3

---

#### Task 3.5.3: Aggregate Confidence Comparison

**Priority:** 🟢 Medium  
**Effort:** 1.5 hours  
**Files:**
- `/components/agora/HomSetComparisonChart.tsx` (new)

**Current State:**
Hom-set aggregate confidence computed for single argument. No way to compare multiple arguments' hom-set structures.

**Implementation:**

```tsx
// /components/agora/HomSetComparisonChart.tsx
"use client";
import * as React from "react";

interface HomSetComparisonChartProps {
  arguments: Array<{
    id: string;
    title: string;
    homSetConfidence: number;
    incomingCount: number;
    outgoingCount: number;
  }>;
}

/**
 * Compares hom-set aggregate confidence across multiple arguments.
 * Phase 3.5: Categorical analysis comparison.
 */
export function HomSetComparisonChart({
  arguments: args,
}: HomSetComparisonChartProps) {
  // Sort by confidence descending
  const sorted = [...args].sort((a, b) => b.homSetConfidence - a.homSetConfidence);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Hom-Set Confidence Comparison</h4>
      
      <div className="space-y-2">
        {sorted.map((arg, index) => {
          const barWidth = (arg.homSetConfidence * 100).toFixed(0);
          
          return (
            <div key={arg.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">#{index + 1}</span>
                  <span className="truncate max-w-[200px]">{arg.title}</span>
                </div>
                <span className="font-semibold text-indigo-600">
                  {(arg.homSetConfidence * 100).toFixed(1)}%
                </span>
              </div>

              {/* Bar */}
              <div className="w-full bg-slate-100 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-end px-2"
                  style={{ width: `${barWidth}%` }}
                >
                  {parseFloat(barWidth) > 20 && (
                    <span className="text-white text-[10px] font-semibold">
                      {barWidth}%
                    </span>
                  )}
                </div>
              </div>

              {/* Edge counts */}
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span>↓ {arg.incomingCount} incoming</span>
                <span>↑ {arg.outgoingCount} outgoing</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Chart compares hom-set confidence across multiple arguments
- [ ] Arguments sorted by confidence (highest first)
- [ ] Bar chart visualizes relative confidence levels
- [ ] Shows incoming/outgoing edge counts
- [ ] Clicking bar navigates to argument detail
- [ ] Chart updates when arguments change

**Dependencies:** Phase 2.6 (hom-set computation), Task 3.5.2  
**Blocks:** None

---

### 3.6 Testing & Documentation (3 tasks, 5 hours)

Ensure code quality, test coverage, and user-facing documentation for all Phase 3 features.

---

#### Task 3.6.1: Unit Tests for UI Components

**Priority:** 🔴 Critical  
**Effort:** 2 hours  
**Files:**
- `/components/dialogue/__tests__/DialogueStateBadge.test.tsx` (new)
- `/components/assumptions/__tests__/AssumptionCard.test.tsx` (new)
- `/components/confidence/__tests__/DSIntervalChart.test.tsx` (new)
- `/components/agora/__tests__/HomSetConfidencePanel.test.tsx` (new)

**Current State:**
No unit tests exist for Phase 3 UI components. Need comprehensive test coverage.

**Implementation:**

```tsx
// /components/dialogue/__tests__/DialogueStateBadge.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { DialogueStateBadge } from "../DialogueStateBadge";

describe("DialogueStateBadge", () => {
  it("displays complete status when all attacks answered", () => {
    render(
      <DialogueStateBadge
        deliberationId="delib123"
        argumentId="arg456"
        initialState={{
          totalAttacks: 3,
          answeredAttacks: 3,
          moveComplete: true,
        }}
      />
    );

    expect(screen.getByText("3/3")).toBeInTheDocument();
    expect(screen.getByTitle("3/3 attacks answered")).toBeInTheDocument();
  });

  it("displays partial status when some attacks answered", () => {
    render(
      <DialogueStateBadge
        deliberationId="delib123"
        argumentId="arg456"
        initialState={{
          totalAttacks: 5,
          answeredAttacks: 2,
          moveComplete: false,
        }}
      />
    );

    expect(screen.getByText("2/5")).toBeInTheDocument();
  });

  it("fetches dialogue state if not provided", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            state: { totalAttacks: 1, answeredAttacks: 0, moveComplete: false },
          }),
      })
    ) as jest.Mock;

    render(
      <DialogueStateBadge deliberationId="delib123" argumentId="arg456" />
    );

    await waitFor(() => {
      expect(screen.getByText("0/1")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/deliberations/delib123/dialogue-state?argumentId=arg456"
    );
  });
});
```

**Additional Test Files**:
- AssumptionCard: Test lifecycle actions (accept/retract/challenge)
- DSIntervalChart: Test segment widths, colors, legend accuracy
- HomSetConfidencePanel: Test aggregate computation, morphism display
- StaleArgumentBadge: Test decay factor calculation, severity levels

**Acceptance Criteria:**
- [ ] All Phase 3 components have unit tests
- [ ] Test coverage > 80% for new components
- [ ] Tests cover: rendering, user interactions, API calls, error states
- [ ] Tests use React Testing Library + Jest
- [ ] Mocks for fetch API calls
- [ ] Tests run via `npm run test` without errors

**Dependencies:** All Phase 3 tasks  
**Blocks:** Task 3.6.2

---

#### Task 3.6.2: Integration Tests for User Workflows

**Priority:** 🟠 High  
**Effort:** 2 hours  
**Files:**
- `/tests/integration/dialogue-workflow.test.ts` (new)
- `/tests/integration/assumption-lifecycle.test.ts` (new)
- `/tests/integration/ds-mode-toggle.test.ts` (new)

**Current State:**
No integration tests for multi-step workflows. Need E2E-style tests for key user journeys.

**Implementation:**

```typescript
// /tests/integration/assumption-lifecycle.test.ts
import { test, expect } from "@playwright/test";

test.describe("Assumption Lifecycle Workflow", () => {
  test("user can create, accept, and retract an assumption", async ({ page }) => {
    // 1. Navigate to deliberation assumptions page
    await page.goto("/deliberations/test-delib-123/assumptions");

    // 2. Create new assumption
    await page.fill('input[placeholder*="assumption"]', "Test assumption content");
    await page.click('button:has-text("Create Assumption")');

    // 3. Wait for assumption card to appear
    await page.waitForSelector('text=Test assumption content');

    // 4. Verify status is PROPOSED
    expect(await page.textContent('[class*="status-badge"]')).toContain("PROPOSED");

    // 5. Click Accept button
    await page.click('button:has-text("Accept")');

    // 6. Wait for status update
    await page.waitForSelector('text=ACCEPTED');

    // 7. Verify Accept button replaced with Retract button
    expect(await page.isVisible('button:has-text("Retract")')).toBeTruthy();

    // 8. Click Retract button
    await page.click('button:has-text("Retract")');

    // 9. Verify status changed to RETRACTED
    await page.waitForSelector('text=RETRACTED');
  });
});
```

**Additional Test Files**:
- dialogue-workflow.test.ts: Create argument → Add attack → Add GROUNDS response → Verify badge updates
- ds-mode-toggle.test.ts: Enable DS mode → Verify confidence display changes to [bel, pl] intervals
- hom-set-analysis.test.ts: View argument detail → Verify hom-set panel displays aggregate confidence

**Acceptance Criteria:**
- [ ] Integration tests cover key user workflows
- [ ] Tests use Playwright for browser automation
- [ ] Tests run against local dev server
- [ ] Tests verify API + UI integration
- [ ] Tests check: navigation, form submission, status updates, data persistence
- [ ] Tests run via `npm run test:integration` (new script)

**Dependencies:** Task 3.6.1  
**Blocks:** Task 3.6.3

---

#### Task 3.6.3: User Documentation

**Priority:** 🟠 High  
**Effort:** 1 hour  
**Files:**
- `/docs/user-guide/dialogue-tracking.md` (new)
- `/docs/user-guide/temporal-decay.md` (new)
- `/docs/user-guide/dempster-shafer-mode.md` (new)
- `/docs/user-guide/assumptions.md` (new)
- `/docs/user-guide/hom-set-analysis.md` (new)

**Current State:**
No user-facing documentation for Phase 3 features. Users need guides to understand new capabilities.

**Implementation:**

```markdown
# Dialogue Tracking

## Overview
Dialogue tracking helps you monitor which attacks on your arguments have been answered with GROUNDS responses. This ensures all challenges are addressed in your deliberation.

## Features

### Dialogue State Badge
Each argument displays a badge showing how many attacks have been answered:
- ✅ **Green (Complete)**: All attacks answered
- ⏱️ **Yellow (Partial)**: Some attacks answered
- ❌ **Red (Pending)**: No attacks answered yet

### Answered Attacks Panel
View a detailed list of all attacks on an argument:
1. Navigate to an argument's detail view
2. Scroll to "Attacks & Responses" section
3. See which attacks have GROUNDS responses

### Response Votes
Community members can vote on response quality:
- 👍 Upvote: Good response
- 👎 Downvote: Weak response
- 🚩 Flag: Inappropriate or off-topic

## Best Practices
- Aim for "Complete" status (all attacks answered)
- Prioritize high-confidence attacks first
- Use response votes to identify weak responses
- Regularly check dialogue state to stay on top of challenges

## See Also
- [Argumentation Schemes](./schemes.md)
- [Critical Questions](./critical-questions.md)
```

**Additional Documentation Files**:
- temporal-decay.md: Explain decay formula, staleness, how to reset decay
- dempster-shafer-mode.md: Explain DS theory, intervals, uncertainty
- assumptions.md: How to create/accept/retract assumptions, dependency graphs
- hom-set-analysis.md: Categorical perspective, aggregate confidence, morphism visualization

**Acceptance Criteria:**
- [ ] Documentation covers all Phase 3 features
- [ ] Guides include screenshots/diagrams (use placeholders if needed)
- [ ] "Getting Started" section for each feature
- [ ] "Best Practices" section with tips
- [ ] Cross-references to related features
- [ ] Documentation accessible via in-app help links
- [ ] Markdown formatted, spell-checked, proofread

**Dependencies:** All Phase 3 tasks  
**Blocks:** None

---

## 📊 Phase 3 Summary

**Total Tasks:** 20  
**Estimated Effort:** 42.5 hours (4-6 weeks with other work)  
**Critical Path:** 3.1.1 → 3.2.1 → 3.3.1 → 3.4.1 → 3.6.1 (dialogue → decay → DS → assumptions → tests)

**Deliverables:**
- ✅ Dialogue state visualization (badges, panels, filters)
- ✅ Temporal decay UI (stale indicators, tooltips, config)
- ✅ Dempster-Shafer visualization (intervals, charts, explanations)
- ✅ Assumption management UI (lifecycle actions, panels, dependency graphs)
- ✅ Hom-set analysis display (panels, morphism cards, comparisons)
- ✅ Comprehensive testing (unit + integration tests)
- ✅ User documentation (5 feature guides)

**Success Metrics:**
- All Phase 2 backend features exposed in UI
- < 2s load time for all new components
- Test coverage > 80% for new components
- Zero TypeScript/lint errors
- User documentation complete (5 guides)
- Accessibility compliance (WCAG AA)
- Positive user feedback on feature usability

---

## 🔗 Dependencies

**Depends On:**
- Phase 2 complete (all backend APIs ready)

**Blocks:**
- Phase 4 (advanced features: real-time updates, collaborative editing)
- Phase 5 (DDF protocol integration)
- User onboarding flows (need UI complete first)

---

## 🎯 Acceptance Criteria (Phase 3 Complete)

- [ ] All 20 tasks completed and validated
- [ ] DialogueStateBadge displays on all arguments
- [ ] AnsweredAttacksPanel shows attack/response mapping
- [ ] StaleArgumentBadge indicates temporal decay
- [ ] DS mode toggle changes confidence display to intervals
- [ ] DSIntervalChart visualizes uncertainty range
- [ ] AssumptionCard lifecycle actions work (accept/retract/challenge)
- [ ] ActiveAssumptionsPanel lists all accepted assumptions
- [ ] AssumptionDependencyGraph shows argument dependencies
- [ ] HomSetConfidencePanel displays aggregate metrics
- [ ] MorphismCard visualizes individual edges with icons
- [ ] HomSetComparisonChart compares multiple arguments
- [ ] Unit tests pass with >80% coverage
- [ ] Integration tests validate user workflows
- [ ] User documentation complete (5 guides)
- [ ] npm run lint: zero errors
- [ ] npm run build: successful compilation
- [ ] Accessibility audit: WCAG AA compliance
- [ ] Performance audit: all components < 2s load time

---

## 📝 Notes

**Parallel Work Opportunities:**
- 3.1 (Dialogue) and 3.2 (Decay) independent → can parallelize
- 3.3 (DS) and 3.4 (Assumptions) independent → can parallelize
- 3.5 (Hom-set) can start after 3.4 completes
- 3.6 (Testing) should wait for all features complete

**Risk Mitigation:**
- DS visualization complex → allocate extra time for polish
- Assumption dependency graph may have performance issues with many arguments → implement pagination
- Hom-set queries expensive → ensure proper caching (backend already handles this)
- Integration tests brittle → use data-testid attributes for stable selectors

**Future Enhancements (Not in Phase 3):**
- Real-time confidence updates (Phase 4)
- Collaborative assumption voting (Phase 4)
- Advanced hom-set filtering (edge type, confidence range)
- Dialogue state analytics dashboard
- Export dialogue transcripts to PDF
- Assumption version history

**Performance Considerations:**
- Use React.memo for expensive renders (DSIntervalChart, HomSetComparisonChart)
- Debounce API calls in sliders (NLI threshold, decay config)
- Lazy load HomSetConfidencePanel (only fetch on expand)
- Cache dialogue state for 60s to reduce API calls
- Paginate assumption lists if > 50 items

**Accessibility Checklist:**
- All interactive elements keyboard navigable
- ARIA labels on all icons/buttons
- Color not the only indicator (use icons + text)
- Tooltips dismissible with ESC key
- Form errors announced to screen readers
- Focus management in modals/panels

---

**Ready to Start?** [Task 3.1.1: Dialogue State Badge →](#task-311-dialogue-state-badge-component)

