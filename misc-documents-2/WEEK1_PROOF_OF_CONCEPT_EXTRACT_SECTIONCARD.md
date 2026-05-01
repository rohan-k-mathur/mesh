# Week 1 Proof of Concept: Extract SectionCard

## Goal
Extract the `SectionCard` component from DeepDivePanelV2.tsx with zero behavior change.

## Steps

### 1. Create shared/SectionCard.tsx (New File)
```tsx
"use client";
import React from "react";
import clsx from "clsx";

export interface SectionCardProps {
  id?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
  stickyHeader?: boolean;
  busy?: boolean;
  isLoading?: boolean;
  emptyText?: string;
  tone?: "default" | "info" | "success" | "warn" | "danger";
  padded?: boolean;
}

export function SectionCard({
  id,
  title,
  subtitle,
  icon,
  action,
  footer,
  children,
  className = "",
  dense = false,
  stickyHeader = false,
  busy = false,
  isLoading = false,
  emptyText,
  tone = "default",
  padded = true,
}: SectionCardProps) {
  const ringClass =
    tone === "info"
      ? "ring-sky-200/60 dark:ring-sky-400/40"
      : tone === "success"
        ? "ring-emerald-200/60 dark:ring-emerald-400/40"
        : tone === "warn"
          ? "ring-amber-200/60 dark:ring-amber-400/50"
          : tone === "danger"
            ? "ring-rose-200/60 dark:ring-rose-400/40"
            : "ring-slate-200/60 dark:ring-slate-800/60";

  const stripeClass =
    tone === "info"
      ? "bg-sky-400/60"
      : tone === "success"
        ? "bg-emerald-400/60"
        : tone === "warn"
          ? "bg-amber-400/70"
          : tone === "danger"
            ? "bg-rose-400/60"
            : "";

  const bodyPad = padded ? (dense ? "px-3 py-3" : "px-5 pt-4 pb-6") : "";

  return (
    <section
      id={id}
      className={clsx(
        "group relative overflow-hidden rounded-2xl",
        "panel-edge dark:border-slate-800/60",
        "bg-white/50 dark:bg-slate-900/50",
        "backdrop-blur-md supports-[backdrop-filter]:bg-white/50",
        "ring-1",
        ringClass,
        className
      )}
    >
      {stripeClass && (
        <div
          className={clsx(
            "absolute top-0 left-0 right-0 h-1 transition-opacity",
            stripeClass,
            busy || isLoading ? "opacity-100" : "opacity-0 group-hover:opacity-40"
          )}
        />
      )}

      {(title || subtitle || action) && (
        <header
          className={clsx(
            "flex items-start justify-between gap-3 border-b border-slate-200/50 dark:border-slate-800/50",
            dense ? "px-3 py-2" : "px-5 py-3",
            stickyHeader && "sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
          )}
        >
          <div className="flex items-start gap-2 min-w-0 flex-1">
            {icon && (
              <div className="flex-shrink-0 mt-0.5 text-slate-500 dark:text-slate-400">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </header>
      )}

      <div className={bodyPad}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          children
        )}
      </div>

      {footer && (
        <footer className="border-t border-slate-200/50 dark:border-slate-800/50 px-5 py-3 bg-slate-50/50 dark:bg-slate-800/20">
          {footer}
        </footer>
      )}
    </section>
  );
}
```

### 2. Update DeepDivePanelV2.tsx

**Add import at top:**
```tsx
import { SectionCard } from "./shared/SectionCard";
```

**Remove old SectionCard definition** (lines ~205-290 in current file)

**All existing usages work immediately:**
```tsx
// BEFORE (inline definition)
export function SectionCard({ ... }) { ... }

// AFTER (imported)
import { SectionCard } from "./shared/SectionCard"

// Usage stays identical:
<SectionCard title="Compose Proposition">
  <PropositionComposerPro deliberationId={deliberationId} />
</SectionCard>
```

### 3. Test Checklist

**Visual Tests** (in browser):
- [ ] All section cards render identically
- [ ] Headers look correct
- [ ] Icons positioned properly
- [ ] Action buttons in right place
- [ ] Footer borders correct
- [ ] Loading states work
- [ ] Tone colors (info/success/warn/danger) correct
- [ ] Dense mode works
- [ ] Sticky header works
- [ ] Hover effects work

**Functional Tests**:
- [ ] Clicking action buttons works
- [ ] Scrolling behavior unchanged
- [ ] Dark mode works
- [ ] Responsive layout works

**Code Tests**:
```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

### 4. Rollout Plan

**Day 1 (Monday)**: Create shared/SectionCard.tsx
**Day 2 (Tuesday)**: Update import in DeepDivePanelV2.tsx, local testing
**Day 3 (Wednesday)**: Deploy to staging, QA testing
**Day 4 (Thursday)**: Deploy to production, monitor
**Day 5 (Friday)**: If stable, mark complete. If issues, revert is just removing one import.

### 5. Success Criteria

✅ **Zero user-visible changes**  
✅ **DeepDivePanelV2.tsx shrinks by ~85 lines**  
✅ **SectionCard now reusable across codebase**  
✅ **Can write unit tests for SectionCard in isolation**  
✅ **No performance regression**  

### 6. Benefits Gained

After just Week 1:
1. **Immediate reuse**: Other components can now use SectionCard
2. **Easier testing**: Can test SectionCard props in isolation
3. **Better types**: Explicit SectionCardProps interface
4. **Reduced V2 complexity**: 85 fewer lines to maintain
5. **Confidence builder**: Proves extraction strategy works

## Next Steps

If Week 1 succeeds:
- Week 2: Extract StickyHeader and ChipBar (similar process)
- Week 3: Extract hooks (useDeliberationData, etc.)
- Continue incrementally...

## Rollback Plan

If anything goes wrong:
```tsx
// In DeepDivePanelV2.tsx
// Simply revert the import and paste back the original SectionCard definition
// No data loss, no broken functionality
```

---

**Key Insight**: This is NOT a rewrite. We're just moving code to better locations while keeping everything working. Like reorganizing a closet while still wearing the clothes.
