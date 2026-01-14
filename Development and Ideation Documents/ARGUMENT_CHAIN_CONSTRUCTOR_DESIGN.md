# ArgumentChain: Cross-Argument Chain Constructor - Design Proposal

**Date**: November 15, 2025  
**Purpose**: Design a UX tool for chaining complete arguments together to build complex deliberative reasoning structures  
**Status**: 🎨 **CONCEPTUAL DESIGN**

---

## Executive Summary

### The Core Insight

**Current System**:
- `SchemeNet` = Sequential schemes **within** one Argument
- Limited to single-author, single-argument analysis
- Cannot model deliberation as interconnected reasoning

**Proposed System**:
- `ArgumentChain` = Chain of complete **Arguments** (each with their own SchemeNets)
- Multi-author, collaborative reasoning chains
- Models real deliberation structure: "Your claim enables my premise"

### Visual Distinction

```
SchemeNet (Current - Analysis Tool):
┌─────────────────── ARGUMENT ────────────────────┐
│ "We should implement carbon tax"                │
│                                                  │
│ [Step 1: Expert Opinion]                        │
│ [Step 2: Sign Evidence]                         │
│ [Step 3: Causal Reasoning]                      │
│ [Step 4: Practical Reasoning]                   │
│                                                  │
│ One author, one argument, explicit steps        │
└──────────────────────────────────────────────────────┘

ArgumentChain (Proposed - Construction Tool):
┌─────────────────── DELIBERATION ─────────────────────┐
│                                                      │
│ [Argument A: "Climate change is happening"]         │
│         │ (User Alice, Expert Opinion SchemeNet)    │
│         │                                            │
│         ↓ (enables premise of...)                   │
│                                                      │
│ [Argument B: "CO2 emissions cause warming"]         │
│         │ (User Bob, Causal Reasoning SchemeNet)    │
│         │                                            │
│         ↓ (leads to...)                             │
│                                                      │
│ [Argument C: "Therefore carbon tax needed"]         │
│         │ (User Carol, Practical Reasoning)         │
│                                                      │
│ Three authors, three arguments, deliberative chain  │
└──────────────────────────────────────────────────────┘
```

---

## Part 1: Conceptual Foundation

### 1.1 What is an ArgumentChain?

**Definition**:
> An **ArgumentChain** is a deliberation-level structure that chains multiple complete Arguments together, where the conclusion of Argument N serves as a premise or enabling condition for Argument N+1.

**Key Characteristics**:

1. **Multi-Argument**: Chains Arguments (not just schemes)
2. **Multi-Author**: Different users contribute different nodes
3. **Cross-References**: Arguments cite/depend on each other
4. **Nested Structure**: Each Argument may have its own SchemeNet
5. **Deliberation-Scoped**: Lives at deliberation level, not argument level

**Theoretical Alignment**:
- Macagno & Walton's examples (The Hague Speech) show multi-step reasoning
- Real deliberations ARE argument chains (distributed across participants)
- Each "step" in their examples could be a full Argument object
- Current SchemeNet models intra-argument structure
- ArgumentChain models inter-argument structure

---

### 1.2 Real-World Use Cases

**Use Case 1: Collaborative Policy Development**

```
Deliberation: "Should city adopt congestion pricing?"

Participant A (Traffic Expert):
  Argument: "Traffic congestion costs city $2B/year"
  Type: Argument from Statistics
  SchemeNet: Expert Opinion → Sign Evidence
  
    ↓ (establishes problem, enables next claim)

Participant B (Urban Planner):
  Argument: "Congestion pricing reduces traffic 20-30%"
  Type: Argument from Precedent (London, Stockholm)
  SchemeNet: Case Study → Analogy
  Dependencies: Cites Argument A (problem exists)
  
    ↓ (shows solution effectiveness, enables policy)

Participant C (City Council):
  Argument: "Therefore we should implement congestion pricing"
  Type: Practical Reasoning
  SchemeNet: Values → Means → Ought
  Dependencies: Cites A (problem) + B (solution)
  
Result: ArgumentChain chains A → B → C
Each node is full argument (with author, dates, schemes)
Chain shows collaborative reasoning structure
```

**Use Case 2: Scientific Reasoning Chain**

```
Research Team Deliberation: "Is gene therapy safe?"

Dr. Smith:
  Argument: "Mouse trials show 95% success rate"
  Evidence: Lab data, peer-reviewed study
  SchemeNet: Experimental Evidence → Statistical Inference
  
    ↓

Dr. Jones:
  Argument: "Mouse models accurately predict human outcomes in this domain"
  Evidence: Historical correlation analysis
  SchemeNet: Argument from Analogy
  Dependencies: Builds on Smith's data
  
    ↓

Dr. Chen:
  Argument: "Therefore gene therapy likely safe for human trials"
  Type: Practical Reasoning
  SchemeNet: Premises → Risk Assessment → Recommendation
  Dependencies: Smith (efficacy) + Jones (transferability)
```

