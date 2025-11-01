# Light vs Dark Mode Quick Comparison
## Glass Morphism Design System

**Quick Reference**: Side-by-side comparison of dark and light mode styling

**⚠️ Important**: This project does NOT have `blue-*` Tailwind classes defined. Always use `sky-*`, `cyan-*`, or `indigo-*` instead.

---

## Import Paths

```tsx
// Dark Mode (Default)
import { NonCanonicalResponseForm } from "@/components/agora";

// Light Mode
import { NonCanonicalResponseFormLight } from "@/components/agora";
```

---

## Visual Comparison Table

| Element | Dark Mode | Light Mode |
|---------|-----------|------------|
| **Container** | `bg-slate-900/55` | `bg-white/95` |


| **Border (Divider)** | `border-white/10` | `border-slate-900/10` |
| **Title Text** | `text-white` | `text-slate-900` |
| **Title Gradient** | `from-inigo-200 via-cyan-200 to-sky-200` | `from-sky-700 via-cyan-700 to-sky-700` |
| **Icon Badge BG** | `from-indigo-500/30 to-cyan-500/30` | `from-sky-500/20 to-cyan-500/20` |
| **Icon Badge Icon** | `text-indigo-50` | `text-sky-700` |
| **Icon Badge Border** | `border-white/20` | `border-slate-900/10` |
| **Target Label Border** | `border-slate-100/50` | `border-slate-700/30` |
| **Target Label Text** | `text-white` | `text-slate-900` |
| **Helper Dot** | `bg-cyan-400/60` | `bg-cyan-600` |
| **Helper Text** | `text-cyan-200/80` | `text-slate-600` |
| **Author Name** | `text-cyan-100` | `text-slate-900` |
| **Section Label** | `text-indigo-100` | `text-sky-900` |
| **Section Dot** | `bg-cyan-400` | `bg-cyan-600` |
| **Card (Resting) BG** | `bg-white/5` | `bg-slate-900/5` |
| **Card (Resting) Border** | `border-white/10` | `border-slate-900/10` |
| **Card (Hover) BG** | `hover:bg-white/10` | `hover:bg-slate-900/10` |
| **Card (Hover) Border** | `hover:border-white/20` | `hover:border-slate-900/20` |
| **Card (Selected) BG** | `from-cyan-500/20 to-sky-500/20` | `from-cyan-400/20 to-sky-400/20` |
| **Card (Selected) Border** | `border-cyan-400/60` | `border-cyan-500/60` |
| **Card Icon Badge (Resting)** | `bg-white/10` | `bg-slate-900/10` |
| **Card Icon Badge (Selected)** | `from-cyan-400/30 to-sky-400/30` | `from-cyan-500/30 to-sky-500/30` |
| **Card Icon (Resting)** | `text-slate-300` | `text-slate-600` |
| **Card Icon (Selected)** | `text-cyan-200` | `text-cyan-700` |
| **Card Label (Resting)** | `text-slate-200` | `text-slate-700` |
| **Card Label (Selected)** | `text-cyan-100` | `text-cyan-900` |
| **Card Description (Resting)** | `text-slate-400` | `text-slate-500` |
| **Card Description (Selected)** | `text-indigo-200/90` | `text-sky-800` |
| **Selection Indicator** | `bg-cyan-400` + `shadow-cyan-400/50` | `bg-cyan-600` + `shadow-cyan-600/50` |
| **Glass Shine (Hover)** | `from-white/10` | `from-slate-900/5` |
| **Input BG** | `bg-white/10` | `bg-slate-900/5` |
| **Input Border** | `border-white/20` | `border-slate-900/20` |
| **Input Text** | `text-white` | `text-slate-900` |
| **Input Placeholder** | `text-slate-400` | `text-slate-400` (same) |
| **Input Focus Border** | `focus:border-cyan-400/60` | `focus:border-cyan-500/60` |
| **Input Focus Ring** | `focus:ring-cyan-400/20` | `focus:ring-cyan-500/20` |
| **Character Counter BG** | `bg-slate-900/50` | `bg-white/80` |
| **Character Counter Text** | `text-slate-400` | `text-slate-500` |
| **Character Counter Border** | (none) | `border-slate-900/10` |
| **Required Asterisk** | `text-rose-400` | `text-rose-600` |
| **Optional Label** | `text-slate-400` | `text-slate-500` |
| **Info Banner BG** | `from-sky-500/20 to-cyan-500/20` | `from-sky-400/15 to-cyan-400/15` |
| **Info Banner Border** | `border-cyan-400/30` | `border-cyan-500/30` |
| **Info Banner Icon Badge** | `from-cyan-400/30 to-sky-400/30` | `from-cyan-500/30 to-sky-500/30` |
| **Info Banner Icon** | `text-cyan-200` | `text-cyan-700` |
| **Info Banner Title** | `text-cyan-100` | `text-cyan-900` |
| **Info Banner Body** | `text-indigo-100` | `text-sky-900` |
| **Info Banner Description** | `text-indigo-200/90` | `text-sky-800` |
| **Success BG** | `from-emerald-500/20 to-green-500/20` | `from-emerald-400/15 to-green-400/15` |
| **Success Border** | `border-emerald-400/40` | `border-emerald-500/40` |
| **Success Icon** | `text-emerald-300` | `text-emerald-600` |
| **Success Text** | `text-emerald-100` | `text-emerald-900` |
| **Error BG** | `from-rose-500/20 to-red-500/20` | `from-rose-400/15 to-red-400/15` |
| **Error Border** | `border-rose-400/40` | `border-rose-500/40` |
| **Error Icon** | `text-rose-300` | `text-rose-600` |
| **Error Text** | `text-rose-100` | `text-rose-900` |
| **Footer Border** | `border-white/10` | `border-slate-900/10` |
| **Cancel Button BG** | `bg-white/10` | `bg-slate-900/5` |
| **Cancel Button Border** | `border-white/20` | `border-slate-900/20` |
| **Cancel Button Text** | `text-white` | `text-slate-900` |
| **Cancel Button Hover BG** | `hover:bg-white/20` | `hover:bg-slate-900/10` |
| **Cancel Button Hover Border** | `hover:border-white/30` | `hover:border-slate-900/30` |
| **Submit Button Gradient** | `from-sky-700 to-indigo-700` | `from-sky-600 to-indigo-700` |
| **Submit Button Hover** | `from-cyan-600 to-indigo-600` | `from-cyan-500 to-indigo-600` |
| **Submit Button Shadow** | `shadow-cyan-500/30` | `shadow-cyan-400/30` |
| **Submit Button Shadow (Hover)** | `shadow-cyan-500/50` | `shadow-cyan-400/50` |
| **Submit Button Shine** | `via-white/20` | `via-white/30` |
| **Scrollbar Class** | `custom-scrollbar` | `custom-scrollbar-light` |
| **Scrollbar Track** | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.05)` |
| **Scrollbar Thumb** | `rgba(96,165,250,0.4)` (cyan) | `rgba(59,130,246,0.4)` (blue) |
| **Drop Shadow** | `drop-shadow-lg` | `drop-shadow-sm` |

---

## Key Inversion Patterns

### Pattern 1: Container Backgrounds
```tsx
// Dark: Light with low opacity
bg-white/95 → bg-slate-900/55

