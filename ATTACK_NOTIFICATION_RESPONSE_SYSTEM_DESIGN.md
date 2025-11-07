# Attack/Challenge Notification & Response System - Design Document

**Date**: November 7, 2025  
**Status**: Design Phase  
**Priority**: HIGH - Critical UX Gap  

---

## Problem Statement

**Current State**:
- ✅ Users can create attacks via AttackCreationModal
- ✅ Users can challenge claims via DialogueActionsButton (WHY moves)
- ✅ Attacks and challenges are stored in database
- ❌ **Authors NOT notified** when their claims/arguments are attacked
- ❌ **No response workflow** for authors to CONCEDE/RETRACT/DEFEND
- ❌ **Attackers NOT notified** when authors respond
- ❌ **No dialogue closure** mechanism

**User Experience Gap**:
```
User A creates argument "Climate action is urgent"
  ↓
User B attacks with UNDERMINES (via AttackCreationModal)
  ↓
User A has NO IDEA they were attacked 😱
  ↓
Dead end - no dialogue, no response, no resolution
```

---

## Current Infrastructure Analysis

### 1. Notification System (Partial)

**Location**: `lib/models/schema.prisma` (line 891)

```prisma
model Notification {
  id              BigInt            @id @default(autoincrement())
  user_id         BigInt            // Recipient
  actor_id        BigInt            // Person who triggered notification
  type            notification_type
  conversation_id BigInt?           // DM conversation
  message_id      BigInt?           // DM message
  market_id       String?           // Prediction market
  trade_id        String?           // Trade executed
  created_at      DateTime          @default(now())
  read            Boolean           @default(false)
  
  // Relations
  actor           User              @relation("NotificationActor", ...)
  conversation    Conversation?     @relation(...)
  message         Message?          @relation(...)
  market          PredictionMarket? @relation(...)
  trade           Trade?            @relation(...)
  user            User              @relation("NotificationUser", ...)
}

enum notification_type {
  FOLLOW          // User followed
  MESSAGE         // DM received
  TRADE_EXECUTED  // Prediction market trade
  MARKET_RESOLVED // Prediction market resolved
  // ❌ NO DIALOGUE/ATTACK TYPES!
}
```

**Current Notification Types**:
- ✅ FOLLOW (social)
- ✅ MESSAGE (DMs)
- ✅ TRADE_EXECUTED (prediction markets)
- ✅ MARKET_RESOLVED (prediction markets)
- ❌ **ARGUMENT_CHALLENGED** (missing)
- ❌ **ARGUMENT_ATTACKED** (missing)
- ❌ **CHALLENGE_RESPONDED** (missing)
- ❌ **ATTACK_CONCEDED** (missing)

**Notification API**:
- ✅ `GET /api/notifications` (fetch notifications)
- ✅ `POST /api/notifications/read` (mark as read)
- ✅ `DELETE /api/notifications/clear` (clear all)
- ❌ **No create notification endpoint** (notifications created inline in other APIs)

---

### 2. DialogueMove System (Complete)

**Location**: `lib/models/schema.prisma` (line 3512)

```prisma
model DialogueMove {
  id             String      @id @default(cuid())
  deliberationId String
  targetType     String      // 'argument'|'claim'|'card'
  targetId       String
  kind           String      // 'WHY'|'GROUNDS'|'CONCEDE'|'RETRACT'|...
  payload        Json?
  actorId        String      // Person who made the move
  createdAt      DateTime    @default(now())
  
  // Provenance tracking
  createdArguments     Argument[]             @relation("ArgumentCreatedByMove")
  createdConflicts     ConflictApplication[]  @relation("ConflictCreatedByMove")
  introducedClaims     Claim[]                @relation("ClaimIntroducedByMove")
  
  // ❌ NO notification relation!
}
```

**Dialogue Move Types**:
- **WHY**: Challenge a claim (poses critical question)
- **GROUNDS**: Respond to WHY with evidence
- **CONCEDE**: Accept opponent's point
- **RETRACT**: Withdraw your claim
- **CLOSE**: End dialogue turn
- **ACCEPT_ARGUMENT**: Accept opponent's argument