**Use Case 3: Legal Argumentation**

```
Court Case: "Is algorithm fair under civil rights law?"

Plaintiff Attorney:
  Argument: "Algorithm produces disparate impact (80% rejection rate for protected class)"
  Evidence: Statistical analysis
  
    ↓

Expert Witness:
  Argument: "Disparate impact indicates discriminatory design"
  Type: Argument from Sign
  Dependencies: Plaintiff's statistical showing
  
    ↓

Plaintiff Attorney (Closing):
  Argument: "Therefore algorithm violates Title VII"
  Type: Argument from Legal Rule
  SchemeNet: Statutory Interpretation → Application → Conclusion
  Dependencies: Expert testimony + disparate impact data
```

---

### 1.3 Why This Is Different (and Better)

| Feature | SchemeNet | ArgumentChain |
|---------|-----------|---------------|
| **Unit of Composition** | Schemes | Arguments |
| **Scope** | Single argument | Entire deliberation |
| **Authorship** | One author | Multi-author |
| **Granularity** | Inferential steps | Complete claims |
| **Dependencies** | Implicit (scheme chaining) | Explicit (argument citations) |
| **Collaboration** | Individual analysis | Collective reasoning |
| **Editing** | Author only | Depends on permissions |
| **Visualization** | Vertical flow of schemes | Network graph of arguments |
| **Use Case** | Pedagogical analysis | Deliberative construction |
| **Output** | Understanding of one argument | Collaborative decision |

**Key Insight**: 
- SchemeNet answers: "What are the inferential steps in THIS argument?"
- ArgumentChain answers: "How do MULTIPLE arguments connect to reach a conclusion?"

---

## Part 2: Data Model Design

### 2.1 New Schema: ArgumentChain + ArgumentChainNode

```prisma
// ============================================================================
// ArgumentChain: Deliberation-Level Argument Chains
// ============================================================================

model ArgumentChain {
  id             String   @id @default(cuid())
  deliberationId String
  
  // Metadata
  name           String   @db.VarChar(255)
  description    String?  @db.Text
  purpose        String?  @db.Text // "Build case for policy X", "Analyze reasoning chain", etc.
  
  // Structure
  chainType      ArgumentChainType @default(SERIAL)
  rootNodeId     String?  // Which argument starts the chain?
  
  // Ownership & Permissions
  createdBy      BigInt
  isPublic       Boolean  @default(false) // Can others view?
  isEditable     Boolean  @default(false) // Can others add nodes?
  
  // Timestamps
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relations
  deliberation   Deliberation        @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  creator        User                @relation(fields: [createdBy], references: [id], onDelete: Restrict)
  nodes          ArgumentChainNode[]
  edges          ArgumentChainEdge[]
  
  @@index([deliberationId])
  @@index([createdBy])
}

model ArgumentChainNode {
  id           String   @id @default(cuid())
  chainId      String
  argumentId   String
  
  // Position in net
  nodeOrder    Int      // Sequential position (for serial nets)
  role         ArgumentRole? // "premise", "evidence", "conclusion", "objection"
  
  // Visual layout (for graph rendering)
  positionX    Float?
  positionY    Float?
  
  // Contribution metadata
  addedBy      BigInt
  addedAt      DateTime @default(now())
  
  // Relations
  chain        ArgumentChain @relation(fields: [chainId], references: [id], onDelete: Cascade)
  argument     Argument      @relation(fields: [argumentId], references: [id], onDelete: Cascade)
  contributor  User          @relation(fields: [addedBy], references: [id])
  
  outgoingEdges ArgumentChainEdge[] @relation("SourceNode")
  incomingEdges ArgumentChainEdge[] @relation("TargetNode")
  
  @@unique([chainId, argumentId]) // Each argument appears once per chain
  @@index([chainId])
  @@index([argumentId])
}

model ArgumentChainEdge {
  id             String   @id @default(cuid())
  chainId        String
  sourceNodeId   String   // Argument providing conclusion/premise
  targetNodeId   String   // Argument receiving/depending on it
  
  // Relationship semantics
  edgeType       ArgumentChainEdgeType @default(SUPPORTS)
  strength       Float    @default(1.0) // How strong is the connection? (0-1)
  
  // Mapping details
  description    String?  @db.Text // "Conclusion of A becomes premise 2 of B"
  slotMapping    Json?    // Which conclusion maps to which premise
  
  createdAt      DateTime @default(now())
  
  // Relations
  chain          ArgumentChain     @relation(fields: [chainId], references: [id], onDelete: Cascade)
  sourceNode     ArgumentChainNode @relation("SourceNode", fields: [sourceNodeId], references: [id], onDelete: Cascade)
  targetNode     ArgumentChainNode @relation("TargetNode", fields: [targetNodeId], references: [id], onDelete: Cascade)
  
  @@unique([chainId, sourceNodeId, targetNodeId])
  @@index([chainId])
}

// ============================================================================
// Enums
// ============================================================================

enum ArgumentChainType {
  SERIAL       // A → B → C (linear chain)
  CONVERGENT   // A → C, B → C (multiple premises for one conclusion)
  DIVERGENT    // A → B, A → C (one premise for multiple conclusions)
  TREE         // Hierarchical (premise-conclusion tree)
  GRAPH        // General DAG (complex interdependencies)
}

enum ArgumentRole {
  PREMISE      // Provides foundational claim
  EVIDENCE     // Supports with data/facts
  CONCLUSION   // Final claim being argued for
  OBJECTION    // Challenges another argument
  REBUTTAL     // Responds to objection
  QUALIFIER    // Adds conditions/scope
}

enum ArgumentChainEdgeType {
  SUPPORTS        // A supports B (conclusion → premise)
  ENABLES         // A enables B (makes B's claim possible)
  PRESUPPOSES     // B presupposes A (A must be true for B)
  REFUTES         // A challenges B (attack relation)
  QUALIFIES       // A adds conditions to B
  EXEMPLIFIES     // A is example of B's general claim
  GENERALIZES     // A abstracts from B's specific case
}
```

