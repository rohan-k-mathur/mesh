# Critical Questions Phase 3 Integration Guide

## ✅ Phase 3 Complete - What's Working

Phase 3 of the CQ multi-layer response system is **fully functional** for claim-based critical questions using `CriticalQuestionsV3.tsx`.

### Currently Working:
- ✅ **Claim-level CQs** (in ClaimMiniMap) - Full Phase 3 features
- ✅ 7 Glass morphism components with animations
- ✅ Submit/view/endorse/approve/reject responses
- ✅ Activity timeline with pagination
- ✅ Canonical response management
- ✅ Permission-based UI (moderators see extra options)
- ✅ Real-time SWR cache invalidation

---

## 🔧 Remaining Integration: Argument-Based CQs

### 1. SchemeSpecificCQsModal Integration

**Location**: `components/arguments/SchemeSpecificCQsModal.tsx`

**Current State**: 
- Uses legacy "ask CQ" system (simple objection forms)
- Posts REBUTS/UNDERCUTS/UNDERMINES directly as conflict applications
- No multi-layer response system

**Integration Strategy**:

#### Option A: Add Response System to Existing CQs (Recommended)

Add Phase 3 response features alongside the existing objection forms:

```tsx
// Add imports at top
import { CQResponsesList } from "@/components/claims/CQResponsesList";
import { CQActivityFeed } from "@/components/claims/CQActivityFeed";
import { CQResponseForm } from "@/components/claims/CQResponseForm";

// In expanded CQ section, after the objection form:
{isExpanded && (
  <div className="mt-4 space-y-4">
    {/* Existing objection form */}
    <div className="p-3 bg-white/70 rounded-lg border border-slate-200">
      {/* ... existing REBUTS/UNDERCUTS/UNDERMINES forms ... */}
    </div>

    {/* NEW: Phase 3 Response System */}
    <div className="border-t border-slate-300 pt-4 mt-4">
      <div className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">
        Community Responses
      </div>
      
      {/* Submit Response Button */}
      <CQResponseForm
        targetType="argument"
        targetId={argumentId}
        cqKey={cq.cqKey}
        cqText={cq.text}
        onSuccess={() => {
          // Refresh responses list
        }}
        trigger={
          <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            Submit Response
          </button>
        }
      />

      {/* View Responses */}
      <CQResponsesList
        targetType="argument"
        targetId={argumentId}
        cqKey={cq.cqKey}
        trigger={
          <button className="w-full mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors">
            View Responses
          </button>
        }
      />

      {/* Activity Timeline */}
      <CQActivityFeed
        targetType="argument"
        targetId={argumentId}
        cqKey={cq.cqKey}
        trigger={
          <button className="w-full mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
            Activity Timeline
          </button>
        }
      />
    </div>
  </div>
)}
```

#### Option B: Replace with CriticalQuestionsV3 (Advanced)

Completely replace SchemeSpecificCQsModal with CriticalQuestionsV3:

```tsx
import { CriticalQuestionsV3 } from "@/components/claims/CriticalQuestionsV3";

// Replace entire modal with:
<CriticalQuestionsV3
  targetType="argument"
  targetId={argumentId}
  schemeKey={meta?.scheme?.key}
/>
```

**Recommendation**: Use **Option A** first to preserve existing objection workflow while adding Phase 3 features.

---

### 2. CQAuthorDashboard Integration in DeepDiveV2

**Location**: `components/deepdive/DeepDivePanelV2.tsx`

**Purpose**: Show moderators all pending CQ responses across the deliberation.

#### Step 1: Add Import

```tsx
// Add at top with other imports (around line 52)
import { CQAuthorDashboard } from "@/components/claims/CQAuthorDashboard";
```

#### Step 2: Add Tab Trigger

Find the `TabsList` section (around line 1326) and add:

```tsx
<TabsList className="grid-cols-6">  {/* Update grid cols */}
  <TabsTrigger value="debate">Debate</TabsTrigger>
  <TabsTrigger value="models">Models</TabsTrigger>
  <TabsTrigger value="ludics">Ludics</TabsTrigger>
  <TabsTrigger value="issues">Issues</TabsTrigger>
  <TabsTrigger value="cq-review">CQ Review</TabsTrigger>  {/* NEW */}
</TabsList>
```

#### Step 3: Add Tab Content

After the existing `TabsContent` sections, add:

```tsx
{/* NEW: CQ Review Tab */}
<TabsContent value="cq-review" className="space-y-4">
  <div className="p-4 bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl border-2 border-sky-200">
    <h3 className="text-lg font-bold text-sky-900 mb-2">
      Critical Question Review Dashboard
    </h3>
    <p className="text-sm text-sky-700">
      Review and moderate community responses to critical questions across all claims and arguments.
    </p>
  </div>

  <CQAuthorDashboard
    deliberationId={deliberationId}
    currentUserId={userId}
  />
</TabsContent>
```

