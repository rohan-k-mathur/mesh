# Non-Canonical Moves: UI Component Designs

**Feature**: Community Response UI Components  
**Date**: October 22, 2025  
**Design System**: Follows AttackMenuProV2 & SchemeSpecificCQsModal patterns

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Component Library](#component-library)
3. [Component Specs](#component-specs)
4. [Integration Examples](#integration-examples)
5. [Mobile Considerations](#mobile-considerations)

---

## Design Principles

### Visual Hierarchy

1. **Canonical moves are primary** (bold, full color)
2. **Approved non-canonical moves are secondary** (muted colors, smaller)
3. **Pending moves are tertiary** (dashed borders, gray)
4. **Rejected moves are hidden** (unless explicitly shown)

### Status Indicators

| Status | Visual Treatment | Badge | Border |
|--------|------------------|-------|--------|
| PENDING | Gray background | "⏳ Pending" | Dashed |
| APPROVED | Light green background | "✓ Approved" | Solid |
| EXECUTED | Full color (like canonical) | "✓ Canonical" | Solid bold |
| REJECTED | Hidden by default | "✗ Rejected" | None |

### Interaction Patterns

- **Quick actions**: Approve/reject buttons inline
- **Detailed review**: Click to expand full response
- **Batch operations**: Select multiple, bulk approve/reject
- **Feedback**: Always show toast on success/error

---

## Component Library

### 1. NonCanonicalResponseForm

**Purpose**: Modal form for submitting community responses

**Props**:
```typescript
interface NonCanonicalResponseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliberationId: string;
  targetType: "argument" | "claim" | "clarification_request";
  targetId: string;
  targetMoveId?: string; // Optional: specific move being answered
  moveType: MoveType; // What kind of response
  onSuccess?: (ncmId: string) => void;
  
  // Context for display
  context?: {
    challengeText?: string; // WHY challenge text
    argumentText?: string; // Argument being defended
    claimText?: string; // Claim being supported
  };
}
```

**Design**:

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClaimPicker } from "@/components/claims/ClaimPicker";

export function NonCanonicalResponseForm({
  open,
  onOpenChange,
  deliberationId,
  targetType,
  targetId,
  moveType,
  context,
  onSuccess
}: NonCanonicalResponseFormProps) {
  const [expression, setExpression] = React.useState("");
  const [evidence, setEvidence] = React.useState<Evidence[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/non-canonical/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliberationId,
          targetType,
          targetId,
          moveType,
          content: { expression, evidence }
        })
      });
      
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      toast.success("Response submitted! Awaiting author approval.");
      onSuccess?.(data.ncmId);
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandHelpingIcon className="w-5 h-5 text-blue-600" />
            Help Answer This Challenge
          </DialogTitle>
        </DialogHeader>

        {/* Context card */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-600 uppercase">
            Challenge
          </div>
          <div className="text-sm text-slate-800">
            {context?.challengeText || "Why should we accept this?"}
          </div>
          
          <div className="text-xs font-semibold text-slate-600 uppercase mt-3">
            Argument
          </div>
          <div className="text-sm text-slate-700">
            {context?.argumentText || "..."}
          </div>
        </div>

        {/* Response form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Response
            </label>
            <Textarea
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Explain why this argument is valid, provide evidence, or clarify the reasoning..."
              rows={6}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Supporting Evidence (optional)
            </label>
            <ClaimPicker
              deliberationId={deliberationId}
              onSelect={(claim) => setEvidence([...evidence, { type: "citation", claimId: claim.id }])}
            />
            
            {evidence.length > 0 && (
              <div className="mt-2 space-y-1">
                {evidence.map((e, i) => (
                  <div key={i} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded">
                    <span className="text-sm">{e.type}: {e.claimId}</span>
                    <button onClick={() => setEvidence(evidence.filter((_, idx) => idx !== i))}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Help text */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <InfoIcon className="w-4 h-4 text-amber-600 mt-0.5" />
            <div className="text-xs text-amber-800">
              <strong>Note:</strong> Your response will be reviewed by the argument author. 
              If approved, it will appear as an official response in the dialogue.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!expression.trim() || submitting}
          >
            {submitting ? "Submitting..." : "Submit Response"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 2. PendingResponsesList

**Purpose**: Drawer/panel for authors to review pending community responses

**Props**:
```typescript
interface PendingResponsesListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authorId: string;
  deliberationId?: string; // Optional: filter by deliberation
}
```

**Design**:

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function PendingResponsesList({
  open,
  onOpenChange,
  authorId,
  deliberationId
}: PendingResponsesListProps) {
  const { data, mutate } = useSWR(
    `/api/non-canonical/pending?authorId=${authorId}&deliberationId=${deliberationId || ""}`,
    fetcher
  );

  const handleApprove = async (ncmId: string, execute: boolean) => {
    const res = await fetch("/api/non-canonical/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ncmId, execute })
    });
    
    if (res.ok) {
      toast.success(execute ? "Response approved & executed!" : "Response approved.");
      mutate();
    } else {
      toast.error("Failed to approve response.");
    }
  };

  const handleReject = async (ncmId: string, reason?: string) => {
    const res = await fetch("/api/non-canonical/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ncmId, reason })
    });
    
    if (res.ok) {
      toast.success("Response rejected.");
      mutate();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Pending Community Responses</span>
            <Badge variant="secondary">{data?.count || 0}</Badge>
          </SheetTitle>
        </SheetHeader>

        {data?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <CheckCircle2Icon className="w-16 h-16 mb-4" />
            <p>No pending responses</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {data?.items.map((ncm) => (
              <div
                key={ncm.id}
                className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white"
              >
                {/* Header: contributor & timestamp */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar src={ncm.contributorImage} alt={ncm.contributorName} className="w-8 h-8" />
                    <div>
                      <div className="text-sm font-medium">{ncm.contributorName}</div>
                      <div className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(ncm.createdAt))} ago
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {ncm.moveType.replace("_", " ")}
                  </Badge>
                </div>

                {/* Context: what they're responding to */}
                <div className="bg-slate-50 rounded p-3 text-sm">
                  <div className="font-semibold text-xs text-slate-600 uppercase mb-1">
                    Responding to
                  </div>
                  <div className="text-slate-700">
                    {ncm.targetContext.text}
                  </div>
                  {ncm.relatedMove && (
                    <div className="mt-2 text-xs text-slate-600">
                      Challenge: "{ncm.relatedMove.expression}"
                    </div>
                  )}
                </div>

                {/* Their response */}
                <div className="pl-3 border-l-2 border-blue-500">
                  <div className="text-sm text-slate-800 whitespace-pre-wrap">
                    {ncm.content.expression}
                  </div>
                  {ncm.content.evidence?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ncm.content.evidence.map((e, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {e.type === "citation" ? "📎 Citation" : "🔗 Link"}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(ncm.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    ✓ Approve & Execute
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(ncm.id, false)}
                  >
                    ✓ Approve (don't execute)
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      const reason = prompt("Reason for rejection (optional):");
                      handleReject(ncm.id, reason || undefined);
                    }}
                  >
                    ✗ Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

---

### 3. CommunityResponsesTab

**Purpose**: Display community responses inside AttackMenuPro or ArgumentCard

**Props**:
```typescript
interface CommunityResponsesTabProps {
  deliberationId: string;
  targetType: "argument" | "claim";
  targetId: string;
  onSubmitResponse?: () => void;
}
```

**Design**:

```tsx
export function CommunityResponsesTab({
  deliberationId,
  targetType,
  targetId,
  onSubmitResponse
}: CommunityResponsesTabProps) {
  const { data } = useSWR(
    `/api/non-canonical/by-target?targetType=${targetType}&targetId=${targetId}&status=all`,
    fetcher
  );

  const [showForm, setShowForm] = React.useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Community Responses</h3>
          <p className="text-xs text-slate-600">
            Help defend this argument or answer challenges
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(true)}
        >
          + Add Response
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Badge variant="secondary">{data?.counts.pending || 0}</Badge>
          <span className="text-slate-600">pending</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="success">{data?.counts.approved || 0}</Badge>
          <span className="text-slate-600">approved</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="default">{data?.counts.executed || 0}</Badge>
          <span className="text-slate-600">canonical</span>
        </div>
      </div>

      {/* List */}
      {data?.items.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <MessageSquareIcon className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No community responses yet</p>
          <p className="text-xs">Be the first to help!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((ncm) => (
            <CommunityResponseCard key={ncm.id} response={ncm} />
          ))}
        </div>
      )}

      {/* Form modal */}
      <NonCanonicalResponseForm
        open={showForm}
        onOpenChange={setShowForm}
        deliberationId={deliberationId}
        targetType={targetType}
        targetId={targetId}
        moveType="GROUNDS_RESPONSE"
        onSuccess={() => {
          setShowForm(false);
          onSubmitResponse?.();
        }}
      />
    </div>
  );
}

function CommunityResponseCard({ response }: { response: any }) {
  const statusColors = {
    PENDING: "bg-slate-50 border-dashed",
    APPROVED: "bg-green-50 border-green-200",
    EXECUTED: "bg-blue-50 border-blue-300",
    REJECTED: "bg-red-50 border-red-200"
  };

  const statusIcons = {
    PENDING: "⏳",
    APPROVED: "✓",
    EXECUTED: "✓✓",
    REJECTED: "✗"
  };

  return (
    <div className={`border rounded-lg p-3 ${statusColors[response.status]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Avatar src={response.contributor.image} className="w-6 h-6" />
          <span className="text-sm font-medium">{response.contributor.name}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {statusIcons[response.status]} {response.status}
        </Badge>
      </div>
      
      <div className="text-sm text-slate-800 pl-8">
        {response.content.expression}
      </div>

      {response.canonicalMove && (
        <div className="mt-2 pl-8 text-xs text-blue-600">
          → Executed as canonical GROUNDS move
        </div>
      )}
    </div>
  );
}
```

---

### 4. ClarificationRequestButton

**Purpose**: Floating action button to request clarification

**Props**:
```typescript
interface ClarificationRequestButtonProps {
  deliberationId: string;
  targetType: "argument" | "claim";
  targetId: string;
}
```

**Design**:

```tsx
import { HelpCircleIcon } from "lucide-react";

export function ClarificationRequestButton({
  deliberationId,
  targetType,
  targetId
}: ClarificationRequestButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/clarification/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliberationId,
          targetType,
          targetId,
          question
        })
      });

      if (!res.ok) throw new Error(await res.text());
      
      toast.success("Clarification requested!");
      setOpen(false);
      setQuestion("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="text-slate-600 hover:text-slate-900"
      >
        <HelpCircleIcon className="w-4 h-4 mr-1" />
        Request Clarification
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Clarification</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Ask for factual details or explanations. This is not a formal challenge.
            </p>

            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like clarified? E.g., 'What do you mean by democratic deficit?'"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!question.trim() || submitting}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

### 5. ClarificationList

**Purpose**: Display clarification requests and their answers

**Props**:
```typescript
interface ClarificationListProps {
  targetType: "argument" | "claim";
  targetId: string;
}
```

**Design**:

```tsx
export function ClarificationList({
  targetType,
  targetId
}: ClarificationListProps) {
  const { data } = useSWR(
    `/api/clarification/list?targetType=${targetType}&targetId=${targetId}`,
    fetcher
  );

  if (!data || data.items.length === 0) {
    return null; // Don't show empty state
  }

  return (
    <div className="space-y-4 mt-4">
      <h4 className="text-sm font-semibold text-slate-700">
        Clarifications ({data.items.length})
      </h4>

      {data.items.map((req) => (
        <div key={req.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          {/* Question */}
          <div className="flex items-start gap-2">
            <HelpCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-slate-600">
                  {req.asker.name} asked:
                </span>
                <Badge variant="secondary" className="text-xs">
                  {req.status}
                </Badge>
              </div>
              <div className="text-sm text-slate-800">
                {req.question}
              </div>
            </div>
          </div>

          {/* Answers */}
          {req.answers.length > 0 && (
            <div className="mt-3 pl-7 space-y-2">
              {req.answers.map((ans) => (
                <div
                  key={ans.id}
                  className={`border-l-2 pl-3 ${
                    ans.approvedByAsker ? "border-green-500" : "border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={ans.contributor.image} className="w-4 h-4" />
                    <span className="text-xs text-slate-600">{ans.contributor.name}</span>
                    {ans.approvedByAsker && (
                      <Badge variant="success" className="text-xs">
                        ✓ Helpful
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-slate-700">
                    {ans.content.answer}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Answer button */}
          <ClarificationAnswerButton clarificationId={req.id} />
        </div>
      ))}
    </div>
  );
}

function ClarificationAnswerButton({ clarificationId }: { clarificationId: string }) {
  const [open, setOpen] = React.useState(false);
  // ... similar to ClarificationRequestButton but submits answer
  
  return (
    <Button
      size="sm"
      variant="link"
      onClick={() => setOpen(true)}
      className="mt-2 text-blue-600"
    >
      💡 Answer This
    </Button>
  );
}
```

---

### 6. CommunityResponseBadge

**Purpose**: Small badge showing pending response count

**Props**:
```typescript
interface CommunityResponseBadgeProps {
  count: number;
  variant?: "pending" | "approved";
  onClick?: () => void;
}
```

**Design**:

```tsx
export function CommunityResponseBadge({
  count,
  variant = "pending",
  onClick
}: CommunityResponseBadgeProps) {
  if (count === 0) return null;

  const colors = {
    pending: "bg-amber-100 text-amber-700 border-amber-300",
    approved: "bg-green-100 text-green-700 border-green-300"
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${colors[variant]} hover:opacity-80`}
    >
      <UsersIcon className="w-3 h-3" />
      {count} community {count === 1 ? "response" : "responses"}
    </button>
  );
}
```

---

## Integration Examples

### Example 1: Add to AttackMenuProV2

```tsx
// components/arguments/AttackMenuProV2.tsx

import { CommunityResponsesTab } from "@/components/dialogue/CommunityResponsesTab";

export function AttackMenuProV2({ ... }: AttackMenuProV2Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Challenge This Argument</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="attacks" className="flex-1 overflow-hidden">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="attacks">My Attack</TabsTrigger>
            <TabsTrigger value="cqs">Critical Questions</TabsTrigger>
            <TabsTrigger value="community">
              Community Responses
              <CommunityResponseBadge count={pendingCount} variant="pending" />
            </TabsTrigger>
          </TabsList>

          {/* Existing attack tabs */}
          <TabsContent value="attacks">
            {/* ... existing attack form ... */}
          </TabsContent>

          <TabsContent value="cqs">
            {/* ... existing CQ display ... */}
          </TabsContent>

          {/* NEW: Community responses tab */}
          <TabsContent value="community" className="overflow-y-auto">
            <CommunityResponsesTab
              deliberationId={deliberationId}
              targetType="argument"
              targetId={target.id}
              onSubmitResponse={() => mutate()}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Example 2: Add to ArgumentCard Footer

```tsx
// components/arguments/ArgumentCard.tsx

import { ClarificationRequestButton } from "@/components/dialogue/ClarificationRequestButton";
import { CommunityResponseBadge } from "@/components/dialogue/CommunityResponseBadge";

export function ArgumentCard({ argument }: ArgumentCardProps) {
  const [showCommunityResponses, setShowCommunityResponses] = React.useState(false);

  return (
    <div className="border rounded-lg p-4">
      {/* ... existing argument display ... */}

      <footer className="flex items-center gap-2 mt-4">
        <AttackMenuProV2 ... />
        
        {/* NEW: Community response badge */}
        <CommunityResponseBadge
          count={argument.communityResponseCount}
          variant="approved"
          onClick={() => setShowCommunityResponses(true)}
        />
        
        {/* NEW: Clarification button */}
        <ClarificationRequestButton
          deliberationId={argument.deliberationId}
          targetType="argument"
          targetId={argument.id}
        />
      </footer>

      {/* Community responses dialog */}
      <Dialog open={showCommunityResponses} onOpenChange={setShowCommunityResponses}>
        <DialogContent className="max-w-2xl">
          <CommunityResponsesTab
            deliberationId={argument.deliberationId}
            targetType="argument"
            targetId={argument.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

### Example 3: Add to LegalMoveChips

```tsx
// components/dialogue/LegalMoveChips.tsx

export function LegalMoveChips({ ... }: LegalMoveChipsProps) {
  const [showNonCanonicalForm, setShowNonCanonicalForm] = React.useState(false);
  const [targetMove, setTargetMove] = React.useState<Move | null>(null);

  return (
    <div className="flex flex-wrap gap-2">
      {moves.map((m) => (
        <div key={m.kind} className="flex items-center gap-1">
          {/* Existing move chip */}
          <button
            onClick={() => postMove(m)}
            className="btnv2"
          >
            {m.label}
          </button>

          {/* NEW: Help answer button for GROUNDS moves */}
          {m.kind === "GROUNDS" && m.authorId !== currentUserId && (
            <button
              onClick={() => {
                setTargetMove(m);
                setShowNonCanonicalForm(true);
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              💡 Help Answer
            </button>
          )}
        </div>
      ))}

      {/* Non-canonical form modal */}
      <NonCanonicalResponseForm
        open={showNonCanonicalForm}
        onOpenChange={setShowNonCanonicalForm}
        deliberationId={deliberationId}
        targetType={targetType}
        targetId={targetId}
        targetMoveId={targetMove?.payload?.cqId}
        moveType="GROUNDS_RESPONSE"
        onSuccess={() => mutate()}
      />
    </div>
  );
}
```

---

### Example 4: Notification Badge in Header

```tsx
// components/layout/Header.tsx

export function Header() {
  const { user } = useAuth();
  const { data: pendingCount } = useSWR(
    user ? `/api/non-canonical/pending?authorId=${user.id}&count=true` : null,
    fetcher
  );

  const [showPending, setShowPending] = React.useState(false);

  return (
    <header className="flex items-center justify-between p-4">
      {/* ... existing header content ... */}

      {/* NEW: Pending responses notification */}
      {pendingCount > 0 && (
        <button
          onClick={() => setShowPending(true)}
          className="relative"
        >
          <BellIcon className="w-6 h-6" />
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white">
            {pendingCount}
          </Badge>
        </button>
      )}

      {/* Pending responses drawer */}
      <PendingResponsesList
        open={showPending}
        onOpenChange={setShowPending}
        authorId={user.id}
      />
    </header>
  );
}
```

---

## Mobile Considerations

### Responsive Design

**Desktop (>768px)**:
- Full modals with sidebars
- Multi-column layouts
- Hover states visible

**Mobile (<768px)**:
- Sheet drawers from bottom
- Single column
- Tap targets 44px minimum
- Swipe gestures for approve/reject

### Touch Interactions

```tsx
// Mobile-optimized approve/reject (swipe)
const handlers = useSwipeable({
  onSwipedLeft: () => handleReject(ncm.id),
  onSwipedRight: () => handleApprove(ncm.id, true),
  trackMouse: false
});

return (
  <div {...handlers} className="swipeable-response-card">
    {/* Card content */}
  </div>
);
```

### Performance

- Virtualize long lists (use `react-window`)
- Lazy load images/avatars
- Debounce search/filter
- Optimistic updates

---

## Accessibility

### Keyboard Navigation

- Tab through all actions
- Enter to open modal
- Escape to close
- Arrow keys in lists

### Screen Reader Support

```tsx
<button
  onClick={handleApprove}
  aria-label={`Approve response from ${contributor.name} submitted ${timeAgo}`}
>
  Approve
</button>
```

### Focus Management

- Trap focus in modals
- Return focus on close
- Visible focus indicators

---

## Next Steps

1. **Build components** in this order:
   - `NonCanonicalResponseForm`
   - `CommunityResponsesTab`
   - `PendingResponsesList`
   - `ClarificationRequestButton`
   - `CommunityResponseBadge`

2. **Test each component** in isolation (Storybook)

3. **Integrate** into existing pages (AttackMenuPro, ArgumentCard, etc.)

4. **Polish** animations, loading states, error handling

5. **User testing** with real data

---

## References

- Design system: `components/arguments/AttackMenuProV2.tsx`
- Modal patterns: `components/arguments/SchemeSpecificCQsModal.tsx`
- Form patterns: `components/claims/ClaimPicker.tsx`
- Badge patterns: `components/issues/IssueBadge.tsx`
