# Phase 8 AIF Ontology - UI Integration Roadmap
## Strategic Plan for User-Facing Features

**Date**: November 1, 2025  
**Status**: Phase 8E.1-8E.4 Backend Complete, UI Integration Planned  
**Context**: DeepDivePanelV2, Admin/Schemes, Agora components

---

## Executive Summary

Phase 8 successfully implemented AIF ontology export (RDF/XML, Turtle, JSON-LD) with CQ inheritance and provenance tracking. Now we need to surface these capabilities to users through intuitive UI integrations.

**Core Philosophy**: Make powerful ontology features accessible without overwhelming users. Progressive disclosure: basics visible, advanced features discoverable.

---

## Component Architecture Map

### 1. DeepDivePanelV2 Ecosystem 🎯 PRIMARY INTEGRATION TARGET

**Location**: `components/deepdive/DeepDivePanelV2.tsx` (1966 lines)

**Current Structure**:
```
DeepDivePanelV2 (main deliberation interface)
├─ Tabs:
│  ├─ Debate (PropositionsList, ClaimMiniMap)
│  ├─ Models ⭐ (AIFArgumentsListPro → ArgumentCardV2)
│  ├─ Ludics (LudicsPanel)
│  ├─ Issues (IssuesList)
│  ├─ CQ Review (CQ panel)
│  ├─ Thesis (ThesisListView)
│  ├─ Assumptions (ActiveAssumptionsPanel)
│  └─ Hom-Sets (HomSetComparisonChart)
│
├─ Right FloatingSheet:
│  ├─ Dialogue Inspector
│  ├─ ArgumentActionsSheet (selected argument)
│  ├─ CQ Context Panel
│  └─ Definition Sheet
│
└─ Components that render arguments:
   ├─ AIFArgumentsListPro → ArgumentCardV2
   ├─ AIFAuthoringPanel (argument composer)
   └─ SchemeSpecificCQsModal
```

**Key Child Components**:
- **ArgumentCardV2** (shows individual arguments with schemes/CQs)
- **AIFAuthoringPanel** (compose arguments with scheme selection)
- **SchemeSpecificCQsModal** (display CQs for scheme)

### 2. Admin/Schemes Page 🔧 SCHEMA MANAGEMENT

**Location**: `app/admin/schemes/page.tsx`  
**Component**: `components/admin/SchemeList.tsx` (280 lines)

**Current Features**:
- ✅ List/Grid view toggle
- ✅ **Hierarchy view** (Phase 6D - tree visualization)
- ✅ CRUD operations (create, edit, delete schemes)
- ✅ CQ management
- ✅ Search/filter by material relation
- ✅ Parent scheme selection
- ✅ Cluster tag assignment
- ✅ CQ inheritance toggle

**Supporting Components**:
- `components/admin/SchemeCreator.tsx` (600+ lines - form)
- `components/admin/SchemeHierarchyView.tsx` (tree view)

### 3. Agora Components 🏛️ DEBATE/DIALOGUE INTERFACES

**Locations**:
- FloatingSheet (used everywhere)
- DebateSheetReader (debate interface)
- DialogueActionsModal (dialogue moves)

---

## Integration Priorities & Features

## Priority 1: Argument Card Enhancements ⭐⭐⭐ IMMEDIATE

### 1.1 Scheme Provenance Badge in ArgumentCardV2

**Goal**: Show where scheme comes from in hierarchy

**Location**: `components/arguments/ArgumentCardV2.tsx`

**Current State**:
- Shows scheme badge: `🔄 Practical Reasoning`
- No indication of parent/child relationships
- No link to scheme details

**New Feature**: Hierarchical scheme badge
```tsx
// Before:
<Badge>🔄 Practical Reasoning</Badge>

// After:
<SchemeProvenanceBadge 
  schemeKey="slippery_slope"
  schemeName="Slippery Slope"
  hierarchy={[
    { key: "practical_reasoning", name: "Practical Reasoning" },
    { key: "negative_consequences", name: "Negative Consequences" },
    { key: "slippery_slope", name: "Slippery Slope" }
  ]}
/>

// Renders as:
<div className="flex items-center gap-1">
  <Badge variant="secondary">
    🔄 Slippery Slope
    <Tooltip>
      Part of: Practical Reasoning → Negative Consequences
    </Tooltip>
  </Badge>
</div>
```

**API Enhancement**:
```typescript
// GET /api/arguments/{id} should include:
{
  scheme: {
    key: "slippery_slope",
    name: "Slippery Slope",
    parentScheme: {
      key: "negative_consequences",
      name: "Negative Consequences",
      parentScheme: {
        key: "practical_reasoning",
        name: "Practical Reasoning"
      }
    }
  }
}
```