// Light: Dark with low opacity  
bg-slate-900/55 → bg-white/95
```

### Pattern 3: Text Colors
```tsx
// Dark: Light colors (100-200 range)
text-white, text-cyan-100, text-indigo-100

// Light: Dark colors (600-900 range)
text-slate-900, text-cyan-900, text-sky-900
```

### Pattern 4: Icon Colors
```tsx
// Dark: Lighter shades
text-cyan-200 (selected), text-slate-300 (resting)

// Light: Darker shades
text-cyan-700 (selected), text-slate-600 (resting)
```

### Pattern 5: Borders
```tsx
// Dark: White with low opacity
border-white/10, border-white/20

// Light: Dark with low opacity
border-slate-900/10, border-slate-900/20
```

### Pattern 6: Card Backgrounds
```tsx
// Dark: White overlay
bg-white/5 (resting), bg-white/10 (hover)

// Light: Dark overlay
bg-slate-900/5 (resting), bg-slate-900/10 (hover)
```

### Pattern 7: Selection States
```tsx
// Dark: Cyan 400 (lighter)
border-cyan-400/60, bg-cyan-400/30, shadow-cyan-400/50

// Light: Cyan 500-600 (darker)
border-cyan-500/60, bg-cyan-500/30, shadow-cyan-600/50
```

### Pattern 8: Atmospheric Effects
```tsx
// Dark: Indigo + Cyan (warmer)
bg-indigo-400/20, bg-cyan-400/15

