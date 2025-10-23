# Light Mode Glass Morphism Design System
## Mesh Visual Language Guide - Light Variant

**Version**: 1.1  
**Last Updated**: October 23, 2025  
**Reference Component**: `NonCanonicalResponseFormLight.tsx`  
**Dark Mode Counterpart**: See `GLASS_MORPHISM_DESIGN_SYSTEM.md`

**⚠️ Important Note**: Tailwind `blue-*` classes are not defined in this project. Use `sky-*`, `cyan-*`, or `indigo-*` instead.

---

## Overview

This document defines the **light mode** variant of the Mesh glass morphism design system. It provides the inverse color scheme for components that require lighter backgrounds with darker text and accents, while maintaining the same elegant glass aesthetic, depth, and visual hierarchy.

### Design Philosophy

The light mode maintains the glass morphism aesthetic through:
- **Luminous brightness**: Clean white/slate base with vibrant blue/cyan accents
- **Subtle shadows**: Dark overlays at low opacity create depth without heaviness
- **Soft translucency**: Light backgrounds with minimal opacity for airy feel
- **High contrast**: Dark text on light surfaces ensures legibility
- **Consistent patterns**: Same component structure as dark mode, inverted colors

---

## Core Principles

### 1. Inverted Opacity System
Light mode uses **lower opacity values** for subtlety on bright backgrounds:
- **5%** (`/5`): Hover states, subtle backgrounds, glass overlays
- **8%** (`/8`): Atmospheric water droplets (lighter variant)
- **10%** (`/10`): Standard borders, resting backgrounds, character counter borders
- **15%** (`/15`): Info/success/error message backgrounds
- **20%** (`/20`): Selected state backgrounds, icon badges, interactive cards, input borders
- **30%** (`/30`): Target label borders, accent borders, hover borders, icon badge gradients, button shadows
- **40%** (`/40`): Error/success borders
- **95%** (`/95`): Main container backgrounds (white with slight transparency)

### 2. Same Glass Structure, Different Colors
```tsx
// Light mode container (compare to dark mode)
className="bg-white/95 backdrop-blur-xl"  // vs bg-slate-900/55

// Glass overlay
<div className="absolute inset-0 bg-gradient-to-b from-slate-900/5 via-transparent to-slate-900/10 pointer-events-none" />
// vs from-white/10 via-transparent to-white/5

// Radial light (blue instead of indigo)
<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />
// vs rgba(120,119,198,0.15)
```

### 3. Gradient Directions (Same as Dark Mode)
- **Vertical**: `bg-gradient-to-b` for overlays
- **Diagonal**: `bg-gradient-to-br` for containers and cards
- **Horizontal**: `bg-gradient-to-r` for buttons and text effects

---

## Color System

### Primary Palette

#### Base Colors
```tsx
// Container backgrounds
bg-white/95           // Main dialog surface (bright, slightly transparent)
bg-white/80           // Character counter badges
bg-slate-900/5        // Resting state cards, input fields
bg-slate-900/10       // Hover states, borders on overlays
```

#### Atmospheric Decorations
```tsx
// Water droplets (lighter and more subtle than dark mode)
bg-sky-400/10         // Top-right decoration (use sky, not blue)
bg-cyan-400/8         // Bottom-left decoration
```

#### Text Colors - Inverted from Dark Mode

**⚠️ Note**: Use `sky`, `cyan`, or `indigo` - never `blue` (not defined in Tailwind config)

**Primary Text** (Dark on Light):
```tsx
text-slate-900        // Primary headings, input text, author names
text-slate-700        // Unselected card labels, secondary headings
text-slate-600        // Helper text, icons in unselected state
text-slate-500        // Descriptions, placeholders, character counter, optional labels
text-slate-400        // Placeholder text in inputs, muted icons
```

**Accent Text** (Sky/Cyan Family):
```tsx
// Sky (Primary labels and info - replaces blue)
text-sky-900          // Labels, section headers
text-sky-800          // Selected card descriptions
text-sky-700          // Icon in main badge, text gradient component

// Cyan (Highlights and emphasis)
text-cyan-900         // Info banner headings, selected card text
text-cyan-700         // Selected icons, info banner icons
text-cyan-600         // Dots, selection indicators
```

**Semantic Text**:
```tsx
// Success
text-emerald-900      // Success message text
text-emerald-600      // Success icon

// Error
text-rose-900         // Error message text
text-rose-600         // Error icon, required asterisk

// Sky (text gradients)
text-sky-700          // Title gradient component
```

#### Background Colors - Accent States

