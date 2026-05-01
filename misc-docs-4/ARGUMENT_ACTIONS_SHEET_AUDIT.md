# ArgumentActionsSheet Component Audit
## Phase 8 Integration Analysis

**Date**: November 1, 2025  
**Component**: `components/arguments/ArgumentActionsSheet.tsx`  
**Context**: Used in DeepDivePanelV2's right FloatingSheet when ArgumentCardV2 is selected

---

## Current Architecture

### Component Overview

**Location**: `components/arguments/ArgumentActionsSheet.tsx`  
**Purpose**: Provides focused interface for argument-level operations  
**Parent**: DeepDivePanelV2 → FloatingSheet (right panel)  
**Trigger**: Click on ArgumentCardV2 in AIFArgumentsListPro

### Current Features (5 Action Panels)

```tsx
type ActionType = "overview" | "attack" | "defend" | "cqs" | "diagram";
```

#### 1. **Overview Panel** ✅ IMPLEMENTED
- Shows argument metadata (ID, conclusion text, scheme key)
- Quick action cards for: Attack, Defend, CQs, Diagram
- Uses gradient badges with icons

#### 2. **Attack Panel** ⚠️ INFORMATIONAL ONLY
- Displays attack types (Rebut, Undercut, Undermine)
- **Current Limitation**: Only shows descriptions, directs users to Attack Menu
- **Missing**: Direct attack creation from this panel

#### 3. **Defend Panel** ⚠️ INFORMATIONAL ONLY
- Shows community defense option
- **Current Limitation**: Directs to Community Defense Menu on argument card
- **Missing**: Direct defense creation

#### 4. **CQs Panel** ⚠️ BASIC IMPLEMENTATION
- Shows scheme key if available
- **Current Limitation**: Directs to CQ button on argument card
- **Missing**: 
  - List of CQs for the scheme
  - CQ status (answered/open)
  - **NO Phase 6/8 inherited CQ provenance**
  - Direct CQ answering interface

#### 5. **Diagram Panel** ✅ FULLY IMPLEMENTED
- Fetches AIF neighborhood via `/api/arguments/{id}/aif-neighborhood?depth=1`
- Renders `AifDiagramViewerDagre` component
- Shows node/edge counts
- Interactive diagram with 600px height
- **Best implemented panel - good model for others**

---

## Direct Imports & Dependencies

### Components Used

1. **FloatingSheet** (`@/components/ui/FloatingSheet`)
   - Base container with glass-dark variant
   - Width: 1000px
   - Side: right

2. **AifDiagramViewerDagre** (`@/components/map/Aifdiagramviewerdagre`)
   - Interactive AIF diagram renderer
   - Uses Dagre layout
   - Props: `initialGraph`, `layoutPreset`, `deliberationId`, `initialSelectedNodeId`, `onNodeClick`

3. **Lucide Icons**
   - `Zap` (attack/action)
   - `GitBranch` (diagram)
   - `Shield` (defend)
   - `Target` (overview/empty)
   - `MessageSquare` (CQs)

### Data Fetching

```typescript
const { data, isLoading, error } = useSWR(
  `/api/arguments/${argument.id}/aif-neighborhood?depth=1`,
  fetcher,
  { revalidateOnFocus: false, dedupingInterval: 60000 }
);
```

**Only used in Diagram Panel** - other panels are static/informational

---

## Phase 8 Integration Opportunities 🎯

### Priority 1: Add RDF Export Button ⭐⭐⭐ HIGH VALUE

**Location**: Overview Panel quick actions OR new dedicated "Export" panel