**Current Workflow** (WHY → GROUNDS):
```
User A creates Argument
  ↓
User B clicks DialogueActionsButton → WHY
  ↓
DialogueMove created (kind: WHY, targetId: argument.id, actorId: B)
  ↓
❌ User A NOT notified
  ↓
User A randomly discovers WHY move in Dialogue Timeline
  ↓
User A clicks DialogueActionsButton → GROUNDS
  ↓
DialogueMove created (kind: GROUNDS, targetId: argument.id, actorId: A)
  ↓
❌ User B NOT notified
  ↓
Dead end
```

---

### 3. ConflictApplication System (Complete)

**Location**: `lib/models/schema.prisma` (line 3235)

```prisma
model ConflictApplication {
  id                      String    @id @default(cuid())
  deliberationId          String
  
  // Attacker
  conflictingClaimId      String?
  conflictingArgumentId   String?
  
  // Target
  conflictedClaimId       String?
  conflictedArgumentId    String?
  
  // ASPIC+ metadata
  legacyAttackType        String?   // UNDERMINES/REBUTS/UNDERCUTS
  legacyTargetScope       String?   // premise/conclusion/inference
  
  // Dialogue provenance
  createdByMoveId         String?   // Which DialogueMove created this
  createdByMove           DialogueMove? @relation("ConflictCreatedByMove", ...)
  
  createdAt               DateTime  @default(now())
  
  // Relations
  conflictingClaim        Claim?     @relation("ConflictingClaim", ...)
  conflictingArgument     Argument?  @relation("ConflictingArgument", ...)
  conflictedClaim         Claim?     @relation("ConflictedClaim", ...)
  conflictedArgument      Argument?  @relation("ConflictedArgument", ...)
  
  // ❌ NO notification relation!
}
```

**Current Workflow** (Direct Attack):
```
User A creates Argument
  ↓
User B clicks "Attack" button → AttackCreationModal
  ↓
User B selects UNDERMINES, selects attacking claim
  ↓
POST /api/ca → ConflictApplication created
  ↓
❌ User A NOT notified
  ↓
Dead end - User A never knows they were attacked
```

---

### 4. CQ Response System (Partial Solution)

**Location**: CQ (Critical Question) response workflow

```prisma
model CQStatus {
  id            String   @id @default(cuid())
  targetType    TargetType
  targetId      String   // claim or argument ID
  argumentId    String?
  status        String   // "open"/"satisfied"/"pending_review"
  cqKey         String
  satisfied     Boolean  @default(false)
  createdById   String
  responses     CQResponse[]
}

model CQResponse {
  id             String   @id @default(cuid())
  cqStatusId     String
  groundsText    String
  contributorId  String
  responseStatus String   // "PENDING"/"APPROVED"/"REJECTED"
  
  cqStatus       CQStatus @relation(...)
}
```

**CQ Workflow** (Partially Functional):
```
User A creates Argument with scheme "Argument from Expert Opinion"
  ↓
System auto-creates CQStatus rows for scheme CQs
  ↓
User B submits CQResponse (GROUNDS text)
  ↓
POST /api/cqs/responses/submit
  ↓
❌ User A NOT notified (TODO comment in code!)
  ↓
User A randomly discovers pending response
  ↓
User A approves/rejects response
  ↓
POST /api/cqs/responses/[id]/approve OR /reject
  ↓
❌ User B NOT notified
```

**Evidence of Missing Notifications** (`app/api/cqs/responses/submit/route.ts` line 110):
```typescript
// TODO Phase 4: Emit event for notifications
// emitBus('cq:response:submitted', { cqStatusId, responseId, contributorId });
```

**Evidence of Missing Notifications** (`app/api/cqs/responses/[id]/reject/route.ts` line 109):
```typescript
// emitBus('cq:response:rejected', { responseId, contributorId, reason });
```

---

## Proposed Solution: Complete Notification & Response System

### Phase 1: Extend Notification Schema ⚡ HIGH PRIORITY

