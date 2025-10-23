# GROUNDS Visual Flow Diagram

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ClaimMiniMap.tsx                                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Claim Row                                                          │  │
│  │                                                                    │  │
│  │  [IN] "Climate change is caused by humans"                        │  │
│  │  +5 −2 CQ 75% expert ?2 G:1 [CQs] [Moves]                        │  │
│  │                       ↑   ↑    ↑    ↑                             │  │
│  │                       │   │    │    └─ Opens CriticalQuestions    │  │
│  │                       │   │    └────── 1 GROUNDS response         │  │
│  │                       │   └─────────── 2 WHY challenges           │  │
│  │                       └─────────────── CQ satisfaction: 75%        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                   │                                      │
│                                   │ User clicks [CQs]                    │
│                                   ↓                                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Dialog Modal                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │         CriticalQuestions Component                         │  │  │
│  │  │                                                             │  │  │
│  │  │  Scheme: Argument from Expert Opinion                      │  │  │
│  │  │                                                             │  │  │
│  │  │  [ ] E1: Is the expert qualified in relevant field?        │  │  │
│  │  │      [Show Moves] [Attach]                                 │  │  │
│  │  │      ┌───────────────────────────────────────────────────┐ │  │  │
│  │  │      │ Legal Moves Panel (LegalMoveChips)               │ │  │  │
│  │  │      │  [Answer E1] [CONCEDE] [RETRACT]                 │ │  │  │
│  │  │      └───────────────────────────────────────────────────┘ │  │  │
│  │  │      ┌───────────────────────────────────────────────────┐ │  │  │
│  │  │      │ Inline Grounds Input                             │ │  │  │
│  │  │      │  [Type grounds here...] [Post grounds] [Clear]   │ │  │  │
│  │  │      └───────────────────────────────────────────────────┘ │  │  │
│  │  │                                                             │  │  │
│  │  │  [ ] E2: Does the expert have conflicts of interest?       │  │  │
│  │  │      ...                                                    │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Dialogue Flow Timeline

```
Time  │ Actor      │ Move        │ Target      │ cqId │ Content
──────┼────────────┼─────────────┼─────────────┼──────┼──────────────────────────
T0    │ Proponent  │ ASSERT      │ claim_xyz   │  -   │ "The expert is reliable"
      │            │             │             │      │
T1    │ Opponent   │ WHY         │ claim_xyz   │  E1  │ (Challenges qualification)
      │            │ ─────────┐  │             │      │
      │            │          │  │             │      │
      │            │          │  │             │      │
      │     ┌──────┘          │  │             │      │
      │     │ Open WHY        │  │             │      │
      │     │ Waiting for     │  │             │      │
      │     │ GROUNDS         │  │             │      │
      │     └──────┐          │  │             │      │
      │            │          │  │             │      │
T2    │ Proponent  │ GROUNDS ←───┘ claim_xyz   │  E1  │ "Dr. Smith has 20 years
      │            │             │             │      │  experience in climate
      │            │             │             │      │  science"
      │            │             │             │      │
      │            │ ✅ Paired   │             │      │
      │            │   by cqId   │             │      │
```

## API Call Sequence

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│  Client  │                 │   API    │                 │    DB    │
│  (UI)    │                 │  Server  │                 │ (Prisma) │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │ 1. POST /api/dialogue/move │                            │
     │    kind: "WHY"             │                            │
     │    payload: {cqId: "E1"}   │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ INSERT DialogicalMove      │
     │                            │ kind='WHY', cqId='E1'      │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │<───────────────────────────┤
     │    200 OK                  │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │ 2. GET /api/dialogue/      │                            │
     │    legal-moves             │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ SELECT DialogicalMove      │
     │                            │ WHERE kind IN              │
     │                            │   ('WHY','GROUNDS')        │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │ Returns:                   │
     │                            │ - WHY (cqId=E1, no GROUNDS)│
     │                            │<───────────────────────────┤
     │                            │                            │
     │                            │ Computes:                  │
     │                            │ - openKeys = ['E1']        │
     │                            │ - moves = [                │
     │                            │     {kind:'GROUNDS',       │
     │                            │      label:'Answer E1',    │
     │                            │      payload:{cqId:'E1'}}  │
     │                            │   ]                        │
     │    200 OK + moves          │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │ 3. User clicks "Answer E1" │                            │
     │    (enters text in prompt) │                            │
     │                            │                            │
     │ 4. POST /api/dialogue/move │                            │
     │    kind: "GROUNDS"         │                            │
     │    payload: {              │                            │
     │      cqId: "E1",           │                            │
     │      expression: "Dr..."   │                            │
     │    }                       │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ INSERT DialogicalMove      │
     │                            │ kind='GROUNDS', cqId='E1'  │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │<───────────────────────────┤
     │    200 OK                  │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │ 5. Event: dialogue:moves:  │                            │
     │    refresh                 │                            │
     │ ──────────────────────────>│                            │
     │    (triggers SWR mutate)   │                            │
     │                            │                            │
     │ 6. GET /api/dialogue/      │                            │
     │    legal-moves (again)     │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ SELECT DialogicalMove      │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │ Returns:                   │
     │                            │ - WHY (cqId=E1)            │
     │                            │ - GROUNDS (cqId=E1) ✅     │
     │                            │<───────────────────────────┤
     │                            │                            │
     │                            │ Computes:                  │
     │                            │ - openKeys = [] (empty)    │
     │                            │ - WHY is now answered      │
     │    200 OK + moves          │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │ UI Update:                 │                            │
     │ - "Answer E1" chip removed │                            │
     │ - GROUNDS count: 1         │                            │
     │ - Open WHY count: 0        │                            │
     │                            │                            │
