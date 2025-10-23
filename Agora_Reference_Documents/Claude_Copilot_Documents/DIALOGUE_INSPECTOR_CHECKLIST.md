# Dialogue Inspector - Getting Started Checklist

## ✅ Installation Complete

The following files have been created:

- [x] `components/dialogue/DialogueInspector.tsx` - Main component
- [x] `app/(app)/test/dialogue-inspector/page.tsx` - Test page
- [x] `DIALOGUE_INSPECTOR_GUIDE.md` - Full documentation
- [x] `DIALOGUE_INSPECTOR_README.md` - Quick start
- [x] `DIALOGUE_INSPECTOR_IMPLEMENTATION_SUMMARY.md` - Technical summary
- [x] `DIALOGUE_INSPECTOR_VISUAL_ARCHITECTURE.md` - Architecture diagrams
- [x] `DIALOGUE_INSPECTOR_CHECKLIST.md` - This file

## 🚀 Quick Start (5 Minutes)

### Step 1: Start Your Dev Server
```bash
cd /Users/rohanmathur/Documents/Documents/mesh
npm run dev
# or
yarn dev
```

### Step 2: Navigate to Test Page
Open browser: `http://localhost:3000/test/dialogue-inspector`

### Step 3: Get Real IDs from Your System

**Option A: From Browser Console**
```javascript
// Open your app, go to any deliberation
// Open DevTools console (F12)
console.log("Deliberation ID:", deliberationId);
console.log("Selected Claim ID:", selectedClaimId);
```

**Option B: From Your Logs**
Look for IDs in your terminal output (you shared these earlier):
```
Deliberation: cmgy6c8vz0000c04w4l9khiux
Claim: cmgzyuusc000ec0leqk4cf26g
Argument: cmh06rqke0045c05ooq3i5u45
```

**Option C: From Database**
```sql
SELECT id, text FROM "Claim" LIMIT 10;
SELECT id FROM "Deliberation" LIMIT 5;
```

### Step 4: Enter IDs in the Form

1. Paste **Deliberation ID**: `cmgy6c8vz0000c04w4l9khiux`
2. Select **Target Type**: `claim`
3. Paste **Target ID**: `cmgzyuusc000ec0leqk4cf26g`
4. Leave **Locus Path**: `0` (default)
5. Click **🔍 Inspect**

### Step 5: Explore the Tabs

- **📊 Overview**: See quick stats and target info
- **💬 Moves**: Expand moves to see full details
- **⚖️ Legal Actions**: Check which actions are available/disabled
- **❓ CQs**: See critical questions status (claims only)
- **🔧 Raw Data**: Inspect exact API responses

## 📋 Testing Checklist

### Basic Functionality
- [ ] Page loads at `/test/dialogue-inspector`
- [ ] Form accepts deliberation ID
- [ ] Form accepts target ID
- [ ] "Inspect" button triggers component render
- [ ] All 5 tabs are visible

### Data Fetching
- [ ] Target data loads (check Overview tab)
- [ ] Moves data loads (check Moves tab)
- [ ] Legal moves data loads (check Legal Actions tab)
- [ ] CQs data loads (check CQs tab - claims only)
- [ ] Raw data shows JSON (check Raw Data tab)

### UI Interactions
- [ ] Tabs switch correctly
- [ ] Sections expand/collapse
- [ ] Move cards expand to show details
- [ ] Icons display correctly (⚔️ 🏳️ ● ✅ ⏳)
- [ ] Colors are correct (purple branding, status colors)

### Error Handling
- [ ] Empty states show when no data
- [ ] Invalid IDs show appropriate error
- [ ] Network errors are handled gracefully

## 🔧 Common Issues & Solutions

### Issue: "Page not found at /test/dialogue-inspector"

**Solution**: Make sure your dev server is running:
```bash
npm run dev
```
Then navigate to: `http://localhost:3000/test/dialogue-inspector`

---

### Issue: "No data appearing in tabs"

