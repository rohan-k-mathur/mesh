# Phase 3.2.3: Embeddable Evidence Widgets - Complete ✅

## Summary

Phase 3.2.3 implements embeddable widgets for stacks, evidence lists, sources, and health badges. These widgets can be embedded on external websites via iframe, script tag, or oEmbed discovery.

## Completed Components

### 1. Embed Code Generator API

**File**: [app/api/widgets/embed/route.ts](../app/api/widgets/embed/route.ts)

Generates embed codes for all widget types:

```typescript
GET /api/widgets/embed?type=stack&id=abc123&theme=light

Response:
{
  "widgetUrl": "https://mesh.app/embed/stack/abc123?theme=light",
  "embedCodes": {
    "iframe": "<iframe src=\"...\" width=\"600\" height=\"400\" ...></iframe>",
    "script": "<div class=\"mesh-widget\" data-mesh-type=\"stack\" ...></div>\n<script src=\"https://mesh.app/embed.js\" async></script>",
    "oembed": "https://mesh.app/api/oembed?url=..."
  },
  "preview": "https://mesh.app/embed/stack/abc123?preview=true",
  "metadata": {
    "title": "My Stack",
    "description": "Stack description",
    "itemCount": 12
  }
}
```

**Supported Widget Types:**
- `stack` - Stack preview with thumbnail grid
- `evidence` - Evidence list grouped by intent
- `source` - Single source card with verification
- `health` - Evidence health badge (compact)

### 2. Stack Embed Page

**File**: [app/embed/stack/[stackId]/page.tsx](../app/embed/stack/%5BstackId%5D/page.tsx)

Embeddable stack preview with:
- Header with stack name and description
- Thumbnail grid of sources (up to 12)
- Source type icons
- Citation badges
- Light/dark theme support
- Compact mode option
- "Powered by Mesh" footer

**URL Pattern**: `/embed/stack/{stackId}?theme=light|dark|auto&compact=true|false`

### 3. Evidence List Embed Page

**File**: [app/embed/evidence/[targetId]/page.tsx](../app/embed/evidence/%5BtargetId%5D/page.tsx)

Embeddable evidence list with:
- Citations grouped by intent (Supporting, Contradicting, Background, Other)
- Color-coded sections
- Inline citation format (Author et al., Year)
- Quote preview
- Expandable citations
- Theme support

**URL Pattern**: `/embed/evidence/{targetId}?theme=light|dark|auto&compact=true|false`

### 4. Source Card Embed Page

**File**: [app/embed/source/[sourceId]/page.tsx](../app/embed/source/%5BsourceId%5D/page.tsx)

Embeddable source card with:
- Source type icon
- Title, authors, year
- Container/journal info
- Verification status badge (Verified, Warning, Failed, Pending)
- Citation count
- DOI indicator
- Theme support

**URL Pattern**: `/embed/source/{sourceId}?theme=light|dark|auto&compact=true|false`

### 5. Embed Script (Client-Side)

**File**: [public/embed.js](../public/embed.js)

JavaScript SDK for dynamic widget embedding:

```html
<!-- Simple usage -->
<div class="mesh-widget" 
     data-mesh-type="stack" 
     data-mesh-id="abc123">
</div>
<script src="https://mesh.app/embed.js" async></script>
```

**Features:**
- Auto-initialization on DOMContentLoaded
- MutationObserver for dynamically added widgets
- Configurable via data attributes
- Resize message handling for dynamic heights
- Programmatic API: `window.MeshWidgets.init()` and `window.MeshWidgets.refresh()`

**Data Attributes:**
- `data-mesh-type`: Widget type (stack, evidence, source, health)
- `data-mesh-id`: Target ID
- `data-mesh-theme`: Theme (light, dark, auto)
- `data-mesh-compact`: Enable compact mode (true/false)
- `data-mesh-width`: Custom width in pixels

### 6. oEmbed Endpoint

**File**: [app/api/oembed/route.ts](../app/api/oembed/route.ts)

Implements oEmbed 1.0 specification for rich preview discovery:

```typescript
GET /api/oembed?url=https://mesh.app/embed/stack/abc123

Response:
{
  "type": "rich",
  "version": "1.0",
  "title": "My Stack",
  "author_name": "John Doe",
  "author_url": "https://mesh.app/profile/user123",
  "provider_name": "Mesh",
  "provider_url": "https://mesh.app",
  "cache_age": 3600,
  "html": "<iframe ...></iframe>",
  "width": 600,
  "height": 400
}
```

**URL Patterns Supported:**
- `/embed/stack/{id}`
- `/embed/evidence/{id}`
- `/embed/source/{id}`
- `/embed/health/{id}`
- `/stacks/{id}` (direct resource URL)
- `/sources/{id}` (direct resource URL)

## Widget Dimensions

| Widget Type | Default Width | Default Height |
|-------------|---------------|----------------|
| Stack       | 600px         | 400px          |
| Evidence    | 500px         | 500px          |
| Source      | 400px         | 150px          |
| Health      | 150px         | 60px           |

## Theme Support

All widgets support three theme modes:
- `light` - Light background, dark text
- `dark` - Dark background, light text
- `auto` - Follows system preference via `prefers-color-scheme`

## Access Control

- Stacks: Must have `public_open`, `public_closed`, or `unlisted` visibility
- Sources: Always embeddable (public references)
- Evidence: Requires at least one citation for the target
- Health: Deliberation must have `isPublic: true`

## Integration Examples

### WordPress
```html
[mesh_embed type="stack" id="abc123" theme="auto"]
```

### Notion
Use the oEmbed URL directly in a `/embed` block.

### Medium
Paste the embed URL and Medium will auto-discover via oEmbed.

### Static Sites
```html
<div class="mesh-widget" data-mesh-type="stack" data-mesh-id="abc123"></div>
<script src="https://mesh.app/embed.js" async></script>
```

## Files Created

| File | Purpose |
|------|---------|
| `app/api/widgets/embed/route.ts` | Embed code generator API |
| `app/embed/stack/[stackId]/page.tsx` | Stack embed page |
| `app/embed/evidence/[targetId]/page.tsx` | Evidence list embed page |
| `app/embed/source/[sourceId]/page.tsx` | Source card embed page |
| `public/embed.js` | Client-side embed script |
| `app/api/oembed/route.ts` | oEmbed discovery endpoint |

## Next Steps

Phase 3.2.4: Public Evidence API (if continuing Phase 3.2)
- Read-only API keys
- Rate limiting
- Evidence endpoints