```

## Data Model Relationships

```
┌──────────────────────────────────────────────────────────────────┐
│                   ArgumentScheme                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ id: "scheme_expert"                                        │  │
│  │ key: "argument_from_expert_opinion"                        │  │
│  │ name: "Argument from Expert Opinion"                       │  │
│  │ cq: [                                                      │  │
│  │   {                                                        │  │
│  │     key: "E1",                                             │  │
│  │     text: "Is expert qualified in relevant field?",       │  │
│  │     attackType: "UNDERCUTS"                                │  │
│  │   },                                                       │  │
│  │   {                                                        │  │
│  │     key: "E2",                                             │  │
│  │     text: "Does expert have conflicts of interest?",      │  │
│  │     attackType: "UNDERMINES"                               │  │
│  │   }                                                        │  │
│  │ ]                                                          │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ Applied to
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      SchemeInstance                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ id: "instance_123"                                         │  │
│  │ targetType: "claim"                                        │  │
│  │ targetId: "claim_xyz789"                                   │  │
│  │ schemeId: "scheme_expert"                                  │  │
│  │ data: { expert: "Dr. Smith", field: "Climate" }           │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ Generates CQs for
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                          CQStatus                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ targetType: "claim"                                        │  │
│  │ targetId: "claim_xyz789"                                   │  │
│  │ schemeKey: "argument_from_expert_opinion"                  │  │
│  │ cqKey: "E1"                                                │  │
│  │ satisfied: false → true (after GROUNDS + toggle)           │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ Dialogue about
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      DialogicalMove                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Move 1: WHY                                                │  │
│  │ ┌────────────────────────────────────────────────────────┐ │  │
│  │ │ id: "dm_001"                                           │ │  │
│  │ │ deliberationId: "delib_abc123"                         │ │  │
│  │ │ targetType: "claim"                                    │ │  │
│  │ │ targetId: "claim_xyz789"                               │ │  │
│  │ │ kind: "WHY"                                            │ │  │
│  │ │ payload: {                                             │ │  │
│  │ │   locusPath: "0",                                      │ │  │
│  │ │   schemeKey: "argument_from_expert_opinion",           │ │  │
│  │ │   cqId: "E1"  ←─────────┐                             │ │  │
│  │ │ }                        │                             │ │  │
│  │ │ signature: "WHY:claim:claim_xyz789:E1"                 │ │  │
│  │ │ createdAt: 2025-10-21 14:30:00                         │ │  │
│  │ └────────────────────────────────────────────────────────┘ │  │
│  │                          │                                 │  │
│  │                          │ Paired by cqId                  │  │
│  │                          │                                 │  │
│  │ Move 2: GROUNDS          │                                 │  │
│  │ ┌────────────────────────────────────────────────────────┐ │  │
│  │ │ id: "dm_002"           │                               │ │  │
│  │ │ deliberationId: "delib_abc123"                         │ │  │
│  │ │ targetType: "claim"                                    │ │  │
│  │ │ targetId: "claim_xyz789"                               │ │  │
│  │ │ kind: "GROUNDS"                                        │ │  │
│  │ │ payload: {                                             │ │  │
│  │ │   locusPath: "0",                                      │ │  │
│  │ │   schemeKey: "argument_from_expert_opinion",           │ │  │
│  │ │   cqId: "E1"  ←─────────┘ (SAME as WHY)               │ │  │
│  │ │   expression: "Dr. Smith has 20 years experience..."  │ │  │
│  │ │ }                                                      │ │  │
│  │ │ signature: "GROUNDS:claim:claim_xyz789:E1:0::hash..." │ │  │
│  │ │ createdAt: 2025-10-21 14:32:00                         │ │  │
│  │ └────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## State Machine for Open WHY Detection