**Implementation**:
```tsx
// Add to Overview Panel quick actions array
{
  id: "export",
  title: "Export as RDF",
  description: "Download argument with scheme context",
  icon: FileDown,
  color: "from-violet-500 to-purple-500",
}

// New Export Panel
function ExportPanel({ deliberationId, argument }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<"turtle" | "rdfxml" | "jsonld">("turtle");

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/arguments/${argument.id}/aif-export?format=${format}`
      );
      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const ext = format === 'rdfxml' ? 'rdf' : format === 'turtle' ? 'ttl' : 'jsonld';
      link.download = `argument-${argument.id.slice(0, 8)}.${ext}`;
      link.click();
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-white/90 mb-1">Export Argument</h4>
        <p className="text-xs text-white/60">
          Download this argument with full scheme context in RDF format
        </p>
      </div>

      <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
        {/* Format selector */}
        <div>
          <label className="text-xs font-medium text-white/80 mb-2 block">Format</label>
          <div className="grid grid-cols-3 gap-2">
            {['turtle', 'rdfxml', 'jsonld'].map(fmt => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt as any)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  format === fmt
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                )}
              >
                {fmt === 'rdfxml' ? 'RDF/XML' : fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Export info */}
        <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <div className="text-xs text-white/80">
            <strong>Includes:</strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Argument structure (RA-node)</li>
              <li>• Premises (I-nodes)</li>
              <li>• Conclusion (I-node)</li>
              <li>• Scheme reference (S-node)</li>
              <li>• Critical questions</li>
              {argument.schemeKey && <li>• Scheme hierarchy</li>}
            </ul>
          </div>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 
                     text-white font-medium text-sm hover:shadow-lg transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
              Exporting...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 mr-2 inline" />
              Download {format.toUpperCase()}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
```

**API Endpoint Needed**: `/api/arguments/[id]/aif-export/route.ts` (NEW - see roadmap)

**Estimated Effort**: 3-4 hours

---

### Priority 2: Enhance CQs Panel with Phase 8 Features ⭐⭐ MEDIUM-HIGH

**Current State**: Only shows scheme key, no actual CQs displayed

**Phase 8 Enhancement**: Show inherited CQs with provenance

**Implementation**:
```tsx
function CQsPanel({ deliberationId, argument }: CQsPanelProps) {
  const { data: cqData, isLoading } = useSWR(
    argument.schemeKey ? `/api/arguments/${argument.id}/cqs-with-provenance` : null,
    fetcher
  );

  if (!argument.schemeKey) {
    return <EmptyState message="No scheme assigned" />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const ownCQs = cqData?.cqs.filter(cq => !cq.inherited) || [];
  const inheritedCQs = cqData?.cqs.filter(cq => cq.inherited) || [];

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white/90 mb-1">
          Critical Questions
        </h4>
        <p className="text-xs text-white/60">
          {ownCQs.length} own • {inheritedCQs.length} inherited • {cqData?.cqs.length} total
        </p>
      </div>

      {/* CQ Status Overview */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="text-2xl font-bold text-white">{cqData?.cqs.length}</div>
          <div className="text-xs text-white/60">Total</div>
        </div>
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="text-2xl font-bold text-white">
            {cqData?.cqs.filter(cq => cq.status === 'answered').length}
          </div>
          <div className="text-xs text-white/60">Answered</div>
        </div>
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-2xl font-bold text-white">
            {cqData?.cqs.filter(cq => cq.status === 'open').length}
          </div>
          <div className="text-xs text-white/60">Open</div>
        </div>
      </div>

      {/* Own CQs */}
      {ownCQs.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-white/80 mb-2">
            Scheme-Specific Questions
          </h5>
          <div className="space-y-2">
            {ownCQs.map((cq, i) => (
              <CQCard key={i} cq={cq} showProvenance={false} />
            ))}
          </div>
        </div>
      )}

      {/* Inherited CQs with Provenance */}
      {inheritedCQs.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-white/80 mb-2 flex items-center gap-2">
            <Info className="w-3 h-3" />
            Inherited Questions
          </h5>
          <div className="space-y-2">
            {inheritedCQs.map((cq, i) => (
              <CQCard key={i} cq={cq} showProvenance={true} />
            ))}
          </div>
        </div>
      )}

      {/* Answer CQ button */}
      <button
        onClick={() => {
          // Open CQ modal or navigate to CQ answer interface
          window.dispatchEvent(new CustomEvent('open-cq-modal', { 
            detail: { argumentId: argument.id, schemeKey: argument.schemeKey }
          }));
        }}
        className="w-full px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 
                   border border-amber-500/30 text-white text-sm font-medium transition-all"
      >
        <MessageSquare className="w-4 h-4 inline mr-2" />
        Answer Critical Questions
      </button>
    </div>
  );
}

