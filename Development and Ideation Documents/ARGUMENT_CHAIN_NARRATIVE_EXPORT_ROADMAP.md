# Argument Chain Narrative Export - Development Roadmap

## Overview
Build a natural language narrative export system for argument chains that transforms formal AIF/ASPIC+ structures into human-readable text. The system will support multiple export formats and provide extensible architecture for future enhancements (e.g., preference-based strength indicators).

**Total Estimated Time**: 6-8 hours across 5 phases

---

## Phase 1: Core Narrative Generator (~2 hours)

### Objectives
- Create topological chain walker
- Implement template-based text generation
- Support scheme-aware transitions
- Handle basic argument structure (claim → premises → inference)

### Tasks
1. **Create narrative generator module** (`lib/chains/narrativeGenerator.ts`)
   - [ ] `generateNarrative(chain: ArgumentChain): string` - main entry point
   - [ ] `topologicalSort(nodes: ChainNode[]): ChainNode[]` - order nodes for narrative flow
   - [ ] `formatNode(node: ChainNode, index: number): string` - format single node
   - [ ] `getTransitionPhrase(scheme: string): string` - scheme-aware connectors

2. **Implement scheme templates**
   - [ ] Default template: "Argument {N}: {claim}"
   - [ ] Modus Ponens: "If {premise1}, and {premise2}, then {conclusion}"
   - [ ] Expert Opinion: "{expert} states that {claim}, therefore {conclusion}"
   - [ ] Causal Reasoning: "Because {cause}, we observe {effect}"
   - [ ] Practical Reasoning: "To achieve {goal}, we should {action}"
   - [ ] Analogy: "{source} is like {target} in that {similarity}, so {conclusion}"

3. **Handle edge cases**
   - [ ] Chains with cycles (break at detected cycle)
   - [ ] Orphan nodes (list at end as "Additional claims")
   - [ ] Multiple roots (number separately: "Chain 1", "Chain 2")
   - [ ] Empty chains (return "No arguments in this chain")

4. **Add metadata sections**
   - [ ] Chain title/summary
   - [ ] Node count
   - [ ] Creation date
   - [ ] Contributors (if multi-author)

### Acceptance Criteria
- Given a chain with 5 nodes, produces coherent narrative with logical flow
- Scheme names appear in appropriate transition phrases
- No crashes on edge cases (cycles, empty chains)
- TypeScript compiles without errors

### Files to Create
- `lib/chains/narrativeGenerator.ts` (~200 lines)

### Files to Reference
- `lib/chains/chainTypes.ts` - ArgumentChain, ChainNode types
- `lib/aspic/schemes.ts` - Scheme definitions
- `lib/aspic/aifToASPIC.ts` - AIF graph structure examples

---

## Phase 2: UI Integration (~1 hour)

### Objectives
- Add "Export as Narrative" button to chain UI
- Implement clipboard copy functionality
- Show success/error feedback
- Support markdown and plain text formats

### Tasks
1. **Update ChainExportButton component** (`components/chains/ChainExportButton.tsx`)
   - [ ] Add dropdown menu with export options
   - [ ] "Export as Narrative (Plain Text)"
   - [ ] "Export as Narrative (Markdown)"
   - [ ] "Export as AIF JSON" (existing)
   - [ ] Import narrativeGenerator functions

2. **Implement export handlers**
   - [ ] `handleNarrativeExport(format: "text" | "markdown")` - generate and copy
   - [ ] Use `navigator.clipboard.writeText()` for copy
   - [ ] Show toast notification: "Narrative copied to clipboard!"
   - [ ] Error handling: "Failed to generate narrative: {error}"

3. **Add loading states**
   - [ ] Show spinner while generating (for large chains)
   - [ ] Disable button during generation
   - [ ] Re-enable after completion

4. **Styling and UX**
   - [ ] Icon: FileText for narrative export
   - [ ] Keyboard shortcut: Cmd/Ctrl+Shift+E
   - [ ] Tooltip: "Export chain as natural language narrative"

### Acceptance Criteria
- Clicking "Export as Narrative" copies text to clipboard
- Toast appears confirming successful copy
- Button disabled during generation
- Works on chains with 1-100 nodes
- No console errors

### Files to Modify
- `components/chains/ChainExportButton.tsx` (~50 lines changed)

### Files to Reference
- `components/ui/DropdownMenu.tsx` - shadcn dropdown
- `components/ui/toast.tsx` - notification system
- `lib/hooks/useToast.ts` - toast hook

---

## Phase 3: Markdown Formatting (~1.5 hours)

### Objectives
- Generate well-formatted markdown with headings, lists, and emphasis
- Support collapsible sections for large chains
- Add visual hierarchy (H1, H2, bullet points)
- Include metadata table

### Tasks
1. **Create markdown formatter** (`lib/chains/markdownFormatter.ts`)
   - [ ] `formatAsMarkdown(chain: ArgumentChain): string` - main entry
   - [ ] Add frontmatter with metadata (YAML style)
   - [ ] Generate table of contents for chains >10 nodes
   - [ ] Use H2 for each argument node
   - [ ] Use bullet lists for premises
   - [ ] Use blockquotes for conclusions
   - [ ] Bold scheme names and confidence scores