#### 1A. Add Dialogue/Attack Notification Types

**File**: `lib/models/schema.prisma`

```prisma
enum notification_type {
  FOLLOW
  MESSAGE
  TRADE_EXECUTED
  MARKET_RESOLVED
  
  // NEW: Dialogue & Attack Notifications
  ARGUMENT_CHALLENGED     // WHY move on your argument
  CLAIM_CHALLENGED        // WHY move on your claim
  ARGUMENT_ATTACKED       // Direct attack (ConflictApplication)
  CLAIM_ATTACKED          // Direct attack on claim
  CHALLENGE_RESPONDED     // Someone responded to your WHY with GROUNDS
  ATTACK_CONCEDED         // Author conceded to your attack
  ATTACK_RETRACTED        // Author retracted attacked claim
  CQ_RESPONSE_SUBMITTED   // Someone answered your CQ
  CQ_RESPONSE_APPROVED    // Your CQ response was approved
  CQ_RESPONSE_REJECTED    // Your CQ response was rejected
}
```

#### 1B. Add Deliberation Context to Notifications

```prisma
model Notification {
  id              BigInt            @id @default(autoincrement())
  user_id         BigInt            // Recipient (author of attacked claim/argument)
  actor_id        BigInt            // Attacker/Challenger
  type            notification_type
  
  // Existing fields
  conversation_id BigInt?
  message_id      BigInt?
  market_id       String?
  trade_id        String?
  
  // NEW: Deliberation context
  deliberation_id String?
  dialogue_move_id String?           // Which DialogueMove triggered this
  conflict_application_id String?    // Which attack triggered this
  target_claim_id String?            // Attacked/challenged claim
  target_argument_id String?         // Attacked/challenged argument
  cq_status_id    String?            // Critical question
  cq_response_id  String?            // CQ response
  
  created_at      DateTime          @default(now())
  read            Boolean           @default(false)
  
  // Existing relations
  actor           User              @relation("NotificationActor", ...)
  conversation    Conversation?     @relation(...)
  message         Message?          @relation(...)
  market          PredictionMarket? @relation(...)
  trade           Trade?            @relation(...)
  user            User              @relation("NotificationUser", ...)
  
  // NEW: Deliberation relations
  deliberation    Deliberation?     @relation(fields: [deliberation_id], references: [id])
  dialogueMove    DialogueMove?     @relation(fields: [dialogue_move_id], references: [id])
  conflictApplication ConflictApplication? @relation(fields: [conflict_application_id], references: [id])
  targetClaim     Claim?            @relation(fields: [target_claim_id], references: [id])
  targetArgument  Argument?         @relation(fields: [target_argument_id], references: [id])
  cqStatus        CQStatus?         @relation(fields: [cq_status_id], references: [id])
  cqResponse      CQResponse?       @relation(fields: [cq_response_id], references: [id])
  
  @@index([user_id, read])
  @@index([deliberation_id])
}
```

---

### Phase 2: Notification Creation Hooks 🔔

#### 2A. WHY Move Notification (Challenge)

**Location**: `app/api/dialogue/move/route.ts` (after DialogueMove creation)

```typescript
// After creating WHY move
if (kind === 'WHY') {
  // Fetch target author
  let authorId: string | null = null;
  
  if (targetType === 'claim') {
    const claim = await prisma.claim.findUnique({
      where: { id: targetId },
      select: { createdById: true }
    });
    authorId = claim?.createdById || null;
  } else if (targetType === 'argument') {
    const argument = await prisma.argument.findUnique({
      where: { id: targetId },
      select: { authorId: true }
    });
    authorId = argument?.authorId || null;
  }
  
  // Create notification for author (don't notify yourself)
  if (authorId && authorId !== actorId) {
    await prisma.notification.create({
      data: {
        user_id: BigInt(authorId),
        actor_id: BigInt(actorId),
        type: targetType === 'claim' ? 'CLAIM_CHALLENGED' : 'ARGUMENT_CHALLENGED',
        deliberation_id: deliberationId,
        dialogue_move_id: createdMove.id,
        target_claim_id: targetType === 'claim' ? targetId : null,
        target_argument_id: targetType === 'argument' ? targetId : null,
        read: false,
      }
    });
  }
}
```