### 2.2 Schema Design Decisions

**Why Not Extend SchemeNet?**
- Different scope (deliberation vs argument)
- Different permissions model (multi-author)
- Different visualization needs (network graph vs flow)
- Both can coexist: Arguments in ArgumentChain may have SchemeNets

**Key Relationships**:
```
Deliberation
  ├─ Arguments (many)
  │   └─ SchemeNet (optional, 1:1)
  │       └─ SchemeNetSteps (many)
  │
  └─ ArgumentChains (many)
      ├─ ArgumentChainNodes (many)
      │   └─ references Argument
      └─ ArgumentChainEdges (many)
          ├─ references source ArgumentChainNode
          └─ references target ArgumentChainNode
```

**Permissions Model**:
- Creator can always edit
- If `isPublic`, anyone can view
- If `isEditable`, anyone in deliberation can add nodes
- Collaborative nets: multiple users contribute
- Personal chains: single user's analysis

---

## Part 3: UX Design - ArgumentChain Constructor

### 3.1 Component Architecture

```typescript
// Main Container
<ArgumentChainConstructor
  deliberationId={deliberationId}
  mode="create" | "edit" | "view"
  chainId={existingChainId} // For edit mode
  onComplete={(chainId) => { }}
/>

// Internal Components
<NetworkCanvas>
  {/* ReactFlow-based visual editor */}
  <ArgumentNodes />
  <ArgumentEdges />
  <MiniMap />
  <Controls />
</NetworkCanvas>

<ArgumentPalette>
  {/* Sidebar: Available arguments to add */}
  <ArgumentSearch />
  <ArgumentFilters />
  <ArgumentList />
  <CreateArgumentButton />
</ArgumentPalette>

<ConnectionEditor>
  {/* Modal: Define edge when connecting nodes */}
  <EdgeTypeSelector />
  <SlotMappingEditor />
  <StrengthSlider />
</ConnectionEditor>

<NetMetadataPanel>
  {/* Top: Net name, purpose, settings */}
  <NameInput />
  <PurposeTextarea />
  <PermissionsToggle />
</NetMetadataPanel>
```

### 3.2 User Workflow: Create Mode

**Step 1: Initialize Chain**
```tsx
<Dialog open={true}>
  <DialogHeader>
    <DialogTitle>Create Argument Chain</DialogTitle>
    <DialogDescription>
      Build a chain of arguments to construct a complex reasoning structure.
      Each node is a complete argument (with its own premises and schemes).
    </DialogDescription>
  </DialogHeader>
  
  <div className="space-y-4">
    {/* Name */}
    <div>
      <Label>Chain Name *</Label>
      <Input 
        placeholder="e.g., Climate Policy Reasoning Chain"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </div>
    
    {/* Purpose */}
    <div>
      <Label>Purpose (Optional)</Label>
      <Textarea 
        placeholder="What are you trying to demonstrate with this chain?"
        rows={3}
      />
    </div>
    
    {/* Chain Type */}
    <div>
      <Label>Chain Structure</Label>
      <RadioGroup value={chainType} onValueChange={setChainType}>
        <RadioGroupItem value="SERIAL">
          <div>
            <strong>Serial Chain</strong>
            <p className="text-xs text-muted-foreground">
              Linear progression: Argument A → B → C
            </p>
          </div>
        </RadioGroupItem>
        
        <RadioGroupItem value="CONVERGENT">
          <div>
            <strong>Convergent</strong>
            <p className="text-xs text-muted-foreground">
              Multiple arguments support one conclusion: A+B+C → D
            </p>
          </div>
        </RadioGroupItem>
        
        <RadioGroupItem value="GRAPH">
          <div>
            <strong>Complex Graph</strong>
            <p className="text-xs text-muted-foreground">
              Flexible structure with multiple dependencies
            </p>
          </div>
        </RadioGroupItem>
      </RadioGroup>
    </div>
    
    {/* Permissions */}
    <div>
      <Label>Collaboration Settings</Label>
      <div className="space-y-2">
        <Checkbox checked={isPublic} onChange={setIsPublic}>
          <Label>Public (anyone can view)</Label>
        </Checkbox>
        <Checkbox checked={isEditable} onChange={setIsEditable}>
          <Label>Collaborative (others can add arguments)</Label>
        </Checkbox>
      </div>
    </div>
  </div>
  
  <DialogFooter>
    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
    <Button onClick={handleCreate}>Create Chain</Button>
  </DialogFooter>
</Dialog>
```

