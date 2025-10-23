# Glass Morphism Design System
## Mesh Visual Language Guide

**Version**: 1.1  
**Last Updated**: October 23, 2025  
**Reference Component**: `NonCanonicalResponseForm.tsx`

**⚠️ Important Note**: Tailwind `blue-*` classes are not defined in this project. Use `sky-*`, `cyan-*`, or `indigo-*` instead.

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Core Principles](#core-principles)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Glass Morphism Effects](#glass-morphism-effects)
7. [Component Patterns](#component-patterns)
8. [Interactive States](#interactive-states)
9. [Animation & Motion](#animation--motion)
10. [Accessibility](#accessibility)
11. [Implementation Guide](#implementation-guide)

---

## Design Philosophy

The Mesh glass morphism design system creates depth, elegance, and visual hierarchy through layered transparency, subtle gradients, and backdrop blur effects. The aesthetic evokes water droplets on glass—luminous, fluid, and dimensional.

### Key Characteristics
- **Luminous darkness**: Deep slate/indigo base with bright cyan/sky accents
- **Layered transparency**: Multiple semi-transparent overlays create depth
- **Soft glow effects**: Ambient light emanates from interactive elements
- **Subtle motion**: Pulsing, scaling, and shine animations provide feedback
- **High legibility**: Strong contrast between text and backgrounds

---

## Core Principles

### 1. Depth Through Layers
Create visual depth by stacking multiple transparent layers:
```tsx
// Base container
className="bg-slate-900/55 backdrop-blur-xl"

// Glass overlay (top layer)
<div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/5 pointer-events-none" />

// Radial light effect (middle layer)
<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.15),transparent_50%)] pointer-events-none" />

// Atmospheric decorations (ambient layer)
<div className="absolute top-10 right-20 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" />
```

### 2. Consistency in Opacity
Use standardized opacity values across the design:
- **5%** (`/5`): Subtle tints, resting states
- **10%** (`/10`): Light overlays, borders, backgrounds
- **15%** (`/15`): Atmospheric effects
- **20%** (`/20`): Interactive backgrounds, gradient fills
- **30%** (`/30`): Accent borders, hover states, icon containers
- **40%** (`/40`): Error/success message borders
- **50%** (`/50`): Character counters, tooltips
- **55%** (`/55`): Main container backgrounds
- **60%** (`/60`): Selection borders, dots
- **80%** (`/80`): Secondary text
- **90%** (`/90`): Body text, descriptions

### 3. Gradient Direction Standards
- **Vertical**: `bg-gradient-to-b` for overlays (top-to-bottom light wash)
- **Diagonal**: `bg-gradient-to-br` for containers (bottom-right depth)
- **Horizontal**: `bg-gradient-to-r` for buttons and titles (left-to-right flow)

---

## Color System

### Primary Palette

#### Base Colors
```tsx
// Container backgrounds
bg-slate-900/55  // Main surfaces (55% opacity)
bg-slate-900/50  // Character counter badges

// Atmospheric effects
bg-indigo-400/20  // Water droplet decorations (top)
bg-cyan-400/15    // Water droplet decorations (bottom)
```

#### Accent Colors - Cyan Family
**Note**: Use `cyan` for primary accents, not `blue` (blue-* classes are not available)

```tsx
// Cyan (Primary accent)
bg-cyan-400       // Dots, highlights (solid)
bg-cyan-400/60    // Selection borders
bg-cyan-400/30    // Icon badges, info banner accents
bg-cyan-400/20    // Focus rings

text-cyan-100     // Headings, author names
text-cyan-200     // Icon text, body emphasis
text-cyan-200/80  // Muted info text

border-cyan-400/60  // Selected state borders
border-cyan-400/30  // Info banner borders

shadow-cyan-500/30  // Button shadow (resting)
shadow-cyan-500/50  // Button shadow (hover)
shadow-cyan-400/50  // Pulsing dot glow
```

#### Accent Colors - Indigo Family
```tsx
// Indigo (Secondary accent)
bg-indigo-500/30   // Icon badge gradient start
bg-indigo-700      // Button gradient end

text-indigo-100    // Labels, info banner text
text-indigo-200/90 // Descriptions in selected state
text-indigo-50     // Icon colors in badges
```

#### Accent Colors - Sky Family
**Note**: Use `sky` for lighter blues, not `blue` (blue-* classes are not available)

```tsx
// Sky (Tertiary accent)
bg-sky-500/20      // Selected state gradient start
bg-sky-400/30      // Icon badge gradient end
bg-sky-700         // Button gradient start

text-sky-200       // Title gradient component
```

#### Semantic Colors
```tsx
// Success (Green/Emerald)
bg-emerald-500/20  // Success message background
border-emerald-400/40  // Success message border
text-emerald-300   // Success icon
text-emerald-100   // Success text

// Error (Rose/Red)
bg-rose-500/20     // Error message background
border-rose-400/40 // Error message border
text-rose-300      // Error icon
text-rose-100      // Error text
text-rose-400      // Required field asterisk

// Neutral
bg-white/5         // Resting state backgrounds
bg-white/10        // Input fields, cancel button, interactive surfaces
bg-white/20        // Hover states

text-white         // Primary text, input text
text-slate-200     // Unselected labels
text-slate-300     // Unselected icons
text-slate-400     // Placeholders, descriptions, muted text, optional labels

border-white/10    // Subtle dividers, card borders
border-white/20    // Input borders, hover borders
border-slate-100/50 // Target label border
```

### Gradient Recipes

**⚠️ Remember**: Always use `sky`, `cyan`, or `indigo` - never `blue` (not defined in Tailwind config)

#### Container Gradients
```tsx
// Main dialog gradient
bg-gradient-to-b from-white/10 via-transparent to-white/5

// Radial lighting
bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.15),transparent_50%)]

// Selection state
bg-gradient-to-br from-cyan-500/20 to-sky-500/20

// Icon badges
bg-gradient-to-b from-indigo-500/30 to-cyan-500/30
bg-gradient-to-br from-cyan-400/30 to-sky-400/30

// Info banner
bg-gradient-to-br from-sky-500/20 to-cyan-500/20

// Buttons
bg-gradient-to-r from-sky-700 to-indigo-700        // Resting
hover:from-cyan-600 hover:to-indigo-600            // Hover
```

#### Text Gradients
```tsx
// Title text (if using bg-clip-text)
bg-gradient-to-r from-inigo-200 via-cyan-200 to-sky-200
```

#### Glass Shine Effect
```tsx
// Animated shine sweep (on hover)
bg-gradient-to-r from-transparent via-white/20 to-transparent
translate-x-[-100%] group-hover:translate-x-[100%]
```

---

## Typography

### Font Sizes
```tsx
text-xs    // 0.75rem - Character counters, helper text, optional labels
text-sm    // 0.875rem - Labels, body text, button text, messages
text-2xl   // 1.5rem - Dialog title
text-3xl   // 1.875rem - Dialog title (desktop)
```

### Font Weights
```tsx
font-normal    // 400 - Optional label indicators
font-medium    // 500 - [Not used in reference, but available]
font-semibold  // 600 - Labels, section headers, emphasis
font-bold      // 700 - Dialog title
```

### Text Hierarchy

#### Headings
```tsx
// Dialog Title
className="text-3xl font-bold text-white drop-shadow-lg"

// Section Labels
className="text-sm font-semibold text-indigo-100 flex items-center gap-2"

// Info Banner Title
className="font-semibold mb-2 text-cyan-100"
```

#### Body Text
```tsx
// Primary body
className="text-sm text-indigo-100"

// Descriptions
className="text-xs leading-relaxed text-indigo-200/90"  // Selected
className="text-xs leading-relaxed text-slate-400"      // Unselected

// Helper text
className="text-xs text-cyan-200/80"
```

#### Interactive Text
```tsx
// Button labels
className="text-sm"  // Explicit size for buttons

// Input placeholders
className="placeholder:text-slate-400"
```

### Text Shadows & Effects
```tsx
drop-shadow-lg  // Dialog title for depth on glass
```

---

## Spacing & Layout

### Container Dimensions
```tsx
max-w-3xl       // Dialog width
max-h-screen    // Dialog max height
max-h-[85vh]    // Scrollable content height
p-6             // Dialog padding
px-2            // Scrollable area horizontal padding
```

### Internal Spacing
```tsx
space-y-3       // Standard vertical spacing between sections
space-y-2       // Compact spacing (used in smaller components)
pb-2            // Header padding bottom
pt-6            // Footer padding top

gap-2           // Small gaps between inline elements
gap-3           // Medium gaps (header elements, icon+text)
gap-4           // Large gaps (info banner icon+content)
```

### Component Padding
```tsx
p-2             // Icon badge padding (small)
p-2.5           // Icon badge padding (medium)
p-3             // Icon badge padding (large)
p-4             // Card padding, message padding
p-5             // Info banner padding

px-2 py-0       // Target label padding
px-2 py-1       // Character counter padding
px-4 py-3       // Input field padding
```

### Grid Layouts
```tsx
grid grid-cols-2 gap-3  // Response type selector (2 columns, medium gap)
```

---

## Glass Morphism Effects

### Backdrop Blur
The foundation of the glass effect:
```tsx
backdrop-blur-xl   // Main dialog (16px blur)
backdrop-blur-md   // Interactive elements, inputs, messages (12px blur)
backdrop-blur-sm   // Small elements, badges (4px blur)
```

### Border Treatments
Create glass edges with semi-transparent white borders:
```tsx
border-0                // Remove default borders on main dialog
border border-white/10  // Subtle glass edge (dividers, cards)
border border-white/20  // Emphasized glass edge (inputs, buttons)
border-slate-100/50     // Alternate subtle border (target label)
```

### Shadow System
```tsx
shadow-lg               // Standard depth (cards, inputs, badges)
shadow-2xl              // Maximum depth (main dialog)
shadow-cyan-500/30      // Colored glow (button resting)
shadow-cyan-500/50      // Stronger glow (button hover)
shadow-cyan-400/50      // Dot glow (pulsing indicator)
```

### Rounded Corners
```tsx
rounded-md      // Small radius - target label
rounded-lg      // Medium radius - icon badges (inner)
rounded-xl      // Large radius - cards, inputs, messages, buttons
rounded-2xl     // Extra large radius - icon badge containers
rounded-full    // Circles - dots, water droplet decorations
```

### Overflow & Clipping
```tsx
overflow-hidden         // Clip content to rounded borders (essential for glass effect)
overflow-y-auto         // Enable vertical scrolling
pointer-events-none     // Disable interaction on decorative overlays
```

---

## Component Patterns

### 1. Dialog Container
```tsx
<DialogContent className="max-w-3xl max-h-screen overflow-hidden panel-edge 
  bg-slate-900/55 backdrop-blur-xl shadow-2xl p-6">
  
  {/* Glass overlay */}
  <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/5 pointer-events-none" />
  
  {/* Radial light */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.15),transparent_50%)] pointer-events-none" />
  
  {/* Water droplets */}
  <div className="absolute top-10 right-20 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-20 left-10 w-40 h-40 bg-cyan-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
  
  {/* Scrollable content */}
  <div className="relative z-10 overflow-y-auto max-h-[85vh] custom-scrollbar px-2">
    {/* Content here */}
  </div>
</DialogContent>
```

**Key Points**:
- `overflow-hidden` on container prevents decorative elements from spilling
- `relative z-10` on content ensures it sits above overlays
- Custom class `panel-edge` for additional styling (if defined)
- Stagger animations on water droplets with `delay-1000`

### 2. Section Headers
```tsx
<Label className="text-sm font-semibold text-indigo-100 flex items-center gap-2">
  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
  Label Text
</Label>
```

**Pattern**: Cyan dot + text creates visual hierarchy

### 3. Interactive Cards (Selection)
```tsx
<button
  className={cn(
    "group relative flex flex-col items-start gap-2 p-4 rounded-xl transition-all duration-300",
    "backdrop-blur-md border shadow-lg overflow-hidden",
    isSelected
      ? "border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 to-sky-500/20 shadow-cyan-500/20 scale-[1.02]"
      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01]",
    isDisabled && "opacity-50 cursor-not-allowed"
  )}
>
  {/* Glass shine overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  
  {/* Icon badge */}
  <div className={cn(
    "p-2 rounded-lg transition-all duration-300",
    isSelected
      ? "bg-gradient-to-br from-cyan-400/30 to-sky-400/30 shadow-lg shadow-cyan-500/20"
      : "bg-white/10"
  )}>
    <Icon className={cn(
      "w-4 h-4 transition-colors duration-300",
      isSelected ? "text-cyan-200" : "text-slate-300"
    )} />
  </div>
  
  {/* Labels */}
  <span className={cn(
    "text-sm font-semibold transition-colors duration-300",
    isSelected ? "text-cyan-100" : "text-slate-200"
  )}>
    {label}
  </span>
  
  <span className={cn(
    "text-xs leading-relaxed transition-colors duration-300",
    isSelected ? "text-indigo-200/90" : "text-slate-400"
  )}>
    {description}
  </span>
  
  {/* Selection indicator */}
  {isSelected && (
    <div className="absolute top-2 right-2">
      <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 animate-pulse" />
    </div>
  )}
</button>
```

**Key Points**:
- Use `group` class for hover effects on children
- Scale transform provides tactile feedback (`scale-[1.01]`, `scale-[1.02]`)
- Pulsing dot indicator for selected state
- Glass shine overlay on hover

### 4. Icon Badge (3D Effect)
```tsx
<div className="p-3 rounded-2xl bg-gradient-to-b from-indigo-500/30 to-cyan-500/30 backdrop-blur-sm border border-white/20 shadow-lg">
  <Icon className="w-4 h-4 text-indigo-50" />
</div>
```

**Pattern**: Gradient background + border + shadow creates dimensional look

### 5. Text Input Fields
```tsx
<Textarea
  className="min-h-[140px] resize-y bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 rounded-xl shadow-lg"
/>

<input
  type="text"
  className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-slate-400 rounded-xl focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 shadow-lg transition-all"
/>
```

**Key Points**:
- White/10 background for subtle contrast
- Cyan focus ring for brand consistency
- `transition-all` for smooth focus animation

### 6. Character Counter Badge
```tsx
<div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded-md backdrop-blur-sm">
  {count} / 2000
</div>
```

**Pattern**: Positioned absolutely, darker background to stand out from input

### 7. Info/Message Banners
```tsx
{/* Info */}
<div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 backdrop-blur-md border border-cyan-400/30 p-5 shadow-lg">
  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
  <div className="relative flex gap-4">
    {/* Icon badge */}
    <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-400/30 to-sky-400/30 shadow-lg h-fit">
      <Icon className="w-5 h-5 text-cyan-200" />
    </div>
    {/* Content */}
    <div className="text-sm text-indigo-100 flex-1">
      <p className="font-semibold mb-2 text-cyan-100">Title</p>
      <p className="text-indigo-200/90 leading-relaxed">Description</p>
    </div>
  </div>
</div>

{/* Success */}
<div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-md border border-emerald-400/40 p-4 shadow-lg">
  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
  <div className="relative flex gap-3">
    <Icon className="w-5 h-5 text-emerald-300 flex-shrink-0 animate-pulse" />
    <p className="text-sm text-emerald-100">Message</p>
  </div>
</div>

{/* Error */}
<div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 backdrop-blur-md border border-rose-400/40 p-4 shadow-lg">
  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
  <div className="relative flex gap-3">
    <Icon className="w-5 h-5 text-rose-300 flex-shrink-0" />
    <p className="text-sm text-rose-100">Message</p>
  </div>
</div>
```

**Pattern**: Colored gradient + glass overlay + icon + text

### 8. Primary Button (Glass with Gradient)
```tsx
<button
  className="relative overflow-hidden btnv2 text-sm rounded-xl text-white
    bg-gradient-to-r from-sky-700 to-indigo-700 hover:from-cyan-600 
    hover:to-indigo-600 border-0 shadow-lg shadow-cyan-500/30 
    hover:shadow-cyan-500/50 transition-all duration-300 group"
>
  {/* Glass shine effect */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
  
  {/* Content */}
  <div className="relative flex items-center gap-2">
    <Icon className="w-4 h-4" />
    Button Text
  </div>
</button>
```

**Key Points**:
- Custom class `btnv2` for base styles (ensure this exists in global CSS)
- Shine sweep animation on hover (700ms)
- Gradient shifts on hover for depth
- Shadow intensifies on hover

### 9. Secondary Button (Outline Glass)
```tsx
<Button
  variant="outline"
  className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all"
>
  Button Text
</Button>
```

**Pattern**: Transparent with glass effect, subtle hover states

---

## Interactive States

### Resting State
```tsx
border-white/10
bg-white/5
text-slate-200
```

### Hover State
```tsx
hover:bg-white/10
hover:border-white/20
hover:scale-[1.01]
hover:shadow-cyan-500/50
```

### Active/Selected State
```tsx
border-cyan-400/60
bg-gradient-to-br from-cyan-500/20 to-sky-500/20
text-cyan-100
scale-[1.02]
```

### Focus State
```tsx
focus:border-cyan-400/60
focus:ring-2
focus:ring-cyan-400/20
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

## Animation & Motion

### Animation Timing
```tsx
transition-all duration-300        // Standard transitions (hover, selection)
transition-colors duration-300     // Color-only transitions
transition-opacity duration-300    // Fade effects
transition-transform duration-700  // Shine sweep (slower for elegance)
```

### Built-in Animations
```tsx
animate-pulse           // Pulsing glow on dots, water droplets, success icons
animate-spin            // Loading spinners
```

### Custom Delays
```tsx
delay-1000  // Stagger water droplet animations
```

### Transform Patterns
```tsx
// Hover scale (tactile feedback)
scale-[1.01]  // Subtle lift on hover
scale-[1.02]  // Emphasized lift on selection

// Shine sweep
translate-x-[-100%] group-hover:translate-x-[100%]  // Horizontal sweep across element
```

### Opacity Transitions
```tsx
opacity-0 group-hover:opacity-100  // Show on hover (glass shine overlay)
```

---

## Accessibility

### Color Contrast
- **Text on dark background**: Use white, cyan-100, indigo-100 (WCAG AAA)
- **Icons**: Minimum cyan-200, emerald-300, rose-300 for visibility
- **Interactive elements**: Clear focus rings (cyan-400/20)

### Focus Indicators
```tsx
focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20
```
- Always visible
- High contrast against dark background
- 2px ring width for clarity

### Disabled States
```tsx
disabled:opacity-50 disabled:cursor-not-allowed
```
- Visual reduction (50% opacity)
- Cursor feedback (not-allowed)

### Status Communication
- **Icons + Text**: Always pair icons with text for redundancy
- **Color + Shape**: Use shapes (dots, badges) in addition to color
- **Loading states**: Animated spinner + descriptive text

### Keyboard Navigation
- Ensure all interactive elements are keyboard-accessible
- Use semantic HTML (`<button>`, `<input>`, `<textarea>`)
- Maintain tab order with proper DOM structure

---

## Implementation Guide

### ⚠️ Critical: Tailwind Color Configuration

**This project does NOT include `blue-*` Tailwind classes.** Always use:
- `sky-*` for light/bright blues
- `cyan-*` for blue-green accent colors  
- `indigo-*` for deep purple-blues

Using `blue-*` will result in no styling being applied.

### Prerequisites
```bash
# Tailwind CSS with backdrop blur support
npm install tailwindcss @tailwindcss/forms

# Lucide icons for consistent iconography
npm install lucide-react

# Class name utility for conditional styling
npm install clsx tailwind-merge
```

### Tailwind Configuration
Ensure your `tailwind.config.ts` includes:
```js
module.exports = {
  theme: {
    extend: {
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionDelay: {
        '1000': '1000ms',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

### Custom Scrollbar Styles
Inject custom scrollbar CSS in component or global styles:
```tsx
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(96, 165, 250, 0.4);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(96, 165, 250, 0.6);
  }
`;

// Inject in component
<style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
```

### Custom Button Class (btnv2)
Define in global CSS or component:
```css
.btnv2 {
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### Utility Helper (cn)
```tsx
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Component Structure Template
```tsx
export function GlassComponent() {
  return (
    <div className="max-w-3xl bg-slate-900/55 backdrop-blur-xl rounded-xl shadow-2xl p-6 relative overflow-hidden">
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/5 pointer-events-none" />
      
      {/* Radial light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.15),transparent_50%)] pointer-events-none" />
      
      {/* Water droplets (optional) */}
      <div className="absolute top-10 right-20 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Your content here */}
      </div>
    </div>
  );
}
```

---

## Quick Reference Cheat Sheet

### Common Class Combinations

**Container**:
```
bg-slate-900/55 backdrop-blur-xl shadow-2xl rounded-xl overflow-hidden
```

**Glass Overlay**:
```
absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/5 pointer-events-none
```

**Interactive Card**:
```
backdrop-blur-md border border-white/10 bg-white/5 hover:bg-white/10 rounded-xl shadow-lg
```

**Selected Card**:
```
border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 to-sky-500/20 scale-[1.02]
```

**Input Field**:
```
bg-white/10 backdrop-blur-md border-white/20 text-white rounded-xl focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20
```

**Icon Badge**:
```
p-2.5 rounded-xl bg-gradient-to-br from-cyan-400/30 to-sky-400/30 shadow-lg
```

**Label**:
```
text-sm font-semibold text-indigo-100 flex items-center gap-2
```

**Primary Button**:
```
bg-gradient-to-r from-sky-700 to-indigo-700 hover:from-cyan-600 hover:to-indigo-600 shadow-lg shadow-cyan-500/30 rounded-xl
```

---

## Design System Checklist

When creating a new component using this design system, ensure:

- [ ] **NO `blue-*` classes used** (use `sky`, `cyan`, or `indigo` instead)

- [ ] Container has backdrop blur (`backdrop-blur-xl` or `backdrop-blur-md`)
- [ ] Base opacity is 55% or less for main backgrounds
- [ ] Glass overlay layers are applied (gradient + radial)
- [ ] Rounded corners use xl scale (`rounded-xl`, `rounded-2xl`)
- [ ] Interactive elements have hover states with scale transform
- [ ] Selected states use cyan/sky gradient
- [ ] Focus states have visible cyan ring
- [ ] Text contrast meets WCAG AA minimum
- [ ] Icons are paired with text labels
- [ ] Transitions use 300ms for standard, 700ms for shine effects
- [ ] Loading states include spinner + text
- [ ] Disabled states have 50% opacity + cursor feedback
- [ ] Borders use white with 10-20% opacity
- [ ] Shadows are layered appropriately (lg, 2xl)
- [ ] Custom scrollbar styles applied if scrollable

---

## Examples from Reference Component

### Example 1: Dialog Title with Icon Badge
```tsx
<DialogTitle className="text-3xl font-bold text-white flex items-center gap-3 drop-shadow-lg">
  <div className="p-3 rounded-2xl bg-gradient-to-b from-indigo-500/30 to-cyan-500/30 backdrop-blur-sm border border-white/20 shadow-lg">
    <Users className="w-4 h-4 text-indigo-50" />
  </div>
  <span className="bg-gradient-to-r from-inigo-200 via-cyan-200 to-sky-200 text-2xl text-white">
    Help Defend This
  </span>
</DialogTitle>
```

### Example 2: Target Label Badge
```tsx
<p className="w-fit text-sm border border-slate-100/50 rounded-md text-white leading-relaxed px-2 py-0">
  {targetLabel}
</p>
```

### Example 3: Section Label with Dot
```tsx
<Label className="text-sm font-semibold text-indigo-100 flex items-center gap-2">
  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
  Response Type
</Label>
```

### Example 4: Selection Card with All States
```tsx
<button
  onClick={() => setSelected(!selected)}
  className={cn(
    "group relative flex flex-col items-start gap-2 p-4 rounded-xl transition-all duration-300",
    "backdrop-blur-md border shadow-lg overflow-hidden",
    selected
      ? "border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 to-sky-500/20 shadow-cyan-500/20 scale-[1.02]"
      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01]"
  )}
>
  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  
  <div className="relative flex items-center gap-2.5 w-full">
    <div className={cn(
      "p-2 rounded-lg transition-all duration-300",
      selected
        ? "bg-gradient-to-br from-cyan-400/30 to-sky-400/30 shadow-lg shadow-cyan-500/20"
        : "bg-white/10"
    )}>
      <Icon className={cn(
        "w-4 h-4 transition-colors duration-300",
        selected ? "text-cyan-200" : "text-slate-300"
      )} />
    </div>
    <span className={cn(
      "text-sm font-semibold transition-colors duration-300",
      selected ? "text-cyan-100" : "text-slate-200"
    )}>
      Label
    </span>
  </div>
  
  <span className={cn(
    "text-xs leading-relaxed transition-colors duration-300 relative",
    selected ? "text-indigo-200/90" : "text-slate-400"
  )}>
    Description text
  </span>
  
  {selected && (
    <div className="absolute top-2 right-2">
      <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 animate-pulse" />
    </div>
  )}
</button>
```

---

## Maintenance & Evolution

### Version History
- **v1.0** (Oct 2025): Initial design system based on NonCanonicalResponseForm

### Future Considerations
- Dark mode variants (already dark by default)
- Light mode adaptation (invert opacity values, use darker accents)
- Theme customization (allow color palette overrides)
- Animation preferences (respect `prefers-reduced-motion`)
- High contrast mode support

### Feedback & Iteration
This design system is a living document. As new components are built, patterns may be refined. Document any deviations or improvements to maintain consistency across the Mesh platform.

---

**End of Design System Guide**
