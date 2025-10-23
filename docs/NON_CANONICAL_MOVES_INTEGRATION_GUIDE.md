# Non-Canonical Moves - Integration Guide

Complete guide for integrating the Non-Canonical Moves feature into your Mesh deliberation views.

## 📦 What's Included

### Components
1. **NonCanonicalResponseForm** - Modal form for submitting community responses
2. **PendingResponsesList** - List of pending responses for author approval
3. **PendingResponsesPanel** - Wrapper with button/inline variants
4. **CommunityResponsesTab** - Display approved community contributions
5. **ClarificationRequestButton** - Request clarifications
6. **CommunityResponseBadge** - Visual count indicator

### API Endpoints
- `POST /api/non-canonical/submit`
- `GET /api/non-canonical/pending`
- `POST /api/non-canonical/approve`
- `POST /api/non-canonical/reject`
- `GET /api/non-canonical/by-target`
- `POST /api/clarification/request`
- `GET /api/clarification/list`

---

## ✅ Completed Integrations

### 1. AttackMenuProV2 ✅
**Location**: `components/arguments/AttackMenuProV2.tsx`

**What was added**:
- New "Community" tab with badge showing response count
- "Help Defend This Argument" button opens NonCanonicalResponseForm
- CommunityResponsesTab displays approved responses
- Auto-switches to Community tab after successful submission

**Usage**: Already integrated! Open any AttackMenuProV2 and click the Community tab.

```tsx
// The integration looks like this:
<TabsTrigger value="community">
  <Users className="w-4 h-4" />
  Community
  <CommunityResponseBadge targetId={target.id} targetType="argument" />
</TabsTrigger>
```

### 2. ArgumentCard ✅
**Location**: `components/arguments/ArgumentCard.tsx`

**What was added**:
- CommunityResponseBadge in the card header (next to CQ badges)
- Badge only appears if there are approved/executed responses

**Usage**: Already integrated! ArgumentCards now show community response counts.

```tsx
<CommunityResponseBadge
  targetId={id}
  targetType="argument"
  variant="compact"
/>
```

---

## 🔧 How to Add to Deliberation Views

### Option 1: Button Variant (Recommended for Headers/Toolbars)

Add a floating button that opens a modal with pending responses:

```tsx
import { PendingResponsesPanel } from "@/components/agora/PendingResponsesPanel";

export default function DeliberationView({ deliberationId }: { deliberationId: string }) {
  return (
    <div>
      {/* Your existing deliberation UI */}
      <div className="flex items-center gap-2 mb-4">
        <h1>Deliberation</h1>
        
        {/* Add this button */}
        <PendingResponsesPanel
          deliberationId={deliberationId}
          variant="button"
          onResponseHandled={() => {
            // Optional: refresh your deliberation data
            console.log("Response handled!");
          }}
        />
      </div>
      
      {/* Rest of your content */}
    </div>
  );
}
```

### Option 2: Inline Variant (Recommended for Dashboard/Admin Views)

Embed the pending responses list directly in your page:

```tsx
import { PendingResponsesPanel } from "@/components/agora/PendingResponsesPanel";

export default function AuthorDashboard({ deliberationId }: { deliberationId: string }) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Deliberation Dashboard</h1>
      
      {/* Inline pending responses */}
      <PendingResponsesPanel
        deliberationId={deliberationId}
        variant="inline"
        onResponseHandled={() => {
          // Refresh data if needed
        }}
      />
      
      {/* Other dashboard content */}
    </div>
  );
}
```

### Option 3: Direct Component Usage (Maximum Control)

Use `PendingResponsesList` directly for custom layouts:

```tsx
import { PendingResponsesList } from "@/components/agora/PendingResponsesList";

export default function CustomView({ deliberationId }: { deliberationId: string }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        {/* Left column: Your content */}
        <h2>Arguments</h2>
        {/* ... */}
      </div>
      
      <div>
        {/* Right column: Pending responses */}
        <PendingResponsesList
          deliberationId={deliberationId}
          onResponseHandled={() => {
            console.log("Response handled!");
          }}
          className="sticky top-4"
        />
      </div>
    </div>
  );
}
```

---

## 🎨 Customization Examples