**Estimated Effort**: 4-6 hours  
**Files**: ArgumentCardV2.tsx, /api/arguments routes

---

### 1.2 Inherited CQ Indicator

**Goal**: Show which CQs are inherited vs. own

**Location**: `components/arguments/SchemeSpecificCQsModal.tsx`

**Current State**:
- Lists all CQs for a scheme
- No distinction between own/inherited

**New Feature**: CQ provenance pills
```tsx
<div className="space-y-2">
  {cqs.map(cq => (
    <div key={cq.id} className="flex items-start gap-2">
      <div className="flex-1">
        <p>{cq.text}</p>
      </div>
      {cq.inherited && (
        <Badge variant="outline" className="text-xs">
          Inherited from {cq.fromScheme}
        </Badge>
      )}
    </div>
  ))}
</div>
```

**Data Structure**:
```typescript
interface CriticalQuestionWithProvenance {
  id: string;
  text: string;
  attackKind: "UNDERMINES" | "UNDERCUTS" | "REBUTS";
  inherited: boolean;
  fromScheme?: string; // "Practical Reasoning"
  fromSchemeKey?: string; // "practical_reasoning"
}
```

**API Enhancement**: Use Phase 6's `getCQsWithInheritance()`
```typescript
// GET /api/schemes/{id}/cqs
export async function GET(req, { params }) {
  const cqs = await getCQsWithInheritance(params.id, true);
  return NextResponse.json({ cqs });
}
```

**Estimated Effort**: 3-4 hours  
**Files**: SchemeSpecificCQsModal.tsx, /api/schemes/[id]/cqs/route.ts

---

### 1.3 Scheme Hierarchy Tree Tooltip

**Goal**: Hover over scheme badge to see full family tree

**Location**: ArgumentCardV2.tsx (scheme badge)

**Implementation**:
```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { SchemeHierarchyMiniTree } from "@/components/arguments/SchemeHierarchyMiniTree";

<HoverCard>
  <HoverCardTrigger>
    <Badge>🔄 {schemeName}</Badge>
  </HoverCardTrigger>
  <HoverCardContent className="w-80">
    <SchemeHierarchyMiniTree 
      schemeKey={schemeKey}
      currentSchemeKey={schemeKey}
    />
  </HoverCardContent>
</HoverCard>
```

**SchemeHierarchyMiniTree Component** (NEW):
```tsx
// components/arguments/SchemeHierarchyMiniTree.tsx
export function SchemeHierarchyMiniTree({ 
  schemeKey,
  currentSchemeKey 
}: {
  schemeKey: string;
  currentSchemeKey: string;
}) {
  const { data } = useSWR(`/api/schemes/${schemeKey}/hierarchy`);
  
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">Scheme Family</h4>
      <div className="space-y-1">
        {data?.ancestors.reverse().map((ancestor, i) => (
          <div 
            key={ancestor.key}
            className="flex items-center gap-2"
            style={{ marginLeft: i * 16 }}
          >
            {i > 0 && <span className="text-gray-400">└─</span>}
            <Badge 
              variant={ancestor.key === currentSchemeKey ? "default" : "outline"}
              className="text-xs"
            >
              {ancestor.name}
            </Badge>
          </div>
        ))}
      </div>
      
      {data?.siblings.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-gray-500 mb-1">Siblings:</p>
            <div className="flex flex-wrap gap-1">
              {data.siblings.map(sib => (
                <Badge key={sib.key} variant="secondary" className="text-xs">
                  {sib.name}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

**API Endpoint** (NEW):
```typescript
// app/api/schemes/[key]/hierarchy/route.ts
import { prisma } from "@/lib/prismaclient";