#### 2B. GROUNDS Move Notification (Response to Challenge)

```typescript
// After creating GROUNDS move
if (kind === 'GROUNDS') {
  // Find the WHY move this GROUNDS is responding to
  const relatedWhy = await prisma.dialogueMove.findFirst({
    where: {
      deliberationId,
      targetId,
      targetType,
      kind: 'WHY',
      actorId: { not: actorId }, // Different actor
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, actorId: true }
  });
  
  // Notify the challenger that their WHY was answered
  if (relatedWhy && relatedWhy.actorId !== actorId) {
    await prisma.notification.create({
      data: {
        user_id: BigInt(relatedWhy.actorId),
        actor_id: BigInt(actorId),
        type: 'CHALLENGE_RESPONDED',
        deliberation_id: deliberationId,
        dialogue_move_id: createdMove.id,
        target_claim_id: targetType === 'claim' ? targetId : null,
        target_argument_id: targetType === 'argument' ? targetId : null,
        read: false,
      }
    });
  }
}
```

#### 2C. Direct Attack Notification

**Location**: `app/api/ca/route.ts` (POST handler, after ConflictApplication creation)

```typescript
// After creating ConflictApplication
const ca = await prisma.conflictApplication.create({ data: { ... } });

// Fetch target author
let targetAuthorId: string | null = null;

if (ca.conflictedClaimId) {
  const claim = await prisma.claim.findUnique({
    where: { id: ca.conflictedClaimId },
    select: { createdById: true }
  });
  targetAuthorId = claim?.createdById || null;
} else if (ca.conflictedArgumentId) {
  const argument = await prisma.argument.findUnique({
    where: { id: ca.conflictedArgumentId },
    select: { authorId: true }
  });
  targetAuthorId = argument?.authorId || null;
}

// Fetch attacker author (from conflicting claim or argument)
let attackerAuthorId: string | null = null;

if (ca.conflictingClaimId) {
  const claim = await prisma.claim.findUnique({
    where: { id: ca.conflictingClaimId },
    select: { createdById: true }
  });
  attackerAuthorId = claim?.createdById || null;
} else if (ca.conflictingArgumentId) {
  const argument = await prisma.argument.findUnique({
    where: { id: ca.conflictingArgumentId },
    select: { authorId: true }
  });
  attackerAuthorId = argument?.authorId || null;
}

// Create notification (don't notify yourself)
if (targetAuthorId && attackerAuthorId && targetAuthorId !== attackerAuthorId) {
  await prisma.notification.create({
    data: {
      user_id: BigInt(targetAuthorId),
      actor_id: BigInt(attackerAuthorId),
      type: ca.conflictedClaimId ? 'CLAIM_ATTACKED' : 'ARGUMENT_ATTACKED',
      deliberation_id: ca.deliberationId,
      conflict_application_id: ca.id,
      target_claim_id: ca.conflictedClaimId,
      target_argument_id: ca.conflictedArgumentId,
      read: false,
    }
  });
}
```

#### 2D. CONCEDE/RETRACT Notification (Resolution)

