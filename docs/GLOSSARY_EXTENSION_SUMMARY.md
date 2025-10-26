# Glossary Feature Extension - Implementation Summary

## Overview
Extended the glossary/dictionary feature with full CRUD functionality and export capabilities.

## New Components Created

### 1. ViewHistoryModal (`components/glossary/ViewHistoryModal.tsx`)
- **Purpose**: Display edit history timeline for term definitions
- **Features**:
  - Timeline view with visual timeline connector
  - Shows `previousText` → `newText` changes
  - Displays change types: `created`, `edited`, `merged`, `endorsed`, `canonical_promoted`
  - Author attribution and timestamps
  - Color-coded change types with icons
  - Glassmorphic design matching existing UI

### 2. ProposeAlternativeModal (`components/glossary/ProposeAlternativeModal.tsx`)
- **Purpose**: Submit competing definitions for existing terms
- **Features**:
  - Definition field (2000 char limit)
  - Examples field (500 char limit, optional)
  - Sources field (optional)
  - Character counters
  - Auto-endorsement by author
  - Dispatches `glossary:updated` event
  - Success/error states with animations
  - Glassmorphic design

### 3. ViewUsageModal (`components/glossary/ViewUsageModal.tsx`)
- **Purpose**: Show where terms are referenced in claims/arguments
- **Features**:
  - Lists all usage entries with context snippets
  - Displays target type (claim/argument) with icons
  - "View" button for navigation (TODO: wire up navigation)
  - Usage count summary footer
  - Grouped by type (claims/arguments)
  - Glassmorphic design

### 4. ExportGlossaryButton (`components/glossary/ExportGlossaryButton.tsx`)
- **Purpose**: Export glossary in multiple formats
- **Features**:
  - **JSON Export**: Full structured data with metadata
    - Includes all definitions, endorsements, authors, timestamps
    - Usage counts and term status
    - Timestamp in filename
  - **Markdown Export**: Human-readable document
    - Grouped by term status (CONSENSUS/CONTESTED/PENDING/ARCHIVED)
    - Canonical definitions highlighted
    - Alternative definitions listed
    - Examples and sources included
  - **CSV Export**: Spreadsheet-compatible format
    - One row per definition
    - Includes term, status, author, endorsements, usage count
  - Dropdown menu with format descriptions
  - Loading and success states
  - Auto-download with timestamped filenames

## API Routes Created

### 1. `/api/glossary/terms/[termId]/history/route.ts`
- **Method**: GET
- **Purpose**: Fetch edit history for all definitions of a term
- **Returns**: Array of `GlossaryDefinitionHistory` entries with author info
- **Sorting**: Descending by `createdAt`

### 2. `/api/glossary/terms/[termId]/usage/route.ts`
- **Method**: GET
- **Purpose**: Fetch usage entries showing where term appears
- **Returns**: Array of `GlossaryTermUsage` entries
- **Sorting**: Descending by `createdAt`

## Updated Components

### TermCard (`components/glossary/TermCard.tsx`)
- Added state for three modals: `showHistory`, `showProposeAlternative`, `showUsage`
- Wired up footer buttons with `onClick` handlers and `stopPropagation`
- Render modals at bottom with proper props:
  - `termId`: term.id
  - `termName`: term.term
  - `onSuccess`: onUpdate callback
  - `onClose`: state setters

### DefinitionSheet (`components/glossary/DefinitionSheet.tsx`)
- Added `ExportGlossaryButton` import
- Integrated export button in header next to "Define a New Term" button
- Passes `deliberationId` and `terms` array to export button

## Functionality Implemented

### View History
1. User clicks "View History" button (when term card is expanded)
2. Modal opens and fetches `/api/glossary/terms/[termId]/history`
3. Timeline displays all changes with:
   - Change type badges (created/edited/merged/promoted)
   - Author names and timestamps
   - Visual diff for edits (previousText strikethrough → newText)
   - Vertical timeline connector with colored dots
4. Empty state shown if no history exists

### Propose Alternative
1. User clicks "Propose Alternative" button (when term card is expanded)
2. Modal opens with form fields
3. User enters definition (required), examples (optional), sources (optional)
4. On submit:
   - POST to `/api/glossary/terms/[termId]/definitions`
   - Auto-endorsement created for author
   - Term status updated to CONTESTED if multiple definitions exist
   - `glossary:updated` event dispatched
   - Modal shows success state and auto-closes after 1.5s
5. DefinitionSheet revalidates and shows updated data

