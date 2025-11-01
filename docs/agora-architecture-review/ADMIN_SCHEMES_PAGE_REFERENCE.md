# Admin Schemes Page - Quick Reference

**Page URL:** `/admin/schemes`

**Access from DeepDivePanel:** Look for the "Schemes" button (with gear icon) in the top-right corner next to the help button.

---

## How to Use

### 1. Create a New Scheme
1. Visit `/admin/schemes` (or click "Schemes" button in DeepDivePanel)
2. Click "Create Scheme" button
3. Fill in the form:
   - **Scheme Key:** Lowercase with underscores (e.g., `my_custom_scheme`)
   - **Display Name:** Human-readable name (e.g., "My Custom Scheme")
   - **Summary:** One-line description
   - **Description:** Optional detailed explanation
4. Fill in Macagno Taxonomy fields (optional but recommended):
   - Purpose, Source, Material Relation, Reasoning Type, Rule Form, Conclusion Type
5. Click **"Generate from Taxonomy"** button to auto-create baseline CQs
6. Manually add/edit/remove CQs as needed
7. Click "Create Scheme" to save

### 2. Edit Existing Scheme
1. Find the scheme in the list
2. Click the Edit icon (pencil)
3. Modify fields (note: key is immutable)
4. Click "Update Scheme"

### 3. Delete Scheme
1. Find the scheme in the list
2. Click the Delete icon (trash)
3. Confirm deletion
4. **Note:** Cannot delete if scheme is in use by existing arguments

### 4. Search & Filter
- Use the search bar to filter by key/name/summary
- Use the dropdown to filter by material relation

---

## CQ Generation Feature

The **"Generate from Taxonomy"** button automatically creates critical questions based on your taxonomy fields:

### Example: Expert Opinion Scheme
**Taxonomy:**
- Material Relation: `authority`
- Source: `external`
- Reasoning Type: `abductive`

**Generated CQs (7):**
1. "Is the authority sufficiently qualified in the relevant domain?" (UNDERMINES → premise)
2. "Is the authority credible (unbiased, reliable, consistent)?" (UNDERMINES → premise)
3. "Do other experts in the field agree with this claim?" (REBUTS → conclusion)
4. "Is the external source reliable and authoritative?" (UNDERMINES → premise)
5. "Has the source been cited accurately and in context?" (UNDERMINES → premise)
6. "Are the premises relevant to the conclusion?" (UNDERCUTS → inference)
7. "Are the premises sufficient to support the conclusion?" (UNDERCUTS → inference)

---

## Integration with Existing System

**Schemes are immediately available after creation:**
- Scheme inference (`lib/argumentation/schemeInference.ts`) will automatically score new schemes
- Arguments can use new schemes via `inferAndAssignScheme()`
- CQ status tracking works with all schemes

**No code changes needed!**

---

## Testing Workflow

1. **Create a test scheme:**
   - Key: `test_scheme`
   - Material Relation: `cause`
   - Generate CQs → should get ~8 CQs

2. **Verify scheme appears:**
   - Check if scheme shows in list
   - Verify taxonomy badges display correctly

3. **Test inference:**
   - Create an argument with causal language
   - Run scheme inference
   - Should return `test_scheme` with high score

4. **Clean up:**
   - Delete test scheme when done

---

## URL Reference

| Page | URL | Purpose |
|------|-----|---------|
| Admin Dashboard | `/admin/schemes` | Manage all schemes |
| Create Scheme | `/admin/schemes` + "Create Scheme" button | Create new scheme |
| Edit Scheme | `/admin/schemes` + Edit icon | Modify existing scheme |
| DeepDivePanel | Any deliberation page | "Schemes" button (top-right) |

---

**Quick Link:** <http://localhost:3000/admin/schemes> (when dev server running)