**Cyan/Sky Family** (Selection & Interactive):
```tsx
// Selected state backgrounds
bg-cyan-400/20        // Selected card gradient start
bg-sky-400/20         // Selected card gradient end
bg-cyan-500/30        // Icon badge gradient start
bg-sky-500/30         // Icon badge gradient end

// Borders
border-cyan-500/60    // Selected card border
border-cyan-500/30    // Info banner border

// Shadows
shadow-cyan-400/20    // Card shadows when selected
shadow-cyan-400/30    // Button shadow (resting)
shadow-cyan-400/50    // Button shadow (hover), pulsing dot glow
shadow-cyan-600/50    // Pulsing indicator glow
```

**Sky/Indigo Family** (Primary Buttons):
**⚠️ Note**: Use `sky` and `indigo` for button gradients, not `blue`

```tsx
// Icon badges and buttons
bg-sky-500/20         // Icon badge gradient start
bg-cyan-500/20        // Icon badge gradient end

// Buttons
bg-sky-600            // Button gradient start
bg-indigo-700         // Button gradient end (resting)
hover:from-cyan-500   // Button gradient start (hover)
hover:to-indigo-600   // Button gradient end (hover)
```

#### Semantic Colors

**Success** (Emerald/Green):
```tsx
bg-emerald-400/15     // Success message background
border-emerald-500/40 // Success message border
text-emerald-600      // Success icon
text-emerald-900      // Success text
```

**Error** (Rose/Red):
```tsx
bg-rose-400/15        // Error message background
border-rose-500/40    // Error message border
text-rose-600         // Error icon
text-rose-900         // Error text
```

**Info** (Sky/Cyan):
```tsx
bg-sky-400/15         // Info banner gradient start
bg-cyan-400/15        // Info banner gradient end
border-cyan-500/30    // Info banner border
```

#### Border Colors
```tsx
// Standard borders (dark with low opacity)
border-slate-900/10   // Subtle dividers, section borders, card borders
border-slate-900/20   // Input borders, button borders, hover states
border-slate-900/30   // Cancel button hover border

// Special borders
border-slate-700/30   // Target label border (slightly more visible)
```

### Gradient Recipes

**⚠️ Remember**: Always use `sky`, `cyan`, or `indigo` - never `blue`

#### Container & Overlay Gradients
```tsx
// Glass overlay (dark with low opacity instead of white)
bg-gradient-to-b from-slate-900/5 via-transparent to-slate-900/10

// Radial lighting (sky base instead of blue)
bg-[radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.08),transparent_50%)]  // sky-400

// Selection state
bg-gradient-to-br from-cyan-400/20 to-sky-400/20

// Icon badges
bg-gradient-to-b from-sky-500/20 to-cyan-500/20
bg-gradient-to-br from-cyan-500/30 to-sky-500/30

// Info banner
bg-gradient-to-br from-sky-400/15 to-cyan-400/15

// Buttons (keep white text, so darker base needed)
bg-gradient-to-r from-sky-600 to-indigo-700         // Resting
hover:from-cyan-500 hover:to-indigo-600             // Hover
```

#### Text Gradients
```tsx
// Title text with bg-clip-text (sky/cyan instead of blue)
bg-gradient-to-r from-sky-700 via-cyan-700 to-sky-700 bg-clip-text text-transparent
```

#### Glass Shine Effect
```tsx
// Same pattern, brighter shine on light background
bg-gradient-to-r from-transparent via-white/30 to-transparent
translate-x-[-100%] group-hover:translate-x-[100%]
```

---

## Component Patterns - Light Mode

### 1. Dialog Container
```tsx
<DialogContent className="max-w-3xl max-h-screen overflow-hidden panel-edge 
  bg-white/95 backdrop-blur-xl shadow-2xl p-6">
  
  {/* Glass overlay - dark with low opacity */}
  <div className="absolute inset-0 bg-gradient-to-b from-slate-900/5 via-transparent to-slate-900/10 pointer-events-none" />
  
  {/* Radial light - sky tint instead of blue */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.08),transparent_50%)] pointer-events-none" />
  
  {/* Water droplets - lighter */}
  <div className="absolute top-10 right-20 w-32 h-32 bg-sky-400/10 rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-20 left-10 w-40 h-40 bg-cyan-400/8 rounded-full blur-3xl animate-pulse delay-1000" />
  
  {/* Scrollable content */}
  <div className="relative z-10 overflow-y-auto max-h-[85vh] custom-scrollbar-light px-2">
    {/* Content */}
  </div>
</DialogContent>
```

### 2. Section Headers
```tsx
<Label className="text-sm font-semibold text-sky-900 flex items-center gap-2">
  <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
  Label Text
</Label>
```