> **Note**: The tab is available to all users. The CQAuthorDashboard component itself handles permission-based UI, showing approve/reject buttons only to moderators.

---

## 🎯 Quick Integration Checklist

### For SchemeSpecificCQsModal:
- [ ] Add imports for CQResponsesList, CQActivityFeed, CQResponseForm
- [ ] Add "Community Responses" section in expanded CQ
- [ ] Add Submit Response button with CQResponseForm
- [ ] Add View Responses button with CQResponsesList  
- [ ] Add Activity Timeline button with CQActivityFeed
- [ ] Test with argument-based CQs
- [ ] Verify SWR cache invalidation works

### For DeepDivePanelV2:
- [ ] Import CQAuthorDashboard component
- [ ] Add "CQ Review" tab trigger
- [ ] Update grid-cols count in TabsList
- [ ] Add TabsContent with CQAuthorDashboard
- [ ] Pass deliberationId and currentUserId props
- [ ] Test dashboard displays pending responses
- [ ] Verify approve/reject actions work (moderators only)

---

## 📍 File Locations Reference

### Phase 3 Components (All Ready to Use)
```
components/claims/
├── CQResponseForm.tsx          # Submit response modal
├── CQResponseCard.tsx          # Individual response card
├── CQResponsesList.tsx         # Tabbed responses list
├── CQAuthorDashboard.tsx       # Moderator review panel ← Use in DeepDiveV2
├── CQStatusBadge.tsx           # Status indicators
├── CQActivityFeed.tsx          # Activity timeline
└── CQEndorseModal.tsx          # Endorsement modal
```

### Integration Targets
```
components/arguments/
└── SchemeSpecificCQsModal.tsx  # Add Phase 3 features here

components/deepdive/
└── DeepDivePanelV2.tsx         # Add CQAuthorDashboard tab here (line ~1326)
```

### API Endpoints (Already Working)
```
app/api/cqs/
├── route.ts                    # GET/POST CQ status
├── responses/
│   ├── submit/route.ts         # Submit response
│   ├── [id]/approve/route.ts   # Approve response
│   ├── [id]/reject/route.ts    # Reject response
│   ├── [id]/vote/route.ts      # Vote on response
│   ├── [id]/endorse/route.ts   # Endorse response
│   └── [id]/withdraw/route.ts  # Withdraw response
├── status/canonical/route.ts   # Set canonical response
└── activity/route.ts           # Get activity log
```

---

## 🧪 Testing Steps

### After SchemeSpecificCQsModal Integration:
1. Open an argument with scheme-specific CQs
2. Expand a CQ in the modal
3. Click "Submit Response" → verify modal opens
4. Submit a response → verify it appears in "View Responses"
5. Click "Activity Timeline" → verify events show
6. Test voting/endorsing on responses
7. Test moderator approve/reject actions

### After DeepDivePanelV2 Integration:
1. Open a deliberation
2. Click "CQ Review" tab
3. Verify pending responses appear
4. Click "Approve" → verify response status updates
5. Click "Reject" → verify rejection reason modal
6. Check SWR cache updates across all CQ components
7. Verify badge counts update in real-time

---

## 🎨 Design Notes

All Phase 3 components use:
- **Glass morphism** light mode design
- **Animated water droplets** on glass surfaces
- **Radial lighting effects** for depth
- **Sky/cyan/indigo** color palette
- **Smooth transitions** (200-300ms)
- **Custom scrollbars** with sky theme
- **Empty states** with helpful messaging
- **Loading states** with spinners
- **Permission-based UI** (moderators see extra options)

---

## 🚀 Next Steps

1. **Integrate SchemeSpecificCQsModal** (15-20 minutes)
   - Add Phase 3 components to expanded CQ section
   - Test with argument-based CQs
   
2. **Add CQAuthorDashboard to DeepDiveV2** (10 minutes)
   - Add new tab for moderators
   - Test review workflow

3. **Test End-to-End** (30 minutes)
   - Create responses on both claims and arguments
   - Test moderation workflow
   - Verify cache invalidation across all UIs

4. **Phase 4: Notifications** (Future)
   - Email notifications for response approvals
   - In-app notifications for mentions
   - Digest emails for moderators

5. **Phase 5: Reputation System** (Future)
   - Track response quality scores
   - Leaderboards for top contributors
   - Badges for expertise areas

---

## 📞 Support

If you encounter issues:
- Check browser console for errors
- Verify API endpoints return 200 status
- Check SWR cache with React DevTools
- Verify Prisma schema is up-to-date (`npx prisma generate`)
- Check database has all tables (`npx prisma db push`)

---

**Status**: Phase 3 ✅ Complete | Ready for Integration 🚀