export async function GET(req, { params }: { params: { key: string } }) {
  const scheme = await prisma.argumentScheme.findUnique({
    where: { key: params.key },
    include: {
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
  
  // Collect ancestors
  const ancestors = [];
  let current = scheme;
  while (current) {
    ancestors.push({ key: current.key, name: current.name });
    current = current.parentScheme;
  }
  
  // Get siblings
  const siblings = await prisma.argumentScheme.findMany({
    where: {
      parentSchemeId: scheme.parentSchemeId,
      id: { not: scheme.id }
    },
    select: { key: true, name: true }
  });
  
  return NextResponse.json({ ancestors, siblings });
}
```

**Estimated Effort**: 6-8 hours  
**Files**: SchemeHierarchyMiniTree.tsx (NEW), /api/schemes/[key]/hierarchy/route.ts (NEW)

---

## Priority 2: RDF Export UI ⭐⭐ HIGH IMPACT

### 2.1 Scheme Export Button in Admin

**Goal**: Export schemes to RDF from admin UI

**Location**: `components/admin/SchemeList.tsx`

**Current Actions**: Edit, Delete  
**New Action**: Export

**Implementation**:
```tsx
// In SchemeList.tsx, add to action buttons:
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleExportScheme(scheme)}
>
  <Download className="h-4 w-4" />
</Button>

async function handleExportScheme(scheme: ArgumentScheme) {
  setExportingSchemeId(scheme.id);
  
  // Show format picker dialog
  setExportDialogOpen(true);
  setExportScheme(scheme);
}

// Export Dialog Component
<Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Export {exportScheme?.name}</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Format</label>
        <Select value={exportFormat} onValueChange={setExportFormat}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="turtle">Turtle (.ttl)</SelectItem>
            <SelectItem value="rdfxml">RDF/XML (.rdf)</SelectItem>
            <SelectItem value="jsonld">JSON-LD (.jsonld)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox 
            id="include-hierarchy" 
            checked={includeHierarchy}
            onCheckedChange={setIncludeHierarchy}
          />
          <label htmlFor="include-hierarchy">
            Include parent/child relationships
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox 
            id="include-cqs" 
            checked={includeCQs}
            onCheckedChange={setIncludeCQs}
          />
          <label htmlFor="include-cqs">
            Include critical questions
          </label>
        </div>
      </div>
      
      <Button onClick={handleDownload} className="w-full">
        <Download className="mr-2 h-4 w-4" />
        Download {exportFormat.toUpperCase()}
      </Button>
    </div>
  </DialogContent>
</Dialog>

async function handleDownload() {
  const url = `/api/aif/export/${exportScheme.id}?format=${exportFormat}&includeHierarchy=${includeHierarchy}&includeCQs=${includeCQs}`;
  
  const response = await fetch(url);
  const blob = await response.blob();
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${exportScheme.key}.${exportFormat === 'rdfxml' ? 'rdf' : exportFormat === 'turtle' ? 'ttl' : 'jsonld'}`;
  link.click();
  
  toast.success(`Exported ${exportScheme.name}`);
  setExportDialogOpen(false);
}
```

**Estimated Effort**: 4-6 hours  
**Files**: SchemeList.tsx

---

### 2.2 Cluster Export Button

**Goal**: Export entire scheme family at once

**Location**: `components/admin/SchemeHierarchyView.tsx`

**Current Features**: Tree visualization  
**New Feature**: "Export Family" button

**Implementation**:
```tsx
// In SchemeHierarchyView.tsx
<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-semibold">Scheme Hierarchy</h3>
  
  <Button 
    variant="outline"
    onClick={() => setExportClusterDialogOpen(true)}
  >
    <Download className="mr-2 h-4 w-4" />
    Export Families
  </Button>
</div>

// Export Cluster Dialog
<Dialog open={exportClusterDialogOpen} onOpenChange={setExportClusterDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Export Scheme Family</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Select Cluster</label>
        <Select value={selectedCluster} onValueChange={setSelectedCluster}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a family..." />
          </SelectTrigger>
          <SelectContent>
            {clusters.map(cluster => (
              <SelectItem key={cluster} value={cluster}>
                {cluster.replace(/_/g, ' ')} ({clusterCounts[cluster]} schemes)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button onClick={handleClusterExport} className="w-full">
        Export {selectedCluster?.replace(/_/g, ' ')} Family
      </Button>
    </div>
  </DialogContent>
</Dialog>

async function handleClusterExport() {
  const url = `/api/aif/export/cluster/${selectedCluster}?format=turtle`;
  // Download logic...
}
```

**Estimated Effort**: 3-4 hours  
**Files**: SchemeHierarchyView.tsx

---

### 2.3 Argument Export with Scheme Context

**Goal**: Export argument + its scheme in RDF

**Location**: `components/arguments/ArgumentActionsSheet.tsx`

**Current Actions**: Edit, Delete, Link, etc.  
**New Action**: "Export as RDF"

**Implementation**:
```tsx
// In ArgumentActionsSheet.tsx
<Button 
  variant="ghost"
  className="w-full justify-start"
  onClick={handleExportArgument}
>
  <FileDown className="mr-2 h-4 w-4" />
  Export as RDF
</Button>

async function handleExportArgument() {
  // Fetch argument with full AIF context
  const response = await fetch(`/api/arguments/${argumentId}/aif-export`);
  const blob = await response.blob();
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `argument-${argumentId}.ttl`;
  link.click();
}
```

**New API Endpoint**:
```typescript
// app/api/arguments/[id]/aif-export/route.ts
export async function GET(req, { params }) {
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
  
  // Build RDF graph with:
  // - Argument instance (RA-node)
  // - Premises (I-nodes)
  // - Conclusion (I-node)
  // - Scheme reference (S-node)
  // - CQs
  
  const builder = new AIFGraphBuilder();
  builder.addArgument(argument);
  builder.addScheme(argument.scheme);
  
  const turtle = await serializeToTurtle(builder.getTriples(), builder.getNamespaces());
  
  return new Response(turtle, {
    headers: {
      'Content-Type': 'text/turtle',
      'Content-Disposition': `attachment; filename="argument-${params.id}.ttl"`
    }
  });
}
```

**Estimated Effort**: 6-8 hours  
**Files**: ArgumentActionsSheet.tsx, /api/arguments/[id]/aif-export/route.ts (NEW)

---

## Priority 3: CQ Inheritance Visualization ⭐⭐ USER VALUE

### 3.1 CQ Provenance Panel

**Goal**: Show CQ family tree when viewing CQs

**Location**: `components/arguments/SchemeSpecificCQsModal.tsx`

**New Component**: CQ source indicator with expandable details

**Implementation**:
```tsx
// Enhanced CQ display
{cqs.map(cq => (
  <Card key={cq.id}>
    <CardHeader className="flex flex-row items-start justify-between">
      <div className="flex-1">
        <p className="font-medium">{cq.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline">{cq.attackKind}</Badge>
          {cq.inherited && (
            <Popover>
              <PopoverTrigger>
                <Badge variant="secondary" className="cursor-help">
                  <Info className="h-3 w-3 mr-1" />
                  Inherited
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">CQ Origin</h4>
                  <p className="text-sm text-gray-600">
                    This critical question was inherited from the parent scheme:
                  </p>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="font-medium text-sm">{cq.fromScheme}</p>
                    <p className="text-xs text-gray-500">
                      {cq.inheritanceDepth} level{cq.inheritanceDepth > 1 ? 's' : ''} up
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Inheritance Path:</p>
                    {cq.inheritancePath.map((ancestor, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">{'  '.repeat(i)}└─</span>
                        <span>{ancestor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </CardHeader>
  </Card>
))}
```

**API Enhancement**:
```typescript
// Enhance getCQsWithInheritance to return full provenance
export async function getCQsWithInheritanceEnhanced(schemeId: string) {
  const cqs = await getCQsWithInheritance(schemeId, true);
  
  // For each inherited CQ, compute full path
  return cqs.map(cq => {
    if (!cq.inherited) return cq;
    
    // Recursively collect path to root
    const path = [];
    let currentScheme = cq.fromScheme;
    while (currentScheme) {
      path.push(currentScheme);
      currentScheme = getParentScheme(currentScheme);
    }
    
    return {
      ...cq,
      inheritancePath: path.reverse(),
      inheritanceDepth: path.length
    };
  });
}
```

**Estimated Effort**: 5-7 hours  
**Files**: SchemeSpecificCQsModal.tsx, cqInheritance.ts

---

### 3.2 Interactive CQ Inheritance Toggle

**Goal**: Let users toggle between "own CQs" and "all CQs (with inherited)"

**Location**: `components/arguments/SchemeSpecificCQsModal.tsx`

**Implementation**:
```tsx
const [showInherited, setShowInherited] = useState(true);

<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-semibold">Critical Questions</h3>
  
  <div className="flex items-center gap-2">
    <Switch 
      checked={showInherited} 
      onCheckedChange={setShowInherited}
      id="show-inherited"
    />
    <label htmlFor="show-inherited" className="text-sm">
      Show inherited ({inheritedCount})
    </label>
  </div>
</div>

<div className="space-y-2">
  <div className="text-sm text-gray-600">
    {ownCQCount} own • {inheritedCount} inherited • {ownCQCount + inheritedCount} total
  </div>
  
  {filteredCQs.map(cq => (
    // ... CQ card with inherited badge
  ))}
</div>

// Filter logic
const filteredCQs = showInherited 
  ? cqs 
  : cqs.filter(cq => !cq.inherited);
```

**Estimated Effort**: 2-3 hours  
**Files**: SchemeSpecificCQsModal.tsx

---

## Priority 4: Scheme Browser Enhancements ⭐ DISCOVERABILITY

### 4.1 Hierarchy View as Default

**Goal**: Make tree view the primary view in admin

**Location**: `components/admin/SchemeList.tsx`

**Current**: List view default  
**Proposed**: Hierarchy view default (more intuitive for families)

**Implementation**:
```tsx
// Change default:
const [viewMode, setViewMode] = useState<"list" | "hierarchy">("hierarchy"); // Changed from "list"

// Enhance hierarchy view with:
// - Collapsible families
// - CQ count badges
// - Export family button
// - Quick edit/delete actions
```

**Estimated Effort**: 2-3 hours  
**Files**: SchemeList.tsx

---

### 4.2 Scheme "Info" Button → AIF Preview

**Goal**: Quick preview of RDF structure

**Location**: `components/admin/SchemeList.tsx`

**New Button**: Info icon next to Edit/Delete

**Implementation**:
```tsx
<Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
  <DialogTrigger asChild>
    <Button variant="ghost" size="sm">
      <Info className="h-4 w-4" />
    </Button>
  </DialogTrigger>
  
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>{scheme.name} - AIF Structure</DialogTitle>
    </DialogHeader>
    
    <Tabs defaultValue="visual">
      <TabsList>
        <TabsTrigger value="visual">Visual</TabsTrigger>
        <TabsTrigger value="rdf">RDF Code</TabsTrigger>
        <TabsTrigger value="metadata">Metadata</TabsTrigger>
      </TabsList>
      
      <TabsContent value="visual">
        <SchemeVisualization scheme={scheme} />
      </TabsContent>
      
      <TabsContent value="rdf">
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
          <code>{rdfPreview}</code>
        </pre>
      </TabsContent>
      
      <TabsContent value="metadata">
        <dl className="space-y-2">
          <div>
            <dt className="font-semibold">Parent:</dt>
            <dd>{scheme.parentScheme?.name || "None (root)"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Children:</dt>
            <dd>{scheme.childSchemes?.length || 0}</dd>
          </div>
          <div>
            <dt className="font-semibold">Total CQs:</dt>
            <dd>{scheme.totalCQs} ({scheme.ownCQs} own, {scheme.inheritedCQs} inherited)</dd>
          </div>
          <div>
            <dt className="font-semibold">Cluster:</dt>
            <dd>{scheme.clusterTag || "None"}</dd>
          </div>
          <div>
            <dt className="font-semibold">AIF URI:</dt>
            <dd className="font-mono text-xs">
              http://mesh-platform.io/aif/schemes/{scheme.key}
            </dd>
          </div>
        </dl>
      </TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>

// Fetch RDF preview
useEffect(() => {
  if (previewDialogOpen && selectedScheme) {
    fetch(`/api/aif/export/${selectedScheme.id}?format=turtle`)
      .then(r => r.text())
      .then(setRdfPreview);
  }
}, [previewDialogOpen, selectedScheme]);
```

**Estimated Effort**: 8-10 hours  
**Files**: SchemeList.tsx, SchemeVisualization.tsx (NEW)

---

## Priority 5: Argument Authoring Improvements ⭐ CREATION EXPERIENCE

### 5.1 Scheme Selector with Hierarchy Context

**Goal**: Show scheme families when composing arguments

**Location**: `components/arguments/SchemeComposer.tsx`, `components/SchemeComposerPicker.tsx`

**Current**: Flat dropdown list  
**Proposed**: Hierarchical tree selector

**Implementation**:
```tsx
// components/arguments/SchemePickerWithHierarchy.tsx (NEW)
export function SchemePickerWithHierarchy({
  selectedKey,
  onSelect
}: {
  selectedKey?: string;
  onSelect: (key: string) => void;
}) {
  const { data: schemes } = useSWR('/api/schemes/hierarchy');
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {selectedKey ? getScheme Name(selectedKey) : "Select scheme..."}
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Search schemes..." />
          <CommandEmpty>No scheme found.</CommandEmpty>
          
          <CommandList>
            {schemes?.rootSchemes.map(root => (
              <CommandGroup key={root.key} heading={root.name}>
                <SchemeTreeItem 
                  scheme={root} 
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  depth={0}
                />
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function SchemeTreeItem({ scheme, selectedKey, onSelect, depth }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <>
      <CommandItem 
        onSelect={() => onSelect(scheme.key)}
        className="flex items-center justify-between"
        style={{ paddingLeft: depth * 16 + 8 }}
      >
        <div className="flex items-center gap-2">
          {scheme.childSchemes?.length > 0 && (
            <button onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          )}
          <span>{scheme.name}</span>
          {scheme.inheritCQs && (
            <Badge variant="secondary" className="text-xs">
              {scheme.totalCQs} CQs
            </Badge>
          )}
        </div>
        {selectedKey === scheme.key && <Check className="h-4 w-4" />}
      </CommandItem>
      
      {expanded && scheme.childSchemes?.map(child => (
        <SchemeTreeItem 
          key={child.key}
          scheme={child}
          selectedKey={selectedKey}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </>
  );
}
```

**API Endpoint** (NEW):
```typescript
// GET /api/schemes/hierarchy
export async function GET() {
  const schemes = await prisma.argumentScheme.findMany({
    include: {
      childSchemes: {
        include: {
          childSchemes: {
            include: {
              childSchemes: true // 3 levels deep
            }
          }
        }
      },
      cqs: { select: { id: true } } // Count only
    }
  });
  
  // Filter to root schemes (no parent)
  const rootSchemes = schemes.filter(s => !s.parentSchemeId);
  
  return NextResponse.json({ rootSchemes });
}
```

**Estimated Effort**: 10-12 hours  
**Files**: SchemePickerWithHierarchy.tsx (NEW), SchemeComposer.tsx, /api/schemes/hierarchy/route.ts (NEW)

---

### 5.2 CQ Preview During Scheme Selection

**Goal**: Show CQs before committing to scheme

**Location**: Scheme picker dialog

**Implementation**:
```tsx
// In SchemePickerWithHierarchy
<div className="border-t p-4 bg-gray-50">
  {hoveredScheme && (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">Critical Questions Preview</h4>
      <p className="text-xs text-gray-600">
        {hoveredScheme.totalCQs} questions 
        ({hoveredScheme.ownCQs} own, {hoveredScheme.inheritedCQs} inherited)
      </p>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {hoveredScheme.cqPreview.map((cq, i) => (
          <div key={i} className="text-xs">
            <span className="font-medium">{i+1}.</span> {cq.text}
            {cq.inherited && (
              <Badge variant="outline" className="ml-2 text-[10px]">
                from {cq.fromScheme}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  )}
</div>
```

**Estimated Effort**: 4-6 hours  
**Files**: SchemePickerWithHierarchy.tsx

---

## Priority 6: FloatingSheet Enhancements ⭐ CONTEXT AWARENESS

### 6.1 Scheme Info Panel in Right Sheet

**Goal**: Show scheme details when argument selected

**Location**: `components/deepdive/DeepDivePanelV2.tsx` right FloatingSheet

**Current Content**:
- DialogueInspector
- ArgumentActionsSheet
- CQContextPanel
- DefinitionSheet

**New Content**: SchemeInfoPanel

**Implementation**:
```tsx
// In DeepDivePanelV2.tsx
{selectedArgumentForActions && (
  <FloatingSheet side="right" defaultOpen>
    <Tabs defaultValue="actions">
      <TabsList>
        <TabsTrigger value="actions">Actions</TabsTrigger>
        <TabsTrigger value="scheme">Scheme</TabsTrigger>
        <TabsTrigger value="cqs">CQs</TabsTrigger>
      </TabsList>
      
      <TabsContent value="actions">
        <ArgumentActionsSheet argument={selectedArgumentForActions} />
      </TabsContent>
      
      <TabsContent value="scheme">
        <SchemeInfoPanel 
          schemeKey={selectedArgumentForActions.schemeKey}
          argumentId={selectedArgumentForActions.id}
        />
      </TabsContent>
      
      <TabsContent value="cqs">
        <CQStatusPanel argumentId={selectedArgumentForActions.id} />
      </TabsContent>
    </Tabs>
  </FloatingSheet>
)}
```

**SchemeInfoPanel Component** (NEW):
```tsx
// components/arguments/SchemeInfoPanel.tsx
export function SchemeInfoPanel({ 
  schemeKey, 
  argumentId 
}: {
  schemeKey: string;
  argumentId: string;
}) {
  const { data: scheme } = useSWR(`/api/schemes/key/${schemeKey}`);
  const { data: cqStatus } = useSWR(`/api/arguments/${argumentId}/cq-status`);
  
  return (
    <div className="space-y-4 p-4">
      {/* Scheme Badge */}
      <div className="flex items-center gap-2">
        <Badge className="text-lg">🔄 {scheme?.name}</Badge>
      </div>
      
      {/* Hierarchy Path */}
      {scheme?.ancestors && scheme.ancestors.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Part of:</h4>
          <div className="space-y-1">
            {scheme.ancestors.map((ancestor, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">{'  '.repeat(i)}└─</span>
                <span>{ancestor.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Description:</h4>
        <p className="text-sm text-gray-600">{scheme?.summary}</p>
      </div>
      
      {/* CQ Overview */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Critical Questions</h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-2xl font-bold">{scheme?.totalCQs}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="text-2xl font-bold">{cqStatus?.satisfied}</div>
            <div className="text-xs text-gray-600">Satisfied</div>
          </div>
          <div className="bg-amber-50 p-2 rounded">
            <div className="text-2xl font-bold">{cqStatus?.open}</div>
            <div className="text-xs text-gray-600">Open</div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => window.open(`/api/aif/export/key/${schemeKey}?format=turtle`)}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Scheme (RDF)
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => router.push(`/admin/schemes?highlight=${schemeKey}`)}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View in Admin
        </Button>
      </div>
    </div>
  );
}
```

**Estimated Effort**: 8-10 hours  
**Files**: DeepDivePanelV2.tsx, SchemeInfoPanel.tsx (NEW)

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 weeks) 🚀 IMMEDIATE VALUE

**Goal**: Surface Phase 8 features with minimal new code

1. ✅ **Priority 1.1**: Scheme Provenance Badge (4-6h)
2. ✅ **Priority 1.2**: Inherited CQ Indicator (3-4h)
3. ✅ **Priority 2.1**: Scheme Export Button in Admin (4-6h)
4. ✅ **Priority 4.1**: Hierarchy View as Default (2-3h)

**Total**: 13-19 hours (~2-3 days)

**Outcome**: Users can see hierarchy, distinguish inherited CQs, export RDF

---

### Phase 2: Enhanced Discovery (2-3 weeks) 🔍 USABILITY

**Goal**: Make ontology structure intuitive and explorable

5. ✅ **Priority 1.3**: Scheme Hierarchy Tree Tooltip (6-8h)
6. ✅ **Priority 3.1**: CQ Provenance Panel (5-7h)
7. ✅ **Priority 3.2**: Interactive CQ Inheritance Toggle (2-3h)
8. ✅ **Priority 2.2**: Cluster Export Button (3-4h)

**Total**: 16-22 hours (~2-4 days)

**Outcome**: Rich contextual information, clear provenance tracking

---

### Phase 3: Advanced Features (3-4 weeks) ⚡ POWER USERS

**Goal**: Full ontology integration for researchers/power users

9. ✅ **Priority 4.2**: Scheme Info Button → AIF Preview (8-10h)
10. ✅ **Priority 5.1**: Scheme Selector with Hierarchy (10-12h)
11. ✅ **Priority 5.2**: CQ Preview During Selection (4-6h)
12. ✅ **Priority 6.1**: Scheme Info Panel in FloatingSheet (8-10h)
13. ✅ **Priority 2.3**: Argument Export with Scheme Context (6-8h)

**Total**: 36-46 hours (~5-7 days)

**Outcome**: Complete ontology-aware authoring and exploration experience

---

## Success Metrics

### User Experience Metrics

1. **Discoverability**: % of users who view scheme hierarchy (target: 40%)
2. **Export Adoption**: # of RDF exports per week (target: 10+)
3. **CQ Understanding**: % of users who check CQ provenance (target: 25%)
4. **Hierarchy Awareness**: % of arguments using child schemes (target: 30%)

### Technical Metrics

1. **API Performance**: Hierarchy queries <50ms
2. **RDF Export**: Single scheme <200ms, cluster <500ms
3. **UI Responsiveness**: No blocking operations
4. **Data Consistency**: 100% provenance accuracy

---

## API Enhancements Needed

### New Endpoints

1. ✅ **GET /api/schemes/[key]/hierarchy** - Ancestors and siblings
2. ✅ **GET /api/schemes/hierarchy** - Full tree structure
3. ✅ **GET /api/schemes/[id]/cqs** - CQs with provenance
4. ✅ **GET /api/arguments/[id]/aif-export** - Argument as RDF
5. ✅ **GET /api/arguments/[id]/cq-status** - CQ completion stats

### Enhanced Responses

**Existing endpoints to enhance**:
- ✅ **GET /api/arguments** - Include scheme hierarchy
- ✅ **GET /api/schemes** - Include CQ counts (own/inherited/total)

---

## Component Dependencies

### New Components to Create

1. ✅ `SchemeProvenanceBadge.tsx` (Priority 1.1)
2. ✅ `SchemeHierarchyMiniTree.tsx` (Priority 1.3)
3. ✅ `CQProvenancePanel.tsx` (Priority 3.1)
4. ✅ `SchemeVisualization.tsx` (Priority 4.2)
5. ✅ `SchemePickerWithHierarchy.tsx` (Priority 5.1)
6. ✅ `SchemeInfoPanel.tsx` (Priority 6.1)

### Components to Modify

1. ✅ `ArgumentCardV2.tsx` - Add provenance badge
2. ✅ `SchemeList.tsx` - Add export buttons
3. ✅ `SchemeHierarchyView.tsx` - Add cluster export
4. ✅ `SchemeSpecificCQsModal.tsx` - Add provenance indicators
5. ✅ `DeepDivePanelV2.tsx` - Add scheme info panel
6. ✅ `SchemeComposer.tsx` - Use hierarchical picker
7. ✅ `ArgumentActionsSheet.tsx` - Add RDF export action

---

## Testing Strategy

### Manual Testing Checklist

**Priority 1 (Quick Wins)**:
- [ ] Scheme badge shows hierarchy tooltip
- [ ] Inherited CQs have "Inherited from X" badge
- [ ] Export button downloads valid RDF file
- [ ] Hierarchy view shows tree structure correctly

**Priority 2 (Discovery)**:
- [ ] Hover over scheme shows family tree
- [ ] CQ provenance panel shows inheritance path
- [ ] CQ toggle hides/shows inherited questions
- [ ] Cluster export includes all family members

**Priority 3 (Advanced)**:
- [ ] Info button shows RDF preview
- [ ] Hierarchical scheme picker renders tree
- [ ] CQ preview updates on scheme hover
- [ ] Scheme info panel loads in right sheet
- [ ] Argument export includes scheme context

### Automated Testing

**Unit Tests**:
- API endpoint response shapes
- CQ inheritance computation
- Hierarchy traversal algorithms

**Integration Tests**:
- Export flow (button → API → download)
- CQ provenance display
- Scheme selection with preview

---

## Documentation Updates Needed

1. **User Guide**: "Understanding Scheme Families"
2. **Admin Guide**: "Managing Scheme Hierarchies"
3. **Developer Guide**: "AIF Ontology API Reference"
4. **Tutorial**: "Exporting Arguments as RDF"

---

## Risks & Mitigations

### Risk 1: Complexity Overwhelm

**Problem**: Too much ontology information could confuse users

**Mitigation**:
- Progressive disclosure (hierarchy visible but not prominent)
- Clear tooltips with "Learn more" links
- Default to simple views, advanced features in menus

### Risk 2: Performance with Large Hierarchies

**Problem**: Recursive queries could be slow

**Mitigation**:
- Cache hierarchy data in Redis
- Limit recursion depth to 4 levels
- Paginate large scheme lists

### Risk 3: Export Feature Discoverability

**Problem**: Users might not find export buttons

**Mitigation**:
- Add "Export" to main menu
- Show tooltip on first visit: "New! Export schemes as RDF"
- Add to onboarding checklist

---

## Future Enhancements (Post-Phase 8)

### Phase 8F Integration (Deferred)

When implementing **Phase 8F: Ontological Reasoning Engine**:

1. **Scheme Recommendation Widget**
   - Show related schemes during authoring
   - "You used Practical Reasoning, consider Negative Consequences"

2. **Fallacy Detection Warnings**
   - "⚠️ This argument may be an Appeal to False Authority"
   - Link to unanswered CQs

3. **Burden of Proof Indicators**
   - Show who has burden in deliberation
   - "Proponent must prove..." badge

4. **Enthymeme Reconstruction**
   - "🔍 Implicit assumption detected: [premise]"
   - One-click to add to argument

---

## Conclusion

This roadmap provides a **pragmatic, phased approach** to integrating Phase 8's powerful AIF ontology features into Mesh's user interface. 

**Key Principles**:
- ✅ **Progressive disclosure**: Advanced features discoverable, not prominent
- ✅ **Backwards compatible**: All changes are additive
- ✅ **User-centered**: Focus on value (understanding, exporting) not technology
- ✅ **Well-tested**: Each phase includes manual and automated testing

**Total Estimated Effort**: 65-87 hours (~8-11 days of focused work)

**Recommended Start**: Priority 1 (Quick Wins) to deliver immediate value, then gather user feedback before proceeding to Phases 2-3.

---

**Next Steps**:
1. Review and approve roadmap
2. Prioritize features based on user needs
3. Begin Phase 1 implementation
4. Create detailed specs for new components
5. Schedule user testing sessions

**Status**: Ready to implement  
**Last Updated**: November 1, 2025