2. **Add markdown features**
   - [ ] Links: `[Argument 3](#argument-3)` for cross-references
   - [ ] Badges: `![Confidence: High](badge-url)` for visual indicators
   - [ ] Code blocks: For formal logic notation
   - [ ] Horizontal rules: `---` between major sections
   - [ ] Emphasis: `**strong**` for conclusions, `*italic*` for assumptions

3. **Support export options**
   - [ ] Include/exclude metadata header (checkbox in UI)
   - [ ] Include/exclude ToC (auto for chains >10 nodes)
   - [ ] Include/exclude citations (if available)
   - [ ] Numbering style: Sequential (1,2,3) vs hierarchical (1.1, 1.2)

### Acceptance Criteria
- Markdown renders correctly in GitHub, Notion, Obsidian
- Table of contents links work (anchor navigation)
- Visual hierarchy clear and consistent
- Frontmatter parses as valid YAML
- Exported file has `.md` extension

### Files to Create
- `lib/chains/markdownFormatter.ts` (~150 lines)

### Files to Modify
- `lib/chains/narrativeGenerator.ts` - add `format` parameter
- `components/chains/ChainExportButton.tsx` - add format dropdown

---

## Phase 4: File Download & Advanced Formats (~1.5 hours)

### Objectives
- Support file download (not just clipboard)
- Add PDF export via print stylesheet
- Support JSON export with narrative embedded
- Add export history/presets

### Tasks
1. **Implement file download** (`lib/utils/fileExport.ts`)
   - [ ] `downloadAsFile(content: string, filename: string, mimeType: string)`
   - [ ] Use `Blob` and `URL.createObjectURL()`
   - [ ] Auto-generate filename: `chain-{name}-{date}.{ext}`
   - [ ] Clean up object URLs after download

2. **Add PDF export**
   - [ ] Create print-friendly CSS (`styles/print.css`)
   - [ ] Hide UI elements (buttons, sidebars)
   - [ ] Optimize typography for print
   - [ ] Add page breaks between arguments
   - [ ] Use `window.print()` API
   - [ ] Include header/footer with chain name and page numbers

3. **JSON export with narrative**
   - [ ] Embed narrative in AIF JSON: `"narrative": { "text": "...", "markdown": "..." }`
   - [ ] Maintain backward compatibility with existing AIF
   - [ ] Include generation timestamp and version

4. **Export presets system**
   - [ ] Save/load export configurations
   - [ ] Presets: "Academic Paper", "Blog Post", "Executive Summary", "Technical Report"
   - [ ] Each preset defines: format, sections, style, length
   - [ ] Store in localStorage: `exportPresets`

### Acceptance Criteria
- Downloaded files open correctly in native apps (TextEdit, VS Code, browsers)
- PDF export includes all content without truncation
- Page breaks appear in logical places (not mid-argument)
- JSON export validates against AIF schema
- Presets persist across browser sessions

### Files to Create
- `lib/utils/fileExport.ts` (~100 lines)
- `lib/chains/exportPresets.ts` (~80 lines)
- `styles/print.css` (~50 lines)

### Files to Modify
- `components/chains/ChainExportButton.tsx` - add download and preset options
- `lib/chains/narrativeGenerator.ts` - support preset configurations

---

## Phase 5: Polish & Extensibility (~2 hours)

### Objectives
- Add preference-based strength indicators (Phase 4 integration hook)
- Support citations and references
- Add customization options (tone, length, detail level)
- Write unit tests
- Document API and examples

### Tasks
1. **Preference integration hooks**
   - [ ] `addStrengthIndicators(narrative: string, preferences: Map): string`
   - [ ] Phrases: "This argument is particularly strong because..."
   - [ ] Phrases: "While this argument holds, note that..."
   - [ ] Leave stub for now, implement fully in ASPIC+ Phase 4

2. **Citation support**
   - [ ] Extract citation metadata from arguments
   - [ ] Format as footnotes: `[1]`, `[2]` with references section at end
   - [ ] Support multiple citation styles: APA, MLA, Chicago
   - [ ] Link to source URLs if available

3. **Customization options**
   - [ ] **Tone**: Formal, Conversational, Academic, Legal
   - [ ] **Length**: Brief (1 sentence/arg), Standard (1 para/arg), Detailed (2-3 para/arg)
   - [ ] **Detail Level**: High (include all premises), Medium (major premises), Low (conclusions only)
   - [ ] **Audience**: Expert, General Public, Student
   - [ ] Store preferences: `narrativePreferences` in localStorage

4. **Testing**
   - [ ] Unit tests for `narrativeGenerator.ts`:
     * Test topological sort with cycles
     * Test scheme template substitution
     * Test edge cases (empty, single node, disconnected)
   - [ ] Integration tests for export button:
     * Test clipboard copy
     * Test file download
     * Test format switching
   - [ ] E2E test: Create chain → export → verify content