### 3. Interactive Cards (Selection)
```tsx
<button
  className={cn(
    "group relative flex flex-col items-start gap-2 p-4 rounded-xl transition-all duration-300",
    "backdrop-blur-md border shadow-lg overflow-hidden",
    isSelected
      ? "border-cyan-500/60 bg-gradient-to-br from-cyan-400/20 to-sky-400/20 shadow-cyan-400/20 scale-[1.02]"
      : "border-slate-900/10 bg-slate-900/5 hover:bg-slate-900/10 hover:border-slate-900/20 hover:scale-[1.01]",
    isDisabled && "opacity-50 cursor-not-allowed"
  )}
>
  {/* Glass shine - dark overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  
  {/* Icon badge */}
  <div className={cn(
    "p-2 rounded-lg transition-all duration-300",
    isSelected
      ? "bg-gradient-to-br from-cyan-500/30 to-sky-500/30 shadow-lg shadow-cyan-400/20"
      : "bg-slate-900/10"
  )}>
    <Icon className={cn(
      "w-4 h-4 transition-colors duration-300",
      isSelected ? "text-cyan-700" : "text-slate-600"
    )} />
  </div>
  
  {/* Labels */}
  <span className={cn(
    "text-sm font-semibold transition-colors duration-300",
    isSelected ? "text-cyan-900" : "text-slate-700"
  )}>
    {label}
  </span>
  
  <span className={cn(
    "text-xs leading-relaxed transition-colors duration-300",
    isSelected ? "text-sky-800" : "text-slate-500"
  )}>
    {description}
  </span>
  
  {/* Selection indicator */}
  {isSelected && (
    <div className="absolute top-2 right-2">
      <div className="w-2 h-2 rounded-full bg-cyan-600 shadow-lg shadow-cyan-600/50 animate-pulse" />
    </div>
  )}
</button>
```

### 4. Icon Badge (3D Effect)
```tsx
<div className="p-3 rounded-2xl bg-gradient-to-b from-sky-500/20 to-cyan-500/20 backdrop-blur-sm border border-slate-900/10 shadow-lg">
  <Icon className="w-4 h-4 text-sky-700" />
</div>
```

### 5. Text Input Fields
```tsx
<Textarea
  className="min-h-[140px] resize-y bg-slate-900/5 backdrop-blur-md border-slate-900/20 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg"
/>

<input
  type="text"
  className="w-full px-4 py-3 bg-slate-900/5 backdrop-blur-md border border-slate-900/20 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 shadow-lg transition-all"
/>
```

### 6. Character Counter Badge
```tsx
<div className="absolute bottom-3 right-3 text-xs text-slate-500 bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm border border-slate-900/10">
  {count} / 2000
</div>
```

### 7. Info/Message Banners

**Info Banner**:
```tsx
<div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-400/15 to-cyan-400/15 backdrop-blur-md border border-cyan-500/30 p-5 shadow-lg">
  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-transparent" />
  <div className="relative flex gap-4">
    <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 to-sky-500/30 shadow-lg h-fit">
      <Icon className="w-5 h-5 text-cyan-700" />
    </div>
    <div className="text-sm text-sky-900 flex-1">
      <p className="font-semibold mb-2 text-cyan-900">Title</p>
      <p className="text-sky-800 leading-relaxed">Description</p>
    </div>
  </div>
</div>
```

**Success Message**:
```tsx
<div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400/15 to-green-400/15 backdrop-blur-md border border-emerald-500/40 p-4 shadow-lg">
  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-transparent" />
  <div className="relative flex gap-3">
    <Icon className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-pulse" />
    <p className="text-sm text-emerald-900">Message</p>
  </div>
</div>
```

**Error Message**:
```tsx
<div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-400/15 to-red-400/15 backdrop-blur-md border border-rose-500/40 p-4 shadow-lg">
  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-transparent" />
  <div className="relative flex gap-3">
    <Icon className="w-5 h-5 text-rose-600 flex-shrink-0" />
    <p className="text-sm text-rose-900">Message</p>
  </div>
</div>
```

### 8. Primary Button (Glass with Gradient)
```tsx
<button
  className="relative overflow-hidden btnv2 text-sm rounded-xl text-white
    bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-cyan-500 
    hover:to-indigo-600 border-0 shadow-lg shadow-cyan-400/30 
    hover:shadow-cyan-400/50 transition-all duration-300 group"
>
  {/* Glass shine - brighter on light bg */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
  
  <div className="relative flex items-center gap-2">
    <Icon className="w-4 h-4" />
    Button Text
  </div>
</button>
```