```typescript
// After creating CONCEDE or RETRACT move
if (kind === 'CONCEDE' || kind === 'RETRACT') {
  // Find attackers/challengers to notify
  
  // 1. Find WHY moves on this target
  const whyMoves = await prisma.dialogueMove.findMany({
    where: {
      deliberationId,
      targetId,
      targetType,
      kind: 'WHY',
      actorId: { not: actorId },
    },
    select: { actorId: true },
    distinct: ['actorId'],
  });
  
  // 2. Find attacks on this target
  const attacks = await prisma.conflictApplication.findMany({
    where: {
      deliberationId,
      ...(targetType === 'claim' ? { conflictedClaimId: targetId } : { conflictedArgumentId: targetId }),
    },
    select: {
      conflictingClaim: { select: { createdById: true } },
      conflictingArgument: { select: { authorId: true } },
    }
  });
  
  // Collect unique attacker IDs
  const attackerIds = new Set<string>();
  whyMoves.forEach(m => attackerIds.add(m.actorId));
  attacks.forEach(a => {
    if (a.conflictingClaim?.createdById) attackerIds.add(a.conflictingClaim.createdById);
    if (a.conflictingArgument?.authorId) attackerIds.add(a.conflictingArgument.authorId);
  });
  
  // Notify all attackers
  for (const attackerId of attackerIds) {
    if (attackerId !== actorId) {
      await prisma.notification.create({
        data: {
          user_id: BigInt(attackerId),
          actor_id: BigInt(actorId),
          type: kind === 'CONCEDE' ? 'ATTACK_CONCEDED' : 'ATTACK_RETRACTED',
          deliberation_id: deliberationId,
          dialogue_move_id: createdMove.id,
          target_claim_id: targetType === 'claim' ? targetId : null,
          target_argument_id: targetType === 'argument' ? targetId : null,
          read: false,
        }
      });
    }
  }
}
```

#### 2E. CQ Response Notifications

**Location**: `app/api/cqs/responses/submit/route.ts`

```typescript
// Replace TODO with actual notification creation
await prisma.notification.create({
  data: {
    user_id: BigInt(cqStatus.createdById), // CQ author (argument author)
    actor_id: BigInt(userId),              // Response contributor
    type: 'CQ_RESPONSE_SUBMITTED',
    deliberation_id: cqStatus.deliberationId,
    cq_status_id: cqStatusId,
    cq_response_id: response.id,
    target_claim_id: cqStatus.targetType === 'claim' ? cqStatus.targetId : null,
    target_argument_id: cqStatus.targetType === 'argument' ? cqStatus.targetId : null,
    read: false,
  }
});
```

**Location**: `app/api/cqs/responses/[id]/approve/route.ts`

```typescript
await prisma.notification.create({
  data: {
    user_id: BigInt(response.contributorId),
    actor_id: BigInt(userId),
    type: 'CQ_RESPONSE_APPROVED',
    deliberation_id: cqStatus.deliberationId,
    cq_response_id: responseId,
    read: false,
  }
});
```

**Location**: `app/api/cqs/responses/[id]/reject/route.ts`

```typescript
await prisma.notification.create({
  data: {
    user_id: BigInt(response.contributorId),
    actor_id: BigInt(userId),
    type: 'CQ_RESPONSE_REJECTED',
    deliberation_id: cqStatus.deliberationId,
    cq_response_id: responseId,
    read: false,
  }
});
```

---

### Phase 3: Notification UI Components 🎨

#### 3A. Notification Badge in Header

**Location**: `components/layout/Header.tsx` (or similar)

```tsx
import { Bell } from 'lucide-react';
import useSWR from 'swr';

export function NotificationBell() {
  const { data } = useSWR('/api/notifications?unreadOnly=true', fetcher, {
    refreshInterval: 30000, // Poll every 30s
  });
  
  const unreadCount = data?.length || 0;
  
  return (
    <button className="relative">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
```

#### 3B. Notification List Panel

```tsx
export function NotificationPanel() {
  const { data: notifications } = useSWR('/api/notifications', fetcher);
  
  return (
    <div className="notification-panel">
      <h3>Notifications</h3>
      {notifications?.map((n: any) => (
        <NotificationCard key={n.id} notification={n} />
      ))}
    </div>
  );
}
```

#### 3C. Notification Card with Action Buttons