**Checklist**:
1. Are the IDs correct? (Check browser console for API errors)
2. Is the target in the same deliberation? (Verify in database)
3. Are APIs returning 200 status? (Check Network tab in DevTools)
4. Wait 3-5 seconds for legal-moves API (it's slow)

**Debug**:
- Open browser DevTools → Network tab
- Filter by "dialogue" or "cqs"
- Check response status and body

---

### Issue: "Legal moves showing as disabled"

**This is normal!** Check the `reason` field to understand why:
- "Already asked WHY for this CQ"
- "Branch is closed (†)"
- "Not your turn"

---

### Issue: "CQs tab is empty"

**Verify**:
- Are you inspecting a **claim**? (CQs only apply to claims, not arguments)
- Does this claim have critical questions? (Check in your main app)

---

### Issue: "TypeScript errors when compiling"

**Run**:
```bash
npx tsc --noEmit --pretty false 2>&1 | grep -i "DialogueInspector"
```

Should return no errors. If errors appear, check:
- All imports are correct
- React is installed
- SWR is installed

---

## 📖 Next Steps

### 1. Explore with Real Data (5 min)
- Use IDs from your production deliberations
- Check if moves match what users see in UI
- Verify CQ status is correct

### 2. Debug a Real Issue (10 min)
- Find a user-reported problem (e.g., "WHY button not showing")
- Open inspector for that claim
- Go to Legal Actions tab
- Read the `reason` field for disabled moves
- Fix the underlying issue

### 3. Integrate into DeepDivePanel (30 min)
Add a toggle button:
```tsx
// In DeepDivePanelV2.tsx
import { DialogueInspector } from "@/components/dialogue/DialogueInspector";
import { useState } from "react";

const [showInspector, setShowInspector] = useState(false);

// Add button to UI
<button
  onClick={() => setShowInspector(!showInspector)}
  className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700"
>
  🔍 Inspector
</button>

// Render inspector overlay
{showInspector && selectedNodeId && (
  <div className="fixed inset-y-0 right-0 w-1/2 overflow-auto bg-white shadow-2xl z-50">
    <button
      onClick={() => setShowInspector(false)}
      className="absolute top-4 right-4"
    >
      ✕
    </button>
    <DialogueInspector
      deliberationId={deliberationId}
      targetType={selectedNodeType}
      targetId={selectedNodeId}
      locusPath={currentLocusPath || "0"}
    />
  </div>
)}
```

### 4. Read the Documentation (15 min)
- `DIALOGUE_INSPECTOR_README.md` - Quick overview
- `DIALOGUE_INSPECTOR_GUIDE.md` - Complete guide
- `DIALOGUE_INSPECTOR_VISUAL_ARCHITECTURE.md` - Architecture diagrams

### 5. Share with Team (5 min)
Let your team know about:
- Test page URL: `/test/dialogue-inspector`
- What it shows (all dialogue state in one place)
- How to get IDs (console, logs, database)

---

## 🎯 Success Criteria

You'll know it's working when:

✅ **You can see target metadata**
- Text, IDs, timestamps all display correctly

✅ **Moves tab shows dialogue history**
- All moves for the target are listed
- Expanding shows full payload with dialogue acts

✅ **Legal actions show available moves**
- Enabled moves are highlighted
- Disabled moves show reasons

✅ **CQs show correct status**
- Answered questions marked with ✅
- Open questions marked with ⏳

✅ **Raw data tab shows JSON**
- All API responses are visible
- You can copy JSON for debugging

---

## 🆘 Need Help?

### Documentation
- **Quick Start**: `DIALOGUE_INSPECTOR_README.md`
- **Full Guide**: `DIALOGUE_INSPECTOR_GUIDE.md`
- **Architecture**: `DIALOGUE_INSPECTOR_VISUAL_ARCHITECTURE.md`
- **Implementation**: `DIALOGUE_INSPECTOR_IMPLEMENTATION_SUMMARY.md`

### Related Docs
- **CommandCard Actions**: `COMMANDCARD_ACTIONS_EXPLAINED.md`
- **Answer-and-Commit**: `ANSWER_AND_COMMIT_INTEGRATION_SUMMARY.md`
- **GROUNDS System**: `GROUNDS_EXPLANATION.md`

### Component Files
- **Component**: `components/dialogue/DialogueInspector.tsx`
- **Test Page**: `app/(app)/test/dialogue-inspector/page.tsx`

### Debug Mode
Add this to your console for verbose logging:
```javascript
localStorage.setItem("debug", "dialogue:*");
```

---

## ✨ Tips for Best Results

### 1. Use Recent Deliberations
Newer deliberations have more complete data (moves, CQs, etc.)

### 2. Test with Different Target Types
- Claims: Show CQs + all move types
- Arguments: Show moves but no CQs

### 3. Check Multiple Locus Paths
- `"0"` - Root level
- `"0.1"` - First sub-branch
- `"0.1.1"` - Nested deeper

### 4. Compare with UI
Open inspector side-by-side with your main app to verify data matches

### 5. Use Raw Data Tab for Bug Reports
Copy exact JSON when reporting issues

---

## 🎉 You're Ready!

The DialogueInspector is now installed and ready to use. Start exploring your dialogue system state with full visibility!

**Next**: Navigate to `/test/dialogue-inspector` and start inspecting! 🔍

---

**Created**: January 2025  
**Status**: ✅ Complete  
**Time to First Use**: ~5 minutes
