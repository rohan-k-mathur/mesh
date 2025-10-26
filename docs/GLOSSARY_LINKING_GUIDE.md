# Glossary Term Linking System

## Overview

A Wikipedia-style glossary linking system that allows users to link words in their claims/propositions to glossary term definitions. Linked terms appear as blue underlined text and open a modal with the full term card when clicked.

## Syntax

Terms are linked using double-bracket syntax:

```
[[termId:Term Name]]  // With display name
[[termId]]            // Without display name (uses termId as display)
```

**Example:**
```
This claim is about [[cm123abc:Justice]] and [[cm456def:Freedom]].
```

## Components

### 1. GlossaryTermLink
Renders a clickable blue underlined link that opens the term modal.

```tsx
import { GlossaryTermLink } from "@/components/glossary/GlossaryTermLink";

<GlossaryTermLink 
  termId="cm123abc"
  termName="Justice"
/>
```

### 2. GlossaryText
Automatically parses text and converts `[[termId:Name]]` markers into clickable links.

```tsx
import { GlossaryText } from "@/components/glossary/GlossaryText";

<GlossaryText 
  text="This is about [[cm123:Justice]] and [[cm456:Freedom]]"
  className="text-white"
  as="p"
/>
```

### 3. GlossaryTermModal
Modal that displays a full TermCard for a glossary term.

```tsx
import { GlossaryTermModal } from "@/components/glossary/GlossaryTermModal";

<GlossaryTermModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  termId="cm123abc"
  termName="Justice"
/>
```

### 4. GlossaryTermPicker
Searchable popover for selecting terms to insert into text.

```tsx
import { GlossaryTermPicker } from "@/components/glossary/GlossaryTermPicker";

<GlossaryTermPicker
  deliberationId={deliberationId}
  onSelectTerm={(syntax, term) => {
    // Insert syntax at cursor position
    insertAtCursor(syntax);
  }}
  selectedText={getSelectedText()} // Optional: pre-filter by selected text
/>
```

### 5. GlossaryEditorToolbar
Complete toolbar for text editors with link insertion and preview toggle.

```tsx
import { GlossaryEditorToolbar } from "@/components/glossary/GlossaryEditorToolbar";

<GlossaryEditorToolbar
  deliberationId={deliberationId}
  onInsertTerm={(syntax) => insertAtCursor(syntax)}
  selectedText={selectedText}
  showPreview={showPreview}
  onTogglePreview={(show) => setShowPreview(show)}
/>
```

## Utility Functions

### parseGlossaryLinks
Extract all glossary link markers from text.

```ts
import { parseGlossaryLinks } from "@/lib/glossary/parseGlossaryLinks";

const links = parseGlossaryLinks("Text with [[cm123:Justice]]");
// Returns: [{ fullMatch: "[[cm123:Justice]]", termId: "cm123", termName: "Justice", ... }]
```

### renderGlossaryLinks
Convert text with markers to React elements with GlossaryTermLink components.

```tsx
import { renderGlossaryLinks } from "@/lib/glossary/parseGlossaryLinks";

const elements = renderGlossaryLinks("About [[cm123:Justice]]");
// Returns: ["About ", <GlossaryTermLink ... />, ""]
```

### createGlossaryLinkSyntax
Generate the link syntax for a term.

```ts
import { createGlossaryLinkSyntax } from "@/lib/glossary/parseGlossaryLinks";

const syntax = createGlossaryLinkSyntax("cm123abc", "Justice");
// Returns: "[[cm123abc:Justice]]"
```

### stripGlossaryLinks
Remove link syntax from text (for plain text export).

```ts
import { stripGlossaryLinks } from "@/lib/glossary/parseGlossaryLinks";

const plain = stripGlossaryLinks("About [[cm123:Justice]]");
// Returns: "About Justice"
```

### hasGlossaryLinks
Check if text contains any glossary links.

```ts
import { hasGlossaryLinks } from "@/lib/glossary/parseGlossaryLinks";

const hasLinks = hasGlossaryLinks("About [[cm123:Justice]]");
// Returns: true
```

## Integration Examples

### Example 1: Display Claim with Glossary Links

```tsx
import { GlossaryText } from "@/components/glossary/GlossaryText";

function ClaimCard({ claim }) {
  return (
    <div>
      <GlossaryText 
        text={claim.conclusion}
        className="text-lg font-semibold text-white"
        as="p"
      />
    </div>
  );
}
```

### Example 2: Text Editor with Glossary Toolbar