**Note**: Buttons keep white text, so gradients use sky-600 and indigo-700 (not blue)

### 9. Secondary Button (Outline Glass)
```tsx
<Button
  variant="outline"
  className="bg-slate-900/5 backdrop-blur-md border-slate-900/20 text-slate-900 hover:bg-slate-900/10 hover:border-slate-900/30 transition-all"
>
  Button Text
</Button>
```

---

## Interactive States - Light Mode

### Resting State
```tsx
border-slate-900/10
bg-slate-900/5
text-slate-700
```

### Hover State
```tsx
hover:bg-slate-900/10
hover:border-slate-900/20
hover:scale-[1.01]
hover:shadow-cyan-400/50
```

### Active/Selected State
```tsx
border-cyan-500/60
bg-gradient-to-br from-cyan-400/20 to-sky-400/20
text-cyan-900
scale-[1.02]
```

### Focus State
```tsx
focus:border-cyan-500/60
focus:ring-2
focus:ring-cyan-500/20
```

### Disabled State
```tsx
opacity-50
cursor-not-allowed
```

### Loading State
```tsx
<Loader2 className="w-4 h-4 animate-spin" />
```

---

## Custom Scrollbar - Light Mode

```tsx
const scrollbarStyles = `
  .custom-scrollbar-light::-webkit-scrollbar {
    width: 3px;
  }
  .custom-scrollbar-light::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);  /* Dark track on light bg */
    border-radius: 4px;
  }
  .custom-scrollbar-light::-webkit-scrollbar-thumb {
    background: rgba(56, 189, 248, 0.4);  /* Sky thumb (not blue) */
    border-radius: 4px;
  }
  .custom-scrollbar-light::-webkit-scrollbar-thumb:hover {
    background: rgba(56, 189, 248, 0.6);
  }
`;
```

Apply with: `className="custom-scrollbar-light"`

---

## Key Differences: Dark vs Light Mode

| Element | Dark Mode | Light Mode |
|---------|-----------|------------|
| **Container Background** | `bg-slate-900/55` | `bg-white/95` |
| **Glass Overlay** | `from-white/10 to-white/5` | `from-slate-900/5 to-slate-900/10` |
| **Primary Text** | `text-white`, `text-cyan-100` | `text-slate-900`, `text-sky-900` |
| **Resting Card BG** | `bg-white/5` | `bg-slate-900/5` |
| **Selected Card BG** | `from-cyan-500/20 to-sky-500/20` | `from-cyan-400/20 to-sky-400/20` |
| **Border (Resting)** | `border-white/10` | `border-slate-900/10` |
| **Border (Selected)** | `border-cyan-400/60` | `border-cyan-500/60` |
| **Icon (Resting)** | `text-slate-300` | `text-slate-600` |
| **Icon (Selected)** | `text-cyan-200` | `text-cyan-700` |
| **Placeholder Text** | `text-slate-400` | `text-slate-400` (same) |
| **Character Counter BG** | `bg-slate-900/50` | `bg-white/80` |
| **Water Droplets** | `bg-indigo-400/20`, `bg-cyan-400/15` | `bg-sky-400/10`, `bg-cyan-400/8` |
| **Radial Light** | `rgba(120,119,198,0.15)` (indigo) | `rgba(56,189,248,0.08)` (sky) |
| **Scrollbar Track** | `rgba(255,255,255,0.05)` (white) | `rgba(0,0,0,0.05)` (black) |
| **Button Shine** | `via-white/20` | `via-white/30` (brighter) |
| **Drop Shadow** | `drop-shadow-lg` | `drop-shadow-sm` (lighter) |

---

## Typography (Same as Dark Mode)

### Font Sizes
```tsx
text-xs    // 0.75rem
text-sm    // 0.875rem
text-2xl   // 1.5rem
text-3xl   // 1.875rem
```

### Font Weights
```tsx
font-normal    // 400
font-semibold  // 600
font-bold      // 700
```

---

## Spacing & Layout (Same as Dark Mode)

All spacing values remain identical to maintain consistency:
- `max-w-3xl`, `max-h-screen`, `max-h-[85vh]`
- `p-6`, `px-2`, `space-y-3`, `gap-3`, etc.

---

## Accessibility - Light Mode

### Color Contrast
- **Dark text on light background**: Use slate-900, slate-700, blue-900 (WCAG AAA)
- **Icons**: Minimum cyan-700, emerald-600, rose-600 for visibility
- **Interactive elements**: Clear focus rings (cyan-500/20, darker than dark mode)

