# Ludics UI Components

Phase 1: Week 2 - Badge and Tooltip Components for Ludics Integration

## Components

### InsightsBadge

Displays Ludics interaction complexity score (0-100) with color coding.

```tsx
import { InsightsBadge } from "@/components/ludics";

<InsightsBadge 
  complexityScore={67} 
  size="md" 
  showLabel={true} 
/>
```

**Props**:
- `complexityScore`: number (0-100) - Complexity score from Ludics insights
- `size`: "sm" | "md" | "lg" - Badge size (default: "md")
- `showLabel`: boolean - Show "High/Medium/Low" label (default: true)

**Color Coding**:
- 🔴 Red (70-100): High complexity
- 🟡 Amber (40-69): Medium complexity  
- 🟢 Green (0-39): Low complexity

---

### LocusBadge

Shows locus path and role with visual indicators.

```tsx
import { LocusBadge } from "@/components/ludics";

<LocusBadge 
  path="0.1.2" 
  role="opener" 
  actCount={5}
  size="md"
/>
```

**Props**:
- `path`: string - Locus path (e.g., "0.1.2")
- `role`: "opener" | "responder" | "daimon" | "neutral" - Role at locus
- `actCount`: number (optional) - Number of acts at locus
- `size`: "sm" | "md" | "lg" - Badge size (default: "md")

**Role Icons**:
- ⊕ Opener (positive polarity)
- ⊖ Responder (negative polarity)
- † Daimon (terminal state)
- • Neutral

---

### PolarityBadge

Displays polarity distribution in compact format.

```tsx
import { PolarityBadge } from "@/components/ludics";

<PolarityBadge 
  positive={12} 
  negative={8} 
  neutral={3}
  size="md"
/>
```

**Props**:
- `positive`: number - Count of positive polarity acts
- `negative`: number - Count of negative polarity acts
- `neutral`: number - Count of neutral acts
- `size`: "sm" | "md" - Badge size (default: "md")

**Display**: ⊕12 / ⊖8 / •3

---

### InsightsTooltip

Rich popover showing detailed Ludics metrics. Wraps any component to add hover tooltip.

```tsx
import { InsightsTooltip } from "@/components/ludics";
import type { LudicsInsights } from "@/lib/ludics/computeInsights";

<InsightsTooltip insights={insightsData}>
  <InsightsBadge complexityScore={insightsData.interactionComplexity} />
</InsightsTooltip>
```

**Props**:
- `insights`: LudicsInsights - Full insights object from API
- `children`: React.ReactNode - Component to wrap (badge, button, etc.)

**Features**:
- Appears on hover/focus
- Keyboard accessible (Tab navigation)
- Shows full metric breakdown:
  - Structure: acts, loci, depth, branches
  - Polarity distribution
  - Role distribution
  - Top active loci
- Auto-positioning
- Z-index: 50

---

## Integration Example

Full integration with DialogueInspector:

```tsx
import useSWR from "swr";
import { InsightsBadge, PolarityBadge, InsightsTooltip } from "@/components/ludics";
import type { LudicsInsights } from "@/lib/ludics/computeInsights";

function MyComponent({ deliberationId }: { deliberationId: string }) {
  const { data } = useSWR<{ insights: LudicsInsights }>(
    `/api/ludics/insights?deliberationId=${deliberationId}`,
    fetcher
  );

  if (!data?.insights) return null;

  return (
    <div className="flex gap-2">
      <InsightsTooltip insights={data.insights}>
        <InsightsBadge 
          complexityScore={data.insights.interactionComplexity} 
        />
      </InsightsTooltip>
      
      <PolarityBadge
        positive={data.insights.polarityDistribution.positive}
        negative={data.insights.polarityDistribution.negative}
        neutral={data.insights.polarityDistribution.neutral}
      />
    </div>
  );
}
```

---

## Styling

All components use Tailwind CSS with:
- Consistent border-radius (rounded-full for badges, rounded-md for locus)
- Color-coded semantic classes
- Responsive sizing options
- Hover transitions
- Accessible focus states

---

## Accessibility

✅ All components are keyboard accessible  
✅ Proper ARIA roles and labels  
✅ Title tooltips for screen readers  
✅ Focus visible on Tab navigation  
✅ Color contrast meets WCAG AA standards

---

## Testing

Run lint:
```bash
npm run lint -- --file components/ludics/InsightsBadges.tsx
npm run lint -- --file components/ludics/InsightsTooltip.tsx
```

Visual testing:
1. Start dev server: `npm run dev`
2. Navigate to deliberation with Ludics data
3. Open DialogueInspector
4. Verify badges appear and tooltips work on hover
5. Test keyboard navigation (Tab to badge → tooltip shows)

---

## Dependencies

- React 18+
- Tailwind CSS
- TypeScript
- SWR (for data fetching in examples)

---

## Future Enhancements

- [ ] Add click-to-pin tooltip functionality
- [ ] Animate complexity score transitions
- [ ] Add mini sparkline charts to tooltip
- [ ] Support custom color themes
- [ ] Add badge variants (outline, solid, ghost)
- [ ] Localize text labels
