# DefinitionSheet Component - Design & Development Roadmap

**Status**: 🎯 Planning Phase  
**Component**: DefinitionSheet (Deliberation Glossary System)  
**Location**: Right FloatingSheet (alongside DialogueActions)  
**Priority**: High - Improves semantic grounding & reduces confusion

---

## Executive Summary

The **DefinitionSheet** is a collaborative glossary component that allows deliberation participants to propose, vote on, and agree upon shared definitions for key terms used in the debate. This reduces semantic confusion and builds common ground.

### Core Value Proposition
-
1. **Surface Hidden Disagreements** - Reveals when participants use same words with different meanings
2. **Reduce Talking-Past-Each-Other** - Common in online discourse with context collapse
3. **Create Accountability** - Participants commit to consistent term usage
4. **Enable Precise Arguments** - Arguments become clearer when predicates have agreed meanings
5. **Build Common Ground** - Collaborative definition-building is a trust-building exercise

---

## I. Conceptual Design

### A. Key Features

#### 1. **Per-Deliberation Scope**
- Each deliberation maintains its own living glossary
- Terms are scoped to the deliberation context
- Definitions evolve through the deliberation lifecycle

#### 2. **Collaborative Editing**
- Participants propose definitions
- Vote/refine definitions (similar to existing consensus mechanisms)
- Multiple competing definitions highlight conceptual divides
- Moderators can endorse "canonical" definitions

#### 3. **Linked to Arguments**
- Terms in glossary hyperlinked when used in arguments
- Hover shows agreed definition
- Inline highlighting of glossary terms in claim/argument text
- Detect when participants use terms inconsistently with agreed definitions

#### 4. **Versioned History**
- Track how definitions evolve through deliberation
- Audit trail of who proposed/edited/voted on definitions
- Timeline view of definition changes

#### 5. **Integration with Argument Graph**
- Identify when participants use terms inconsistently
- Flag semantic drift in arguments
- Suggest definition clarifications during argument authoring

---

## II. UI/UX Design

### A. FloatingSheet Layout

```
┌─────────────────────────────────────────────────────────┐
│  Right Side FloatingSheet (520px width)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [Actions Tab] [Definitions Tab] [Diagram Tab]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  When "Definitions" tab selected:                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📚 Deliberation Glossary                        │   │
│  │                                                  │   │
│  │ Search: [___________________] 🔍                │   │
│  │                                                  │   │
│  │ Sort: [Most Used ▼] Filter: [All ▼]            │   │
│  │                                                  │   │
│  │ ┌──────────────────────────────────────────┐   │   │
│  │ │ Term: "Justice"                 ✏️ 👍12  │   │
│  │ │ ─────────────────────────────────────    │   │
│  │ │ Definition (consensus):                   │   │
│  │ │ "Fair treatment under law and social      │   │
│  │ │  norms, with equal opportunity..."        │   │
│  │ │                                            │   │
│  │ │ Proposed by: @alice                       │   │
│  │ │ Endorsed by: @bob, @charlie, @dana        │   │
│  │ │                                            │   │
│  │ │ [View History] [Competing Definitions: 2] │   │
│  │ └──────────────────────────────────────────┘   │   │
│  │                                                  │   │
│  │ ┌──────────────────────────────────────────┐   │   │
│  │ │ Term: "Freedom"                 ✏️ 👍8   │   │
│  │ │ ─────────────────────────────────────    │   │
│  │ │ ⚠️ COMPETING DEFINITIONS (3)             │   │
│  │ │                                            │   │
│  │ │ Definition A (40% support):               │   │
│  │ │ "Absence of external constraints..."      │   │
│  │ │                                            │   │
│  │ │ Definition B (35% support):               │   │
│  │ │ "Capacity for self-determination..."      │   │
│  │ │                                            │   │
│  │ │ [View All 3 Definitions →]               │   │
│  │ └──────────────────────────────────────────┘   │   │
│  │                                                  │   │
│  │ [+ Propose New Term]                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### B. Toggle Button Placement

**Location**: Fixed button just **below** the existing "Actions" toggle button on the right side

```
Right side of screen:
┌────────────────┐
│   Actions  [2] │  ← Existing toggle (dialogical moves)
├────────────────┤
│   Terms    [5] │  ← NEW: DefinitionSheet toggle
└────────────────┘
     ↓
