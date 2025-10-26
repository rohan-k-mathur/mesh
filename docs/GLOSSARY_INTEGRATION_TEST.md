# Glossary Linking Test Plan - PropositionComposerPro Integration

## Test Setup
The glossary linking system has been integrated into `PropositionComposerPro`. The component now includes:
- **GlossaryEditorToolbar**: Provides "Link Term" button and Preview toggle
- **Edit/Preview Modes**: Toggle between editing with `[[termId:Name]]` syntax and viewing rendered links
- **GlossaryText Component**: Auto-converts syntax to clickable blue underlined links in preview mode

## How to Test

### 1. Navigate to Proposition Composer
- Go to any deliberation page
- Click "Create Proposition" or "Reply" to open PropositionComposerPro

### 2. Test Term Linking Flow
1. **Click "Link Term" button** in the toolbar
   - Searchable dropdown should appear
   - Should show all glossary terms with status badges (CONSENSUS/CONTESTED/PENDING)
   
2. **Search for a term**
   - Type in search box (e.g., "democracy", "truth", "validity")
   - Results should filter in real-time
   
3. **Select a term**
   - Click on a term in the dropdown
   - Syntax `[[termId:TermName]]` should be inserted at cursor position
   - Dropdown should close automatically

### 3. Test Preview Mode
1. **Write text with glossary links**
   ```
   In a democratic society, epistemic humility is essential for truth-seeking discourse.
   ```
   
2. **Add term links** using "Link Term" button:
   ```
   In a [[term-2:democratic]] society, [[term-4:epistemic humility]] is essential for [[term-1:truth]]-seeking discourse.
   ```
   
3. **Toggle Preview** (click Eye icon)
   - Text should render with blue underlined clickable links
   - Raw `[[...]]` syntax should be hidden
   - Links should match Wikipedia styling

### 4. Test Term Modal
1. **In preview mode, click a glossary link**
   - Modal should open with full TermCard
   - Should show:
     - Term name and status
     - All definitions (canonical first, then by endorsements)
     - Endorse buttons for each definition
     - "Propose Alternative Definition" button
     - "View History" and "View Usage" buttons
   
2. **Test modal interactions**
   - Click "Endorse" on a definition → should update count
   - Click "Propose Alternative" → should open submission modal
   - Click "View History" → should show all historical changes
   - Click "View Usage" → should show contexts where term is used
   - Click outside or close → modal should dismiss

### 5. Test Multiple Links
1. **Add multiple terms in one text**
   ```
   [[term-1:Truth]] differs from [[term-3:validity]]: the former concerns [[term-4:epistemic humility]], while the latter involves logical structure.
   ```
   
2. **Verify all links work**
   - Each link should be clickable independently
   - Each should open correct term modal

### 6. Test Edge Cases
- **Empty preview**: Toggle preview with no links → should show plain text
- **Invalid syntax**: Type `[[invalid]]` → should not render as link (needs termId:Name)
- **Cursor position**: Insert term at start, middle, end of text → all should work
- **Undo/edit**: Switch back to edit mode → raw syntax should be editable

## Expected Behavior

### Edit Mode
- ✅ Toolbar shows "Link Term" button and "Edit" mode indicator
- ✅ Textarea shows raw text with `[[termId:Name]]` syntax
- ✅ Can type, edit, delete syntax manually
- ✅ Clicking "Link Term" opens searchable picker
- ✅ Selecting term inserts syntax at cursor

### Preview Mode
- ✅ Toolbar shows Eye icon and "Preview" indicator
- ✅ Text renders with blue underlined links (no raw `[[]]`)
- ✅ Links have cyan-400 color with underline
- ✅ Hover shows pointer cursor
- ✅ Clicking link opens GlossaryTermModal

### Modal Interactions
- ✅ Modal shows full TermCard with all definitions
- ✅ Can endorse definitions
- ✅ Can propose new definitions
- ✅ Can view history and usage
- ✅ Click outside closes modal

## Integration Points

### Files Modified
- `/components/propositions/PropositionComposerPro.tsx`:
  - Added imports: `GlossaryEditorToolbar`, `GlossaryText`
  - Added state: `showPreview`
  - Added toolbar above textarea
  - Conditional render: textarea (edit) vs GlossaryText (preview)

### Dependencies
- Uses existing `insertAtCursor` helper for syntax insertion
- Integrates with existing epistemic detection, reply context
- Preserves all original composer functionality (autosizing, validation, submit)

## Success Criteria
- [ ] Can open term picker and search terms
- [ ] Can select term and insert syntax at cursor
- [ ] Preview mode renders blue underlined links
- [ ] Clicking link opens modal with TermCard
- [ ] Can endorse, propose, view history from modal
- [ ] Can toggle between edit/preview seamlessly
- [ ] Multiple links in same text all work
- [ ] Submit proposition with glossary links succeeds

## Future Enhancements (Not in This Integration)
- Auto-suggest when typing words matching glossary terms
- Keyboard shortcut: `[[` triggers inline term picker
- Batch auto-link: automatically link all mentions
- Link analytics: track which terms are most linked

## Troubleshooting

### Links don't appear blue/underlined
- Ensure you're in **Preview mode** (Eye icon active)
- Check syntax is exactly `[[termId:Name]]` (colon required)

### Modal doesn't open when clicking link
- Verify GlossaryTermModal component is rendering
- Check browser console for errors
- Ensure term ID exists in database

### Picker dropdown doesn't show terms
- Verify seed data was run (`npm run seed:glossary`)
- Check `/api/glossary/terms` endpoint returns data
- Look for fetch errors in Network tab

### Syntax not inserted at cursor
- Click in textarea to set cursor position
- Ensure textarea has focus before clicking "Link Term"