**Step 2: Visual Canvas (Main Interface)**
```tsx
<div className="flex h-screen">
  {/* Left Sidebar: Argument Palette */}
  <div className="w-80 border-r bg-muted/30 p-4">
    <h3 className="font-semibold mb-4">Available Arguments</h3>
    
    {/* Search/Filter */}
    <Input 
      placeholder="Search arguments..."
      icon={<Search />}
    />
    
    <Select value={authorFilter} onChange={setAuthorFilter}>
      <SelectItem value="all">All Authors</SelectItem>
      <SelectItem value="me">My Arguments</SelectItem>
      <SelectItem value="others">Others' Arguments</SelectItem>
    </Select>
    
    <Select value={schemeFilter} onChange={setSchemeFilter}>
      <SelectItem value="all">All Schemes</SelectItem>
      <SelectItem value="expert-opinion">Expert Opinion</SelectItem>
      <SelectItem value="causal">Causal Reasoning</SelectItem>
      {/* ... */}
    </Select>
    
    {/* Argument List */}
    <div className="space-y-2 mt-4">
      {arguments.map(arg => (
        <ArgumentCard
          key={arg.id}
          argument={arg}
          draggable
          onDragStart={() => handleDragStart(arg)}
          onDoubleClick={() => addToNet(arg)}
        >
          <div className="text-sm font-medium">{arg.conclusion}</div>
          <div className="text-xs text-muted-foreground">
            by {arg.author.name} • {arg.schemeCount} schemes
          </div>
          {arg.schemeNet && (
            <Badge variant="secondary" size="sm">
              Has SchemeNet
            </Badge>
          )}
        </ArgumentCard>
      ))}
    </div>
    
    {/* Create New Argument */}
    <Button 
      variant="outline" 
      className="w-full mt-4"
      onClick={openArgumentConstructor}
    >
      <Plus className="mr-2 h-4 w-4" />
      Create New Argument
    </Button>
  </div>
  
  {/* Center: ReactFlow Canvas */}
  <div className="flex-1 relative">
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={customNodeTypes}
      edgeTypes={customEdgeTypes}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h4 className="font-medium mb-2">Start Building Your Network</h4>
            <p className="text-sm">
              Drag arguments from the left panel onto the canvas
            </p>
          </div>
        </div>
      )}
      
      <MiniMap />
      <Controls />
      <Background />
    </ReactFlow>
    
    {/* Top Bar: Metadata */}
    <div className="absolute top-4 left-4 right-4 bg-background/95 backdrop-blur border rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-semibold text-lg"
            placeholder="Network Name"
          />
        </div>
        <div className="flex gap-2">
          <Badge>{chainType}</Badge>
          <Badge variant="outline">{nodes.length} arguments</Badge>
          <Badge variant="outline">{edges.length} connections</Badge>
        </div>
      </div>
    </div>
  </div>
  
  {/* Right Panel: Selected Node Details */}
  {selectedNode && (
    <div className="w-96 border-l p-4 bg-muted/30">
      <ArgumentDetailPanel
        argument={selectedNode.data.argument}
        showSchemeNet={true}
        onRemoveFromChain={() => removeNode(selectedNode.id)}
        onEditRole={() => openRoleEditor(selectedNode)}
      />
    </div>
  )}
</div>
```

**Step 3: Connect Arguments (Edge Creation)**

