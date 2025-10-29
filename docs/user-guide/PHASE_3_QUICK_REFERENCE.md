# Phase 3 Features - Quick Reference Guide

**Last Updated**: October 29, 2025  
**Status**: ✅ All features fully functional

---

## How to Access Each Feature

### 1. DS Mode Toggle
**Path**: Any deliberation page → Header (next to Confidence dropdown)  
**Action**: Click "DS Mode: OFF" button to toggle ON/OFF  
**Effect**: Changes confidence displays from single values to [belief, plausibility] intervals

---

### 2. Dialogue State Badge
**Path**: Deliberation page → **Models tab** → AIFArgumentsListPro → Argument card header  
**Appearance**: Badge showing "X/Y ✓" (e.g., "2/5 ✓")  
**Meaning**: Shows how many attacks have been answered out of total  
**Colors**:
- 🟢 Green: All attacks answered
- 🟡 Amber: Some attacks answered
- ⚪ Gray: No attacks answered

---

### 3. Stale Argument Badge
**Path**: Deliberation page → **Models tab** → AIFArgumentsListPro → Argument card header  
**Appearance**: Badge showing "⏰ X days" (e.g., "⏰ 12 days")  
**Condition**: Only appears for arguments older than 7 days  
**Purpose**: Indicates temporal decay affecting confidence

---

### 4. DS-Aware Confidence Display
**Path**: Deliberation page → **Models tab** → AIFArgumentsListPro → Argument card header  
**Appearance**:
- DS Mode OFF: "82%"
- DS Mode ON: "[65.6% – 91.8%]"
**Updates**: Automatically when DS Mode is toggled

---

### 5. Assumptions Tab
**Path**: Deliberation page → **Assumptions tab** (in main tab bar)  
**Sections**:
- **Create Assumption Form**: Enter text and click Create
- **Active Assumptions Panel**: List of all assumptions with Accept/Challenge buttons

**Actions Available**:
- Create new assumption
- Accept assumption (marks as accepted)
- Challenge assumption (opens challenge form)
- View assumption dependencies

---

### 6. Hom-Sets Tab
**Path**: Deliberation page → **Hom-Sets tab** (in main tab bar)  
**Content**: Bar chart comparing argument hom-set confidence  
**Features**:
- Arguments sorted by confidence (descending)
- Shows incoming attack count for each argument
- Click argument to navigate to it in Debate tab
- Average confidence reference line

---

## Quick Troubleshooting

### "DS Mode toggle doesn't change displays"
- Check: Are you viewing argument cards in **Models tab**?
- Check: Do arguments have confidence data from API?
- Solution: Toggle DS mode, then navigate to **Models tab** and scroll to AIFArgumentsListPro

### "Stale badge not appearing"
- Check: Is argument older than 7 days?
- Check: Does API return `updatedAt` field?
- Solution: Badge only shows for arguments > 7 days old

### "Dialogue badge shows 0/0"
- Meaning: Argument has no attacks yet
- Normal: Badge should be gray/neutral color
- Create attack to see badge update

### "Hom-Sets tab shows empty state"
- Check: Does deliberation have arguments?
- Check: Network tab for API errors
- Solution: Create arguments first, then refresh Hom-Sets tab

---

## Component Integration Map

```
DeepDivePanelV2 (Main Container)
├─ Header
│  ├─ Confidence dropdown
│  └─ DS Mode Toggle ⭐ (Phase 3)
│
├─ Debate Tab
│  ├─ PropositionComposerPro
│  ├─ PropositionsList
│  ├─ ClaimMiniMap
│  └─ DialogueInspector
│
├─ Models Tab
│  ├─ AIFAuthoringPanel
│  └─ AIFArgumentsListPro ⭐ (ArgumentCardV2 with Phase 3 badges)
│     └─ ArgumentCardV2
│        ├─ DialogueStateBadge ⭐ (Phase 3)
│        ├─ StaleArgumentBadge ⭐ (Phase 3)
│        └─ ConfidenceDisplay (DS-aware) ⭐ (Phase 3)
│
├─ Assumptions Tab ⭐ (Phase 3)
│  ├─ CreateAssumptionForm
│  └─ ActiveAssumptionsPanel
│     └─ AssumptionCard
│
└─ Hom-Sets Tab ⭐ (Phase 3)
   └─ HomSetsTab
      └─ HomSetComparisonChart
```

---

## Keyboard Shortcuts (if implemented)

- **Tab**: Navigate between elements
- **Enter/Space**: Activate DS Mode toggle
- **Arrow Keys**: Navigate tab bar
- **Escape**: Close modals/forms

---

## Browser Support

**Tested On**:
- ✅ Chrome 118+ (recommended)
- ✅ Firefox 118+
- ✅ Safari 17+
- ✅ Edge 118+

**Mobile**:
- ✅ iOS Safari 17+
- ✅ Chrome Mobile 118+

---

## API Endpoints Used

| Feature | Endpoint | Method |
|---------|----------|--------|
| Arguments List | `/api/deliberations/{id}/arguments/aif` | GET |
| Hom-Sets Data | `/api/deliberations/{id}/arguments/aif?limit=50` | GET |
| Assumptions | `/api/assumptions?deliberationId={id}` | GET |
| Create Assumption | `/api/assumptions` | POST |

---

## Performance Tips

1. **For large deliberations (50+ arguments)**:
   - Hom-Sets tab limits to 20 arguments for performance
   - Arguments list uses virtualization for smooth scrolling

2. **DS Mode toggle**:
   - Updates are instant (no API calls)
   - Only re-renders visible argument cards

3. **Tab switching**:
   - Data is cached between switches
   - Revalidation happens in background

---

## Contact & Support

**Issues**: Report bugs via GitHub Issues  
**Documentation**: See `/docs/testing/` folder  
**Demo**: [Link to demo video when available]

---

**Phase 3 Status**: ✅ Fully Functional & Production-Ready