```
┌──────────────────────────────────────────────────────────────────┐
│  Per CQ (identified by cqId):                                    │
│                                                                  │
│  Initial State: NO_MOVES                                         │
│         │                                                        │
│         │ WHY move posted                                        │
│         ↓                                                        │
│  State: OPEN_WHY                                                 │
│         │                                                        │
│         │ ┌─────────────────────────────┐                       │
│         │ │ UI shows:                   │                       │
│         │ │ - "Answer E1" chip          │                       │
│         │ │ - Open WHY count: +1        │                       │
│         │ │ - Legal moves: GROUNDS      │                       │
│         │ └─────────────────────────────┘                       │
│         │                                                        │
│         │ GROUNDS move posted (matching cqId)                   │
│         ↓                                                        │
│  State: ANSWERED                                                 │
│         │                                                        │
│         │ ┌─────────────────────────────┐                       │
│         │ │ UI shows:                   │                       │
│         │ │ - "Answer E1" chip removed  │                       │
│         │ │ - Open WHY count: -1        │                       │
│         │ │ - GROUNDS count: +1         │                       │
│         │ │ - CQ may be satisfied       │                       │
│         │ └─────────────────────────────┘                       │
│         │                                                        │
│         │ New WHY posted (re-opens)                             │
│         ↓                                                        │
│  State: OPEN_WHY (again)                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## ClaimMiniMap Integration Flow

```
User opens ClaimMiniMap
         │
         ↓
Component fetches data:
- /api/claims/summary
- /api/deliberations/{id}/moves
- /api/claims/edges
         │
         ↓
Enrichment logic runs:
  for each claim:
    moves = filter by targetId
    whyMoves = filter by kind='WHY'
    groundsMoves = filter by kind='GROUNDS'
    
    openWhys = whyMoves.filter(w =>
      !groundsMoves.some(g =>
        g.payload.cqId === w.payload.cqId  ← Pairing key
        && g.createdAt > w.createdAt
      )
    ).length
         │
         ↓
Render claim rows:
  "Climate change..."
  [IN] +5 −2 CQ 75% ?2 G:1 [CQs]
                     ↑   ↑
                     │   └─ groundsCount
                     └───── openWhys (2 unanswered)
         │
         ↓
User clicks [CQs]
         │
         ↓
Dialog opens with CriticalQuestions:
  <CriticalQuestions
    targetType="claim"
    targetId={claimId}
    deliberationId={deliberationId}
  />
         │
         ↓
CriticalQuestions fetches:
- /api/cqs?targetId={claimId}
- /api/cqs/attachments
- /api/deliberations/{id}/moves
- /api/claims/edges
         │
         ↓
Renders CQ list:
  E1: Is expert qualified?
    [ ] (disabled, needs attachment)
    [Show Moves] → LegalMoveChips
         │
         ↓
User clicks [Show Moves]
         │
         ↓
LegalMoveChips fetches:
  /api/dialogue/legal-moves
         │
         ↓
Detects open WHY for E1
         │
         ↓
Renders: [Answer E1] chip
         │
         ↓
User clicks [Answer E1]
         │
         ↓
Prompt appears, user types grounds
         │
         ↓
POST /api/dialogue/move
  kind: 'GROUNDS'
  payload: { cqId: 'E1', expression: '...' }
         │
         ↓
Event: dialogue:moves:refresh
         │
         ↓
All components revalidate:
- ClaimMiniMap
- CriticalQuestions
- LegalMoveChips
         │
         ↓
UI updates:
- ClaimMiniMap: G:1, ?1 (was ?2)
- CriticalQuestions: "Answer E1" removed
- Legal moves: only WHY for E2 remains
```

---

## Summary Diagram

```
┌─────────────┐    WHY     ┌─────────────┐   GROUNDS   ┌─────────────┐
│   Opponent  │ ─────────> │   Server    │ <───────── │  Proponent  │
│             │  (cqId=E1) │             │ (cqId=E1)  │             │
└─────────────┘            └─────────────┘            └─────────────┘
      │                           │                           │
      │                           │                           │
      ↓                           ↓                           ↓
   Challenge               Pairs by cqId                  Answer
   recorded                  in DB                       recorded
      │                           │                           │
      └───────────────────────────┴───────────────────────────┘
                                  │
                                  ↓
                          Open WHY closed
                          CQ may be satisfied
                          UI updates across all components
```

This visual representation helps understand the flow from ClaimMiniMap → CriticalQuestions → LegalMoveChips → WHY/GROUNDS posting → Database → UI refresh cycle.