When user drags from one node's handle to another:
```tsx
<Dialog open={showConnectionEditor}>
  <DialogHeader>
    <DialogTitle>Define Connection</DialogTitle>
    <DialogDescription>
      How does "{sourceArg.conclusion}" relate to "{targetArg.conclusion}"?
    </DialogDescription>
  </DialogHeader>
  
  <div className="space-y-4">
    {/* Edge Type */}
    <div>
      <Label>Connection Type *</Label>
      <Select value={edgeType} onValueChange={setEdgeType}>
        <SelectItem value="SUPPORTS">
          <div>
            <strong>Supports</strong>
            <p className="text-xs">Source's conclusion becomes Target's premise</p>
          </div>
        </SelectItem>
        
        <SelectItem value="ENABLES">
          <div>
            <strong>Enables</strong>
            <p className="text-xs">Source makes Target's claim possible</p>
          </div>
        </SelectItem>
        
        <SelectItem value="PRESUPPOSES">
          <div>
            <strong>Presupposes</strong>
            <p className="text-xs">Target assumes Source is true</p>
          </div>
        </SelectItem>
        
        <SelectItem value="REFUTES">
          <div>
            <strong>Refutes</strong>
            <p className="text-xs">Source challenges Target</p>
          </div>
        </SelectItem>
      </Select>
    </div>
    
    {/* Explanation */}
    <div>
      <Label>Explanation (Optional)</Label>
      <Textarea 
        placeholder="Describe how these arguments connect..."
        rows={3}
      />
    </div>
    
    {/* Strength */}
    <div>
      <Label>Connection Strength</Label>
      <Slider 
        value={[strength * 100]}
        onValueChange={([val]) => setStrength(val / 100)}
        min={0}
        max={100}
        step={10}
      />
      <p className="text-xs text-muted-foreground mt-1">
        {strength >= 0.8 ? "Strong" : strength >= 0.5 ? "Moderate" : "Weak"} connection
      </p>
    </div>
    
    {/* Advanced: Slot Mapping */}
    <Collapsible>
      <CollapsibleTrigger>
        <Button variant="ghost" size="sm">
          <ChevronDown className="h-4 w-4 mr-2" />
          Advanced: Premise Mapping
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border rounded p-3 space-y-2">
          <Label className="text-xs">Map conclusion to specific premise</Label>
          
          {/* Source Conclusion */}
          <div>
            <p className="text-xs font-medium">From (Source Conclusion):</p>
            <div className="text-sm bg-muted p-2 rounded">
              {sourceArg.conclusion}
            </div>
          </div>
          
          {/* Target Premises */}
          <div>
            <p className="text-xs font-medium">To (Target Premise):</p>
            <Select>
              {targetArg.premises.map((p, i) => (
                <SelectItem key={i} value={`premise-${i}`}>
                  Premise {i+1}: {p.text.substring(0, 50)}...
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  </div>
  
  <DialogFooter>
    <Button variant="ghost" onClick={() => setShowConnectionEditor(false)}>
      Cancel
    </Button>
    <Button onClick={createEdge}>Create Connection</Button>
  </DialogFooter>
</Dialog>
```

---

### 3.3 Custom Node Component

```tsx
function ArgumentChainNode({ data, selected }: NodeProps) {
  const { argument, role } = data;
  
  return (
    <div 
      className={cn(
        "bg-background border-2 rounded-lg shadow-lg",
        "w-[280px] transition-all",
        selected && "border-primary ring-2 ring-primary/20"
      )}
    >
      {/* Header */}
      <div className="border-b p-3 bg-muted/50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Badge variant="outline" size="sm">
              {role || "Argument"}
            </Badge>
            <h4 className="font-semibold text-sm mt-1 line-clamp-2">
              {argument.conclusion}
            </h4>
          </div>
          <Button variant="ghost" size="sm" onClick={showMenu}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-3 space-y-2 text-xs">
        {/* Author */}
        <div className="flex items-center gap-2">
          <Avatar size="xs" src={argument.author.image} />
          <span className="text-muted-foreground">{argument.author.name}</span>
        </div>
        
        {/* Schemes */}
        {argument.schemeCount > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            <span className="text-muted-foreground">
              {argument.schemeCount} scheme{argument.schemeCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        
        {/* SchemeNet Indicator */}
        {argument.schemeNet && (
          <div className="flex items-center gap-1 text-blue-600">
            <Network className="h-3 w-3" />
            <span>Has reasoning chain ({argument.schemeNet.steps.length} steps)</span>
          </div>
        )}
        
        {/* Premises Count */}
        <div className="text-muted-foreground">
          {argument.premises.length} premise{argument.premises.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {/* Connection Handles */}
      <Handle 
        type="target" 
        position={Position.Left}
        className="w-3 h-3 bg-primary"
      />
      <Handle 
        type="source" 
        position={Position.Right}
        className="w-3 h-3 bg-primary"
      />
    </div>
  );
}
```

---

### 3.4 Edge Visualization

```tsx
function ArgumentChainEdge({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  data,
  selected 
}: EdgeProps) {
  const { edgeType, strength, description } = data;
  
  // Color based on type
  const edgeColor = {
    SUPPORTS: '#22c55e',      // green
    ENABLES: '#3b82f6',       // blue
    PRESUPPOSES: '#a855f7',   // purple
    REFUTES: '#ef4444',       // red
    QUALIFIES: '#f59e0b',     // amber
  }[edgeType] || '#64748b';  // default gray
  
  // Stroke width based on strength
  const strokeWidth = 1 + (strength * 3); // 1-4px
  
  return (
    <>
      <path
        d={`M ${sourceX},${sourceY} L ${targetX},${targetY}`}
        stroke={edgeColor}
        strokeWidth={strokeWidth}
        fill="none"
        className={cn(
          "transition-all",
          selected && "drop-shadow-lg"
        )}
        markerEnd="url(#arrowhead)"
      />
      
      {/* Label */}
      {description && (
        <foreignObject
          x={(sourceX + targetX) / 2 - 50}
          y={(sourceY + targetY) / 2 - 20}
          width={100}
          height={40}
        >
          <div className="bg-background border rounded px-2 py-1 text-xs text-center shadow-sm">
            {edgeType.toLowerCase()}
          </div>
        </foreignObject>
      )}
    </>
  );
}
```