### View Usage
1. User clicks "View Usage (N)" button (only shown if term has usage entries)
2. Modal opens and fetches `/api/glossary/terms/[termId]/usage`
3. Displays usage cards with:
   - Target type badge (claim/argument)
   - Context text excerpt
   - Creation date and target ID
   - "View" button for navigation
4. Footer shows summary count by type
5. Empty state shown if no usage exists

### Export
1. User clicks "Export" dropdown button in DefinitionSheet header
2. Menu shows three format options with descriptions:
   - JSON: Full data with metadata
   - Markdown: Human-readable document
   - CSV: Spreadsheet compatible
3. User selects format
4. Export logic executes:
   - Data formatted according to chosen format
   - File downloaded with timestamped filename
   - Button shows "Exporting..." → "Exported!" states
5. State resets after 2 seconds

## Design Patterns

### Glassmorphic UI Consistency
- All modals use `bg-slate-900/95 backdrop-blur-xl border-white/20`
- Header icons in gradient background: `from-indigo-500/30 to-cyan-500/30`
- Content cards with glass shine overlay: `from-white/5 via-transparent`
- Status-specific color coding (cyan/indigo/emerald/rose/amber)

### Event-Driven Updates
- `glossary:updated` CustomEvent dispatched on mutations
- DefinitionSheet listens and calls `mutate()` to revalidate
- Ensures UI stays in sync across components

### Optimistic UI
- Buttons show loading states during async operations
- Success states with checkmark icons
- Error states with error messages and alert icons

### Modal Management
- Click handlers use `stopPropagation()` to prevent card collapse
- Modals controlled by local state in TermCard
- Proper cleanup on close

## File Structure
```
components/glossary/
├── DefinitionSheet.tsx          (updated - added export button)
├── TermCard.tsx                 (updated - wired up 3 modals)
├── ProposeTermModal.tsx         (existing)
├── EndorseButton.tsx            (existing)
├── ViewHistoryModal.tsx         (new)
├── ProposeAlternativeModal.tsx  (new)
├── ViewUsageModal.tsx           (new)
└── ExportGlossaryButton.tsx     (new)

app/api/glossary/
├── terms/[termId]/
│   ├── definitions/route.ts     (existing)
│   ├── history/route.ts         (new)
│   └── usage/route.ts           (new)
└── definitions/[definitionId]/
    ├── endorse/route.ts         (existing)
    └── vote/route.ts            (existing)
```

## Testing Checklist

### View History
- [x] Opens modal when clicking "View History" button
- [ ] Fetches and displays history entries
- [ ] Shows edit changes with previousText → newText
- [ ] Displays change types correctly
- [ ] Shows author names and timestamps
- [ ] Empty state for terms with no history

### Propose Alternative
- [x] Opens modal when clicking "Propose Alternative" button
- [ ] Form validation (definition required)
- [ ] Character counter updates correctly
- [ ] Submits to correct API endpoint
- [ ] Shows success state
- [ ] Dispatches glossary:updated event
- [ ] DefinitionSheet updates after submission

### View Usage
- [x] Button only shows when term has usage entries
- [ ] Opens modal when clicking "View Usage" button
- [ ] Fetches and displays usage entries
- [ ] Shows correct type badges (claim/argument)
- [ ] Summary footer shows correct counts
- [ ] Empty state for terms with no usage

### Export
- [x] Export button appears in DefinitionSheet header
- [ ] Dropdown menu shows three format options
- [ ] JSON export downloads with correct structure
- [ ] Markdown export generates readable document
- [ ] CSV export creates valid spreadsheet file
- [ ] Filenames include deliberationId and timestamp
- [ ] Loading and success states work correctly

## Known TODOs

1. **View Usage Navigation**: Wire up "View" button to actually navigate to claim/argument
   - Need to determine navigation pattern (open in modal, navigate to deep dive, etc.)
   - May require passing `router` or navigation callback

2. **Definition Editing**: Add edit functionality for existing definitions
   - Would create new history entry
   - Requires permission check (only author can edit?)

3. **Definition Merging**: Implement merge workflow for competing definitions
   - Combine best parts of multiple definitions
   - Requires consensus mechanism

4. **Auto-detect Usage**: Automatically create usage entries when terms appear in new claims/arguments
   - NLP/text matching logic
   - Background job to scan existing content

## Performance Notes

- History and usage modals use SWR with conditional fetching (only when `isOpen`)
- Export operates on already-loaded data (no additional API calls)
- File downloads use blob URLs with proper cleanup
- Modal renders are optimized (only when open)

## Next Steps

1. Test all modals in production environment
2. Wire up navigation in ViewUsageModal
3. Consider adding definition editing
4. Implement auto-detection of term usage in content
5. Add export to other formats (PDF, DOCX) if needed