// Light: Sky + Cyan (cooler, lighter)
bg-sky-400/10, bg-cyan-400/8
```

---

## Code Comparison Examples

### Example 1: Title
```tsx
// Dark Mode
<span className="bg-gradient-to-r from-inigo-200 via-cyan-200 to-sky-200 text-2xl text-white">
  Help Defend This
</span>

// Light Mode (use sky, not blue)
<span className="bg-gradient-to-r from-sky-700 via-cyan-700 to-sky-700 bg-clip-text text-transparent text-2xl">
  Help Defend This
</span>
```

### Example 2: Icon Badge
```tsx
// Dark Mode
<div className="p-3 rounded-2xl bg-gradient-to-b from-indigo-500/30 to-cyan-500/30 
  backdrop-blur-sm border border-white/20 shadow-lg">
  <Users className="w-4 h-4 text-indigo-50" />
</div>

// Light Mode (use sky, not blue)
<div className="p-3 rounded-2xl bg-gradient-to-b from-sky-500/20 to-cyan-500/20 
  backdrop-blur-sm border border-slate-900/10 shadow-lg">
  <Users className="w-4 h-4 text-sky-700" />
</div>
```

### Example 3: Input Field
```tsx
// Dark Mode
<Textarea className="bg-white/10 backdrop-blur-md border-white/20 text-white 
  placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-cyan-400/20" />

// Light Mode
<Textarea className="bg-slate-900/5 backdrop-blur-md border-slate-900/20 text-slate-900 
  placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-cyan-500/20" />
```

### Example 4: Selection Card
```tsx
// Dark Mode (Selected)
className="border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 to-sky-500/20"

// Light Mode (Selected)
className="border-cyan-500/60 bg-gradient-to-br from-cyan-400/20 to-sky-400/20"
```

---

## Theme Switcher Implementation

```tsx
import { 
  NonCanonicalResponseForm, 
  NonCanonicalResponseFormLight 
} from "@/components/agora";

function MyComponent() {
  const theme = useTheme(); // or any theme detection method
  
  const FormComponent = theme === 'dark' 
    ? NonCanonicalResponseForm 
    : NonCanonicalResponseFormLight;
  
  return (
    <FormComponent
      open={isOpen}
      onOpenChange={setIsOpen}
      deliberationId="123"
      targetType="argument"
      targetId="456"
    />
  );
}
```

---

## Testing Checklist

When implementing both variants, verify:

- [ ] **NO `blue-*` classes used** (use `sky`, `cyan`, or `indigo`)
- [ ] Dark mode component renders correctly on dark backgrounds
- [ ] Light mode component renders correctly on light backgrounds
- [ ] Text contrast meets WCAG AA/AAA in both modes
- [ ] Interactive states (hover, focus, selected) are visible in both
- [ ] Borders are visible but subtle in both modes
- [ ] Scrollbars use appropriate class names
- [ ] Buttons maintain consistent interaction patterns
- [ ] Success/error messages are clearly distinguishable
- [ ] Theme switching transitions smoothly (if implemented)

---

## Usage Guidelines

### When to Use Dark Mode
- App-wide dark theme enabled
- Evening/night usage
- Media-rich content
- Immersive experiences
- Reduced eye strain in low light

### When to Use Light Mode
- App-wide light theme enabled
- Daytime usage
- Document/text-heavy content
- Extended reading sessions
- Accessibility preferences (some users prefer high contrast light mode)

### Automatic Theme Detection
```tsx
// System preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Time-based
const hour = new Date().getHours();
const isDaytime = hour >= 6 && hour < 18;

// User preference (stored)
const userTheme = localStorage.getItem('theme');
```

---

**Summary**: Both variants maintain identical structure and behavior, differing only in color values to provide optimal legibility in their respective contexts.