Opens right FloatingSheet with Definitions tab
```

**Visual Design**:
- Icon: 📚 (book) or dictionary icon
- Badge: Number of active terms in glossary
- Color: Complementary to Actions button (perhaps emerald/teal theme)
- Sticky positioning at `top-32` (below Actions at `top-24`)

### C. Term Card Design

```tsx
<TermCard>
  <Header>
    <TermTitle>Justice</TermTitle>
    <Actions>
      <EditButton /> {/* If user is proposer or moderator */}
      <EndorseButton endorsements={12} />
      <MoreMenu>
        <MenuItem>Flag as ambiguous</MenuItem>
        <MenuItem>Suggest edit</MenuItem>
        <MenuItem>View in context</MenuItem>
      </MoreMenu>
    </Actions>
  </Header>
  
  <DefinitionBody>
    {hasConsensus ? (
      <ConsensusDefinition text={definition.text} />
    ) : (
      <CompetingDefinitions definitions={definitions} />
    )}
  </DefinitionBody>
  
  <Metadata>
    <ProposedBy user={author} />
    <EndorsedBy users={endorsers} count={12} />
    <UsageCount claims={5} arguments={3} />
  </Metadata>
  
  <Footer>
    <Button variant="ghost">View History</Button>
    {competingCount > 0 && (
      <Button variant="outline">
        Competing Definitions ({competingCount})
      </Button>
    )}
  </Footer>
</TermCard>
```

### D. Interaction Patterns

#### Adding a New Term
1. Click "+ Propose New Term" button
2. Modal opens with form:
   - Term name (required)
   - Definition (rich text, max 500 chars)
   - Examples (optional, 2-3 sentences)
   - Related terms (tags)
   - Scope (global or specific to sub-topic)
3. Submit → Term added to glossary in "Pending" state
4. Other participants can endorse or propose alternative definitions

#### Endorsing a Definition
- Click 👍 icon on term card
- User added to endorsers list
- If endorsement threshold reached (e.g., 50% of active participants), mark as "Consensus"

#### Proposing Alternative Definition
- Click "Propose Alternative" button
- Fill in alternative definition form
- Creates competing definition entry
- Participants can vote between competing definitions
- Visual indicator shows % support for each definition

#### Resolving Competing Definitions
1. **Voting mechanism**: Participants upvote preferred definition
2. **Deliberative mode**: Open discussion thread to synthesize definitions
3. **Moderator resolution**: Moderator chooses canonical definition
4. **Merge**: Combine elements from multiple definitions

---

## III. Database Schema Design

### A. New Prisma Models

```prisma
// ──────────────────────────────────────────────────────
// Deliberation Glossary System
// ──────────────────────────────────────────────────────

