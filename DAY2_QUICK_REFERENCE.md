# Day 2 Quick Reference Card

## 🎯 5-Minute Smoke Test

1. **Visit any deliberation**: `/room/[DELIBERATION_ID]`
2. **Click through all 9 tabs**: Debate → Arguments → Dialogue → Ludics → Admin → Sources → Thesis → ASPIC → Analytics
3. **Check**: No visual glitches? No console errors?
4. **Hover test**: Move mouse over any card header, see radial gradient?
5. **Dark mode toggle**: Still works?

**If all ✅ → Likely success! Continue with detailed tests.**

---

## 🔍 Critical Path Tests (30 min)

### Test A: Arguments Tab
- Argument cards render ✓
- Hover effect works ✓
- No console errors ✓

### Test B: Admin Tab (ChipBar)
- Works counts display (DN/IH/TC/OP) ✓
- ChipBar wraps if many items ✓

### Test C: Dark Mode
- Toggle dark mode ✓
- Re-check Arguments tab ✓
- Cards visible, good contrast ✓

### Test D: Mobile (iPhone SE - 375px)
- DevTools → Toggle device toolbar ✓
- Arguments tab, no overflow ✓
- Text truncates properly ✓

### Test E: StickyHeader Scroll
- Open left floating sheet ✓
- Scroll down ✓
- Header sticks at top ✓

---

## 🚨 Red Flags (Stop and Fix)

- **Console errors** mentioning SectionCard/ChipBar/StickyHeader
- **Visual glitches** in any tab
- **Broken hover effects** (no radial gradient)
- **Dark mode broken** (invisible text)
- **Mobile overflow** (horizontal scrollbar)
- **Performance regression** (> 500ms tab switch)

---

## ✅ Green Lights (Proceed)

- All 9 tabs render identically
- Hover effects smooth
- No console errors
- Dark mode works
- Mobile responsive
- Performance < 200ms

---

## 📞 Quick Commands

### Check for errors
```bash
# In browser console
console.clear()
# Navigate through tabs, check for errors
```

### Performance timing
```javascript
performance.mark('start')
// Switch tab
performance.mark('end')
performance.measure('tab', 'start', 'end')
console.table(performance.getEntriesByType('measure'))
```

### Check StickyHeader cleanup
```javascript
// Before opening sheet
getEventListeners(window).scroll.length
// After opening/closing sheet 20x
getEventListeners(window).scroll.length
// Should be same number (no leak)
```

---

## 📋 Minimal Acceptance

**To pass Day 2**:
1. ✅ All 9 tabs render without errors
2. ✅ Hover effects work
3. ✅ Dark mode works
4. ✅ Mobile doesn't overflow
5. ✅ No new console errors

**If these 5 pass → Deploy to staging tomorrow!**

---

## 📝 Quick Issue Template

**Issue**: [Brief description]  
**Severity**: Critical / Major / Minor  
**Location**: [Tab name]  
**Expected**: [What should happen]  
**Actual**: [What happens]  
**Screenshot**: [Yes/No]

---

## ⏱️ Time Budget

- 5-min smoke test: **START HERE**
- 30-min critical path: **If smoke test passes**
- 90-min full test: **If time permits**

**Minimum for Day 2**: Smoke test + critical path = **35 minutes**

---

## 🎓 What You're Looking For

### Good Signs ✅
- Everything looks identical
- Smooth animations
- Clean console
- Fast tab switching

### Bad Signs 🚨
- Missing styles
- Broken layouts
- Console errors
- Slow rendering
- Dark mode issues

---

## 📞 Help Commands

### Find deliberation ID
```sql
-- In database
SELECT id, title FROM "Deliberation" LIMIT 5;
```

### Check build
```bash
npm run build
# Should succeed with no new errors
```

### Restart dev server (if needed)
```bash
# Kill process on :3000
lsof -ti:3000 | xargs kill -9
# Restart
yarn dev
```

---

## 🎯 Today's Goal

**Verify**: Extraction was perfect, zero regressions

**Outcome**: Confidence to proceed to Week 2

**Success = Everything boring** (no surprises, no issues, identical behavior)

---

**Remember**: We WANT boring results. Boring = success! 🎉
