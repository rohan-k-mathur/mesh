# Argument CQ Quick Reference

## 🎯 What Was Built

**Goal:** Enable critical questions on argument schemes (expert_opinion, analogy, causal_reasoning) with full UX integration and SchemeComposerPicker claim search.

## 🚀 Quick Start

### For Users

**To ask critical questions on an argument:**

1. Find any argument in ArgumentCard component
2. Look for the **🟣 "Arg CQs"** button (purple border)
3. Click to open ArgumentCriticalQuestionsModal
4. Ask WHY on any unsatisfied CQ
5. Post GROUNDS via CommandCard or legal moves
6. Use **🔍 Search & attach counter-claim** to link existing claims

### For Developers

**Use ArgumentCriticalQuestionsModal:**
```tsx
import { ArgumentCriticalQuestionsModal } from "@/components/arguments/ArgumentCriticalQuestionsModal";

<ArgumentCriticalQuestionsModal
  open={isOpen}
  onOpenChange={setIsOpen}
  argumentId="arg_xyz"
  deliberationId="delib_123"
  roomId="room_456" // optional
  currentLens="default" // optional
  currentAudienceId="aud_789" // optional
/>
```

**Use CriticalQuestionsV2 for arguments:**
```tsx
import CriticalQuestionsV2 from "@/components/claims/CriticalQuestionsV2";

<CriticalQuestionsV2
  targetType="argument" // NEW: was claim-only before
  targetId={argumentId}
  deliberationId={deliberationId}
/>
```

**Fetch argument CQs via API:**
```bash
GET /api/cqs?targetType=argument&targetId=arg_xyz
```

## 📊 Visual Guide

### ArgumentCard Layout

```
┌─────────────────────────────────────────────────────┐
│ ✓ Conclusion: "Policy P is effective"              │
│   ┌────────────┐ ┌──────────┐ ┌─────────┐          │
│   │ SCHEME     │ │ Claim CQ │ │ Arg CQ  │          │
│   │ Expert     │ │ 75% 🟡   │ │ 50% 🟣  │          │
│   └────────────┘ └──────────┘ └─────────┘          │
│                                                     │
│   [Claim CQs] [Arg CQs] [Expand]                   │
│      ↓            ↓                                 │
│   Opens claim  Opens argument                      │
│   CQ modal     CQ modal                            │
└─────────────────────────────────────────────────────┘
```

### CQ Color Coding

| Type | Badge Color | Button Border | Focus |
|------|------------|---------------|-------|
| Claim CQ | 🟡 Amber | Indigo | Claim properties |
| Arg CQ | 🟣 Purple | Purple | Reasoning quality |

## 🔧 API Endpoints

### GET /api/cqs
**Fetch CQs for claim or argument**

```typescript
// Query params
{
  targetType: 'claim' | 'argument',
  targetId: string,
  scheme?: string // optional filter
}

// Response
{
  targetType: 'argument',
  targetId: 'arg_xyz',
  schemes: [
    {
      key: 'expert_opinion',
      title: 'Argument from Expert Opinion',
      cqs: [
        {
          key: 'E1',
          text: 'How credible is E as an expert source?',
          satisfied: false,
          groundsText: null,
          suggestion: {
            type: 'undercut',
            scope: 'inference',
            options: [...]
          }
        },
        // ... more CQs
      ]
    }
  ]
}
```

### POST /api/cqs/toggle
**Toggle CQ satisfaction**

```typescript
{
  targetType: 'claim' | 'argument',
  targetId: string,
  schemeKey: string,
  cqKey: string,
  satisfied: boolean,
  deliberationId: string,
  groundsText?: string, // Optional: persist response text
  attackerClaimId?: string // Optional: for attach flow
}
```

## 🎨 SchemeComposerPicker Integration

### Before (Old Pattern)
```tsx
// Manual search dialog with paste fallback
<Dialog>
  <Input />
  <Button onClick={manualSearch}>Search</Button>
  <Button onClick={manualPaste}>Paste ID</Button>
</Dialog>
```

### After (New Pattern)
```tsx
// One-liner with live search
<SchemeComposerPicker
  kind="claim"
  open={open}
  onClose={() => setOpen(false)}
  onPick={(claim) => attachClaim(claim.id)}
/>
```

**Usage Locations:**
1. ✅ CriticalQuestionsV2 - "Attach existing counter-claim"
2. ✅ DialogueInspector - "Find Claim" in CQs tab
3. ✅ AttackMenuPro - Rebut/undermine claim selection
4. ✅ SchemeComposer - Premise/conclusion selection

## 📝 Component Hierarchy

```
ArgumentCard
├── Claim CQ Dialog (existing)
│   └── CriticalQuestionsV2 (targetType="claim")
│       └── SchemeComposerPicker (NEW)
├── ArgumentCriticalQuestionsModal (NEW)
│   └── CriticalQuestionsV2 (targetType="argument")
│       └── SchemeComposerPicker (NEW)
```

