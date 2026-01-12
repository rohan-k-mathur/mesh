# Phase 2.1 Remaining Tasks - PDF Navigation & Highlight Integration

**Status**: Deferred  
**Priority**: P1  
**Estimated Effort**: 1-2 days  
**Dependencies**: Phase 2.1 core (complete), existing PdfLightbox component

---

## Task 1: Add PdfNavigationListener to Root Layout

### Objective
Enable citation clicks to open PDFs in a lightbox at the correct page.

### Current State
- `PdfNavigationListener` component created at `components/citations/PdfNavigationListener.tsx`
- Listens for `pdf:open` CustomEvent
- Opens `PdfLightbox` with `postId` and `startPage`

### Implementation Steps

1. **Identify target layout file**
   ```
   app/(app)/layout.tsx   # Most likely candidate for app routes
   # or
   app/layout.tsx         # Root layout
   ```

2. **Add import and component**
   ```tsx
   import PdfNavigationListener from "@/components/citations/PdfNavigationListener";
   
   // In the layout return, add near other global components:
   <PdfNavigationListener />
   ```

3. **Test the integration**
   - Create a citation with a PDF source
   - Display it using `CitationCard`
   - Click the citation → PDF should open in lightbox at correct page

### Files to Modify
| File | Change |
|------|--------|
| `app/(app)/layout.tsx` or `app/layout.tsx` | Import and render `<PdfNavigationListener />` |

### Acceptance Criteria
- [ ] Clicking a PDF citation opens PdfLightbox
- [ ] PDF opens at the correct page (from anchorData)
- [ ] Multiple clicks work correctly (state resets between views)

---

## Task 2: Add Highlight Overlay to PdfLightbox

### Objective
When navigating to a citation with an annotation anchor, show a visual highlight on the referenced text region.

### Current State
- `PdfLightbox` receives `startPage` and opens PDF at that page
- No support for `highlight` (annotation ID) or `rect` overlay
- `PdfNavigationListener` passes `highlight` and `rect` in event detail but they're not used

### Implementation Steps

#### Step 2.1: Extend PdfLightbox Props

```tsx
// components/modals/PdfLightbox.tsx

type BaseProps = {
  title?: string;
  startPage?: number;
  // NEW: Highlight overlay support
  highlightRect?: { x: number; y: number; width: number; height: number };
  highlightAnnotationId?: string;
  // ...
};
```

#### Step 2.2: Add Highlight Overlay UI

```tsx
// Inside PdfLightbox Body, after the iframe:

{/* Highlight overlay - flashes to draw attention */}
{props.highlightRect && (
  <div
    className="absolute bg-yellow-300/50 animate-pulse pointer-events-none transition-opacity duration-2000"
    style={{
      left: `${props.highlightRect.x}%`,
      top: `${props.highlightRect.y}%`,
      width: `${props.highlightRect.width}%`,
      height: `${props.highlightRect.height}%`,
    }}
  />
)}
```

**Note**: This approach has limitations because the highlight is overlaid on an iframe, which uses browser-native PDF rendering. The coordinates may not align perfectly with the actual PDF content.

#### Step 2.3: Alternative - Fetch Annotation on Open

If `highlightAnnotationId` is provided but no rect:

```tsx
React.useEffect(() => {
  if (!props.highlightAnnotationId) return;
  
  fetch(`/api/annotations/${props.highlightAnnotationId}`)
    .then(res => res.json())
    .then(data => {
      if (data.annotation?.rect) {
        setHighlightRect(data.annotation.rect);
      }
    })
    .catch(() => {});
}, [props.highlightAnnotationId]);
```

#### Step 2.4: Update PdfNavigationListener

```tsx
// components/citations/PdfNavigationListener.tsx

<PdfLightbox
  open={open}
  onOpenChange={setOpen}
  postId={postId}
  startPage={startPage}
  title="PDF Viewer"
  highlightRect={highlightRect}           // NEW
  highlightAnnotationId={highlightId}     // NEW
/>
```

### Technical Considerations

| Consideration | Notes |
|---------------|-------|
| **Coordinate system** | Rects stored as percentages (0-100) for responsive display |
| **iframe limitations** | Cannot interact with PDF content inside browser iframe |
| **PDF.js alternative** | For precise highlighting, would need PDF.js integration instead of iframe |
| **Animation** | Use `animate-pulse` for 2-3 seconds, then fade out |

### Files to Modify
| File | Change |
|------|--------|
| `components/modals/PdfLightbox.tsx` | Add highlightRect/highlightAnnotationId props and overlay UI |
| `components/citations/PdfNavigationListener.tsx` | Pass highlight props to PdfLightbox |

### Acceptance Criteria
- [ ] Navigation with `highlight` param shows yellow overlay
- [ ] Overlay is positioned correctly over the cited region
- [ ] Overlay pulses briefly then fades
- [ ] Works with both pre-provided rect and fetched annotation

---

## Future Enhancement: PDF.js Integration

For a more robust solution that allows:
- Precise text highlighting inside the PDF
- Text selection with coordinate capture
- In-document annotation rendering

Consider migrating from iframe-based viewing to PDF.js:

```
npm install pdfjs-dist react-pdf
```

This would enable:
1. Programmatic text highlighting
2. Selection events with bounding rect capture
3. Custom annotation layer rendering
4. Better accessibility

**Estimated effort**: 3-5 days (significant refactor)

---

## Testing Checklist

### Manual Tests
1. [ ] Create citation from PDF with page locator → anchorType=page saved
2. [ ] Click CitationCard for PDF → lightbox opens at correct page
3. [ ] Create annotation → create citation with anchorType=annotation → click → highlight shows
4. [ ] Video citation with timestamp → opens at correct time
5. [ ] Multiple sequential citation clicks → each opens correctly

### Edge Cases
- [ ] Citation without anchor data → opens PDF at page 1
- [ ] Annotation deleted → citation still navigates (no highlight)
- [ ] Very large PDF → page navigation works
- [ ] Mobile viewport → overlay scales correctly

---

## References

- `components/citations/PdfNavigationListener.tsx` - Event listener component
- `components/modals/PdfLightbox.tsx` - PDF viewer modal
- `components/citations/CitationCard.tsx` - Dispatches pdf:open event
- `app/api/annotations/[id]/route.ts` - Fetch annotation details
- `lib/citations/navigation.ts` - Navigation target computation

