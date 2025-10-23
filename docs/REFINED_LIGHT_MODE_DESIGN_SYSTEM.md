# Refined Light Mode Glass Morphism Design System
## Mesh Visual Language Guide - Updated Specifications

**Version**: 2.0  
**Last Updated**: October 23, 2025  
**Reference Component**: `NonCanonicalResponseFormLight.tsx` (refined)  
**Previous Version**: See `GLASS_MORPHISM_LIGHT_MODE_DESIGN_SYSTEM.md` (v1.1)

---

## Table of Contents
1. [Design Philosophy Updates](#design-philosophy-updates)
2. [Custom CSS Classes](#custom-css-classes)
3. [Component Element Hierarchy](#component-element-hierarchy)
4. [Gradient Direction Standards](#gradient-direction-standards)
5. [Shadow System](#shadow-system)
6. [Opacity & Blur Specifications](#opacity--blur-specifications)
7. [Color Palette Refinements](#color-palette-refinements)
8. [Padding & Spacing Standards](#padding--spacing-standards)
9. [Border Treatments](#border-treatments)
10. [Button Styling Patterns](#button-styling-patterns)
11. [Input Field Patterns](#input-field-patterns)
12. [Visual Composition & Layering](#visual-composition--layering)

---

## Design Philosophy Updates

### Key Refinements from v1.0

**1. Gradient Direction Preference**
- **Primary pattern**: `bg-gradient-to-b` (top to bottom) for clean vertical flow
- **Secondary pattern**: `bg-gradient-to-br` (bottom-right) only for overlay effects
- **Rationale**: Vertical gradients create cleaner, more predictable visual hierarchy

**2. Native `<button>` over `<Button>` Component**
- Use native HTML `<button>` elements with custom classes for full control
- Avoids component library overrides and ensures consistent styling
- Easier to apply custom classes like `btnv2`, `articlesearchfield`, etc.

**3. Enhanced Shadow Depth**
- Stronger use of `shadow-lg` on interactive elements
- Specific colored shadows for selection states (`shadow-cyan-400/20`)
- `drop-shadow-sm` for subtle text depth (not `drop-shadow-lg`)

**4. Refined Opacity System**
- More selective use of transparency
- Stronger backgrounds: `bg-white/85` instead of `bg-slate-900/5`
- Cleaner, crisper visual presentation

---

## Custom CSS Classes

### Core Custom Classes

These classes must be defined in your global CSS or Tailwind config:

#### 1. `btnv2`
**Purpose**: Standard button styling with proper padding and typography

```css
.btnv2 {
  padding: 0.5rem 0.75rem;  /* py-2 px-3 equivalent */
  font-weight: 600;
  font-size: 0.875rem;  /* text-sm */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}
```

**Usage**:
```tsx
<button className="btnv2 text-sm rounded-xl ...">
  Button Text
</button>
```

#### 2. `panel-edge-blue`
**Purpose**: Specialized border styling for modal containers and cards with blue accent

```css
.panel-edge-blue {
  border-width: 1px;
  border-style: solid;
  border-image: linear-gradient(
    to bottom,
    rgba(56, 189, 248, 0.3),  /* sky-400 */
    rgba(14, 165, 233, 0.2),  /* sky-500 */
    rgba(2, 132, 199, 0.3)    /* sky-600 */
  ) 1;
  box-shadow: 
    0 0 0 1px rgba(56, 189, 248, 0.1),
    inset 0 1px 2px rgba(255, 255, 255, 0.5);
}
```

**Usage**:
```tsx
<DialogContent className="panel-edge-blue bg-gradient-to-b ...">
```

**Variants**:
- `panel-edge` - Generic border (no color)
- `panel-edge-blue` - Blue accent borders
- Can create `panel-edge-cyan`, `panel-edge-indigo`, etc.

#### 3. `modalfield`
**Purpose**: Input fields within modals with consistent styling

```css
.modalfield {
  border: 1px solid rgba(148, 163, 184, 0.3);  /* slate-400/30 */
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.05),
    inset 0 1px 3px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(12px);
  transition: all 0.2s ease;
}

.modalfield:focus {
  border-color: rgba(6, 182, 212, 0.6);  /* cyan-500/60 */
  box-shadow: 
    0 0 0 3px rgba(6, 182, 212, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.05),
    inset 0 1px 3px rgba(0, 0, 0, 0.05);
  outline: none;
}
```

**Usage**:
```tsx
<Textarea className="modalfield min-h-[100px] resize-y bg-slate-50 ..." />
```

#### 4. `articlesearchfield`
**Purpose**: Search and single-line input fields

```css
.articlesearchfield {
  border: 1px solid rgba(148, 163, 184, 0.25);  /* slate-400/25 */
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.03),
    inset 0 1px 2px rgba(0, 0, 0, 0.03);
  backdrop-filter: blur(12px);
  transition: all 0.2s ease;
}

.articlesearchfield:focus {
  border-color: rgba(6, 182, 212, 0.5);  /* cyan-500/50 */
  box-shadow: 
    0 0 0 2px rgba(6, 182, 212, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.03),
    inset 0 1px 2px rgba(0, 0, 0, 0.03);
  outline: none;
}
```

**Usage**:
```tsx
<input className="articlesearchfield w-full py-2 text-xs px-3 ..." />
```

---

## Component Element Hierarchy

### Dialog Container Structure
```tsx
<DialogContent className="
  max-w-3xl max-h-screen overflow-hidden 
  panel-edge-blue
  bg-gradient-to-b from-sky-50/75 via-slate-50/20 to-sky-50/70 
  backdrop-blur-xl 
  shadow-2xl 
  px-6 py-8
">
  {/* Glass overlay (1) */}
  <div className="absolute inset-0 bg-gradient-to-b from-slate-900/5 via-transparent to-slate-900/10 pointer-events-none" />
  
  {/* Radial light (2) */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />
  
  {/* Water droplets (3) */}
  <div className="absolute top-10 right-20 w-32 h-32 bg-sky-400/10 rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-20 left-10 w-40 h-40 bg-cyan-400/8 rounded-full blur-3xl animate-pulse delay-1000" />
  
  {/* Content (4 - highest z-index) */}
  <div className="relative z-10 overflow-y-auto max-h-[85vh] custom-scrollbar-light px-2">
    {/* ... */}
  </div>
</DialogContent>
```

**Layer Stack (bottom to top)**:
1. Base gradient background
2. Glass overlay (dark gradient with low opacity)
3. Radial light effect (blue glow from bottom)
4. Water droplet decorations (animated, blurred)
5. Content layer (z-10)

---

## Gradient Direction Standards

### Primary Pattern: Top-to-Bottom (`bg-gradient-to-b`)

**Container Backgrounds**:
```tsx
bg-gradient-to-b from-sky-50/75 via-slate-50/20 to-sky-50/70
```

**Glass Overlays**:
```tsx
bg-gradient-to-b from-slate-900/5 via-transparent to-slate-900/10
```

**Icon Badges**:
```tsx
bg-gradient-to-b from-sky-500/20 to-cyan-500/20
```

### Secondary Pattern: Bottom-Right (`bg-gradient-to-br`)

**Only used for**:
- Subtle overlay effects
- Selection state backgrounds
- Info/message banners

```tsx
// Selection state
bg-gradient-to-br from-cyan-400/20 to-sky-400/20

// Info banner
bg-gradient-to-br from-sky-400/15 to-cyan-400/15

// Glass shine overlay
bg-gradient-to-br from-slate-900/5 via-transparent to-transparent
```

### Horizontal Pattern (`bg-gradient-to-r`)

**Only used for**:
- Text gradients with `bg-clip-text`
- Button backgrounds
- Shine animations

```tsx
// Text gradient
bg-gradient-to-r from-sky-600 via-cyan-700 to-sky-700 bg-clip-text text-transparent

// Button gradient
bg-gradient-to-r from-sky-600 to-sky-700

// Shine effect
bg-gradient-to-r from-transparent via-white/30 to-transparent
```

---

## Shadow System

### Shadow Hierarchy

**1. Container Shadows**
```tsx
shadow-2xl  // Dialog containers (deepest shadow)
```

**2. Card/Element Shadows**
```tsx
shadow-lg   // Interactive cards, buttons, badges (standard depth)
```

**3. Colored Shadows (Selection States)**
```tsx
shadow-cyan-400/20   // Selected card (subtle color glow)
shadow-cyan-400/30   // Button resting state
shadow-cyan-400/50   // Button hover state
shadow-cyan-600/50   // Pulsing indicator dot
```

**4. Combined Shadows (Resting Cards)**
```tsx
shadow-lg shadow-slate-400/80  // Two shadows for depth + color
```

**Pattern**:
```tsx
className="shadow-lg shadow-slate-400/80"
// Creates: box-shadow: 
//   0 10px 15px -3px rgba(0,0,0,0.1),    // shadow-lg
//   0 10px 15px -3px rgba(148,163,184,0.8)  // shadow-slate-400/80
```

### Drop Shadows (Text Depth)

```tsx
drop-shadow-sm   // Subtle text depth for titles
// NOT drop-shadow-lg (too heavy)
```

### Inset Shadows (Custom Classes)

Defined in `panel-edge-blue`, `modalfield`, `articlesearchfield`:
```css
inset 0 1px 2px rgba(0, 0, 0, 0.05)  /* Inner shadow for depth */
inset 0 1px 3px rgba(0, 0, 0, 0.05)  /* Deeper inner shadow */
```

---

## Opacity & Blur Specifications

### Backdrop Blur

**Primary**: `backdrop-blur-xl` (16px)
- Dialog containers
- Large modal backgrounds

**Secondary**: `backdrop-blur-md` (12px)
- Interactive cards
- Input fields (via `modalfield` class)
- Info banners

**Tertiary**: `backdrop-blur-sm` (4px)
- Icon badges
- Small decorative elements

### Background Opacity Levels

**Container Backgrounds** (higher opacity for cleaner look):
```tsx
from-sky-50/75    // 75% opacity (more solid)
via-slate-50/20   // 20% opacity (transparent middle)
to-sky-50/70      // 70% opacity (solid bottom)
```

**Card Backgrounds**:
```tsx
bg-white/85       // Resting state (85% opacity - cleaner than /5)
bg-sky-100/40     // Hover state (40% opacity)
```

**Selection States**:
```tsx
from-cyan-400/20 to-sky-400/20  // 20% opacity gradient
```

**Overlays**:
```tsx
from-slate-900/5 via-transparent to-slate-900/10  // Very subtle (5-10%)
```

**Atmospheric Decorations**:
```tsx
bg-sky-400/10     // Top droplet (10%)
bg-cyan-400/8     // Bottom droplet (8%)
```

---

## Color Palette Refinements

### Primary Gradients

**Dialog Container**:
```tsx
bg-gradient-to-b from-sky-50/75 via-slate-50/20 to-sky-50/70
```
- Start: Sky-50 at 75% opacity (light blue-white)
- Middle: Slate-50 at 20% opacity (almost transparent neutral)
- End: Sky-50 at 70% opacity (light blue-white, slightly darker)

**Icon Badge**:
```tsx
bg-gradient-to-b from-sky-500/20 to-cyan-500/20
```
- Start: Sky-500 (bright blue)
- End: Cyan-500 (blue-green)
- Both at 20% opacity

**Selection Card**:
```tsx
bg-gradient-to-br from-cyan-400/20 to-sky-400/20
```
- Start: Cyan-400 (lighter blue-green)
- End: Sky-400 (lighter bright blue)
- Both at 20% opacity

### Text Color Palette

**Headings & Labels**:
```tsx
text-slate-900    // Primary headings (darkest)
text-sky-900      // Section labels (blue accent)
text-slate-700    // Secondary text, unselected labels
```

**Body Text**:
```tsx
text-sky-800      // Selected descriptions
text-slate-600    // Helper text, muted info
text-slate-500    // Descriptions, placeholders
```

**Accent Text**:
```tsx
text-cyan-900     // Selected card labels, info banner titles
text-cyan-700     // Icons in selected state
text-cyan-600     // Dots, small accents
text-sky-700      // Icon badge icons
```

**Icon Colors**:
```tsx
text-sky-700      // Icon badge main icon
text-cyan-700     // Selected card icons, info banner icons
text-slate-600    // Unselected card icons
```

### Border Color Refinements

**Card Borders**:
```tsx
// Selected
border-cyan-500/60

// Resting (lighter, more visible)
border-cyan-100/60

// Hover (via panel-edge class behavior)
```

**Special Borders**:
```tsx
border-indigo-900/10   // Icon badge border (subtle indigo)
border-slate-900/10    // Standard dividers
```

---

## Padding & Spacing Standards

### Dialog Container
```tsx
px-6 py-8  // Horizontal: 1.5rem, Vertical: 2rem
```

### Scrollable Content Area
```tsx
px-2  // Horizontal padding inside scrollable area
```

### Section Spacing
```tsx
space-y-5  // Between major sections (1.25rem)
space-y-2  // Between label and input (0.5rem)
space-y-3  // Header spacing (0.75rem)
```

### Interactive Cards
```tsx
p-4  // Card inner padding (1rem)
gap-2  // Between elements inside card (0.5rem)
gap-2.5  // Icon + text spacing (0.625rem)
```

### Buttons (`btnv2` class)
```tsx
px-3 py-2  // Standard button padding
// Defined in btnv2: padding: 0.5rem 0.75rem
```

### Icon Badges
```tsx
p-3      // Large badge (0.75rem)
p-2.5    // Medium badge (0.625rem)
p-2      // Small badge (0.5rem)
```

### Input Fields

**Textarea (`modalfield`)**:
```tsx
min-h-[100px]  // Minimum height
// Padding inherited from modalfield class
```

**Single-line (`articlesearchfield`)**:
```tsx
py-2 px-3  // Vertical: 0.5rem, Horizontal: 0.75rem
```

### Info Banners
```tsx
py-2 px-3  // Compact padding (0.5rem vertical, 0.75rem horizontal)
```

### Status Messages
```tsx
p-4  // Error/success messages (1rem)
```

### Footer
```tsx
pt-3  // Top padding only (0.75rem)
```

### Grid Gaps
```tsx
gap-3  // Card grid spacing (0.75rem)
gap-4  // Info banner icon + content (1rem)
gap-1  // Label + dot (0.25rem)
gap-2  // Helper text elements (0.5rem)
```

---

## Border Treatments

### Custom Border Classes

**`panel-edge-blue`**: Gradient border with blue accent
- Used on: Dialog container, selected cards
- Creates multi-color border effect with inset shadow

**`panel-edge`**: Generic version without color
- Used on: Cards in resting state
- Simpler border treatment

### Standard Borders

**Dividers**:
```tsx
border-b border-slate-900/10  // Header divider
border-t border-slate-900/10  // Footer divider
```

**Card Borders** (when not using panel-edge):
```tsx
border-cyan-500/60    // Selected state
border-cyan-100/60    // Resting state (lighter)
```

**Info Banner**:
```tsx
border border-cyan-500/30
```

**Icon Badge**:
```tsx
border border-indigo-900/10
```

**Character Counter**:
```tsx
border border-slate-900/10
```

### Border Radius Scale

```tsx
rounded-full  // Target label badge
rounded-2xl   // Icon badge containers
rounded-xl    // Cards, inputs, buttons, banners
rounded-lg    // Small icon badge inner containers, scheme input
rounded-md    // Character counter
```

---

## Button Styling Patterns

### Use Native `<button>` Elements

**Pattern**:
```tsx
<button className="btnv2 text-sm rounded-xl ...">
  Button Text
</button>
```

**NOT**:
```tsx
<Button variant="outline" className="...">  // Avoid UI library Button
```

### Primary Action Button

```tsx
<button
  onClick={handleSubmit}
  disabled={isSubmitting || !expression.trim()}
  className="relative overflow-hidden btnv2 text-sm rounded-xl text-white px-3 py-2
    bg-gradient-to-r from-sky-600 to-sky-700 
    hover:from-cyan-500 hover:to-sky-600 
    border-0 
    shadow-lg shadow-cyan-400/30 
    hover:shadow-cyan-400/50 
    transition-all duration-300 
    group"
>
  {/* Shine effect */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
  
  <div className="relative flex items-center gap-2">
    {isSubmitting ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        Submitting...
      </>
    ) : (
      <>
        <Send className="w-4 h-4" />
        Submit Response
      </>
    )}
  </div>
</button>
```

**Key Elements**:
- `relative overflow-hidden` - Enables shine effect
- `btnv2` - Base button styling
- `px-3 py-2` - Explicit padding (matches btnv2)
- `bg-gradient-to-r from-sky-600 to-sky-700` - Horizontal gradient (darker end)
- `hover:from-cyan-500 hover:to-sky-600` - Lighter on hover
- `shadow-lg shadow-cyan-400/30` - Colored shadow (resting)
- `hover:shadow-cyan-400/50` - Stronger shadow (hover)
- `transition-all duration-300` - Smooth state changes
- `group` - Enable child hover effects

**Shine Animation**:
- `from-transparent via-white/30 to-transparent` - Bright in middle
- `translate-x-[-100%]` - Start off-screen left
- `group-hover:translate-x-[100%]` - Sweep to right on hover
- `transition-transform duration-700` - Slow, elegant sweep

### Secondary Button (Cancel)

```tsx
<button
  onClick={() => onOpenChange(false)}
  disabled={isSubmitting}
  className="btnv2 text-sm rounded-xl 
    bg-slate-100/5 backdrop-blur-md 
    border-slate-200/20 
    text-slate-900 
    hover:bg-slate-200/10 
    hover:border-slate-200/30 
    transition-all"
>
  Cancel
</button>
```

**Key Elements**:
- Very subtle background `bg-slate-100/5`
- Light border `border-slate-200/20`
- Dark text `text-slate-900`
- Minimal hover changes
- No shadow (flat appearance)

---

## Input Field Patterns

### Textarea (Multi-line)

```tsx
<Textarea
  id="expression"
  value={expression}
  onChange={(e) => setExpression(e.target.value)}
  disabled={isSubmitting}
  placeholder={`Provide your ${selectedMoveType?.label.toLowerCase()} here...`}
  className="modalfield 
    min-h-[100px] resize-y 
    bg-slate-50 
    text-slate-900 
    placeholder:text-slate-400 
    rounded-xl"
/>
```

**Key Elements**:
- `modalfield` - Custom class with borders and shadows
- `min-h-[100px]` - Minimum height
- `resize-y` - Allow vertical resizing only
- `bg-slate-50` - Light solid background (not transparent)
- No explicit border/shadow (handled by `modalfield`)

### Single-line Input

```tsx
<input
  id="scheme"
  type="text"
  value={scheme}
  onChange={(e) => setScheme(e.target.value)}
  disabled={isSubmitting}
  placeholder="e.g., Modus Ponens, Argument from Authority, etc."
  className="articlesearchfield 
    w-full 
    py-2 text-xs px-3 
    bg-slate-50/95 backdrop-blur-md 
    text-slate-900 
    placeholder:text-slate-400 
    rounded-lg"
/>
```

**Key Elements**:
- `articlesearchfield` - Custom class for search/single-line
- `py-2 text-xs px-3` - Compact padding with small text
- `bg-slate-50/95` - Nearly solid background with slight transparency
- `backdrop-blur-md` - Blur effect
- `rounded-lg` - Slightly less rounded than textarea

### Character Counter Badge

```tsx
<div className="absolute bottom-3 right-3 
  text-xs text-slate-500 
  bg-white/80 
  px-2 py-1 
  rounded-md 
  backdrop-blur-sm 
  border border-slate-900/10">
  {expression.length} / 2000
</div>
```

**Key Elements**:
- Positioned absolutely within input container
- `bg-white/80` - Nearly opaque white
- `backdrop-blur-sm` - Light blur
- Small border for definition

---

## Visual Composition & Layering

### Z-Index Hierarchy

```tsx
// Base layer (z-0, implicit)
DialogContent background gradient

// Decorative layers (z-auto, stacking context)
Glass overlay (absolute inset-0)
Radial light (absolute inset-0)
Water droplets (absolute positioned)

// Content layer (z-10)
Scrollable content area
```

### Overlay Stacking

**Order (bottom to top)**:
1. Base gradient: `bg-gradient-to-b from-sky-50/75 via-slate-50/20 to-sky-50/70`
2. Glass overlay: `bg-gradient-to-b from-slate-900/5 via-transparent to-slate-900/10`
3. Radial light: `bg-[radial-gradient(circle_at_50%_120%,...)]`
4. Water droplets: Two absolute positioned elements

All decorative layers have `pointer-events-none` to allow interaction with content.

### Visual Rhythm

**Spacing Progression** (creates visual flow):
```tsx
space-y-5  // Major sections (largest gap)
  ↓
space-y-3  // Related groups (medium gap)
  ↓
space-y-2  // Label + input pairs (smallest gap)
  ↓
gap-1      // Inline elements (tightest)
```

**Size Progression** (visual hierarchy):
```tsx
text-3xl   // Main title
  ↓
text-2xl   // Title gradient text
  ↓
text-sm    // Labels, body text
  ↓
text-xs    // Helper text, descriptions, small inputs
```

### Compositional Balance

**Horizontal Balance**:
- Left-aligned content with centered buttons in footer
- Icon badges provide visual anchor points
- Grid layout for cards (2 columns)

**Vertical Balance**:
- Header: 3-line max (title, target label, author info)
- Body: Variable height sections with consistent spacing
- Footer: Single line with opposing buttons

**Visual Weight Distribution**:
- Header: 20% (lighter, establishes context)
- Body: 70% (content-heavy, variable)
- Footer: 10% (minimal, action-focused)

### Contrast Ratios

**Primary Text** (slate-900 on light backgrounds):
- WCAG AAA compliant (>7:1 ratio)

**Accent Text** (cyan-900, sky-900):
- WCAG AA compliant (>4.5:1 ratio)

**Helper Text** (slate-600, slate-500):
- WCAG AA compliant (>4.5:1 ratio)

---

## Complete Component Templates

### Dialog Container Template

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
  
  <DialogContent className="
    max-w-3xl max-h-screen overflow-hidden 
    panel-edge-blue
    bg-gradient-to-b from-sky-50/75 via-slate-50/20 to-sky-50/70 
    backdrop-blur-xl 
    shadow-2xl 
    px-6 py-8
  ">
    {/* Decorative layers */}
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/5 via-transparent to-slate-900/10 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />
    <div className="absolute top-10 right-20 w-32 h-32 bg-sky-400/10 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-20 left-10 w-40 h-40 bg-cyan-400/8 rounded-full blur-3xl animate-pulse delay-1000" />
    
    {/* Content */}
    <div className="relative z-10 overflow-y-auto max-h-[85vh] custom-scrollbar-light px-2">
      {/* Your content */}
    </div>
  </DialogContent>
</Dialog>
```

### Section Label Template

```tsx
<Label htmlFor="field-id" className="
  text-sm font-semibold text-sky-900 
  flex items-center gap-1
">
  <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
  Label Text
</Label>
```

### Interactive Card Template

```tsx
<button
  onClick={() => handleSelect()}
  disabled={isDisabled}
  className={cn(
    "group relative flex flex-col items-start gap-2 p-4 rounded-xl",
    "transition-all duration-300 backdrop-blur-md shadow-lg overflow-hidden",
    isSelected
      ? "panel-edge border-cyan-500/60 bg-gradient-to-br from-cyan-400/20 to-sky-400/20 shadow-cyan-400/20 scale-[1.02]"
      : "panel-edge border-cyan-100/60 bg-white/85 shadow-slate-400/80 hover:bg-sky-100/40 hover:scale-[1.01]",
    isDisabled && "opacity-50 cursor-not-allowed"
  )}
>
  {/* Glass shine */}
  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  
  {/* Content */}
  <div className="relative flex items-center gap-2.5 w-full">
    {/* Icon + Text */}
  </div>
  
  {/* Selection indicator */}
  {isSelected && (
    <div className="absolute top-2 right-2">
      <div className="w-2 h-2 rounded-full bg-cyan-600 shadow-lg shadow-cyan-600/50 animate-pulse" />
    </div>
  )}
</button>
```

### Info Banner Template

```tsx
<div className="
  relative overflow-hidden rounded-xl 
  bg-gradient-to-br from-sky-400/15 to-cyan-400/15 
  backdrop-blur-md 
  border border-cyan-500/30 
  py-2 px-3 
  shadow-lg
">
  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-transparent" />
  
  <div className="relative flex gap-4">
    <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 to-sky-500/30 shadow-lg h-fit">
      <Icon className="w-4 h-4 text-cyan-700" />
    </div>
    
    <div className="text-xs text-sky-900 flex-1">
      <p className="font-semibold mb-1 text-cyan-900">Title</p>
      <p className="text-sky-800 leading-relaxed">Description</p>
    </div>
  </div>
</div>
```

---

## Quick Reference Checklist

When building components in this style:

- [ ] Use `<button>` elements, not `<Button>` components
- [ ] Apply `btnv2` class to all buttons
- [ ] Use `panel-edge-blue` for modal containers
- [ ] Use `modalfield` for textareas
- [ ] Use `articlesearchfield` for single-line inputs
- [ ] Prefer `bg-gradient-to-b` over `bg-gradient-to-br` for primary gradients
- [ ] Use `shadow-lg` for cards and interactive elements
- [ ] Add colored shadows for selection states (`shadow-cyan-400/20`)
- [ ] Use `drop-shadow-sm` for text depth (not `lg`)
- [ ] Container padding: `px-6 py-8`
- [ ] Button padding: `px-3 py-2` (via `btnv2`)
- [ ] Section spacing: `space-y-5` (major), `space-y-2` (minor)
- [ ] Higher opacity backgrounds (`bg-white/85` not `bg-slate-900/5`)
- [ ] Border radius: `rounded-xl` for most elements
- [ ] Custom scrollbar class: `custom-scrollbar-light`
- [ ] Layer decorative elements with `pointer-events-none`
- [ ] Content layer needs `relative z-10`

---

## Migration from v1.0

If updating from previous design system version:

### Changed Elements

| v1.0 | v2.0 | Reason |
|------|------|--------|
| `<Button variant="outline">` | `<button className="btnv2">` | Full style control |
| `bg-gradient-to-br` | `bg-gradient-to-b` | Cleaner vertical flow |
| `bg-slate-900/5` | `bg-white/85` | Higher opacity, clearer |
| `shadow-cyan-500/30` | `shadow-cyan-400/30` | Lighter shadow color |
| `drop-shadow-lg` | `drop-shadow-sm` | Subtler text depth |
| Manual borders | `panel-edge-blue` class | Consistent border treatment |
| Manual input styling | `modalfield`, `articlesearchfield` | Consistent field styling |
| `space-y-3` throughout | `space-y-5` for major sections | Better visual rhythm |
| `py-2 px-1` info banner | `py-2 px-3` | More balanced padding |

---

**End of Refined Light Mode Design System**

For dark mode, refer to updated dark mode documentation.  
For comparison, see `GLASS_MORPHISM_DARK_VS_LIGHT_COMPARISON.md`