model GlossaryTerm {
  id              String   @id @default(cuid())
  deliberationId  String
  deliberation    Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  
  term            String   // The word/phrase being defined
  termNormalized  String   // Lowercase, trimmed version for matching
  
  status          GlossaryTermStatus @default(PENDING)
  // PENDING: awaiting endorsements
  // CONSENSUS: has sufficient endorsements
  // CONTESTED: multiple competing definitions
  // ARCHIVED: no longer active
  
  proposedById    String
  proposedBy      User     @relation("ProposedTerms", fields: [proposedById], references: [auth_id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  definitions     GlossaryDefinition[]
  usages          GlossaryTermUsage[]
  
  @@unique([deliberationId, termNormalized])
  @@index([deliberationId, status])
  @@index([termNormalized])
}

model GlossaryDefinition {
  id              String   @id @default(cuid())
  termId          String
  term            GlossaryTerm @relation(fields: [termId], references: [id], onDelete: Cascade)
  
  definition      String   @db.Text // The actual definition text
  examples        String?  @db.Text // Optional usage examples
  sources         Json?    // References/citations
  
  authorId        String
  author          User     @relation("AuthoredDefinitions", fields: [authorId], references: [auth_id])
  
  isCanonical     Boolean  @default(false) // Moderator-endorsed or consensus-reached
  endorsementCount Int     @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  endorsements    GlossaryEndorsement[]
  votes           GlossaryDefinitionVote[]
  history         GlossaryDefinitionHistory[]
  
  @@index([termId, isCanonical])
  @@index([termId, endorsementCount])
}

model GlossaryEndorsement {
  id             String   @id @default(cuid())
  definitionId   String
  definition     GlossaryDefinition @relation(fields: [definitionId], references: [id], onDelete: Cascade)
  
  userId         String
  user           User     @relation("DefinitionEndorsements", fields: [userId], references: [auth_id])
  
  createdAt      DateTime @default(now())
  
  @@unique([definitionId, userId])
  @@index([definitionId])
  @@index([userId])
}

model GlossaryDefinitionVote {
  id             String   @id @default(cuid())
  definitionId   String
  definition     GlossaryDefinition @relation(fields: [definitionId], references: [id], onDelete: Cascade)
  
  userId         String
  user           User     @relation("DefinitionVotes", fields: [userId], references: [auth_id])
  
  value          Int      // +1 for upvote, -1 for downvote, 0 for neutral
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([definitionId, userId])
  @@index([definitionId])
}

model GlossaryDefinitionHistory {
  id             String   @id @default(cuid())
  definitionId   String
  definition     GlossaryDefinition @relation(fields: [definitionId], references: [id], onDelete: Cascade)
  
  previousText   String   @db.Text
  newText        String   @db.Text
  changeType     String   // "created", "edited", "merged", "endorsed"
  
  changedById    String
  changedBy      User     @relation("DefinitionChanges", fields: [changedById], references: [auth_id])
  
  createdAt      DateTime @default(now())
  
  @@index([definitionId, createdAt])
}

model GlossaryTermUsage {
  id             String   @id @default(cuid())
  termId         String
  term           GlossaryTerm @relation(fields: [termId], references: [id], onDelete: Cascade)
  
  // What used this term?
  targetType     String   // "claim", "argument", "premise", "comment"
  targetId       String
  
  // Context where it was used
  contextText    String?  @db.Text
  highlightStart Int?     // Character position in text
  highlightEnd   Int?
  
  detectedAt     DateTime @default(now())
  
  @@index([termId])
  @@index([targetType, targetId])
}

enum GlossaryTermStatus {
  PENDING
  CONSENSUS
  CONTESTED
  ARCHIVED
}

// ──────────────────────────────────────────────────────
// Extend existing models
// ──────────────────────────────────────────────────────

// In User model, add:
model User {
  // ... existing fields ...
  
  proposedTerms         GlossaryTerm[]           @relation("ProposedTerms")
  authoredDefinitions   GlossaryDefinition[]     @relation("AuthoredDefinitions")
  definitionEndorsements GlossaryEndorsement[]   @relation("DefinitionEndorsements")
  definitionVotes       GlossaryDefinitionVote[] @relation("DefinitionVotes")
  definitionChanges     GlossaryDefinitionHistory[] @relation("DefinitionChanges")
}

// In Deliberation model, add:
model Deliberation {
  // ... existing fields ...
  
  glossaryTerms GlossaryTerm[]
}
```

### B. Migration Strategy

1. **Create new tables** via Prisma migration
2. **Add indices** for performance (deliberationId, termNormalized, status)
3. **Seed with common terms** (optional: pre-populate with philosophical/political terms)
4. **Backfill existing deliberations** (optional: extract terms from existing claims/arguments using NLP)

---

## IV. Component Architecture

### A. Component Tree

```
DeepDivePanelV2
├── SheetToggleButton (side="right", label="Actions") ← existing
├── SheetToggleButton (side="right", label="Terms")   ← NEW
│
└── FloatingSheet (side="right")
    ├── Tabs
    │   ├── [Actions Tab]     ← existing
    │   ├── [Terms Tab]       ← NEW
    │   └── [Diagram Tab]     ← existing
    │
    └── TabsContent (value="terms")
        └── DefinitionSheet
            ├── DefinitionSheetHeader
            │   ├── SearchInput
            │   ├── SortDropdown
            │   └── FilterDropdown
            │
            ├── TermsList (virtualized)
            │   └── TermCard[] 
            │       ├── TermHeader
            │       ├── DefinitionBody
            │       │   ├── ConsensusDefinition (if consensus)
            │       │   └── CompetingDefinitions (if contested)
            │       ├── TermMetadata
            │       └── TermFooter
            │
            └── ProposeTermButton
                └── ProposeTermModal
```

### B. Key Components

#### 1. **DefinitionSheet.tsx** (Main Container)

```typescript
interface DefinitionSheetProps {
  deliberationId: string;
  selectedTermId?: string; // Auto-scroll to this term
  onTermSelect?: (termId: string) => void;
}

export function DefinitionSheet({
  deliberationId,
  selectedTermId,
  onTermSelect
}: DefinitionSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"usage" | "alphabetical" | "recent">("usage");
  const [filterStatus, setFilterStatus] = useState<GlossaryTermStatus | "all">("all");
  
  // Fetch terms for this deliberation
  const { data: terms, mutate } = useSWR(
    `/api/deliberations/${deliberationId}/glossary/terms`,
    fetcher
  );
  
  // Real-time updates
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail.deliberationId === deliberationId) {
        mutate();
      }
    };
    window.addEventListener("glossary:updated", handler as any);
    return () => window.removeEventListener("glossary:updated", handler as any);
  }, [deliberationId, mutate]);
  
  return (
    <div className="space-y-4">
      <DefinitionSheetHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />
      
      <TermsList
        terms={filteredAndSortedTerms}
        selectedTermId={selectedTermId}
        onTermSelect={onTermSelect}
      />
      
      <ProposeTermButton
        deliberationId={deliberationId}
        onTermProposed={() => mutate()}
      />
    </div>
  );
}
```

#### 2. **TermCard.tsx**

```typescript
interface TermCardProps {
  term: GlossaryTermWithDefinitions;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: () => void;
}