---

## Part 4: Key Features & Interactions

### 4.1 Drag & Drop from Palette

```typescript
function handleDrop(event: React.DragEvent) {
  const argumentData = JSON.parse(
    event.dataTransfer.getData('application/argument')
  );
  
  const position = reactFlowInstance.project({
    x: event.clientX,
    y: event.clientY,
  });
  
  const newNode = {
    id: `node-${argumentData.id}`,
    type: 'argumentChainNode',
    position,
    data: {
      argument: argumentData,
      role: inferRole(argumentData, existingNodes),
    },
  };
  
  setNodes((nodes) => [...nodes, newNode]);
  
  // Auto-suggest connections
  if (chainType === 'SERIAL' && nodes.length > 0) {
    const lastNode = nodes[nodes.length - 1];
    suggestConnection(lastNode.id, newNode.id);
  }
}
```

### 4.2 Smart Connection Suggestions

```typescript
function suggestConnection(sourceId: string, targetId: string) {
  const source = nodes.find(n => n.id === sourceId);
  const target = nodes.find(n => n.id === targetId);
  
  if (!source || !target) return;
  
  // Analyze relationship between arguments
  const suggestion = analyzeArgumentRelationship(
    source.data.argument,
    target.data.argument
  );
  
  if (suggestion.confidence > 0.7) {
    toast({
      title: "Connection Suggested",
      description: `"${source.data.argument.conclusion}" ${suggestion.type.toLowerCase()} "${target.data.argument.conclusion}"`,
      action: (
        <Button size="sm" onClick={() => createEdge(sourceId, targetId, suggestion.type)}>
          Connect
        </Button>
      ),
    });
  }
}

function analyzeArgumentRelationship(argA: Argument, argB: Argument) {
  // Check if A's conclusion appears in B's premises
  const conclusionInPremises = argB.premises.some(p => 
    semanticSimilarity(p.text, argA.conclusion) > 0.8
  );
  
  if (conclusionInPremises) {
    return { type: 'SUPPORTS', confidence: 0.9 };
  }
  
  // Check scheme compatibility
  if (argA.primaryScheme === 'expert-opinion' && 
      argB.primaryScheme === 'practical-reasoning') {
    return { type: 'ENABLES', confidence: 0.75 };
  }
  
  // Default
  return { type: 'SUPPORTS', confidence: 0.5 };
}
```

### 4.3 Path Analysis

Show critical path through chain:

```tsx
<Button onClick={analyzeCriticalPath}>
  <TrendingDown className="h-4 w-4 mr-2" />
  Find Weakest Path
</Button>

// When clicked:
function analyzeCriticalPath() {
  const paths = findAllPaths(rootNodeId, conclusionNodeId);
  
  const pathScores = paths.map(path => {
    const edgeStrengths = path.edges.map(e => e.data.strength);
    const weakestLink = Math.min(...edgeStrengths);
    
    return {
      path,
      score: weakestLink,
      weakestEdge: path.edges.find(e => e.data.strength === weakestLink),
    };
  });
  
  // Highlight weakest path
  const weakest = pathScores.sort((a, b) => a.score - b.score)[0];
  
  highlightPath(weakest.path);
  
  toast({
    title: "Weakest Link Found",
    description: `Connection "${weakest.weakestEdge.source.argument.conclusion}" → "${weakest.weakestEdge.target.argument.conclusion}" has strength ${Math.round(weakest.score * 100)}%`,
  });
}
```

### 4.4 Collaborative Editing

```typescript
// Real-time updates via WebSocket or polling
useEffect(() => {
  if (!isEditable || !chainId) return;
  
  const subscription = supabase
    .channel(`argumentchain:${chainId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'ArgumentChainNode',
      filter: `chainId=eq.${chainId}`,
    }, (payload) => {
      // Another user added a node
      const newNode = {
        id: `node-${payload.new.argumentId}`,
        type: 'argumentChainNode',
        position: { x: payload.new.positionX, y: payload.new.positionY },
        data: { argument: payload.new.argument },
      };
      
      setNodes((nodes) => [...nodes, newNode]);
      
      toast({
        title: "Node Added",
        description: `${payload.new.contributor.name} added "${newNode.data.argument.conclusion}"`,
      });
    })
    .subscribe();
  
  return () => subscription.unsubscribe();
}, [chainId, isEditable]);
```

---

## Part 5: API Design

### 5.1 Core Endpoints

```typescript
// POST /api/argument-chains
// Create new ArgumentChain
interface CreateArgumentChainRequest {
  deliberationId: string;
  name: string;
  description?: string;
  purpose?: string;
  chainType: ArgumentChainType;
  isPublic: boolean;
  isEditable: boolean;
}