// CQ Card component with provenance
function CQCard({ cq, showProvenance }: { 
  cq: CQWithProvenance; 
  showProvenance: boolean;
}) {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/90">{cq.text}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={clsx(
              'text-[10px] px-2 py-0.5 rounded-full font-medium',
              cq.attackType === 'REBUTS' && 'bg-rose-500/20 text-rose-300',
              cq.attackType === 'UNDERCUTS' && 'bg-amber-500/20 text-amber-300',
              cq.attackType === 'UNDERMINES' && 'bg-indigo-500/20 text-indigo-300'
            )}>
              {cq.attackType}
            </span>
            {showProvenance && cq.inherited && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                from {cq.fromScheme}
              </span>
            )}
            <span className={clsx(
              'text-[10px] px-2 py-0.5 rounded-full',
              cq.status === 'answered' 
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-white/10 text-white/60'
            )}>
              {cq.status === 'answered' ? '✓ Answered' : 'Open'}
            </span>
          </div>
        </div>
      </div>
      
      {showProvenance && cq.inherited && cq.inheritancePath && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-[10px] text-white/50 mb-1">Inheritance Path:</p>
          <div className="space-y-0.5">
            {cq.inheritancePath.map((ancestor, i) => (
              <div key={i} className="text-[10px] text-white/60 flex items-center gap-1">
                <span className="text-white/30">{'  '.repeat(i)}└─</span>
                <span>{ancestor}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**API Endpoint Needed**: `/api/arguments/[id]/cqs-with-provenance/route.ts` (NEW)

**Estimated Effort**: 6-8 hours

---

### Priority 3: Add Scheme Info Panel ⭐⭐ MEDIUM

**New Action**: "Scheme Info" button in Overview

**Implementation**:
```tsx
// Add to ActionSelector
const actions = [
  { id: "overview", label: "Overview", icon: Target },
  { id: "attack", label: "Attack", icon: Zap },
  { id: "defend", label: "Defend", icon: Shield },
  { id: "cqs", label: "CQs", icon: MessageSquare },
  { id: "scheme", label: "Scheme", icon: FileText }, // NEW
  { id: "diagram", label: "Diagram", icon: GitBranch },
] as const;

// New Scheme Info Panel
function SchemeInfoPanel({ deliberationId, argument }: SchemeInfoPanelProps) {
  const { data: schemeData } = useSWR(
    argument.schemeKey ? `/api/schemes/key/${argument.schemeKey}` : null,
    fetcher
  );

  if (!argument.schemeKey) {
    return <EmptyState message="No scheme assigned" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-white/90 mb-1">Scheme Details</h4>
        <p className="text-xs text-white/60">
          Formal argumentation scheme structure and metadata
        </p>
      </div>

      {/* Scheme Badge */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-indigo-500/20">
            <FileText className="w-5 h-5 text-indigo-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-white">
              {schemeData?.name}
            </div>
            <div className="text-xs text-white/60 font-mono">
              {argument.schemeKey}
            </div>
          </div>
        </div>

        {schemeData?.summary && (
          <p className="text-sm text-white/80">{schemeData.summary}</p>
        )}
      </div>

      {/* Hierarchy Path */}
      {schemeData?.ancestors && schemeData.ancestors.length > 0 && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h5 className="text-xs font-semibold text-white/80 mb-2">
            Part of Scheme Family
          </h5>
          <div className="space-y-1">
            {schemeData.ancestors.reverse().map((ancestor, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                <span className="text-white/30">{'  '.repeat(i)}└─</span>
                <span>{ancestor.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Macagno Taxonomy */}
      {schemeData?.materialRelation && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h5 className="text-xs font-semibold text-white/80 mb-3">
            Macagno Taxonomy
          </h5>
          <div className="grid grid-cols-2 gap-3">
            {schemeData.materialRelation && (
              <TaxonomyField 
                label="Material Relation" 
                value={schemeData.materialRelation} 
              />
            )}
            {schemeData.reasoningType && (
              <TaxonomyField 
                label="Reasoning Type" 
                value={schemeData.reasoningType} 
              />
            )}
            {schemeData.purpose && (
              <TaxonomyField 
                label="Purpose" 
                value={schemeData.purpose} 
              />
            )}
            {schemeData.source && (
              <TaxonomyField 
                label="Source" 
                value={schemeData.source} 
              />
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-2">
        <button
          onClick={() => window.open(`/api/aif/export/key/${argument.schemeKey}?format=turtle`)}
          className="w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 
                     border border-white/10 text-white text-sm flex items-center justify-center gap-2"
        >
          <FileDown className="w-4 h-4" />
          Export Scheme (RDF)
        </button>
        
        <button
          onClick={() => window.location.href = `/admin/schemes?highlight=${argument.schemeKey}`}
          className="w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 
                     border border-white/10 text-white text-sm flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          View in Admin
        </button>
      </div>
    </div>
  );
}

function TaxonomyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-white/50 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="text-xs text-white/90 font-medium">
        {value.replace(/_/g, ' ')}
      </div>
    </div>
  );
}
```

**Estimated Effort**: 5-7 hours

---

### Priority 4: Make Attack/Defend Panels Functional ⭐ LOWER PRIORITY

**Current State**: Informational only, redirect to other UI

**Enhancement**: Add direct attack/defend creation

**Consideration**: May be complex due to existing AttackMenuPro integration. Consider if duplication is worth it or if current redirect pattern is sufficient.

**Recommendation**: **DEFER** - Current pattern works, focus on RDF export and CQ enhancements first

---

## API Endpoints Needed

### 1. `/api/arguments/[id]/aif-export/route.ts` ⭐⭐⭐ HIGH PRIORITY

**Purpose**: Export argument with full AIF context (RDF)

**Implementation** (from roadmap):
```typescript
export async function GET(req, { params }) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'turtle';

  const argument = await prisma.argument.findUnique({
    where: { id: params.id },
    include: {
      conclusion: true,
      premises: true,
      scheme: {
        include: {
          cqs: true,
          parentScheme: true
        }
      }
    }
  });

  const builder = new AIFGraphBuilder();
  builder.addArgument(argument);
  builder.addScheme(argument.scheme);

  let serialized;
  if (format === 'turtle') {
    serialized = await serializeToTurtle(builder.getTriples(), builder.getNamespaces());
  } else if (format === 'rdfxml') {
    serialized = await serializeToRDFXML(builder.getTriples(), builder.getNamespaces());
  } else {
    serialized = await serializeToJSONLD(builder.getTriples(), builder.getNamespaces());
  }

  const ext = format === 'rdfxml' ? 'rdf' : format === 'turtle' ? 'ttl' : 'jsonld';
  const contentType = format === 'rdfxml' ? 'application/rdf+xml' : 
                      format === 'turtle' ? 'text/turtle' : 
                      'application/ld+json';

  return new Response(serialized, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="argument-${params.id}.${ext}"`
    }
  });
}
```

**Estimated Effort**: 6-8 hours (includes testing)

---

### 2. `/api/arguments/[id]/cqs-with-provenance/route.ts` ⭐⭐ MEDIUM PRIORITY

**Purpose**: Get CQs with inheritance provenance for an argument's scheme

**Implementation**:
```typescript
export async function GET(req, { params }) {
  const argument = await prisma.argument.findUnique({
    where: { id: params.id },
    include: {
      scheme: {
        include: {
          parentScheme: true
        }
      }
    }
  });

  if (!argument?.scheme) {
    return NextResponse.json({ ok: false, error: 'No scheme' }, { status: 404 });
  }

  // Use Phase 6's getCQsWithInheritance
  const cqsWithInheritance = await getCQsWithInheritanceEnhanced(argument.scheme.id);

  // Get CQ status for this specific argument
  const cqAnswers = await prisma.cQAnswer.findMany({
    where: { argumentId: params.id },
    select: { cqKey: true }
  });

  const answeredKeys = new Set(cqAnswers.map(a => a.cqKey));

  const cqs = cqsWithInheritance.map(cq => ({
    ...cq,
    status: answeredKeys.has(cq.cqKey) ? 'answered' : 'open'
  }));

  return NextResponse.json({ ok: true, cqs });
}
```

**Estimated Effort**: 3-4 hours

---

### 3. `/api/schemes/key/[key]/route.ts` (Enhancement)

**Purpose**: Get scheme details by key (for Scheme Info Panel)

**Current Status**: May already exist, needs verification

**Enhancement**: Include hierarchy (ancestors/descendants)

**Implementation**:
```typescript
export async function GET(req, { params }) {
  const scheme = await prisma.argumentScheme.findUnique({
    where: { key: params.key },
    include: {
      cqs: true,
      parentScheme: {
        include: {
          parentScheme: {
            include: {
              parentScheme: true
            }
          }
        }
      }
    }
  });

  if (!scheme) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  // Collect ancestors
  const ancestors = [];
  let current = scheme.parentScheme;
  while (current) {
    ancestors.push({ id: current.id, key: current.key, name: current.name });
    current = current.parentScheme;
  }

  return NextResponse.json({
    ok: true,
    ...scheme,
    ancestors,
    totalCQs: scheme.cqs.length // Can enhance with inherited count
  });
}
```

**Estimated Effort**: 2-3 hours

---

## Component Dependencies & Integration Points

### Existing Components Used

1. **FloatingSheet** - Container
   - Props: `open`, `onOpenChange`, `side`, `width`, `title`, `subtitle`, `variant`, `icon`
   - Works well, no changes needed

2. **AifDiagramViewerDagre** - Diagram visualization
   - Well integrated in Diagram Panel
   - Good model for other data-rich panels

### Potential New Components

1. **CQCard** (NEW)
   - Reusable CQ display with provenance
   - Used in enhanced CQs Panel

2. **SchemeHierarchyMiniTree** (from roadmap)
   - Could be used in Scheme Info Panel
   - Shows family tree in compact format

3. **ExportFormatPicker** (NEW)
   - Reusable export format selector (Turtle, RDF/XML, JSON-LD)
   - Used in Export Panel

---

## Implementation Roadmap

### Phase 1: Quick Wins (1 week) 🚀

**Goal**: Add RDF export functionality

1. ✅ Create `/api/arguments/[id]/aif-export/route.ts` (6-8h)
2. ✅ Add "Export" action to Overview Panel (2-3h)
3. ✅ Implement Export Panel with format selector (3-4h)
4. ✅ Test export flow with various arguments (2h)

**Total**: 13-17 hours (~2 days)

**Outcome**: Users can export arguments as RDF directly from actions sheet

---

### Phase 2: CQ Enhancement (1 week) 🔍

**Goal**: Show CQs with provenance

1. ✅ Create `/api/arguments/[id]/cqs-with-provenance/route.ts` (3-4h)
2. ✅ Enhance CQs Panel with data fetching (4-5h)
3. ✅ Create CQCard component with provenance display (3-4h)
4. ✅ Add CQ status indicators (answered/open) (2-3h)
5. ✅ Test with inherited CQs (slippery_slope example) (2h)

**Total**: 14-18 hours (~2-3 days)

**Outcome**: Rich CQ display with inheritance tracking

---

### Phase 3: Scheme Info (1 week) ⚡

**Goal**: Complete scheme context panel

1. ✅ Verify/enhance `/api/schemes/key/[key]/route.ts` (2-3h)
2. ✅ Add "Scheme" action to selector (1h)
3. ✅ Implement SchemeInfoPanel component (5-7h)
4. ✅ Add quick actions (export, view in admin) (2-3h)
5. ✅ Test with various scheme types (2h)

**Total**: 12-16 hours (~2 days)

**Outcome**: Complete scheme metadata and hierarchy view

---

## Testing Checklist

### Manual Testing

**Export Panel**:
- [ ] Export button downloads file
- [ ] All 3 formats work (Turtle, RDF/XML, JSON-LD)
- [ ] Filename is correct (argument-{id}.{ext})
- [ ] RDF content includes argument structure
- [ ] Works for arguments with/without schemes

**CQs Panel**:
- [ ] Shows correct CQ count (own vs inherited)
- [ ] Inherited CQs have provenance badges
- [ ] CQ status indicators work (answered/open)
- [ ] Inheritance path displays correctly
- [ ] Works for schemes with no parent
- [ ] Works for deeply nested schemes (3+ levels)

**Scheme Info Panel**:
- [ ] Displays scheme name and summary
- [ ] Hierarchy path shows ancestors
- [ ] Macagno taxonomy fields display
- [ ] Export scheme button works
- [ ] View in admin button navigates correctly

---

## Phase 8 Alignment Score

### Current Implementation: 3/10 ⚠️

**What's Good**:
- ✅ Diagram Panel is excellent (fetches AIF data, renders interactively)
- ✅ Panel architecture is clean and extensible
- ✅ Good separation of concerns (5 distinct action types)

**What's Missing**:
- ❌ No RDF export functionality
- ❌ CQs Panel is informational only, no data fetching
- ❌ No inherited CQ provenance display
- ❌ No scheme hierarchy information
- ❌ Attack/Defend panels are placeholders

### After Phase 1-3 Implementation: 9/10 ✅

**Improvements**:
- ✅ RDF export with format selection
- ✅ Full CQ display with provenance tracking
- ✅ Scheme info panel with hierarchy
- ✅ Phase 8 features accessible from main argument interface
- ✅ Consistent with roadmap (PHASE_8_UI_INTEGRATION_ROADMAP.md)

---

## Conclusion & Recommendations

### Summary

ArgumentActionsSheet is a **well-architected component** with excellent extensibility. The Diagram Panel demonstrates the pattern for data-rich panels (fetch, loading states, interactive UI).

**Current Gaps**: The component lacks Phase 8 integration for:
1. RDF export (highest user value)
2. CQ provenance display (medium value)
3. Scheme context (medium value)

### Priority Recommendations

1. **Implement Export Panel first** (Phase 1) - Highest ROI, straightforward implementation
2. **Enhance CQs Panel second** (Phase 2) - Medium complexity, high theoretical value
3. **Add Scheme Info Panel third** (Phase 3) - Polish feature, completes the picture
4. **Defer Attack/Defend enhancements** - Current redirect pattern works, not worth duplication

### Code Quality

- Clean TypeScript with proper types
- Good component composition
- SWR for data fetching (follows project pattern)
- Proper loading/error states (in Diagram Panel)

### Integration Notes

- Component is **ready for Phase 8 features** with minimal refactoring
- Uses FloatingSheet pattern consistent with DeepDivePanelV2
- No breaking changes needed to existing functionality
- All new features are additive (new panels or enhancements)

---

**Status**: Ready for implementation  
**Total Estimated Effort**: 39-51 hours (~5-7 days focused work)  
**Last Updated**: November 1, 2025