```tsx
import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { GlossaryEditorToolbar } from "@/components/glossary/GlossaryEditorToolbar";
import { GlossaryText } from "@/components/glossary/GlossaryText";

function ClaimComposer({ deliberationId }) {
  const [text, setText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (syntax: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.slice(0, start) + syntax + text.slice(end);
    
    setText(newText);
    
    // Move cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + syntax.length, start + syntax.length);
    }, 0);
  };

  return (
    <div className="space-y-3">
      <GlossaryEditorToolbar
        deliberationId={deliberationId}
        onInsertTerm={(syntax) => insertAtCursor(syntax)}
        showPreview={showPreview}
        onTogglePreview={setShowPreview}
      />
      
      {showPreview ? (
        <div className="p-4 rounded-lg bg-slate-800/60 border border-white/20">
          <GlossaryText text={text} className="text-white" as="div" />
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your claim... Use 'Link Term' to add glossary references"
          className="min-h-32"
        />
      )}
    </div>
  );
}
```

### Example 3: Markdown-Style Editor with Auto-Complete

```tsx
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { GlossaryTermPicker } from "@/components/glossary/GlossaryTermPicker";
import useSWR from "swr";

function AdvancedEditor({ deliberationId }) {
  const [text, setText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const { data } = useSWR(`/api/deliberations/${deliberationId}/glossary/terms`);
  const terms = data?.terms || [];

  // Detect when user types "[[" to trigger suggestions
  useEffect(() => {
    const lastTwo = text.slice(cursorPosition - 2, cursorPosition);
    setShowSuggestions(lastTwo === "[[");
  }, [text, cursorPosition]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  return (
    <div className="relative">
      <Textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Type [[ to link a glossary term"
        className="min-h-32"
      />
      
      {showSuggestions && (
        <div className="absolute top-full left-0 mt-1 z-50">
          <GlossaryTermPicker
            deliberationId={deliberationId}
            onSelectTerm={(syntax) => {
              // Replace "[[" with the full syntax
              const newText = text.slice(0, cursorPosition - 2) + syntax + text.slice(cursorPosition);
              setText(newText);
              setShowSuggestions(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
```

## API Endpoint

### GET /api/glossary/terms/[termId]

Fetch a single glossary term with all definitions and metadata.

**Response:**
```json
{
  "term": {
    "id": "cm123abc",
    "term": "Justice",
    "status": "CONSENSUS",
    "definitions": [...],
    "proposedBy": {...},
    "usages": [...]
  }
}
```

## Storage Format

When storing text with glossary links in the database, use the raw syntax:

```
"This claim about [[cm123abc:Justice]] demonstrates [[cm456def:Freedom]]"
```

When rendering for display, use `GlossaryText` component or `renderGlossaryLinks()` utility.

## Best Practices

### 1. Always Use Term IDs
Use the database ID (e.g., `cm123abc`) in the syntax, not the term name alone. This ensures links work even if terms are renamed.

### 2. Include Display Names
Always include the display name in the syntax: `[[id:Name]]`. This makes the raw text readable even without rendering.

### 3. Preserve Raw Text
Store the raw text with `[[...]]` markers in the database. Don't store rendered HTML.

### 4. Handle Missing Terms Gracefully
If a term ID in `[[id:Name]]` no longer exists, the link should:
- Still display the name as plain text
- Optionally show a "term not found" indicator

### 5. Export Considerations
When exporting to plain text formats (PDF, DOCX, etc.), use `stripGlossaryLinks()` to convert:
```
"About [[cm123:Justice]]" → "About Justice"
```

## Styling

Glossary links use these default styles:
```css
.glossary-link {
  color: rgb(34, 211, 238); /* cyan-400 */
  text-decoration: underline;
  text-decoration-color: rgba(34, 211, 238, 0.5);
  text-underline-offset: 2px;
  cursor: pointer;
}

.glossary-link:hover {
  color: rgb(103, 232, 249); /* cyan-300 */
  text-decoration-thickness: 2px;
}
```

Customize via the `className` prop on `GlossaryTermLink`.

## Future Enhancements

### Auto-Detection
Automatically suggest linking when users type words that match glossary terms:
```tsx
// Detect as user types
const detectTerms = (text: string) => {
  return terms.filter(term => 
    text.toLowerCase().includes(term.term.toLowerCase())
  );
};
```

### Smart Suggestions
Show inline suggestions when typing terms:
```tsx
// "You mentioned 'justice' - link to glossary term?"
<InlineSuggestion term={matchedTerm} onAccept={insertLink} />
```

### Bulk Linking
Allow users to auto-link all mentions of glossary terms in existing text:
```tsx
<Button onClick={autoLinkAllTerms}>
  Auto-link All Glossary Terms
</Button>
```

### Link Analytics
Track which terms are most frequently linked:
```tsx
// Store link usage in GlossaryTermUsage
await prisma.glossaryTermUsage.create({
  data: {
    termId: term.id,
    targetType: "claim",
    targetId: claim.id,
    contextText: claim.conclusion
  }
});
```