// POST /api/argument-chains/[chainId]/nodes
// Add argument to chain
interface AddNodeRequest {
  argumentId: string;
  role?: ArgumentRole;
  positionX?: number;
  positionY?: number;
}

// POST /api/argument-chains/[chainId]/edges
// Create connection between arguments
interface CreateEdgeRequest {
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: ArgumentChainEdgeType;
  strength?: number;
  description?: string;
  slotMapping?: Record<string, string>;
}

// GET /api/argument-chains/[chainId]
// Fetch chain with all nodes and edges
interface ArgumentChainResponse {
  id: string;
  name: string;
  description: string;
  chainType: ArgumentChainType;
  nodes: Array<{
    id: string;
    argument: Argument & { schemeNet?: SchemeNet };
    role: ArgumentRole;
    position: { x: number; y: number };
    addedBy: User;
  }>;
  edges: Array<{
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    edgeType: ArgumentChainEdgeType;
    strength: number;
    description: string;
  }>;
  metadata: {
    createdBy: User;
    createdAt: Date;
    isPublic: boolean;
    isEditable: boolean;
  };
}

// GET /api/argument-chains/[chainId]/analyze
// Run analysis on chain structure
interface AnalysisResponse {
  criticalPath: {
    nodes: string[];
    weakestLink: {
      sourceId: string;
      targetId: string;
      strength: number;
    };
  };
  overallStrength: number; // Minimum edge strength in critical path
  complexity: {
    nodeCount: number;
    edgeCount: number;
    averageDegree: number;
    maxDepth: number;
  };
  suggestions: Array<{
    type: 'missing_connection' | 'weak_link' | 'circular_dependency';
    message: string;
    affectedNodes: string[];
  }>;
}
```

---

## Part 6: Integration with Existing Features

### 6.1 Relationship to SchemeNet

**Nested Structure**:
```
ArgumentChain (deliberation-level)
  └─ Node 1: Argument A
      └─ SchemeNet (argument-level)
          ├─ Step 1: Expert Opinion
          ├─ Step 2: Sign Evidence
          └─ Step 3: Conclusion
  └─ Node 2: Argument B
      └─ SchemeNet
          ├─ Step 1: Causal Reasoning
          └─ Step 2: Conclusion
  └─ Edge: A → B (A's conclusion enables B's premise)
```

**Combined Visualization**:
When user clicks on a node in ArgumentChain that has a SchemeNet:
```tsx
<Dialog open={showNodeDetail}>
  <DialogHeader>
    <DialogTitle>{argument.conclusion}</DialogTitle>
    <DialogDescription>
      Argument by {argument.author.name} • Part of {chainName}
    </DialogDescription>
  </DialogHeader>
  
  <Tabs>
    <TabsList>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="scheme-net">
        Reasoning Steps {argument.schemeNet && `(${argument.schemeNet.steps.length})`}
      </TabsTrigger>
      <TabsTrigger value="context">Context in Network</TabsTrigger>
    </TabsList>
    
    <TabsContent value="overview">
      {/* Argument details */}
    </TabsContent>
    
    <TabsContent value="scheme-net">
      {argument.schemeNet ? (
        <SchemeNetVisualization net={argument.schemeNet} />
      ) : (
        <EmptyState>
          This argument doesn't have explicit reasoning steps.
          <Button onClick={() => openSchemeNetBuilder(argument.id)}>
            Build SchemeNet
          </Button>
        </EmptyState>
      )}
    </TabsContent>
    
    <TabsContent value="context">
      {/* Show incoming/outgoing edges */}
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Depends On:</h4>
          {incomingEdges.map(edge => (
            <EdgeCard key={edge.id} edge={edge} />
          ))}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Enables:</h4>
          {outgoingEdges.map(edge => (
            <EdgeCard key={edge.id} edge={edge} />
          ))}
        </div>
      </div>
    </TabsContent>
  </Tabs>
</Dialog>
```

### 6.2 ArgumentConstructor Integration

When user clicks "Create New Argument" from ArgumentChain canvas:
```tsx
<ArgumentConstructor
  deliberationId={deliberationId}
  mode="create"
  onComplete={(argumentId) => {
    // Automatically add to chain
    addNodeToChain({
      argumentId,
      positionX: lastClickPosition.x,
      positionY: lastClickPosition.y,
    });
  }}
  contextHint={{
    source: 'argument-chain',
    chainId: currentChainId,
    suggestedSchemes: inferSchemesFromChainContext(),
  }}