### Show Community Responses for a Claim

```tsx
import { CommunityResponsesTab } from "@/components/agora/CommunityResponsesTab";

<CommunityResponsesTab
  targetId="claim-123"
  targetType="claim"
  status="APPROVED,EXECUTED" // optional, defaults to both
  className="mt-4"
/>
```

### Add "Help Defend" to Any Component

```tsx
import { NonCanonicalResponseForm } from "@/components/agora/NonCanonicalResponseForm";
import { useState } from "react";

function MyComponent({ claimId, deliberationId }) {
  const [formOpen, setFormOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setFormOpen(true)}>
        Help defend this claim
      </button>
      
      <NonCanonicalResponseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        deliberationId={deliberationId}
        targetType="claim"
        targetId={claimId}
        targetLabel="Claim: All humans are mortal"
        onSuccess={(ncmId) => {
          console.log("Submitted:", ncmId);
          setFormOpen(false);
        }}
      />
    </>
  );
}
```

### Add Clarification Request Button

```tsx
import { ClarificationRequestButton } from "@/components/agora/ClarificationRequestButton";

<ClarificationRequestButton
  deliberationId={deliberationId}
  targetType="argument"
  targetId={argumentId}
  targetLabel="Argument: Socrates is mortal"
  variant="outline"
  size="sm"
  onSuccess={(clarificationId) => {
    console.log("Clarification requested:", clarificationId);
  }}
/>
```

---

## 🔐 Permissions & Security

### Built-in Rules
1. **R1**: Users cannot submit non-canonical responses for their own content
2. **R2**: Only the original author can approve/reject responses
3. **R3**: Users can't have duplicate pending responses for the same target

### Validation
All API endpoints validate:
- Authentication (via `getCurrentUserId()`)
- Authorization (author ownership checks)
- Data integrity (target existence, status transitions)

---

## 📊 Data Flow

```
User → NonCanonicalResponseForm → POST /api/non-canonical/submit
                                        ↓
                                  NonCanonicalMove (PENDING)
                                        ↓
                        PendingResponsesList (author sees)
                                        ↓
              Approve → POST /api/non-canonical/approve
                                        ↓
                         NonCanonicalMove (APPROVED/EXECUTED)
                                        ↓
                           CommunityResponsesTab (public)
```

---

## 🎯 Next Steps

### Phase 4: Testing & Polish
- [ ] Write unit tests for components
- [ ] Add notification system (email/in-app)
- [ ] Emit bus events for real-time updates
- [ ] Add analytics tracking
- [ ] Performance optimization
- [ ] Accessibility audit

### Recommended Order
1. Test the AttackMenuProV2 integration (already complete)
2. Add PendingResponsesPanel to your main deliberation view
3. Monitor usage and gather feedback
4. Iterate on UX based on real usage

---

## 💡 Tips

1. **Auto-refresh**: All components use SWR with auto-refresh (10-30s intervals)
2. **Optimistic UI**: Consider adding optimistic updates for better UX
3. **Loading states**: All components have built-in loading/error/empty states
4. **Mobile-friendly**: All components are responsive and touch-friendly
5. **Type-safe**: All props are fully typed with exported TypeScript interfaces

---

## 🐛 Troubleshooting

**Q: Badge not showing up?**
A: Badge only renders if count > 0. Check that there are approved/executed responses.

**Q: Form submission fails?**
A: Check console for error messages. Common issues:
- User is the author (R1 violation)
- Duplicate pending response exists
- Missing required fields

**Q: Pending list empty?**
A: Only shows moves where current user is the author. Make sure you're logged in as the correct user.

---

## 📚 Resources

- **Full Spec**: `docs/NON_CANONICAL_MOVES_SPEC.md`
- **UI Design**: `docs/NON_CANONICAL_MOVES_UI.md`
- **Database Schema**: `docs/NON_CANONICAL_MOVES_SCHEMA.md`
- **Quick Reference**: `docs/NON_CANONICAL_MOVES_QUICK_REF.md`
- **Progress Tracker**: `docs/NON_CANONICAL_MOVES_IMPLEMENTATION_PROGRESS.md`

For questions or issues, refer to these docs or check the implementation files.