## 🧪 Testing Workflow

### 1. Create Test Argument
```sql
-- Argument with expert_opinion scheme
INSERT INTO "Argument" (id, conclusionId, schemeId, ...)
VALUES ('arg_test', 'claim_conclusion', 'scheme_expert_opinion', ...);

-- Link to scheme (creates CQs automatically)
INSERT INTO "SchemeInstance" (targetType, targetId, schemeId, ...)
VALUES ('argument', 'arg_test', 'scheme_expert_opinion', ...);
```

### 2. Open Argument CQ Modal
- Navigate to ArgumentCard with `id='arg_test'`
- Look for purple "Arg CQ X%" badge
- Click "Arg CQs" button

### 3. Test CQ Operations
- **WHY**: Click "Ask WHY" → opens NLCommitPopover
- **GROUNDS**: Post grounds text → verify `CQStatus.groundsText` saved
- **Toggle**: Check "Addressed" → verify `CQStatus.satisfied = true`
- **Attach**: Click "🔍 Search & attach" → use SchemeComposerPicker

### 4. Verify Persistence
```sql
-- Check CQ satisfaction
SELECT * FROM "CQStatus" 
WHERE targetType = 'argument' 
  AND targetId = 'arg_test';

-- Check dialogue moves
SELECT * FROM "DialogueMove"
WHERE targetId = 'arg_test'
  AND kind IN ('WHY', 'GROUNDS');
```

## 🐛 Troubleshooting

### Issue: "Arg CQs" button not showing

**Check:**
1. Does argument have a scheme? (`Argument.schemeId` not null)
2. Does SchemeInstance exist for the argument?
3. Does ArgumentScheme have `cq` JSON array populated?

**Solution:**
```typescript
// Verify scheme instance
const instance = await prisma.schemeInstance.findFirst({
  where: { targetType: 'argument', targetId: argumentId },
  include: { scheme: true }
});
console.log('Scheme CQs:', instance?.scheme?.cq);
```

### Issue: SchemeComposerPicker not opening

**Check:**
1. Is `attachExistingFor` state set correctly?
2. Is modal rendering in DOM tree (check z-index conflicts)?

**Solution:**
```tsx
// Debug state
console.log('attachExistingFor:', attachExistingFor);
console.log('pickerOpen:', !!attachExistingFor);
```

### Issue: CQ toggle fails with 409

**Cause:** CQ requires attached counter-claim before marking satisfied

**Solution:**
1. Click "🔍 Search & attach counter-claim"
2. Select or create counter-claim
3. Then toggle satisfied checkbox

## 📚 Related Files

### Core Components
- `components/claims/CriticalQuestionsV2.tsx` - Main CQ component
- `components/arguments/ArgumentCriticalQuestionsModal.tsx` - Argument CQ modal
- `components/arguments/ArgumentCard.tsx` - Dual CQ display
- `components/SchemeComposerPicker.tsx` - Entity search modal

### API Routes
- `app/api/cqs/route.ts` - Fetch CQs
- `app/api/cqs/toggle/route.ts` - Toggle satisfaction
- `app/api/cqs/attachments/route.ts` - Track attachments

### Documentation
- `ARGUMENT_CQ_INTEGRATION_COMPLETE.md` - Full implementation summary
- `CLAIM_LEVEL_CQ_SYSTEM.md` - Claim CQ architecture
- `CQ_PERSISTENCE_IMPLEMENTATION.md` - Grounds text persistence

## 🎓 Best Practices

### Do ✅
- Use purple styling for argument CQs (consistency)
- Always pass deliberationId to CQ components
- Test both claim and argument CQ flows
- Use SchemeComposerPicker for all entity search
- Persist groundsText when posting GROUNDS

### Don't ❌
- Don't mix claim and argument CQ UIs
- Don't skip deliberationId (needed for moves)
- Don't bypass SchemeComposerPicker for claim search
- Don't assume CQ toggle always succeeds (may need attachment)
- Don't forget to revalidate caches after mutations

## 💡 Tips

1. **Color Coding**: Use badge color to quickly identify CQ type
2. **Search First**: Try SchemeComposerPicker before creating new claims
3. **Grounds Text**: Always fill in why CQ is satisfied (persists forever)
4. **Batch Operations**: Use LegalMoveChips for multiple WHY/GROUNDS in sequence
5. **Navigation**: Use DialogueInspector's "Find Claim" for quick claim lookup

---

**Quick Links:**
- [Full Implementation Guide](./ARGUMENT_CQ_INTEGRATION_COMPLETE.md)
- [Component Docs](./components/arguments/ArgumentCriticalQuestionsModal.tsx)
- [API Reference](./app/api/cqs/route.ts)