/>
```

### 6.3 Deliberation View Integration

Add new tab to DeepDive v3:
```tsx
// In ArgumentsTab.tsx
{
  value: "argument-chains",
  label: "Argument Chains",
  icon: <GitBranch className="size-3.5" />,
  content: (
    <ArgumentChainsTab deliberationId={deliberationId} />
  ),
}
```

**ArgumentChainsTab Component**:
```tsx
function ArgumentChainsTab({ deliberationId }: { deliberationId: string }) {
  const { data: chains } = useSWR(`/api/deliberations/${deliberationId}/argument-chains`);
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Argument Chains</h2>
          <p className="text-muted-foreground">
            Complex reasoning chains built from multiple arguments
          </p>
        </div>
        <Button onClick={() => setShowConstructor(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Chain
        </Button>
      </div>
      
      {/* Chain Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chains?.map(chain => (
          <ArgumentChainCard
            key={chain.id}
            chain={chain}
            onClick={() => openChainViewer(chain.id)}
          />
        ))}
      </div>
      
      {/* Constructor Modal */}
      {showConstructor && (
        <ArgumentChainConstructor
          deliberationId={deliberationId}
          mode="create"
          onComplete={(chainId) => {
            setShowConstructor(false);
            router.push(`/deliberations/${deliberationId}/chains/${chainId}`);
          }}
        />
      )}
    </div>
  );
}
```

---

## Part 7: Key Differentiators & Value Props

### Why This Is Better Than Current Nets

| Feature | SchemeNet (Current) | ArgumentChain (Proposed) |
|---------|---------------------|--------------------------|
| **Collaboration** | Single author | Multi-author |
| **Scope** | One argument | Entire deliberation |
| **Flexibility** | Fixed structure | Dynamic graph |
| **Reusability** | Arguments not reusable | Same argument in multiple chains |
| **Deliberation Mapping** | N/A | Shows actual discourse structure |
| **Educational Value** | Analysis of one argument | Shows collective reasoning |
| **Use Case** | "Break down THIS argument" | "How do THESE arguments connect?" |

### Unique Capabilities

1. **Trace Reasoning Across Participants**
   - See how Alice's claim → Bob's premise → Carol's conclusion
   - Visualize collaborative knowledge building

2. **Multiple Chains Per Deliberation**
   - "Pro carbon tax" chain
   - "Against carbon tax" chain
   - Compare competing reasoning chains

3. **Argument Reuse**
   - Same argument appears in multiple chains
   - "This evidence supports multiple conclusions"

4. **Dynamic Permissions**
   - Creator starts net
   - Others can contribute (if collaborative)
   - Democratic reasoning construction

5. **Weakest Link Across Arguments**
   - Not just within one argument's schemes
   - Across entire deliberative chain
   - "The weakest connection is between Alice's claim and Bob's use of it"

---

## Part 8: Implementation Roadmap

### Phase 1: Core Infrastructure (2-3 weeks)

**Tasks**:
1. Database schema (ArgumentChain, ArgumentChainNode, ArgumentChainEdge models)
2. API endpoints (CRUD operations)
3. Basic ReactFlow canvas
4. Argument palette sidebar
5. Node/Edge creation

**Deliverable**: Can create chains, add arguments, connect them

---

### Phase 2: Visual Polish & UX (1-2 weeks)

**Tasks**:
1. Custom node components with SchemeNet indicators
2. Edge styling (colors, widths, labels)
3. Drag & drop from palette
4. Connection editor modal
5. Metadata panel

**Deliverable**: Professional, intuitive interface

---

### Phase 3: Analysis Features (1-2 weeks)

**Tasks**:
1. Critical path detection
2. Weakest link analysis
3. Complexity metrics
4. Export functionality
5. Suggestions engine

**Deliverable**: Analytical insights on chain structure

---

### Phase 4: Collaboration (2 weeks)

**Tasks**:
1. Real-time updates
2. Permissions model
3. Activity feed ("Alice added Argument B")
4. Conflict resolution (concurrent edits)
5. Comments on nodes/edges

**Deliverable**: True collaborative reasoning tool

---

### Phase 5: Integration (1 week)

**Tasks**:
1. ArgumentsTab new subtab
2. ArgumentConstructor integration
3. SchemeNet nested visualization
4. Deep linking
5. Search/discovery

**Deliverable**: Fully integrated into Mesh

---

**Total Estimate**: 7-10 weeks for full implementation

---

## Conclusion

**ArgumentChain transforms Mesh from**:
- Individual argument analysis
- Single-author reasoning
- Isolated claims

**Into**:
- Collaborative deliberation mapping
- Multi-participant reasoning chains
- Connected knowledge structures

**Key Innovation**: Treating **Arguments** as first-class composable units (not just schemes), enabling true deliberative structure modeling.

This aligns with the theoretical vision while providing unique value that no other feature currently delivers: **visualizing and constructing how arguments connect across a deliberation**.

**Naming Clarity**: By using "ArgumentChain" instead of "ArgumentNet", we clearly distinguish this deliberation-level feature from SchemeNet (argument-level analysis) and avoid confusion with other network/net terminology throughout the system.