export function TermCard({
  term,
  isSelected,
  onSelect,
  onUpdate
}: TermCardProps) {
  const { user } = useAuth();
  const canEdit = user?.userId === term.proposedById || user?.isModerator;
  
  const consensusDefinition = term.definitions.find(d => d.isCanonical);
  const competingDefinitions = term.definitions.filter(d => !d.isCanonical);
  
  return (
    <div
      className={clsx(
        "rounded-xl border p-4 transition-all",
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50"
          : "border-slate-200 hover:border-slate-300 bg-white"
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-900">{term.term}</h3>
          <StatusBadge status={term.status} />
        </div>
        
        <div className="flex items-center gap-1">
          <EndorseButton
            definitionId={consensusDefinition?.id}
            endorsementCount={consensusDefinition?.endorsementCount || 0}
            onEndorsed={onUpdate}
          />
          {canEdit && <EditTermButton term={term} onEdited={onUpdate} />}
        </div>
      </div>
      
      {/* Body */}
      {consensusDefinition ? (
        <ConsensusDefinition definition={consensusDefinition} />
      ) : (
        <CompetingDefinitions
          definitions={competingDefinitions}
          onVote={onUpdate}
        />
      )}
      
      {/* Metadata */}
      <TermMetadata
        proposedBy={term.proposedBy}
        usageCount={term.usages.length}
        endorsers={consensusDefinition?.endorsements.map(e => e.user)}
      />
      
      {/* Footer */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
        <Button variant="ghost" size="sm">
          View History
        </Button>
        {competingDefinitions.length > 0 && (
          <Button variant="outline" size="sm">
            Competing Definitions ({competingDefinitions.length})
          </Button>
        )}
        <Button variant="ghost" size="sm">
          View in Context ({term.usages.length})
        </Button>
      </div>
    </div>
  );
}
```

#### 3. **ProposeTermModal.tsx**

```typescript
interface ProposeTermModalProps {
  deliberationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProposed: () => void;
}

export function ProposeTermModal({
  deliberationId,
  open,
  onOpenChange,
  onProposed
}: ProposeTermModalProps) {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [examples, setExamples] = useState("");
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const response = await fetch(
      `/api/deliberations/${deliberationId}/glossary/terms`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, definition, examples })
      }
    );
    
    if (response.ok) {
      onProposed();
      onOpenChange(false);
      setTerm("");
      setDefinition("");
      setExamples("");
      
      // Broadcast event
      window.dispatchEvent(
        new CustomEvent("glossary:updated", {
          detail: { deliberationId }
        })
      );
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Propose New Term</DialogTitle>
          <DialogDescription>
            Add a term to the deliberation glossary to help everyone stay on the same page.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="term">Term</Label>
            <Input
              id="term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g., Justice, Freedom, Equity"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="definition">Definition</Label>
            <Textarea
              id="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Provide a clear, concise definition..."
              rows={4}
              maxLength={500}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              {definition.length}/500 characters
            </p>
          </div>
          
          <div>
            <Label htmlFor="examples">Examples (Optional)</Label>
            <Textarea
              id="examples"
              value={examples}
              onChange={(e) => setExamples(e.target.value)}
              placeholder="Provide 1-2 example sentences showing usage..."
              rows={2}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Propose Term</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## V. API Design

### A. REST Endpoints

```typescript
// ──────────────────────────────────────────────────────
// GET /api/deliberations/[id]/glossary/terms
// ──────────────────────────────────────────────────────
// Fetch all terms for a deliberation with their definitions

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const deliberationId = params.id;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // "PENDING" | "CONSENSUS" | "CONTESTED" | "all"
  
  const terms = await prisma.glossaryTerm.findMany({
    where: {
      deliberationId,
      ...(status && status !== "all" ? { status: status as GlossaryTermStatus } : {})
    },
    include: {
      proposedBy: {
        select: { auth_id: true, username: true, name: true, image: true }
      },
      definitions: {
        include: {
          author: {
            select: { auth_id: true, username: true, name: true, image: true }
          },
          endorsements: {
            include: {
              user: {
                select: { auth_id: true, username: true, name: true, image: true }
              }
            }
          }
        },
        orderBy: { endorsementCount: "desc" }
      },
      usages: {
        select: {
          id: true,
          targetType: true,
          targetId: true,
          contextText: true
        }
      }
    },
    orderBy: [
      { status: "asc" }, // CONSENSUS first, then PENDING, CONTESTED, ARCHIVED
      { createdAt: "desc" }
    ]
  });
  
  return NextResponse.json({ terms });
}

// ──────────────────────────────────────────────────────
// POST /api/deliberations/[id]/glossary/terms
// ──────────────────────────────────────────────────────
// Create a new glossary term with initial definition

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const deliberationId = params.id;
  const { term, definition, examples } = await req.json();
  
  // Normalize term for uniqueness check
  const termNormalized = term.toLowerCase().trim();
  
  // Check if term already exists
  const existing = await prisma.glossaryTerm.findUnique({
    where: {
      deliberationId_termNormalized: {
        deliberationId,
        termNormalized
      }
    }
  });
  
  if (existing) {
    return NextResponse.json(
      { error: "Term already exists. You can propose an alternative definition." },
      { status: 409 }
    );
  }
  
  // Create term with initial definition
  const newTerm = await prisma.glossaryTerm.create({
    data: {
      deliberationId,
      term,
      termNormalized,
      status: "PENDING",
      proposedById: userId,
      definitions: {
        create: {
          definition,
          examples,
          authorId: userId,
          isCanonical: false,
          endorsementCount: 1, // Self-endorsement
          endorsements: {
            create: {
              userId
            }
          }
        }
      }
    },
    include: {
      proposedBy: true,
      definitions: {
        include: {
          author: true,
          endorsements: {
            include: { user: true }
          }
        }
      }
    }
  });
  
  return NextResponse.json({ term: newTerm }, { status: 201 });
}

// ──────────────────────────────────────────────────────
// POST /api/glossary/terms/[termId]/definitions
// ──────────────────────────────────────────────────────
// Propose alternative definition for an existing term

export async function POST(
  req: NextRequest,
  { params }: { params: { termId: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { termId } = params;
  const { definition, examples } = await req.json();
  
  // Create alternative definition
  const newDefinition = await prisma.glossaryDefinition.create({
    data: {
      termId,
      definition,
      examples,
      authorId: userId,
      isCanonical: false,
      endorsementCount: 1,
      endorsements: {
        create: { userId }
      }
    },
    include: {
      author: true,
      endorsements: {
        include: { user: true }
      }
    }
  });
  
  // Update term status to CONTESTED if not already
  await prisma.glossaryTerm.update({
    where: { id: termId },
    data: { status: "CONTESTED" }
  });
  
  return NextResponse.json({ definition: newDefinition }, { status: 201 });
}

// ──────────────────────────────────────────────────────
// POST /api/glossary/definitions/[definitionId]/endorse
// ──────────────────────────────────────────────────────
// Endorse a definition (toggle on/off)

export async function POST(
  req: NextRequest,
  { params }: { params: { definitionId: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { definitionId } = params;
  
  // Check if already endorsed
  const existing = await prisma.glossaryEndorsement.findUnique({
    where: {
      definitionId_userId: {
        definitionId,
        userId
      }
    }
  });
  
  if (existing) {
    // Remove endorsement
    await prisma.glossaryEndorsement.delete({
      where: { id: existing.id }
    });
    
    await prisma.glossaryDefinition.update({
      where: { id: definitionId },
      data: { endorsementCount: { decrement: 1 } }
    });
    
    return NextResponse.json({ endorsed: false });
  } else {
    // Add endorsement
    await prisma.glossaryEndorsement.create({
      data: {
        definitionId,
        userId
      }
    });
    
    const updated = await prisma.glossaryDefinition.update({
      where: { id: definitionId },
      data: { endorsementCount: { increment: 1 } },
      include: {
        term: {
          select: {
            id: true,
            deliberationId: true,
            definitions: {
              select: { id: true, endorsementCount: true }
            }
          }
        }
      }
    });
    
    // Check if this definition should become canonical
    await checkAndPromoteToCanonical(updated);
    
    return NextResponse.json({ endorsed: true });
  }
}

// ──────────────────────────────────────────────────────
// Helper: Promote definition to canonical if threshold met
// ──────────────────────────────────────────────────────

async function checkAndPromoteToCanonical(definition: GlossaryDefinition) {
  const term = definition.term;
  const deliberationId = term.deliberationId;
  
  // Get participant count
  const participantCount = await getDeliberationParticipantCount(deliberationId);
  
  // Threshold: 50% of participants (minimum 3)
  const threshold = Math.max(3, Math.ceil(participantCount * 0.5));
  
  if (definition.endorsementCount >= threshold) {
    // Promote to canonical
    await prisma.$transaction([
      // Remove canonical status from other definitions
      prisma.glossaryDefinition.updateMany({
        where: {
          termId: term.id,
          id: { not: definition.id }
        },
        data: { isCanonical: false }
      }),
      
      // Set this as canonical
      prisma.glossaryDefinition.update({
        where: { id: definition.id },
        data: { isCanonical: true }
      }),
      
      // Update term status
      prisma.glossaryTerm.update({
        where: { id: term.id },
        data: { status: "CONSENSUS" }
      })
    ]);
  }
}
```

---

## VI. Integration with Existing Systems

### A. Argument Authoring Integration

**Inline Term Detection & Highlighting**

When users compose arguments in `AIFAuthoringPanel` or `PropositionComposer`:

1. **Detect glossary terms** in input text as user types
2. **Highlight matched terms** with subtle underline/background
3. **Show tooltip** on hover with consensus definition
4. **Flag inconsistent usage** if term used differently than definition

```typescript
// In AIFAuthoringPanel or any text input component

function useGlossaryDetection(
  text: string,
  deliberationId: string
) {
  const { data: terms } = useSWR(
    `/api/deliberations/${deliberationId}/glossary/terms`,
    fetcher
  );
  
  const detectedTerms = useMemo(() => {
    if (!terms) return [];
    
    const detected: Array<{
      term: GlossaryTerm;
      start: number;
      end: number;
      matchedText: string;
    }> = [];
    
    terms.forEach((term: GlossaryTerm) => {
      // Case-insensitive search
      const regex = new RegExp(`\\b${term.term}\\b`, "gi");
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        detected.push({
          term,
          start: match.index,
          end: match.index + match[0].length,
          matchedText: match[0]
        });
      }
    });
    
    return detected;
  }, [text, terms]);
  
  return detectedTerms;
}

// Component usage:
function PremiseTextInput({ deliberationId, value, onChange }) {
  const detectedTerms = useGlossaryDetection(value, deliberationId);
  
  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={onChange}
        className="peer"
      />
      
      {/* Overlay with highlighted terms */}
      <div className="absolute inset-0 pointer-events-none peer-focus:hidden">
        <HighlightedText text={value} highlights={detectedTerms} />
      </div>
      
      {detectedTerms.length > 0 && (
        <div className="mt-2 text-xs text-slate-500">
          <span className="font-medium">Glossary terms detected:</span>
          {detectedTerms.map((dt, i) => (
            <GlossaryTermChip
              key={i}
              term={dt.term}
              onClick={() => openTermDefinition(dt.term.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### B. Argument Graph Integration

**Show definitions in ClaimMiniMap / AIFMinimap**

When hovering over claims/arguments in the graph:

```typescript
// In ClaimMiniMap or AIFMinimap tooltip

function ClaimTooltip({ claim, deliberationId }) {
  const detectedTerms = useGlossaryDetection(claim.text, deliberationId);
  
  return (
    <div className="p-3 bg-white rounded-lg shadow-xl border">
      <div className="text-sm text-slate-900 mb-2">
        {claim.text}
      </div>
      
      {detectedTerms.length > 0 && (
        <div className="border-t pt-2">
          <div className="text-xs font-medium text-slate-700 mb-1">
            Terms in this claim:
          </div>
          {detectedTerms.map((dt) => {
            const consensusDef = dt.term.definitions.find(d => d.isCanonical);
            return (
              <div key={dt.term.id} className="text-xs text-slate-600 mb-1">
                <span className="font-medium">{dt.term.term}:</span>{" "}
                {consensusDef?.definition.slice(0, 80)}...
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### C. Search & Discovery

**Add glossary term search to global search**

In the main search bar, add a "Terms" filter:

```
Search results:
┌────────────────────────────────────┐
│ [All] [Claims] [Arguments] [Terms] │
├────────────────────────────────────┤
│ 📚 Justice                         │
│    "Fair treatment under law..."   │
│    5 uses in this deliberation     │
├────────────────────────────────────┤
│ 📚 Freedom                         │
│    ⚠️ 3 competing definitions      │
│    8 uses in this deliberation     │
└────────────────────────────────────┘
```

---

## VII. Development Phases

### Phase 1: Core Infrastructure (Week 1-2)

**Goal**: Database schema + basic CRUD API

- [ ] Create Prisma schema models
- [ ] Write migration
- [ ] Implement REST API endpoints
  - [ ] GET `/api/deliberations/[id]/glossary/terms`
  - [ ] POST `/api/deliberations/[id]/glossary/terms`
  - [ ] POST `/api/glossary/terms/[termId]/definitions`
  - [ ] POST `/api/glossary/definitions/[definitionId]/endorse`
- [ ] Write unit tests for API endpoints
- [ ] Seed script with sample terms

### Phase 2: UI Components (Week 2-3)

**Goal**: Build DefinitionSheet UI in FloatingSheet

- [ ] Create `DefinitionSheet.tsx` container component
- [ ] Create `TermCard.tsx` with consensus/competing views
- [ ] Create `ProposeTermModal.tsx`
- [ ] Create `DefinitionSheetHeader.tsx` (search/filter/sort)
- [ ] Add "Terms" toggle button to DeepDivePanelV2
- [ ] Integrate into FloatingSheet tabs
- [ ] Style with existing design system
- [ ] Add loading states, empty states, error states

### Phase 3: Interactivity & Real-time (Week 3-4)

**Goal**: Endorsements, voting, live updates

- [ ] Implement `EndorseButton` with optimistic updates
- [ ] Implement competing definition voting
- [ ] Add SWR mutations for cache invalidation
- [ ] Add WebSocket/SSE for live glossary updates
- [ ] Event system: `glossary:updated`, `glossary:term:added`
- [ ] Notification system for when terms reach consensus

### Phase 4: Integration with Arguments (Week 4-5)

**Goal**: Connect glossary to argument authoring

- [ ] Build `useGlossaryDetection` hook
- [ ] Add inline term highlighting to `AIFAuthoringPanel`
- [ ] Add inline term highlighting to `PropositionComposer`
- [ ] Add glossary tooltips to ClaimMiniMap
- [ ] Add glossary tooltips to AIFMinimap
- [ ] Create `GlossaryTermUsage` tracking on argument creation
- [ ] Build "View in Context" feature (shows all usages of a term)

### Phase 5: Advanced Features (Week 5-6)

**Goal**: History, moderation, analytics

- [ ] Implement definition history view
- [ ] Build definition merge UI
- [ ] Add moderator controls (mark canonical, archive)
- [ ] Analytics dashboard: most contested terms, usage trends
- [ ] Export glossary as PDF/Markdown
- [ ] AI-assisted definition synthesis (suggest merged definitions)
- [ ] Semantic similarity detection (flag synonyms/near-duplicates)

### Phase 6: Polish & Testing (Week 6-7)

**Goal**: Production-ready

- [ ] Comprehensive integration testing
- [ ] Performance optimization (virtualized lists)
- [ ] Accessibility audit (keyboard nav, screen readers)
- [ ] Mobile responsiveness
- [ ] User testing with sample deliberation
- [ ] Documentation for users
- [ ] Migration guide for existing deliberations

---

## VIII. Success Metrics

### Quantitative Metrics

1. **Adoption Rate**: % of deliberations that use glossary (target: 60%)
2. **Term Consensus Rate**: % of terms that reach consensus (target: 70%)
3. **Usage Frequency**: Average terms defined per deliberation (target: 8-15)
4. **Engagement**: Average endorsements per definition (target: 5+)
5. **Resolution Time**: Average time to consensus (target: <3 days)

### Qualitative Metrics

1. **Semantic Clarity**: User-reported reduction in misunderstandings
2. **Trust Building**: Participants feel definitions were fair/collaborative
3. **Argument Quality**: Arguments become more precise when terms are defined
4. **Moderator Feedback**: Moderators find it easier to guide discussions
5. **Conflict Resolution**: Glossary helps resolve semantic disputes

---

## IX. Future Enhancements

### A. AI-Powered Features

1. **Auto-suggest definitions**: Use LLM to draft initial definitions from Wikipedia/dictionaries
2. **Semantic analysis**: Detect when participants use terms inconsistently
3. **Definition synthesis**: Merge competing definitions using AI
4. **Synonym detection**: Flag when multiple terms mean the same thing
5. **Context-aware definitions**: Different definitions for different sub-topics

### B. Cross-Deliberation Features

1. **Global glossary**: Terms defined across all deliberations
2. **Import definitions**: Start new deliberation with pre-existing terms
3. **Term templates**: Pre-defined glossaries for common debate topics (e.g., climate policy, healthcare)
4. **Community standards**: Moderators curate "canonical" definitions for platform-wide use

### C. Gamification

1. **Badges**: "Lexicographer" badge for users who propose many definitions
2. **Reputation**: Earn points when your definitions reach consensus
3. **Leaderboard**: Most endorsed definitions, most clarified terms
4. **Challenges**: "Define 5 terms this week" prompts

### D. Visualization

1. **Term network graph**: Show relationships between terms
2. **Evolution timeline**: Visualize how definitions changed over time
3. **Heatmap**: Show which terms are most contested
4. **Usage map**: Highlight where in arguments terms are used

---

## X. Technical Considerations

### A. Performance

- **Virtualized lists**: Use `react-window` for long term lists
- **Debounced search**: Don't search on every keystroke
- **Pagination**: Load terms in batches (50 at a time)
- **Caching**: Aggressive SWR caching with revalidation
- **Lazy loading**: Load definition details only when card is expanded

### B. Accessibility

- **Keyboard navigation**: Arrow keys to navigate terms, Enter to expand
- **Screen readers**: Proper ARIA labels for all interactive elements
- **Focus management**: Trap focus in modals, restore focus on close
- **Color contrast**: Meet WCAG AA standards
- **Alternative text**: Describe icons/badges for screen readers

### C. Security

- **Rate limiting**: Prevent spam term proposals (max 10/hour per user)
- **Input sanitization**: XSS prevention on term/definition text
- **Moderation queue**: Flag suspicious terms for review
- **Permissions**: Only deliberation participants can propose terms
- **Audit log**: Track all changes for accountability

### D. Scalability

- **Database indices**: On deliberationId, termNormalized, status
- **Query optimization**: Use `include` strategically, avoid N+1 queries
- **Background jobs**: Recompute consensus status asynchronously
- **CDN caching**: Cache term lists for public deliberations
- **Sharding**: Separate glossary data by deliberationId for large scale

---

## XI. Open Questions for Discussion

1. **Consensus threshold**: Should it be 50% of participants, absolute number (e.g., 5), or moderator-decided?

2. **Edit permissions**: Can anyone edit a definition, or only the original proposer?

3. **Competing definitions**: Should we allow unlimited competing definitions, or cap at 3-5?

4. **Term scope**: Should terms be global (all deliberations) or strictly per-deliberation?

5. **Automatic detection**: Should we auto-detect terms from existing arguments (retroactive glossary)?

6. **Moderation**: How much power should moderators have to override community consensus?

7. **Versioning**: Should we preserve full edit history or just major versions?

8. **Integration depth**: Should glossary terms be **required** for argument authoring, or optional?

9. **Export format**: What formats should we support (PDF, Markdown, JSON, CSV)?

10. **Mobile UX**: On mobile, should DefinitionSheet be a bottom sheet or full-screen modal?

---

## XII. Conclusion

The **DefinitionSheet** component addresses a critical gap in online deliberation: **semantic grounding**. By enabling participants to collaboratively define key terms, we reduce confusion, build trust, and improve argument quality.

This design leverages existing Mesh architecture (FloatingSheet, SWR, Prisma) while introducing a novel collaborative glossary system. The phased development approach ensures incremental value delivery with clear milestones.

**Next Steps**:
1. Review this document with team
2. Prioritize features for MVP vs future enhancements
3. Create GitHub issues for Phase 1 tasks
4. Begin database schema implementation

**Estimated Timeline**: 6-7 weeks to production-ready feature

**Estimated Effort**: 1-2 engineers full-time

---

**Document Version**: 1.0  
**Last Updated**: October 24, 2025  
**Author**: GitHub Copilot (with Rohan)  
**Status**: Ready for Review 🚀