```tsx
function NotificationCard({ notification }: { notification: any }) {
  const { type, actor, deliberation_id, target_argument_id, target_claim_id } = notification;
  
  const renderContent = () => {
    switch (type) {
      case 'ARGUMENT_CHALLENGED':
        return (
          <div>
            <p><strong>{actor.name}</strong> challenged your argument</p>
            <div className="actions">
              <Button onClick={() => respondWithGrounds(target_argument_id)}>
                Provide GROUNDS
              </Button>
              <Button onClick={() => concede(target_argument_id)}>
                CONCEDE
              </Button>
              <Button onClick={() => retract(target_argument_id)}>
                RETRACT
              </Button>
            </div>
          </div>
        );
        
      case 'ARGUMENT_ATTACKED':
        return (
          <div>
            <p><strong>{actor.name}</strong> attacked your argument</p>
            <div className="actions">
              <Button onClick={() => viewAttack(notification.conflict_application_id)}>
                View Attack
              </Button>
              <Button onClick={() => concede(target_argument_id)}>
                CONCEDE
              </Button>
              <Button onClick={() => counterAttack(target_argument_id)}>
                Counter-Attack
              </Button>
            </div>
          </div>
        );
        
      case 'CHALLENGE_RESPONDED':
        return (
          <div>
            <p><strong>{actor.name}</strong> provided GROUNDS for your WHY challenge</p>
            <div className="actions">
              <Button onClick={() => viewResponse(notification.dialogue_move_id)}>
                View Response
              </Button>
              <Button onClick={() => acceptResponse(target_argument_id)}>
                Accept
              </Button>
              <Button onClick={() => continueChallenge(target_argument_id)}>
                Challenge Further
              </Button>
            </div>
          </div>
        );
        
      case 'ATTACK_CONCEDED':
        return (
          <div>
            <p><strong>{actor.name}</strong> conceded to your attack</p>
            <p className="text-green-600">✅ Victory!</p>
          </div>
        );
        
      // ... other notification types
    }
  };
  
  return (
    <div className={`notification-card ${notification.read ? 'read' : 'unread'}`}>
      {renderContent()}
    </div>
  );
}
```

---

### Phase 4: Response Workflow UI 🔄

#### 4A. Quick Response Modal

**Location**: `components/dialogue/QuickResponseModal.tsx` (NEW)