### Focus Indicators
```tsx
focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20
```
- Slightly darker than dark mode for visibility on light bg
- Still 2px ring width

### High Contrast Mode
Light mode naturally provides better contrast for users who prefer bright interfaces

---

## Implementation Guide

### Component File Naming
```
NonCanonicalResponseForm.tsx       → Dark mode (default)
NonCanonicalResponseFormLight.tsx  → Light mode variant
```

### Scrollbar Class Naming
```tsx
custom-scrollbar        → Dark mode
custom-scrollbar-light  → Light mode
```

### Usage Example
```tsx
import { NonCanonicalResponseFormLight } from "@/components/agora";

// Use exactly like dark mode, just different styling
<NonCanonicalResponseFormLight
  open={isOpen}
  onOpenChange={setIsOpen}
  deliberationId="123"
  targetType="argument"
  targetId="456"
  authorName="Alice"
  targetLabel="Argument: All humans are mortal"
/>
```

---

## Quick Reference Cheat Sheet - Light Mode

### Common Class Combinations

**Container**:
```
bg-white/95 backdrop-blur-xl shadow-2xl rounded-xl overflow-hidden
```

**Glass Overlay**:
```
absolute inset-0 bg-gradient-to-b from-slate-900/5 via-transparent to-slate-900/10 pointer-events-none
```

**Interactive Card**:
```
backdrop-blur-md border border-slate-900/10 bg-slate-900/5 hover:bg-slate-900/10 rounded-xl shadow-lg
```

**Selected Card**:
```
border-cyan-500/60 bg-gradient-to-br from-cyan-400/20 to-sky-400/20 scale-[1.02]
```

**Input Field**:
```
bg-slate-900/5 backdrop-blur-md border-slate-900/20 text-slate-900 rounded-xl focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20
```

**Icon Badge**:
```
p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 to-sky-500/30 shadow-lg
```

**Label**:
```
text-sm font-semibold text-sky-900 flex items-center gap-2
```

**Primary Button**:
```
bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-cyan-500 hover:to-indigo-600 shadow-lg shadow-cyan-400/30 rounded-xl text-white
```

---

## Design System Checklist - Light Mode

When creating a light mode component:

- [ ] **NO `blue-*` classes used** (use `sky`, `cyan`, or `indigo` instead)
- [ ] Container uses `bg-white/95` (not slate-900/55)
- [ ] Glass overlay uses dark (`from-slate-900/5 to-slate-900/10`)
- [ ] Radial gradient uses sky base (not indigo or blue)
- [ ] Water droplets are lighter (10% and 8% opacity, use sky not blue)
- [ ] Primary text is dark (`text-slate-900`, `text-sky-900`)
- [ ] Borders use dark with low opacity (`border-slate-900/10`)
- [ ] Selected states use cyan-500/60 border (darker than dark mode's 400)
- [ ] Resting backgrounds use slate-900/5 (dark on light)
- [ ] Icons in selected state use cyan-700 (not 200)
- [ ] Character counter uses `bg-white/80` (not slate-900/50)
- [ ] Scrollbar class is `custom-scrollbar-light`
- [ ] Drop shadow is `drop-shadow-sm` (not lg)
- [ ] Focus rings use cyan-500 (darker than dark mode's 400)
- [ ] Button shine uses `via-white/30` (brighter than dark mode)

---

## When to Use Light vs Dark Mode

**Use Light Mode** (`NonCanonicalResponseFormLight`) when:
- Component appears in light-themed sections of the app
- User has light mode preference enabled
- Context is document-heavy or reading-focused (better for extended reading)
- Integrating with light-styled third-party components
- Daytime usage patterns

**Use Dark Mode** (`NonCanonicalResponseForm`) when:
- Component appears in dark-themed sections
- User has dark mode preference enabled
- Context is media-rich or immersive (reduces eye strain in low light)
- Evening/night usage patterns
- Premium/elegant aesthetic desired

**Consider Theme Switcher**:
```tsx
const isDarkMode = useTheme() === 'dark';

return isDarkMode ? (
  <NonCanonicalResponseForm {...props} />
) : (
  <NonCanonicalResponseFormLight {...props} />
);
```

---

## Maintenance & Evolution

### Version History
- **v1.0** (Oct 2025): Initial light mode variant based on dark mode design system

### Future Considerations
- Auto theme detection based on system preference
- Smooth transitions between light/dark modes
- User preference persistence
- Contrast adjustments for accessibility modes
- Color-blind friendly variants

---

**End of Light Mode Design System Guide**

For dark mode styling, refer to `GLASS_MORPHISM_DESIGN_SYSTEM.md`