5. **Documentation**
   - [ ] API docs: JSDoc comments for all public functions
   - [ ] Usage guide: `NARRATIVE_EXPORT_USAGE.md`
   - [ ] Examples: 3 sample chains with expected outputs
   - [ ] Architecture notes: Extension points for future features

### Acceptance Criteria
- All tests pass (100% coverage on core functions)
- Customization options produce noticeably different outputs
- Citation formatting matches style guide requirements
- Documentation clear enough for new developer to use API
- Preference hooks ready for Phase 4 integration

### Files to Create
- `lib/chains/__tests__/narrativeGenerator.test.ts` (~150 lines)
- `NARRATIVE_EXPORT_USAGE.md` (~200 lines)
- `lib/chains/citationFormatter.ts` (~100 lines)

### Files to Modify
- `lib/chains/narrativeGenerator.ts` - add customization parameters
- `components/chains/ChainExportButton.tsx` - add options panel

---

## Architecture Overview

```
lib/chains/
├── narrativeGenerator.ts      # Core generation logic
├── markdownFormatter.ts       # Markdown-specific formatting
├── citationFormatter.ts       # Citation handling
├── exportPresets.ts           # Preset configurations
└── __tests__/
    └── narrativeGenerator.test.ts

lib/utils/
└── fileExport.ts              # File download utilities

components/chains/
└── ChainExportButton.tsx      # UI integration (modified)

styles/
└── print.css                  # PDF export styling

docs/
└── NARRATIVE_EXPORT_USAGE.md  # User guide
```

## Extension Points (Future Enhancements)

1. **ASPIC+ Phase 4 Integration** (Post-Phase 5)
   - Hook: `addStrengthIndicators()` in narrativeGenerator.ts
   - Phrases based on preference ordering (elitist, weakest link)
   - Visual indicators: "💪 Strong argument", "⚠️ Weak link"

2. **ASPIC+ Phase 5 Integration** (Post-Phase 5)
   - Share export infrastructure with formal formats (TGF, DOT)
   - Unified export menu: Narrative, AIF, TGF, DOT, PDF
   - Batch export: All formats at once

3. **AI Enhancement** (Future)
   - GPT-4 rewriting for improved readability
   - Tone adjustment via LLM
   - Summary generation for long chains

4. **Collaboration Features** (Future)
   - Shared export templates across team
   - Comments on exported narratives
   - Version history of exports

## Dependencies

**Existing Code**:
- `lib/chains/chainTypes.ts` - Type definitions
- `lib/aspic/aifToASPIC.ts` - AIF graph structure
- `lib/aspic/schemes.ts` - Scheme definitions
- `components/ui/*` - shadcn components (Button, DropdownMenu, Toast)

**New Dependencies** (None - using native APIs):
- `navigator.clipboard` (Clipboard API)
- `Blob` and `URL.createObjectURL()` (File API)
- `window.print()` (Print API)
- `localStorage` (Storage API)

## Testing Strategy

1. **Unit Tests** (Jest/Vitest)
   - narrativeGenerator.ts: All public functions
   - markdownFormatter.ts: Format validation
   - citationFormatter.ts: Style compliance

2. **Integration Tests**
   - ChainExportButton: User interaction flows
   - File download: Verify blob creation

3. **E2E Tests** (Playwright/Cypress)
   - Full workflow: Create chain → export → verify clipboard
   - Cross-browser: Chrome, Firefox, Safari

4. **Manual QA Checklist**
   - [ ] Test with real deliberation data (5+ chains)
   - [ ] Verify markdown renders in 3+ apps (GitHub, Notion, VS Code)
   - [ ] Test PDF export on Mac/Windows/Linux
   - [ ] Verify clipboard works in all browsers
   - [ ] Test with chains of varying sizes (1, 10, 50, 100 nodes)
   - [ ] Test edge cases (cycles, empty, single node)

## Success Metrics

**Phase 1-2** (MVP):
- ✅ Generate narrative for any chain
- ✅ Copy to clipboard works
- ✅ Toast notification appears

**Phase 3-4** (Production-Ready):
- ✅ Markdown renders correctly
- ✅ File download works
- ✅ PDF export functional

**Phase 5** (Complete):
- ✅ All tests passing
- ✅ Documentation complete
- ✅ Customization options working
- ✅ Ready for ASPIC+ Phase 4 integration

## Rollout Plan

1. **Phase 1-2**: Merge to main, feature flag `ENABLE_NARRATIVE_EXPORT=true`
2. **Phase 3**: Beta testing with 5-10 users, gather feedback
3. **Phase 4**: Public release, announce in product updates
4. **Phase 5**: Full production, remove feature flag

## Notes

- **Performance**: For chains >100 nodes, consider pagination or summary mode
- **Accessibility**: Ensure exported content is screen-reader friendly
- **i18n**: Structure for future localization (templates → message catalog)
- **Security**: Sanitize user input in chain names (XSS prevention)

---

**Ready to Start**: Phase 1 - Core Narrative Generator
**Next Review**: After Phase 2 completion (UI integration)