```tsx
interface QuickResponseModalProps {
  notification: Notification;
  onClose: () => void;
}

export function QuickResponseModal({ notification, onClose }: QuickResponseModalProps) {
  const [responseType, setResponseType] = React.useState<'GROUNDS' | 'CONCEDE' | 'RETRACT'>('GROUNDS');
  const [groundsText, setGroundsText] = React.useState('');
  
  const handleSubmit = async () => {
    if (responseType === 'GROUNDS') {
      // Create GROUNDS dialogue move
      await fetch('/api/dialogue/move', {
        method: 'POST',
        body: JSON.stringify({
          deliberationId: notification.deliberation_id,
          targetType: notification.target_argument_id ? 'argument' : 'claim',
          targetId: notification.target_argument_id || notification.target_claim_id,
          kind: 'GROUNDS',
          payload: { text: groundsText },
        }),
      });
    } else if (responseType === 'CONCEDE') {
      // Create CONCEDE dialogue move
      await fetch('/api/dialogue/move', {
        method: 'POST',
        body: JSON.stringify({
          deliberationId: notification.deliberation_id,
          targetType: notification.target_argument_id ? 'argument' : 'claim',
          targetId: notification.target_argument_id || notification.target_claim_id,
          kind: 'CONCEDE',
        }),
      });
    } else if (responseType === 'RETRACT') {
      // Create RETRACT dialogue move
      await fetch('/api/dialogue/move', {
        method: 'POST',
        body: JSON.stringify({
          deliberationId: notification.deliberation_id,
          targetType: notification.target_argument_id ? 'argument' : 'claim',
          targetId: notification.target_argument_id || notification.target_claim_id,
          kind: 'RETRACT',
        }),
      });
    }
    
    // Mark notification as read
    await fetch(`/api/notifications/${notification.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    });
    
    onClose();
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Respond to Challenge</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Response Type Selection */}
          <div className="flex gap-2">
            <button 
              onClick={() => setResponseType('GROUNDS')}
              className={responseType === 'GROUNDS' ? 'selected' : ''}
            >
              Provide GROUNDS
            </button>
            <button 
              onClick={() => setResponseType('CONCEDE')}
              className={responseType === 'CONCEDE' ? 'selected' : ''}
            >
              CONCEDE
            </button>
            <button 
              onClick={() => setResponseType('RETRACT')}
              className={responseType === 'RETRACT' ? 'selected' : ''}
            >
              RETRACT
            </button>
          </div>
          
          {/* GROUNDS Text Input */}
          {responseType === 'GROUNDS' && (
            <textarea
              value={groundsText}
              onChange={(e) => setGroundsText(e.target.value)}
              placeholder="Provide evidence or reasoning to support your argument..."
              rows={5}
            />
          )}
          
          {/* Confirm Button */}
          <button onClick={handleSubmit}>
            {responseType === 'GROUNDS' ? 'Submit Response' : `Confirm ${responseType}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Phase 5: Complete User Flow Examples 🎯

#### Example 1: WHY → GROUNDS → ACCEPT

```
1. User A creates Argument "Climate action is urgent"
   ↓
2. User B clicks DialogueActionsButton → WHY "Why is it urgent?"
   ↓
   POST /api/dialogue/move { kind: 'WHY', ... }
   ↓
   Notification created:
   {
     user_id: A,
     actor_id: B,
     type: 'ARGUMENT_CHALLENGED',
     dialogue_move_id: why_move_id,
     target_argument_id: arg_id
   }
   ↓
3. User A sees notification bell (unread count: 1)
   ↓
4. User A clicks bell → Notification panel opens
   ↓
   "User B challenged your argument"
   [Provide GROUNDS] [CONCEDE] [RETRACT]
   ↓
5. User A clicks "Provide GROUNDS"
   ↓
   QuickResponseModal opens
   ↓
   User A types: "Recent IPCC report shows 1.5°C threshold approaching"
   ↓
   POST /api/dialogue/move { kind: 'GROUNDS', payload: { text: "..." } }
   ↓
   Notification created:
   {
     user_id: B,
     actor_id: A,
     type: 'CHALLENGE_RESPONDED',
     dialogue_move_id: grounds_move_id
   }
   ↓
6. User B sees notification: "User A provided GROUNDS for your WHY challenge"
   ↓
7. User B reviews GROUNDS, clicks "Accept"
   ↓
   POST /api/dialogue/move { kind: 'ACCEPT_ARGUMENT', ... }
   ↓
   Dialogue thread closed ✅
```

#### Example 2: Direct Attack → Counter-Attack

```
1. User A creates Argument "Climate action is urgent"
   ↓
2. User B clicks "Attack" button → AttackCreationModal
   ↓
   Selects UNDERMINES, selects attacking claim "Cost outweighs benefit"
   ↓
   POST /api/ca { ... }
   ↓
   Notification created:
   {
     user_id: A,
     actor_id: B,
     type: 'ARGUMENT_ATTACKED',
     conflict_application_id: ca_id
   }
   ↓
3. User A sees notification: "User B attacked your argument"
   [View Attack] [CONCEDE] [Counter-Attack]
   ↓
4. User A clicks "View Attack" → Navigates to ASPIC+ tab
   ↓
   Sees: UNDERMINES attack on premise "Climate change is real"
   ↓
5. User A clicks "Counter-Attack"
   ↓
   AttackCreationModal opens (pre-filled with attacker's claim as target)
   ↓
   User A selects REBUTS, selects claim "Cost-benefit analysis flawed"
   ↓
   POST /api/ca { ... }
   ↓
   Notification created:
   {
     user_id: B,
     actor_id: A,
     type: 'ARGUMENT_ATTACKED',
     conflict_application_id: counter_ca_id
   }
   ↓
6. User B sees notification: "User A counter-attacked"
   ↓
   Dialogue continues... 🔄
```

#### Example 3: CONCEDE (Resolution)

```
1. User A's argument is challenged
   ↓
2. User A realizes they were wrong
   ↓
3. User A clicks "CONCEDE" in notification
   ↓
   POST /api/dialogue/move { kind: 'CONCEDE', ... }
   ↓
   Notifications created for all attackers:
   {
     user_id: B (and C, D, etc.),
     actor_id: A,
     type: 'ATTACK_CONCEDED'
   }
   ↓
4. All attackers see: "User A conceded to your attack ✅ Victory!"
   ↓
5. Argument labeled OUT in ASPIC+ evaluation
   ↓
   Dialogue thread resolved ✅
```

---

## Implementation Roadmap

### Week 1: Schema & Backend
- [ ] **Day 1**: Update Notification schema (add enum types, fields)
- [ ] **Day 2**: Run Prisma migration, update types
- [ ] **Day 3**: Add notification hooks to WHY/GROUNDS moves
- [ ] **Day 4**: Add notification hooks to ConflictApplication creation
- [ ] **Day 5**: Add notification hooks to CQ responses

### Week 2: Frontend UI
- [ ] **Day 1**: Build NotificationBell component
- [ ] **Day 2**: Build NotificationPanel component
- [ ] **Day 3**: Build NotificationCard with action buttons
- [ ] **Day 4**: Build QuickResponseModal
- [ ] **Day 5**: Integration testing

### Week 3: Polish & Testing
- [ ] **Day 1**: Email notifications (optional)
- [ ] **Day 2**: Push notifications (optional)
- [ ] **Day 3**: Performance optimization (batching)
- [ ] **Day 4**: User testing
- [ ] **Day 5**: Documentation

---

## API Endpoints Required

### Existing (Already Implemented)
- ✅ `GET /api/notifications` (fetch notifications)
- ✅ `POST /api/notifications/read` (mark as read)
- ✅ `DELETE /api/notifications/clear` (clear all)

### New (Phase 1-2)
- ⏳ `PATCH /api/notifications/[id]` (mark single notification as read)
- ⏳ Internal notification creation (in dialogue/attack APIs)

---

## Technical Considerations

### 1. User ID Type Mismatch
**Problem**: Notification uses `BigInt` but Deliberation system uses `String`

**Solution**: Convert when creating notifications
```typescript
user_id: BigInt(authorId) // Convert String → BigInt
```

### 2. Notification Overload
**Problem**: Too many notifications for active users

**Solution**: Batching and digest
- Batch notifications: "3 new challenges on your arguments"
- Daily digest email (optional)
- Notification preferences (per-user settings)

### 3. Real-Time Updates
**Problem**: Users won't see notifications until page refresh

**Solution**: WebSocket or polling
- Short-term: Poll `/api/notifications?unreadOnly=true` every 30s
- Long-term: WebSocket with real-time push

### 4. Notification Threading
**Problem**: Hard to track conversation threads

**Solution**: Thread grouping
- Group notifications by `target_argument_id` or `target_claim_id`
- Show "3 responses in this thread"

---

## Success Metrics

### User Engagement
- **Notification Open Rate**: % of notifications clicked
- **Response Rate**: % of challenges responded to (GROUNDS/CONCEDE/RETRACT)
- **Resolution Rate**: % of dialogues that reach closure (ACCEPT/CLOSE)
- **Time to Respond**: Average time between challenge and response

### System Health
- **Notification Delivery**: 100% of attacks/challenges trigger notifications
- **No Duplicates**: No duplicate notifications for same event
- **Read State Accuracy**: Read/unread state persists correctly

---

## Conclusion

**Current State**: Attack/challenge system exists but has **critical UX gap** (no notifications, no response flow)

**Proposed Solution**: Complete notification & response system with:
1. Extended Notification schema (10 new notification types)
2. Notification creation hooks in all attack/challenge APIs
3. Notification UI (bell icon, panel, cards with actions)
4. Quick response modal (GROUNDS/CONCEDE/RETRACT)
5. Complete user flows (challenge → response → resolution)

**Effort Estimate**:
- Schema changes: 2 hours
- Backend hooks: 1 day
- Frontend UI: 2-3 days
- Testing & polish: 1-2 days
- **Total: 1 week for MVP**

**Priority**: **HIGH** - This is essential for deliberation system to be usable

**Next Steps**:
1. Review this design with team
2. Approve schema changes
3. Run Prisma migration
4. Implement notification hooks
5. Build notification UI
6. User testing

---

**Ready to proceed with implementation?** 🚀
