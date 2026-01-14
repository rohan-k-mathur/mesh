# Stacks Improvement Roadmap: Phases 1 & 2

> **Status**: Active Development  
> **Created**: January 6, 2026  
> **Last Updated**: January 6, 2026  
> **Source Documents**:  
> - [STACKS_IMPROVEMENT_BRAINSTORM.md](STACKS_IMPROVEMENT_BRAINSTORM.md)  
> - [STACKS_IMPROVEMENT_DEV_ROADMAP_OUTLINE.md](STACKS_IMPROVEMENT_DEV_ROADMAP_OUTLINE.md)

---

## Executive Summary

This document provides the **complete implementation specification** for Phases 1 and 2 of the Stacks improvement initiative. These phases transform Stacks from a PDF-centric collection system into an Are.na-parity knowledge graph with evidence-first deliberation superpowers.

### Phase Overview

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| **Phase 1** | Are.na Parity | 4-5 weeks | StackItem migration, block types, multi-stack connections, visibility modes |
| **Phase 2** | Evidence UX | 3-4 weeks | Citation anchors, lift carries citations, citation intent, evidence filtering |

### Current State (Baseline)

From `schema.prisma` (verified January 2026):

```prisma
model LibraryPost {
  id          String   @id @default(cuid())
  uploader_id BigInt
  stack_id    String?              // ← Single stack ownership
  title       String?
  page_count  Int
  file_url    String
  thumb_urls  String[]
  created_at  DateTime @default(now())
  annotations Annotation[]
  stack       Stack?   @relation(fields: [stack_id], references: [id])
  // ...
}

model Stack {
  id          String   @id @default(cuid())
  owner_id    BigInt
  name        String
  description String?
  is_public   Boolean  @default(false)  // ← Binary visibility only
  order       String[]                   // ← Array-based ordering
  created_at  DateTime @default(now())
  parent_id   String?                    // ← Folder hierarchy only
  slug        String?  @unique
  posts       LibraryPost[]
  // ...
}

model Citation {
  id         String  @id @default(cuid())
  targetType String  // 'argument' | 'claim' | 'card' | 'comment' | 'move'
  targetId   String
  sourceId   String
  locator    String? // ← Basic page reference only
  quote      String?
  note       String?
  relevance  Int?
  // No anchor, no intent field
}

model Annotation {
  id        String @id @default(cuid())
  post_id   String
  page      Int
  rect      Json   // ← Has selection coordinates
  text      String
  author_id BigInt
  // Not linked to Citation
}
```

### Target State (End of Phase 2)

- **Multi-stack connections**: Any block can appear in unlimited stacks via `StackItem` join table
- **Block diversity**: PDF, Link, Text, Image, Video block types
- **Granular visibility**: `public_open | public_closed | private | unlisted`
- **Executable citations**: Click citation → jump to exact location in source
- **Evidence inheritance**: Lifted claims automatically inherit comment citations
- **Semantic evidence**: Citations tagged with intent (supports/refutes/context)

---

# PHASE 1: ARE.NA PARITY

**Objective**: Make Stacks feel as capable as Are.na for collecting, organizing, and connecting content.

**Timeline**: Weeks 1-5  
**Team**: 1-2 engineers

---

## 1.1 StackItem Join Table Migration

**Priority**: P0 — Foundation for all multi-stack features  
**Estimated Effort**: 5-7 days  
**Risk Level**: Medium (requires data migration with zero downtime)  
**Dependencies**: None (foundational)

### 1.1.1 Problem Statement

The current `Stack.order: String[]` design has critical limitations:

1. **Single ownership**: `LibraryPost.stack_id` means a post belongs to exactly one stack
2. **Array rewrite on reorder**: Moving one item requires rewriting the entire `order` array
3. **Concurrency risk**: Two users reordering simultaneously can corrupt the array
4. **No connection metadata**: Can't track who added an item, when, or why

Are.na's core value proposition is that "blocks can be connected to an infinite number of channels." Our current model makes this impossible.

### 1.1.2 Solution: StackItem Join Table

Replace the implicit `Stack.order[]` + `LibraryPost.stack_id` relationship with an explicit join table that:
- Enables many-to-many relationships (block ↔ stacks)
- Stores position as a scalar (no array rewrites)
- Captures connection metadata (who, when, notes)
- Supports mixed item types (blocks and embedded stacks)

### 1.1.3 Schema Design

```prisma
// ============================================================
// NEW: StackItem join table
// ============================================================

model StackItem {
  id          String        @id @default(cuid())
  stackId     String
  
  // Polymorphic reference: either a block OR an embedded stack
  blockId     String?       // LibraryPost.id (null if kind=stack_embed)
  embedStackId String?      // Stack.id for embedded stacks (null if kind=block)
  
  kind        StackItemKind @default(block)
  position    Float         // Float enables cheap insertion (avg of neighbors)
  addedById   BigInt        // Who connected this
  note        String?       // Optional "why I added this" annotation
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Relations
  stack       Stack         @relation("StackItems", fields: [stackId], references: [id], onDelete: Cascade)
  block       LibraryPost?  @relation("BlockConnections", fields: [blockId], references: [id], onDelete: Cascade)
  embedStack  Stack?        @relation("EmbeddedIn", fields: [embedStackId], references: [id], onDelete: Cascade)
  addedBy     User          @relation(fields: [addedById], references: [id])

  @@unique([stackId, blockId])           // One block can only appear once per stack
  @@unique([stackId, embedStackId])      // One embedded stack only once per parent
  @@index([stackId, position])           // Fast ordered retrieval
  @@index([blockId])                     // Fast "contexts" lookup
  @@index([embedStackId])
  @@index([addedById])
  @@map("stack_items")
}

enum StackItemKind {
  block        // LibraryPost reference
  stack_embed  // Embedded stack reference
}

// ============================================================
// MODIFIED: Stack model additions
// ============================================================

model Stack {
  // ... existing fields ...
  
  // NEW: Relation to items in this stack
  items           StackItem[]  @relation("StackItems")
  
  // NEW: Relation for when this stack is embedded in other stacks
  embeddedIn      StackItem[]  @relation("EmbeddedIn")
  
  // DEPRECATED (keep during migration, remove later)
  order           String[]     // Will be removed after migration verified
}

// ============================================================
// MODIFIED: LibraryPost model additions
// ============================================================

model LibraryPost {
  // ... existing fields ...
  
  // DEPRECATED (keep during migration for backward compat)
  stack_id        String?
  
  // NEW: All stacks this block is connected to
  stackConnections StackItem[] @relation("BlockConnections")
}
```

### 1.1.4 Migration Strategy

**Approach**: Parallel write with gradual cutover (zero downtime)

#### Step 1: Schema Addition (Day 1)

```bash
# Add new models without removing old fields
npx prisma db push
```

#### Step 2: Backfill Script (Day 1-2)

```typescript
// scripts/migrations/backfillStackItems.ts

import { prisma } from "@/lib/prismaclient";

interface MigrationStats {
  stacksProcessed: number;
  itemsCreated: number;
  orphansFound: number;
  errors: string[];
}

export async function backfillStackItems(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    stacksProcessed: 0,
    itemsCreated: 0,
    orphansFound: 0,
    errors: [],
  };

  // Process all stacks with their order arrays
  const stacks = await prisma.stack.findMany({
    select: { 
      id: true, 
      order: true, 
      owner_id: true,
      posts: { select: { id: true } }
    },
  });

  for (const stack of stacks) {
    try {
      const order = stack.order ?? [];
      const postsInOrder = new Set(order);
      
      // Create StackItems from order array (preserves position)
      for (let i = 0; i < order.length; i++) {
        const blockId = order[i];
        
        await prisma.stackItem.upsert({
          where: {
            stackId_blockId: { stackId: stack.id, blockId }
          },
          create: {
            stackId: stack.id,
            blockId,
            kind: "block",
            position: (i + 1) * 1000,  // Leave gaps: 1000, 2000, 3000...
            addedById: stack.owner_id,
          },
          update: {}, // Don't overwrite if exists
        });
        
        stats.itemsCreated++;
      }

      // Handle orphans: posts with stack_id but not in order array
      for (const post of stack.posts) {
        if (!postsInOrder.has(post.id)) {
          stats.orphansFound++;
          
          const maxPosition = await prisma.stackItem.aggregate({
            where: { stackId: stack.id },
            _max: { position: true },
          });
          
          await prisma.stackItem.upsert({
            where: {
              stackId_blockId: { stackId: stack.id, blockId: post.id }
            },
            create: {
              stackId: stack.id,
              blockId: post.id,
              kind: "block",
              position: (maxPosition._max.position ?? 0) + 1000,
              addedById: stack.owner_id,
            },
            update: {},
          });
        }
      }

      stats.stacksProcessed++;
    } catch (error) {
      stats.errors.push(`Stack ${stack.id}: ${error}`);
    }
  }

  return stats;
}

// Run with: npx tsx scripts/migrations/backfillStackItems.ts
if (require.main === module) {
  backfillStackItems()
    .then((stats) => {
      console.log("Migration complete:", stats);
      process.exit(stats.errors.length > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
```

#### Step 3: Dual-Write Layer (Day 2-3)

Create a utility that writes to both systems during transition:

```typescript
// lib/stacks/stackItemWriter.ts

import { prisma } from "@/lib/prismaclient";

export interface AddToStackParams {
  stackId: string;
  blockId: string;
  addedById: bigint;
  position?: number;  // If not provided, append to end
  note?: string;
}

export async function addBlockToStack(params: AddToStackParams) {
  const { stackId, blockId, addedById, note } = params;

  // Calculate position if not provided
  let position = params.position;
  if (position === undefined) {
    const maxPos = await prisma.stackItem.aggregate({
      where: { stackId },
      _max: { position: true },
    });
    position = (maxPos._max.position ?? 0) + 1000;
  }

  // NEW: Write to StackItem (primary)
  const item = await prisma.stackItem.create({
    data: {
      stackId,
      blockId,
      kind: "block",
      position,
      addedById,
      note,
    },
  });

  // DEPRECATED: Also update legacy fields (remove after migration)
  await prisma.$transaction([
    // Update LibraryPost.stack_id (pick first stack if multi)
    prisma.libraryPost.update({
      where: { id: blockId },
      data: { stack_id: stackId },
    }),
    // Append to Stack.order array
    prisma.$executeRaw`
      UPDATE stacks 
      SET "order" = array_append("order", ${blockId}::text)
      WHERE id = ${stackId}
      AND NOT (${blockId}::text = ANY("order"))
    `,
  ]);

  return item;
}

export async function removeBlockFromStack(stackId: string, blockId: string) {
  // NEW: Remove from StackItem (primary)
  await prisma.stackItem.delete({
    where: { stackId_blockId: { stackId, blockId } },
  });

  // DEPRECATED: Update legacy fields
  // Check if block is in other stacks
  const otherConnections = await prisma.stackItem.findFirst({
    where: { blockId, stackId: { not: stackId } },
    select: { stackId: true },
  });

  await prisma.$transaction([
    // Update stack_id to another stack or null
    prisma.libraryPost.update({
      where: { id: blockId },
      data: { stack_id: otherConnections?.stackId ?? null },
    }),
    // Remove from order array
    prisma.$executeRaw`
      UPDATE stacks 
      SET "order" = array_remove("order", ${blockId}::text)
      WHERE id = ${stackId}
    `,
  ]);
}

export async function reorderStackItem(
  stackId: string,
  blockId: string,
  newPosition: number
) {
  // NEW: Update StackItem position (primary)
  await prisma.stackItem.update({
    where: { stackId_blockId: { stackId, blockId } },
    data: { position: newPosition },
  });

  // DEPRECATED: Rebuild order array from StackItem positions
  const items = await prisma.stackItem.findMany({
    where: { stackId, kind: "block" },
    orderBy: { position: "asc" },
    select: { blockId: true },
  });

  await prisma.stack.update({
    where: { id: stackId },
    data: { order: items.map((i) => i.blockId!).filter(Boolean) },
  });
}
```

#### Step 4: Update Read Paths (Day 3-4)

```typescript
// lib/actions/stack.actions.ts - Updated getStack

export async function getStack(slugOrId: string) {
  const viewerId = await getCurrentUserIdOrNull();
  
  const stack = await prisma.stack.findFirst({
    where: {
      OR: [{ id: slugOrId }, { slug: slugOrId }],
    },
    include: {
      owner: { select: { id: true, name: true, username: true, avatar: true } },
      collaborators: { include: { user: { select: { id: true, name: true } } } },
      subscribers: viewerId ? { where: { user_id: viewerId } } : false,
      
      // NEW: Use StackItem for ordered retrieval
      items: {
        where: { kind: "block" },
        orderBy: { position: "asc" },
        include: {
          block: {
            include: {
              annotations: true,
              // Count of stacks this block appears in
              stackConnections: { select: { stackId: true } },
            },
          },
          addedBy: { select: { id: true, name: true, username: true } },
        },
      },
    },
  });

  if (!stack) return null;

  // Transform items to posts with connection metadata
  const posts = stack.items
    .filter((item) => item.block !== null)
    .map((item) => ({
      ...item.block!,
      connectionNote: item.note,
      addedBy: item.addedBy,
      addedAt: item.createdAt,
      connectedStacksCount: item.block!.stackConnections.length,
    }));

  return {
    stack: { /* ... */ },
    posts,
    // ...
  };
}
```

#### Step 5: Verification & Cleanup (Day 5-7)

```typescript
// scripts/migrations/verifyStackItemMigration.ts

export async function verifyMigration() {
  const issues: string[] = [];

  // Check 1: Every Stack.order entry has a StackItem
  const stacks = await prisma.stack.findMany({
    select: { id: true, order: true },
  });

  for (const stack of stacks) {
    const items = await prisma.stackItem.findMany({
      where: { stackId: stack.id, kind: "block" },
      select: { blockId: true },
    });
    const itemBlockIds = new Set(items.map((i) => i.blockId));

    for (const orderId of stack.order) {
      if (!itemBlockIds.has(orderId)) {
        issues.push(`Stack ${stack.id}: order entry ${orderId} missing StackItem`);
      }
    }
  }

  // Check 2: StackItem order matches Stack.order sequence
  for (const stack of stacks) {
    const items = await prisma.stackItem.findMany({
      where: { stackId: stack.id, kind: "block" },
      orderBy: { position: "asc" },
      select: { blockId: true },
    });
    const itemOrder = items.map((i) => i.blockId);
    
    if (JSON.stringify(itemOrder) !== JSON.stringify(stack.order)) {
      issues.push(`Stack ${stack.id}: StackItem order doesn't match Stack.order`);
    }
  }

  // Check 3: Every LibraryPost.stack_id has corresponding StackItem
  const postsWithStackId = await prisma.libraryPost.findMany({
    where: { stack_id: { not: null } },
    select: { id: true, stack_id: true },
  });

  for (const post of postsWithStackId) {
    const item = await prisma.stackItem.findUnique({
      where: {
        stackId_blockId: { stackId: post.stack_id!, blockId: post.id },
      },
    });
    if (!item) {
      issues.push(`Post ${post.id}: has stack_id=${post.stack_id} but no StackItem`);
    }
  }

  return { valid: issues.length === 0, issues };
}
```

### 1.1.5 API Endpoints

#### Connect Block to Stack

```typescript
// app/api/stacks/[id]/connect/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { canEditStack } from "@/lib/stacks/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { blockId, note } = await req.json();
  if (!blockId) {
    return NextResponse.json({ error: "blockId required" }, { status: 400 });
  }

  const stackId = params.id;

  // Check permissions
  const canEdit = await canEditStack(stackId, userId);
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if already connected
  const existing = await prisma.stackItem.findUnique({
    where: { stackId_blockId: { stackId, blockId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Block already connected to this stack" },
      { status: 409 }
    );
  }

  // Get max position
  const maxPos = await prisma.stackItem.aggregate({
    where: { stackId },
    _max: { position: true },
  });

  const item = await prisma.stackItem.create({
    data: {
      stackId,
      blockId,
      kind: "block",
      position: (maxPos._max.position ?? 0) + 1000,
      addedById: BigInt(userId),
      note,
    },
    include: {
      block: true,
      addedBy: { select: { id: true, name: true, username: true } },
    },
  });

  return NextResponse.json({ item });
}
```

#### Disconnect Block from Stack

```typescript
// app/api/stacks/[id]/disconnect/[blockId]/route.ts

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id: stackId, blockId } = params;

  const canEdit = await canEditStack(stackId, userId);
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.stackItem.delete({
    where: { stackId_blockId: { stackId, blockId } },
  });

  return NextResponse.json({ success: true });
}
```

#### Get Block Contexts (Stacks containing this block)

```typescript
// app/api/blocks/[id]/contexts/route.ts

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserIdOrNull();
  const blockId = params.id;

  const connections = await prisma.stackItem.findMany({
    where: { blockId },
    include: {
      stack: {
        select: {
          id: true,
          name: true,
          slug: true,
          is_public: true,
          owner_id: true,
          owner: { select: { id: true, name: true, username: true } },
          _count: { select: { items: true } },
        },
      },
      addedBy: { select: { id: true, name: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter to only stacks the user can view
  const visibleConnections = connections.filter((c) => {
    if (c.stack.is_public) return true;
    if (!userId) return false;
    return c.stack.owner_id === BigInt(userId);
    // TODO: Also check collaborator access
  });

  return NextResponse.json({
    blockId,
    contexts: visibleConnections.map((c) => ({
      stackId: c.stack.id,
      stackName: c.stack.name,
      stackSlug: c.stack.slug,
      owner: c.stack.owner,
      itemCount: c.stack._count.items,
      addedBy: c.addedBy,
      addedAt: c.createdAt,
      note: c.note,
    })),
    totalCount: visibleConnections.length,
  });
}
```

#### Reorder Stack Items

```typescript
// app/api/stacks/[id]/reorder/route.ts

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { blockId, afterBlockId, beforeBlockId } = await req.json();
  const stackId = params.id;

  const canEdit = await canEditStack(stackId, userId);
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Calculate new position based on neighbors
  let newPosition: number;

  if (!afterBlockId && !beforeBlockId) {
    // Move to start
    const first = await prisma.stackItem.findFirst({
      where: { stackId },
      orderBy: { position: "asc" },
      select: { position: true },
    });
    newPosition = (first?.position ?? 1000) / 2;
  } else if (afterBlockId && !beforeBlockId) {
    // Move to end (after afterBlockId)
    const after = await prisma.stackItem.findUnique({
      where: { stackId_blockId: { stackId, blockId: afterBlockId } },
      select: { position: true },
    });
    newPosition = (after?.position ?? 0) + 1000;
  } else if (afterBlockId && beforeBlockId) {
    // Move between two items
    const [after, before] = await Promise.all([
      prisma.stackItem.findUnique({
        where: { stackId_blockId: { stackId, blockId: afterBlockId } },
        select: { position: true },
      }),
      prisma.stackItem.findUnique({
        where: { stackId_blockId: { stackId, blockId: beforeBlockId } },
        select: { position: true },
      }),
    ]);
    newPosition = ((after?.position ?? 0) + (before?.position ?? 2000)) / 2;
  } else {
    // beforeBlockId only: move to start
    const before = await prisma.stackItem.findUnique({
      where: { stackId_blockId: { stackId, blockId: beforeBlockId! } },
      select: { position: true },
    });
    newPosition = (before?.position ?? 1000) / 2;
  }

  await prisma.stackItem.update({
    where: { stackId_blockId: { stackId, blockId } },
    data: { position: newPosition },
  });

  return NextResponse.json({ success: true, newPosition });
}
```

### 1.1.6 Component Updates

#### StackGrid Component

```tsx
// components/stack/StackGrid.tsx

"use client";

import { LibraryPostCard } from "./LibraryPostCard";
import { StackEmbedCard } from "./StackEmbedCard";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

interface StackGridProps {
  stackId: string;
  items: StackItemWithBlock[];
  editable: boolean;
}

export function StackGrid({ stackId, items, editable }: StackGridProps) {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIndex = items.findIndex((i) => i.blockId === active.id);
    const overIndex = items.findIndex((i) => i.blockId === over.id);

    // Calculate neighbors for position
    const afterBlockId = overIndex > 0 ? items[overIndex - 1].blockId : null;
    const beforeBlockId = overIndex < items.length - 1 ? items[overIndex + 1].blockId : null;

    await fetch(`/api/stacks/${stackId}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blockId: active.id,
        afterBlockId,
        beforeBlockId,
      }),
    });
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.blockId!)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            item.kind === "block" ? (
              <LibraryPostCard
                key={item.id}
                post={item.block!}
                connectionNote={item.note}
                connectedStacksCount={item.block!.stackConnections?.length ?? 1}
                editable={editable}
                onDisconnect={() => handleDisconnect(item.blockId!)}
              />
            ) : (
              <StackEmbedCard
                key={item.id}
                stack={item.embedStack!}
                editable={editable}
              />
            )
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

#### Connected Stacks Badge

```tsx
// components/stack/ConnectedStacksBadge.tsx

"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link2Icon } from "lucide-react";

interface ConnectedStacksBadgeProps {
  blockId: string;
  count: number;
}

export function ConnectedStacksBadge({ blockId, count }: ConnectedStacksBadgeProps) {
  const [contexts, setContexts] = useState<StackContext[] | null>(null);
  const [loading, setLoading] = useState(false);

  const loadContexts = async () => {
    if (contexts) return;
    setLoading(true);
    const res = await fetch(`/api/blocks/${blockId}/contexts`);
    const data = await res.json();
    setContexts(data.contexts);
    setLoading(false);
  };

  if (count <= 1) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={loadContexts}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Link2Icon className="h-3 w-3" />
          <span>{count} stacks</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="text-xs font-medium mb-2">Connected to:</div>
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading...</div>
        ) : (
          <ul className="space-y-1">
            {contexts?.map((ctx) => (
              <li key={ctx.stackId}>
                <a
                  href={`/stacks/${ctx.stackSlug || ctx.stackId}`}
                  className="text-sm hover:underline"
                >
                  {ctx.stackName}
                </a>
                <span className="text-xs text-muted-foreground ml-1">
                  by {ctx.owner.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

### 1.1.7 Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Migration preserves order | Compare `Stack.order` to `StackItem` sequence for all stacks |
| Multi-stack works | Connect same block to 3 stacks; verify appears in all |
| Contexts API returns all | Fetch `/api/blocks/:id/contexts`; verify complete list |
| Reorder is atomic | Move item; verify only `position` column changes |
| Badge shows count | Block in 3 stacks shows "3 stacks" badge |
| Disconnect removes only one | Disconnect from stack A; verify still in stacks B, C |
| Legacy compat during migration | `Stack.order` stays in sync during dual-write phase |

### 1.1.8 Rollback Plan

If issues arise during migration:

1. **Immediate**: Revert API routes to read from `Stack.order` instead of `StackItem`
2. **Data**: `StackItem` table can be dropped without affecting existing functionality
3. **Schema**: Remove `StackItem` model, relations from schema
4. **Cleanup**: No data loss since old fields (`order`, `stack_id`) preserved

---

## 1.2 Block Types: Link + Text

**Priority**: P0 — Core content diversity  
**Estimated Effort**: 4-5 days  
**Risk Level**: Low (additive schema changes)  
**Dependencies**: 1.1 StackItem (recommended but not required)

### 1.2.1 Problem Statement

Currently, `LibraryPost` is PDF-centric:
- `file_url` assumes a PDF file
- `page_count` only makes sense for documents
- `thumb_urls` designed for PDF page thumbnails

Are.na's power comes from mixing content types freely: links, text notes, images, videos, and files in the same channel. To achieve parity, we need a **block type discriminator** and type-specific fields.

### 1.2.2 Design Decision: Extend LibraryPost vs. New Block Model

**Option A: Extend LibraryPost** (Recommended)
- Add `blockType` enum and nullable type-specific fields
- Minimal migration, preserves all existing data
- Some field bloat (PDF fields on link blocks, etc.)

**Option B: Create new Block model**
- Cleaner separation of concerns
- Major migration required
- Breaking change to existing queries

**Decision**: Option A — Extend LibraryPost with type discriminator. Rename to "Block" conceptually in UI while keeping model name for compatibility.

### 1.2.3 Schema Changes

```prisma
// ============================================================
// EXTENDED: LibraryPost becomes polymorphic Block
// ============================================================

model LibraryPost {
  id          String    @id @default(cuid())
  uploader_id BigInt
  created_at  DateTime  @default(now()) @db.Timestamptz(6)
  
  // ─────────────────────────────────────────────────────────
  // NEW: Block type discriminator
  // ─────────────────────────────────────────────────────────
  blockType   BlockType @default(pdf)
  
  // ─────────────────────────────────────────────────────────
  // PDF-specific fields (existing)
  // ─────────────────────────────────────────────────────────
  title       String?
  file_url    String?   // Made nullable for non-PDF blocks
  page_count  Int       @default(0)
  thumb_urls  String[]
  
  // ─────────────────────────────────────────────────────────
  // NEW: Link block fields
  // ─────────────────────────────────────────────────────────
  linkUrl         String?   // Original URL
  linkCanonical   String?   // Resolved canonical URL
  linkTitle       String?   // OG title / page title
  linkDescription String?   // OG description / meta description
  linkImage       String?   // OG image URL
  linkFavicon     String?   // Site favicon
  linkSiteName    String?   // OG site_name
  linkReadableText String?  // Extracted readable content (for search)
  linkScreenshot  String?   // Screenshot URL (stored in CDN)
  
  // ─────────────────────────────────────────────────────────
  // NEW: Text block fields
  // ─────────────────────────────────────────────────────────
  textContent     String?   // Markdown content
  textPlain       String?   // Plain text version (for search)
  
  // ─────────────────────────────────────────────────────────
  // NEW: Image block fields
  // ─────────────────────────────────────────────────────────
  imageUrl        String?   // Image file URL
  imageAlt        String?   // Alt text
  imageWidth      Int?
  imageHeight     Int?
  
  // ─────────────────────────────────────────────────────────
  // NEW: Video block fields
  // ─────────────────────────────────────────────────────────
  videoUrl        String?   // Video URL (YouTube, Vimeo, etc.)
  videoProvider   String?   // 'youtube' | 'vimeo' | 'direct'
  videoEmbedId    String?   // Provider-specific ID
  videoDuration   Int?      // Duration in seconds
  videoThumb      String?   // Thumbnail URL
  
  // ─────────────────────────────────────────────────────────
  // NEW: Processing status
  // ─────────────────────────────────────────────────────────
  processingStatus BlockProcessingStatus @default(pending)
  processingError  String?
  processedAt      DateTime?
  
  // ─────────────────────────────────────────────────────────
  // Existing relations
  // ─────────────────────────────────────────────────────────
  annotations      Annotation[]
  uploader         User        @relation(fields: [uploader_id], references: [id], onDelete: Cascade)
  feedPosts        FeedPost[]
  stackConnections StackItem[] @relation("BlockConnections")
  sources          Source[]    // Blocks can be sources for citations
  
  // DEPRECATED
  stack_id    String?
  stack       Stack?      @relation(fields: [stack_id], references: [id])

  @@index([uploader_id, created_at])
  @@index([blockType])
  @@index([processingStatus])
  @@map("library_posts")
}

enum BlockType {
  pdf
  link
  text
  image
  video
  dataset
  embed     // Future: embedded content (tweets, etc.)
}

enum BlockProcessingStatus {
  pending     // Awaiting processing
  processing  // Currently being processed
  completed   // Successfully processed
  failed      // Processing failed
  skipped     // No processing needed
}
```

### 1.2.4 Migration Script

```typescript
// scripts/migrations/addBlockTypeFields.ts

import { prisma } from "@/lib/prismaclient";

export async function migrateExistingPosts() {
  // All existing LibraryPosts are PDFs
  const result = await prisma.libraryPost.updateMany({
    where: { blockType: null as any },
    data: { 
      blockType: "pdf",
      processingStatus: "completed", // PDFs already processed
    },
  });
  
  console.log(`Updated ${result.count} existing posts to blockType=pdf`);
}
```

### 1.2.5 Block Creation APIs

#### Create Link Block

```typescript
// app/api/blocks/link/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { extractLinkMetadata } from "@/lib/blocks/linkExtractor";
import { enqueueBlockProcessing } from "@/lib/blocks/processingQueue";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { url, stackId, note } = await req.json();
  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Create block with pending status
  const block = await prisma.libraryPost.create({
    data: {
      uploader_id: BigInt(userId),
      blockType: "link",
      linkUrl: url,
      title: parsedUrl.hostname, // Placeholder until processed
      page_count: 0,
      processingStatus: "pending",
    },
  });

  // Connect to stack if provided
  if (stackId) {
    const maxPos = await prisma.stackItem.aggregate({
      where: { stackId },
      _max: { position: true },
    });

    await prisma.stackItem.create({
      data: {
        stackId,
        blockId: block.id,
        kind: "block",
        position: (maxPos._max.position ?? 0) + 1000,
        addedById: BigInt(userId),
        note,
      },
    });
  }

  // Queue background processing
  await enqueueBlockProcessing(block.id, "link");

  return NextResponse.json({ 
    block: { id: block.id, blockType: "link", linkUrl: url },
    processing: true,
  });
}
```

#### Create Text Block

```typescript
// app/api/blocks/text/route.ts

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { content, stackId, note } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  // Extract plain text for search
  const plainText = stripMarkdown(content);
  const title = plainText.slice(0, 100) + (plainText.length > 100 ? "..." : "");

  const block = await prisma.libraryPost.create({
    data: {
      uploader_id: BigInt(userId),
      blockType: "text",
      textContent: content,
      textPlain: plainText,
      title,
      page_count: 0,
      processingStatus: "completed", // No async processing needed
    },
  });

  // Connect to stack if provided
  if (stackId) {
    const maxPos = await prisma.stackItem.aggregate({
      where: { stackId },
      _max: { position: true },
    });

    await prisma.stackItem.create({
      data: {
        stackId,
        blockId: block.id,
        kind: "block",
        position: (maxPos._max.position ?? 0) + 1000,
        addedById: BigInt(userId),
        note,
      },
    });
  }

  return NextResponse.json({ block });
}

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s/g, "")           // Headers
    .replace(/\*\*|__/g, "")            // Bold
    .replace(/\*|_/g, "")               // Italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
    .replace(/`{1,3}[^`]*`{1,3}/g, "")  // Code
    .replace(/\n{2,}/g, "\n")           // Multiple newlines
    .trim();
}
```

### 1.2.6 Link Metadata Extraction

```typescript
// lib/blocks/linkExtractor.ts

import { JSDOM } from "jsdom";

export interface LinkMetadata {
  canonical: string;
  title: string;
  description: string;
  image: string | null;
  favicon: string | null;
  siteName: string | null;
  readableText: string | null;
}

export async function extractLinkMetadata(url: string): Promise<LinkMetadata> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "MeshBot/1.0 (+https://mesh.app/bot)",
      "Accept": "text/html",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Extract OG tags
  const getMeta = (property: string): string | null => {
    const el = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
    return el?.getAttribute("content") || null;
  };

  // Canonical URL
  const canonicalEl = doc.querySelector('link[rel="canonical"]');
  const canonical = canonicalEl?.getAttribute("href") || response.url;

  // Title (OG > title tag)
  const title = getMeta("og:title") || doc.title || new URL(url).hostname;

  // Description
  const description = getMeta("og:description") || getMeta("description") || "";

  // Image
  const image = getMeta("og:image") || getMeta("twitter:image");

  // Favicon
  const faviconEl = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  const favicon = faviconEl?.getAttribute("href") 
    ? new URL(faviconEl.getAttribute("href")!, url).href 
    : `${new URL(url).origin}/favicon.ico`;

  // Site name
  const siteName = getMeta("og:site_name");

  // Readable text (simplified extraction)
  const readableText = extractReadableText(doc);

  return {
    canonical,
    title,
    description,
    image,
    favicon,
    siteName,
    readableText,
  };
}

function extractReadableText(doc: Document): string {
  // Remove scripts, styles, nav, footer, etc.
  const toRemove = doc.querySelectorAll(
    "script, style, nav, footer, header, aside, .sidebar, .comments, .advertisement"
  );
  toRemove.forEach((el) => el.remove());

  // Get main content area
  const main = doc.querySelector("main, article, .content, .post, #content") || doc.body;
  
  // Extract text
  const text = main.textContent || "";
  
  // Clean up whitespace
  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 10000); // Limit for storage
}
```

### 1.2.7 Background Processing Queue

```typescript
// lib/blocks/processingQueue.ts

import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prismaclient";
import { extractLinkMetadata } from "./linkExtractor";
import { captureScreenshot } from "./screenshotService";

const QUEUE_KEY = "block:processing:queue";

export async function enqueueBlockProcessing(
  blockId: string, 
  blockType: string
) {
  await redis.lpush(QUEUE_KEY, JSON.stringify({ blockId, blockType }));
}

// Worker function (run via workers/blockProcessor.ts)
export async function processNextBlock() {
  const item = await redis.rpop(QUEUE_KEY);
  if (!item) return null;

  const { blockId, blockType } = JSON.parse(item);

  await prisma.libraryPost.update({
    where: { id: blockId },
    data: { processingStatus: "processing" },
  });

  try {
    if (blockType === "link") {
      await processLinkBlock(blockId);
    } else if (blockType === "video") {
      await processVideoBlock(blockId);
    }
    // Add more block types as needed

    await prisma.libraryPost.update({
      where: { id: blockId },
      data: { 
        processingStatus: "completed",
        processedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.libraryPost.update({
      where: { id: blockId },
      data: { 
        processingStatus: "failed",
        processingError: String(error),
      },
    });
    throw error;
  }

  return blockId;
}

async function processLinkBlock(blockId: string) {
  const block = await prisma.libraryPost.findUnique({
    where: { id: blockId },
    select: { linkUrl: true },
  });

  if (!block?.linkUrl) throw new Error("No URL for link block");

  const metadata = await extractLinkMetadata(block.linkUrl);
  
  // Optional: capture screenshot
  let screenshotUrl: string | null = null;
  try {
    screenshotUrl = await captureScreenshot(block.linkUrl, blockId);
  } catch (e) {
    console.warn("Screenshot capture failed:", e);
  }

  await prisma.libraryPost.update({
    where: { id: blockId },
    data: {
      linkCanonical: metadata.canonical,
      linkTitle: metadata.title,
      linkDescription: metadata.description,
      linkImage: metadata.image,
      linkFavicon: metadata.favicon,
      linkSiteName: metadata.siteName,
      linkReadableText: metadata.readableText,
      linkScreenshot: screenshotUrl,
      title: metadata.title, // Also set main title field
    },
  });
}

async function processVideoBlock(blockId: string) {
  const block = await prisma.libraryPost.findUnique({
    where: { id: blockId },
    select: { videoUrl: true },
  });

  if (!block?.videoUrl) throw new Error("No URL for video block");

  const parsed = parseVideoUrl(block.videoUrl);
  
  await prisma.libraryPost.update({
    where: { id: blockId },
    data: {
      videoProvider: parsed.provider,
      videoEmbedId: parsed.embedId,
      videoThumb: parsed.thumbnail,
      title: parsed.title,
    },
  });
}

function parseVideoUrl(url: string) {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  if (ytMatch) {
    return {
      provider: "youtube",
      embedId: ytMatch[1],
      thumbnail: `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`,
      title: null, // Would need API call
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      provider: "vimeo",
      embedId: vimeoMatch[1],
      thumbnail: null, // Would need API call
      title: null,
    };
  }

  return { provider: "direct", embedId: null, thumbnail: null, title: null };
}
```

### 1.2.8 Block Card Components

#### LinkBlockCard

```tsx
// components/stack/blocks/LinkBlockCard.tsx

"use client";

import { ExternalLinkIcon, RefreshCwIcon, AlertCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkBlockCardProps {
  block: {
    id: string;
    linkUrl: string;
    linkTitle: string | null;
    linkDescription: string | null;
    linkImage: string | null;
    linkFavicon: string | null;
    linkSiteName: string | null;
    linkScreenshot: string | null;
    processingStatus: string;
  };
  compact?: boolean;
}

export function LinkBlockCard({ block, compact }: LinkBlockCardProps) {
  const isProcessing = block.processingStatus === "pending" || 
                       block.processingStatus === "processing";
  const hasFailed = block.processingStatus === "failed";

  return (
    <div className={cn(
      "group relative rounded-lg border bg-card overflow-hidden",
      "hover:border-primary/50 transition-colors"
    )}>
      {/* Preview Image */}
      <div className="aspect-video bg-muted relative">
        {block.linkImage || block.linkScreenshot ? (
          <img
            src={block.linkImage || block.linkScreenshot!}
            alt={block.linkTitle || ""}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ExternalLinkIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <RefreshCwIcon className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {hasFailed && (
          <div className="absolute top-2 right-2">
            <AlertCircleIcon className="h-5 w-5 text-destructive" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {block.linkFavicon && (
            <img src={block.linkFavicon} alt="" className="h-4 w-4" />
          )}
          <span className="text-xs text-muted-foreground truncate">
            {block.linkSiteName || new URL(block.linkUrl).hostname}
          </span>
        </div>
        
        <h3 className="font-medium text-sm line-clamp-2 mb-1">
          {block.linkTitle || block.linkUrl}
        </h3>
        
        {!compact && block.linkDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {block.linkDescription}
          </p>
        )}
      </div>
      
      {/* Click overlay */}
      <a
        href={block.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0"
      >
        <span className="sr-only">Open {block.linkTitle}</span>
      </a>
    </div>
  );
}
```

#### TextBlockCard

```tsx
// components/stack/blocks/TextBlockCard.tsx

"use client";

import ReactMarkdown from "react-markdown";
import { FileTextIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextBlockCardProps {
  block: {
    id: string;
    textContent: string;
    title: string | null;
  };
  compact?: boolean;
  onClick?: () => void;
}

export function TextBlockCard({ block, compact, onClick }: TextBlockCardProps) {
  return (
    <div 
      className={cn(
        "group relative rounded-lg border bg-card p-4 cursor-pointer",
        "hover:border-primary/50 transition-colors"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-muted">
          <FileTextIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          {block.title && (
            <h3 className="font-medium text-sm mb-2 line-clamp-1">
              {block.title}
            </h3>
          )}
          
          <div className={cn(
            "prose prose-sm dark:prose-invert max-w-none",
            compact ? "line-clamp-3" : "line-clamp-6"
          )}>
            <ReactMarkdown>
              {block.textContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Block Type Router

```tsx
// components/stack/blocks/BlockCard.tsx

"use client";

import { LibraryPostCard } from "../LibraryPostCard";
import { LinkBlockCard } from "./LinkBlockCard";
import { TextBlockCard } from "./TextBlockCard";
import { ImageBlockCard } from "./ImageBlockCard";
import { VideoBlockCard } from "./VideoBlockCard";

interface BlockCardProps {
  block: LibraryPostWithType;
  compact?: boolean;
  editable?: boolean;
  onSelect?: () => void;
}

export function BlockCard({ block, compact, editable, onSelect }: BlockCardProps) {
  switch (block.blockType) {
    case "pdf":
      return (
        <LibraryPostCard
          post={block}
          compact={compact}
          editable={editable}
        />
      );
    
    case "link":
      return (
        <LinkBlockCard
          block={block}
          compact={compact}
        />
      );
    
    case "text":
      return (
        <TextBlockCard
          block={block}
          compact={compact}
          onClick={onSelect}
        />
      );
    
    case "image":
      return (
        <ImageBlockCard
          block={block}
          compact={compact}
        />
      );
    
    case "video":
      return (
        <VideoBlockCard
          block={block}
          compact={compact}
        />
      );
    
    default:
      return (
        <div className="p-4 border rounded-lg text-muted-foreground">
          Unknown block type: {block.blockType}
        </div>
      );
  }
}
```

### 1.2.9 Stack Composer Updates

```tsx
// components/stack/StackComposer.tsx

"use client";

import { useState } from "react";
import { 
  PlusIcon, 
  LinkIcon, 
  FileTextIcon, 
  ImageIcon, 
  VideoIcon,
  FileIcon 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddLinkModal } from "./modals/AddLinkModal";
import { AddTextModal } from "./modals/AddTextModal";
import { AddPDFModal } from "./modals/AddPDFModal";

interface StackComposerProps {
  stackId: string;
  onBlockAdded: (block: any) => void;
}

export function StackComposer({ stackId, onBlockAdded }: StackComposerProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="btnv2 btnv2--primary flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Block
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setActiveModal("link")}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveModal("text")}>
            <FileTextIcon className="h-4 w-4 mr-2" />
            Note
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveModal("pdf")}>
            <FileIcon className="h-4 w-4 mr-2" />
            PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveModal("image")}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveModal("video")}>
            <VideoIcon className="h-4 w-4 mr-2" />
            Video
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddLinkModal
        open={activeModal === "link"}
        onClose={() => setActiveModal(null)}
        stackId={stackId}
        onSuccess={onBlockAdded}
      />
      
      <AddTextModal
        open={activeModal === "text"}
        onClose={() => setActiveModal(null)}
        stackId={stackId}
        onSuccess={onBlockAdded}
      />
      
      <AddPDFModal
        open={activeModal === "pdf"}
        onClose={() => setActiveModal(null)}
        stackId={stackId}
        onSuccess={onBlockAdded}
      />
    </>
  );
}
```

### 1.2.10 Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Link blocks create successfully | Add link → block created with `blockType=link` |
| Link metadata extracted | After processing, OG tags populated |
| Text blocks render markdown | Add note with markdown → renders formatted |
| Mixed blocks in grid | Stack with PDF + Link + Text displays correctly |
| Processing status visible | Pending blocks show loading indicator |
| Failed processing shows error | Invalid URL shows error state |
| Search includes all types | Text content and link text searchable |

---

## 1.3 Connect UI + Contexts Panel

**Priority**: P1 — Key UX for multi-stack mental model  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low  
**Dependencies**: 1.1 StackItem

### 1.3.1 Problem Statement

With StackItem enabling multi-stack connections, users need:
1. A way to discover which stacks a block appears in ("Contexts")
2. A way to add a block to additional stacks ("Connect")
3. Visual indication of connection count

### 1.3.2 Connect Modal Component

```tsx
// components/stack/modals/ConnectModal.tsx

"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchIcon, FolderIcon, CheckIcon } from "lucide-react";

interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
  blockId: string;
  blockTitle: string;
  currentStackIds: string[];
  onConnect: (stackIds: string[]) => Promise<void>;
}

interface StackOption {
  id: string;
  name: string;
  slug: string | null;
  itemCount: number;
  isOwner: boolean;
  isConnected: boolean;
}

export function ConnectModal({
  open,
  onClose,
  blockId,
  blockTitle,
  currentStackIds,
  onConnect,
}: ConnectModalProps) {
  const [search, setSearch] = useState("");
  const [stacks, setStacks] = useState<StackOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(currentStackIds));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadStacks();
      setSelected(new Set(currentStackIds));
    }
  }, [open, currentStackIds]);

  const loadStacks = async () => {
    setLoading(true);
    const res = await fetch(`/api/stacks/my?includeCollaborator=true`);
    const data = await res.json();
    
    setStacks(
      data.stacks.map((s: any) => ({
        ...s,
        isConnected: currentStackIds.includes(s.id),
      }))
    );
    setLoading(false);
  };

  const handleToggle = (stackId: string) => {
    const next = new Set(selected);
    if (next.has(stackId)) {
      next.delete(stackId);
    } else {
      next.add(stackId);
    }
    setSelected(next);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Find stacks to add and remove
    const toAdd = [...selected].filter((id) => !currentStackIds.includes(id));
    const toRemove = currentStackIds.filter((id) => !selected.has(id));
    
    // Process additions
    for (const stackId of toAdd) {
      await fetch(`/api/stacks/${stackId}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId }),
      });
    }
    
    // Process removals
    for (const stackId of toRemove) {
      await fetch(`/api/stacks/${stackId}/disconnect/${blockId}`, {
        method: "DELETE",
      });
    }
    
    await onConnect([...selected]);
    setSaving(false);
    onClose();
  };

  const filteredStacks = stacks.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to Stacks</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select stacks to connect "{blockTitle}"
          </p>
        </DialogHeader>

        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your stacks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading stacks...
            </div>
          ) : filteredStacks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stacks found
            </div>
          ) : (
            filteredStacks.map((stack) => (
              <label
                key={stack.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(stack.id)}
                  onCheckedChange={() => handleToggle(stack.id)}
                />
                <FolderIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {stack.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stack.itemCount} items
                    {stack.isConnected && (
                      <span className="ml-2 text-primary">• Connected</span>
                    )}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="btnv2 btnv2--ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btnv2 btnv2--primary"
          >
            {saving ? "Saving..." : "Save Connections"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 1.3.3 Contexts Panel Component

```tsx
// components/stack/ContextsPanel.tsx

"use client";

import { useState, useEffect } from "react";
import { Link2Icon, ExternalLinkIcon, XIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface ContextsPanelProps {
  open: boolean;
  onClose: () => void;
  blockId: string;
  blockTitle: string;
}

interface StackContext {
  stackId: string;
  stackName: string;
  stackSlug: string | null;
  owner: { id: string; name: string; username: string };
  itemCount: number;
  addedBy: { id: string; name: string } | null;
  addedAt: string;
  note: string | null;
}

export function ContextsPanel({ open, onClose, blockId, blockTitle }: ContextsPanelProps) {
  const [contexts, setContexts] = useState<StackContext[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadContexts();
    }
  }, [open, blockId]);

  const loadContexts = async () => {
    setLoading(true);
    const res = await fetch(`/api/blocks/${blockId}/contexts`);
    const data = await res.json();
    setContexts(data.contexts);
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Link2Icon className="h-5 w-5" />
            Connections
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            "{blockTitle}" appears in {contexts.length} stack{contexts.length !== 1 ? "s" : ""}
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading connections...
            </div>
          ) : contexts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Not connected to any stacks
            </div>
          ) : (
            contexts.map((ctx) => (
              <a
                key={ctx.stackId}
                href={`/stacks/${ctx.stackSlug || ctx.stackId}`}
                className="block p-3 rounded-lg border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{ctx.stackName}</h4>
                    <p className="text-sm text-muted-foreground">
                      by {ctx.owner.name} • {ctx.itemCount} items
                    </p>
                  </div>
                  <ExternalLinkIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                
                {ctx.note && (
                  <p className="mt-2 text-sm italic text-muted-foreground">
                    "{ctx.note}"
                  </p>
                )}
                
                {ctx.addedBy && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Added by {ctx.addedBy.name} on{" "}
                    {new Date(ctx.addedAt).toLocaleDateString()}
                  </p>
                )}
              </a>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### 1.3.4 Connect Button (Global Action)

```tsx
// components/stack/ConnectButton.tsx

"use client";

import { useState } from "react";
import { Link2Icon } from "lucide-react";
import { ConnectModal } from "./modals/ConnectModal";

interface ConnectButtonProps {
  blockId: string;
  blockTitle: string;
  currentStackIds: string[];
  variant?: "icon" | "text" | "full";
  onUpdate?: () => void;
}

export function ConnectButton({
  blockId,
  blockTitle,
  currentStackIds,
  variant = "text",
  onUpdate,
}: ConnectButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleConnect = async (stackIds: string[]) => {
    onUpdate?.();
  };

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="p-2 rounded-md hover:bg-muted"
          title="Connect to stacks"
        >
          <Link2Icon className="h-4 w-4" />
        </button>
        <ConnectModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          blockId={blockId}
          blockTitle={blockTitle}
          currentStackIds={currentStackIds}
          onConnect={handleConnect}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="btnv2 btnv2--ghost btnv2--sm flex items-center gap-1.5"
      >
        <Link2Icon className="h-3.5 w-3.5" />
        {variant === "full" ? "Connect to Stack" : "Connect"}
      </button>
      <ConnectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        blockId={blockId}
        blockTitle={blockTitle}
        currentStackIds={currentStackIds}
        onConnect={handleConnect}
      />
    </>
  );
}
```

### 1.3.5 Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Connect modal shows user's stacks | Open modal → see owned + collaborator stacks |
| Can connect to multiple stacks | Select 3 stacks → block appears in all 3 |
| Can disconnect from stacks | Uncheck stack → block removed from that stack |
| Contexts panel shows all connections | Block in 5 stacks → panel shows all 5 |
| Connection notes display | Add note when connecting → shows in contexts |
| Search filters stacks | Type in search → list filters |

---

## 1.4 Stack Embeds (Stacks Containing Stacks)

**Priority**: P2 — Advanced organization  
**Estimated Effort**: 2-3 days  
**Risk Level**: Low  
**Dependencies**: 1.1 StackItem (with `kind` enum)

### 1.4.1 Problem Statement

Are.na channels can contain other channels as items, not just blocks. This enables:
- **Reader's guides** that embed sub-collections as modules
- **Topic hubs** that aggregate related collections
- **Hierarchical curation** beyond simple folder nesting

Our current `parent_id` field creates a folder-like hierarchy, but doesn't allow a stack to be **embedded as an item** within another stack (appearing in the position-ordered list alongside blocks).

### 1.4.2 Schema (Already Covered in 1.1)

The `StackItem` model already supports this via:

```prisma
model StackItem {
  // ...
  kind         StackItemKind @default(block)
  blockId      String?       // null when kind=stack_embed
  embedStackId String?       // Stack.id when kind=stack_embed
  
  embedStack   Stack? @relation("EmbeddedIn", fields: [embedStackId], references: [id])
}

enum StackItemKind {
  block
  stack_embed
}
```

### 1.4.3 Circular Embed Prevention

```typescript
// lib/stacks/embedValidation.ts

import { prisma } from "@/lib/prismaclient";

/**
 * Check if embedding `childStackId` in `parentStackId` would create a cycle.
 * Returns true if cycle detected (embed should be blocked).
 */
export async function wouldCreateCycle(
  parentStackId: string,
  childStackId: string
): Promise<boolean> {
  // Case 1: Direct self-embed
  if (parentStackId === childStackId) {
    return true;
  }

  // Case 2: Child already contains parent (directly or transitively)
  const visited = new Set<string>();
  const queue = [childStackId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    // Check if this stack embeds the parent
    const embeds = await prisma.stackItem.findMany({
      where: { stackId: current, kind: "stack_embed" },
      select: { embedStackId: true },
    });

    for (const embed of embeds) {
      if (embed.embedStackId === parentStackId) {
        return true; // Cycle detected
      }
      if (embed.embedStackId) {
        queue.push(embed.embedStackId);
      }
    }
  }

  return false;
}
```

### 1.4.4 Embed Stack API

```typescript
// app/api/stacks/[id]/embed/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { canEditStack } from "@/lib/stacks/permissions";
import { wouldCreateCycle } from "@/lib/stacks/embedValidation";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { embedStackId, note } = await req.json();
  if (!embedStackId) {
    return NextResponse.json({ error: "embedStackId required" }, { status: 400 });
  }

  const parentStackId = params.id;

  // Permission check
  const canEdit = await canEditStack(parentStackId, userId);
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify the stack to embed exists and is visible
  const embedStack = await prisma.stack.findUnique({
    where: { id: embedStackId },
    select: { id: true, name: true, is_public: true, owner_id: true },
  });

  if (!embedStack) {
    return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  }

  // Check for cycles
  if (await wouldCreateCycle(parentStackId, embedStackId)) {
    return NextResponse.json(
      { error: "Cannot embed: would create circular reference" },
      { status: 400 }
    );
  }

  // Check if already embedded
  const existing = await prisma.stackItem.findUnique({
    where: { stackId_embedStackId: { stackId: parentStackId, embedStackId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Stack already embedded" },
      { status: 409 }
    );
  }

  // Get max position
  const maxPos = await prisma.stackItem.aggregate({
    where: { stackId: parentStackId },
    _max: { position: true },
  });

  const item = await prisma.stackItem.create({
    data: {
      stackId: parentStackId,
      embedStackId,
      kind: "stack_embed",
      position: (maxPos._max.position ?? 0) + 1000,
      addedById: BigInt(userId),
      note,
    },
    include: {
      embedStack: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          owner: { select: { id: true, name: true, username: true } },
          _count: { select: { items: true } },
        },
      },
    },
  });

  return NextResponse.json({ item });
}
```

### 1.4.5 Stack Embed Card Component

```tsx
// components/stack/blocks/StackEmbedCard.tsx

"use client";

import { FolderIcon, ExternalLinkIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StackEmbedCardProps {
  stack: {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    owner: { id: string; name: string; username: string };
    _count: { items: number };
  };
  note?: string | null;
  compact?: boolean;
  depth?: number; // For nested rendering limit
}

export function StackEmbedCard({ 
  stack, 
  note, 
  compact,
  depth = 0 
}: StackEmbedCardProps) {
  const href = `/stacks/${stack.slug || stack.id}`;

  return (
    <a
      href={href}
      className={cn(
        "group block rounded-lg border-2 border-dashed bg-card/50 p-4",
        "hover:border-primary/50 hover:bg-card transition-all",
        depth > 0 && "border-primary/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2.5 rounded-lg",
          "bg-primary/10 text-primary"
        )}>
          <FolderIcon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">
              {stack.name}
            </h3>
            <ExternalLinkIcon className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <p className="text-sm text-muted-foreground">
            by {stack.owner.name} • {stack._count.items} items
          </p>
          
          {!compact && stack.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {stack.description}
            </p>
          )}
          
          {note && (
            <p className="mt-2 text-sm italic text-muted-foreground border-l-2 pl-2">
              "{note}"
            </p>
          )}
        </div>
      </div>
      
      {/* Preview of items (optional, depth-limited) */}
      {!compact && depth < 1 && stack._count.items > 0 && (
        <div className="mt-3 pt-3 border-t">
          <StackEmbedPreview stackId={stack.id} limit={4} />
        </div>
      )}
    </a>
  );
}

function StackEmbedPreview({ stackId, limit }: { stackId: string; limit: number }) {
  // This would fetch a preview of items - simplified for brevity
  return (
    <div className="flex gap-1">
      {/* Thumbnail previews would go here */}
      <div className="text-xs text-muted-foreground">
        Click to view contents →
      </div>
    </div>
  );
}
```

### 1.4.6 Embed Stack Modal

```tsx
// components/stack/modals/EmbedStackModal.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchIcon, FolderIcon, AlertCircleIcon } from "lucide-react";

interface EmbedStackModalProps {
  open: boolean;
  onClose: () => void;
  parentStackId: string;
  onEmbed: (stackId: string, note?: string) => Promise<void>;
}

export function EmbedStackModal({
  open,
  onClose,
  parentStackId,
  onEmbed,
}: EmbedStackModalProps) {
  const [search, setSearch] = useState("");
  const [stacks, setStacks] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadStacks();
      setSelected(null);
      setNote("");
      setError(null);
    }
  }, [open]);

  const loadStacks = async () => {
    setLoading(true);
    const res = await fetch(`/api/stacks/embeddable?excludeId=${parentStackId}`);
    const data = await res.json();
    setStacks(data.stacks);
    setLoading(false);
  };

  const handleEmbed = async () => {
    if (!selected) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/stacks/${parentStackId}/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedStackId: selected, note: note || undefined }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to embed stack");
      }
      
      await onEmbed(selected, note);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredStacks = stacks.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Embed a Stack</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add another stack as an item in this stack
          </p>
        </DialogHeader>

        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stacks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading...
            </div>
          ) : filteredStacks.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No stacks available to embed
            </div>
          ) : (
            filteredStacks.map((stack) => (
              <button
                key={stack.id}
                onClick={() => setSelected(stack.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-md text-left",
                  selected === stack.id
                    ? "bg-primary/10 border border-primary"
                    : "hover:bg-muted"
                )}
              >
                <FolderIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {stack.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stack._count?.items ?? 0} items
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {selected && (
          <Textarea
            placeholder="Add a note about why you're embedding this stack... (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircleIcon className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="btnv2 btnv2--ghost">
            Cancel
          </button>
          <button
            onClick={handleEmbed}
            disabled={!selected || saving}
            className="btnv2 btnv2--primary"
          >
            {saving ? "Embedding..." : "Embed Stack"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 1.4.7 Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Can embed stack as item | Add stack B to stack A → appears in A's item list |
| Circular embed blocked | Try to embed A in B when B is in A → error |
| Self-embed blocked | Try to embed A in A → error |
| Embed card displays correctly | Embedded stack shows name, owner, item count |
| Note preserved | Add note when embedding → displays on embed card |
| Depth limit respected | Embedded stacks don't infinitely recurse in preview |

---

## 1.5 Visibility Modes

**Priority**: P1 — Matches user expectations from Are.na  
**Estimated Effort**: 2 days  
**Risk Level**: Low (schema + permission checks)  
**Dependencies**: None (independent)

### 1.5.1 Problem Statement

Current visibility is binary (`is_public: boolean`), but Are.na offers richer options:
- **Public Open**: Anyone can view AND add content
- **Public Closed**: Anyone can view, only collaborators can add
- **Private**: Only collaborators can view/add
- **Unlisted**: Accessible via link, but not discoverable in search/feeds

### 1.5.2 Schema Changes

```prisma
model Stack {
  // ... existing fields ...
  
  // NEW: Replace is_public with granular visibility
  visibility StackVisibility @default(public_closed)
  
  // DEPRECATED: Keep during migration
  is_public  Boolean @default(false)
}

enum StackVisibility {
  public_open    // Anyone can view + add blocks
  public_closed  // Anyone can view; only owner/collaborators can add
  private        // Only owner/collaborators can view and add
  unlisted       // Link access only; not in search/discovery
}
```

### 1.5.3 Migration Script

```typescript
// scripts/migrations/migrateStackVisibility.ts

import { prisma } from "@/lib/prismaclient";

export async function migrateVisibility() {
  // Public stacks → public_closed (safe default)
  const publicResult = await prisma.stack.updateMany({
    where: { is_public: true, visibility: null as any },
    data: { visibility: "public_closed" },
  });
  
  // Private stacks → private
  const privateResult = await prisma.stack.updateMany({
    where: { is_public: false, visibility: null as any },
    data: { visibility: "private" },
  });
  
  console.log(`Migrated ${publicResult.count} public, ${privateResult.count} private stacks`);
}
```

### 1.5.4 Permission Utilities

```typescript
// lib/stacks/permissions.ts

import { prisma } from "@/lib/prismaclient";
import { StackVisibility } from "@prisma/client";

export interface StackPermissions {
  canView: boolean;
  canEdit: boolean;
  canAdd: boolean;
  canDelete: boolean;
  canManageCollaborators: boolean;
}

export async function getStackPermissions(
  stackId: string,
  userId: bigint | null
): Promise<StackPermissions> {
  const stack = await prisma.stack.findUnique({
    where: { id: stackId },
    select: {
      owner_id: true,
      visibility: true,
      collaborators: userId
        ? { where: { user_id: userId }, select: { role: true } }
        : false,
    },
  });

  if (!stack) {
    return {
      canView: false,
      canEdit: false,
      canAdd: false,
      canDelete: false,
      canManageCollaborators: false,
    };
  }

  const isOwner = userId !== null && stack.owner_id === userId;
  const collaborator = stack.collaborators?.[0];
  const isEditor = collaborator?.role === "EDITOR" || collaborator?.role === "OWNER";
  const isViewer = collaborator?.role === "VIEWER";
  const isCollaborator = isOwner || isEditor || isViewer;

  const visibility = stack.visibility as StackVisibility;

  // Calculate permissions based on visibility and role
  const perms: StackPermissions = {
    canView: false,
    canEdit: false,
    canAdd: false,
    canDelete: false,
    canManageCollaborators: false,
  };

  switch (visibility) {
    case "public_open":
      perms.canView = true;
      perms.canAdd = userId !== null; // Any logged-in user can add
      perms.canEdit = isOwner || isEditor;
      perms.canDelete = isOwner;
      perms.canManageCollaborators = isOwner;
      break;

    case "public_closed":
      perms.canView = true;
      perms.canAdd = isOwner || isEditor;
      perms.canEdit = isOwner || isEditor;
      perms.canDelete = isOwner;
      perms.canManageCollaborators = isOwner;
      break;

    case "unlisted":
      perms.canView = true; // Anyone with link
      perms.canAdd = isOwner || isEditor;
      perms.canEdit = isOwner || isEditor;
      perms.canDelete = isOwner;
      perms.canManageCollaborators = isOwner;
      break;

    case "private":
      perms.canView = isCollaborator;
      perms.canAdd = isOwner || isEditor;
      perms.canEdit = isOwner || isEditor;
      perms.canDelete = isOwner;
      perms.canManageCollaborators = isOwner;
      break;
  }

  return perms;
}

// Convenience functions
export async function canViewStack(stackId: string, userId: bigint | null): Promise<boolean> {
  const perms = await getStackPermissions(stackId, userId);
  return perms.canView;
}

export async function canEditStack(stackId: string, userId: bigint | null): Promise<boolean> {
  const perms = await getStackPermissions(stackId, userId);
  return perms.canEdit;
}

export async function canAddToStack(stackId: string, userId: bigint | null): Promise<boolean> {
  const perms = await getStackPermissions(stackId, userId);
  return perms.canAdd;
}
```

### 1.5.5 Update Stack API Authorization

```typescript
// app/api/stacks/[id]/route.ts - Updated GET handler

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserIdOrNull();
  const stackId = params.id;

  const perms = await getStackPermissions(stackId, userId ? BigInt(userId) : null);
  
  if (!perms.canView) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stack = await prisma.stack.findUnique({
    where: { id: stackId },
    include: {
      // ... includes
    },
  });

  return NextResponse.json({
    stack,
    permissions: perms,
  });
}
```

### 1.5.6 Visibility Selector Component

```tsx
// components/stack/VisibilitySelector.tsx

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  GlobeIcon, 
  LockIcon, 
  UsersIcon, 
  LinkIcon,
  AlertTriangleIcon 
} from "lucide-react";

type Visibility = "public_open" | "public_closed" | "private" | "unlisted";

interface VisibilitySelectorProps {
  value: Visibility;
  onChange: (value: Visibility) => void;
  disabled?: boolean;
}

const visibilityOptions: {
  value: Visibility;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  warning?: string;
}[] = [
  {
    value: "public_open",
    label: "Public Open",
    description: "Anyone can view and add blocks",
    icon: GlobeIcon,
    warning: "Anyone can add content to this stack",
  },
  {
    value: "public_closed",
    label: "Public",
    description: "Anyone can view; only collaborators can add",
    icon: UsersIcon,
  },
  {
    value: "unlisted",
    label: "Unlisted",
    description: "Only people with the link can view",
    icon: LinkIcon,
  },
  {
    value: "private",
    label: "Private",
    description: "Only you and collaborators can access",
    icon: LockIcon,
  },
];

export function VisibilitySelector({
  value,
  onChange,
  disabled,
}: VisibilitySelectorProps) {
  const selected = visibilityOptions.find((o) => o.value === value);

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              {selected && <selected.icon className="h-4 w-4" />}
              <span>{selected?.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {visibilityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <option.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected?.warning && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangleIcon className="h-3.5 w-3.5" />
          {selected.warning}
        </div>
      )}
    </div>
  );
}
```

### 1.5.7 Search/Discovery Filtering

```typescript
// lib/stacks/search.ts

import { prisma } from "@/lib/prismaclient";

export async function searchPublicStacks(query: string, limit = 20) {
  return prisma.stack.findMany({
    where: {
      // Only include discoverable stacks
      visibility: { in: ["public_open", "public_closed"] },
      // Exclude unlisted and private
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { created_at: "desc" },
    include: {
      owner: { select: { id: true, name: true, username: true, avatar: true } },
      _count: { select: { items: true, subscribers: true } },
    },
  });
}
```

### 1.5.8 Acceptance Criteria

| Criterion | Test |
|-----------|------|
| public_open allows anyone to add | Non-collaborator adds block → success |
| public_closed restricts adding | Non-collaborator adds block → forbidden |
| private hides from non-collaborators | Non-collaborator views stack → 404 |
| unlisted accessible via link | Direct link works; not in search results |
| Migration preserves behavior | is_public=true → public_closed, is_public=false → private |
| Visibility selector works | Change visibility → API updates correctly |

---

## 1.6 Export Functionality

**Priority**: P2 — Trust & portability  
**Estimated Effort**: 2-3 days  
**Risk Level**: Low  
**Dependencies**: None

### 1.6.1 Problem Statement

Users need to be able to export their stacks for:
- **Backup**: Offline copies of curated content
- **Portability**: Move data to other tools
- **Academic use**: BibTeX for papers, Zotero import
- **Trust**: "I can leave anytime" reduces platform lock-in anxiety

### 1.6.2 Export Formats

| Format | Contents | Use Case |
|--------|----------|----------|
| **ZIP** | All files + `manifest.json` | Full backup |
| **Markdown** | One `.md` per block with links | Documentation, notes |
| **BibTeX** | All Sources in BibTeX format | Academic papers |
| **CSL-JSON** | All Sources in CSL format | Zotero/Mendeley import |
| **JSON** | Stack metadata + items | API/automation |

### 1.6.3 Export API

```typescript
// app/api/stacks/[id]/export/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { canViewStack } from "@/lib/stacks/permissions";
import { generateZipExport } from "@/lib/stacks/export/zip";
import { generateMarkdownExport } from "@/lib/stacks/export/markdown";
import { generateBibTeXExport } from "@/lib/stacks/export/bibtex";
import { generateCSLExport } from "@/lib/stacks/export/csl";
import { generateJSONExport } from "@/lib/stacks/export/json";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  const stackId = params.id;
  const format = req.nextUrl.searchParams.get("format") || "json";

  // Permission check
  const canView = await canViewStack(stackId, userId ? BigInt(userId) : null);
  if (!canView) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch stack with all data needed for export
  const stack = await prisma.stack.findUnique({
    where: { id: stackId },
    include: {
      owner: { select: { id: true, name: true, username: true } },
      items: {
        where: { kind: "block" },
        orderBy: { position: "asc" },
        include: {
          block: {
            include: {
              sources: true,
            },
          },
          addedBy: { select: { name: true, username: true } },
        },
      },
    },
  });

  if (!stack) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Collect all sources from blocks
  const sources = stack.items
    .flatMap((item) => item.block?.sources ?? [])
    .filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i); // Dedupe

  switch (format) {
    case "zip":
      const zipBuffer = await generateZipExport(stack);
      return new NextResponse(zipBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${stack.slug || stack.id}.zip"`,
        },
      });

    case "md":
    case "markdown":
      const markdown = generateMarkdownExport(stack);
      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="${stack.slug || stack.id}.md"`,
        },
      });

    case "bib":
    case "bibtex":
      const bibtex = generateBibTeXExport(sources);
      return new NextResponse(bibtex, {
        headers: {
          "Content-Type": "application/x-bibtex",
          "Content-Disposition": `attachment; filename="${stack.slug || stack.id}.bib"`,
        },
      });

    case "csl":
    case "csl-json":
      const csl = generateCSLExport(sources);
      return NextResponse.json(csl, {
        headers: {
          "Content-Disposition": `attachment; filename="${stack.slug || stack.id}.json"`,
        },
      });

    case "json":
    default:
      const json = generateJSONExport(stack);
      return NextResponse.json(json, {
        headers: {
          "Content-Disposition": `attachment; filename="${stack.slug || stack.id}.json"`,
        },
      });
  }
}
```

### 1.6.4 Export Generators

#### BibTeX Export

```typescript
// lib/stacks/export/bibtex.ts

interface Source {
  id: string;
  kind: string;
  title: string | null;
  authorsJson: any;
  year: number | null;
  doi: string | null;
  url: string | null;
  container: string | null;
  publisher: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
}

export function generateBibTeXExport(sources: Source[]): string {
  const entries = sources.map((source) => {
    const key = generateBibKey(source);
    const type = mapKindToBibType(source.kind);
    const fields: string[] = [];

    if (source.title) {
      fields.push(`  title = {${escapeBibTeX(source.title)}}`);
    }
    
    if (source.authorsJson) {
      const authors = formatAuthors(source.authorsJson);
      if (authors) {
        fields.push(`  author = {${authors}}`);
      }
    }
    
    if (source.year) {
      fields.push(`  year = {${source.year}}`);
    }
    
    if (source.container) {
      const containerField = type === "article" ? "journal" : "booktitle";
      fields.push(`  ${containerField} = {${escapeBibTeX(source.container)}}`);
    }
    
    if (source.publisher) {
      fields.push(`  publisher = {${escapeBibTeX(source.publisher)}}`);
    }
    
    if (source.volume) {
      fields.push(`  volume = {${source.volume}}`);
    }
    
    if (source.issue) {
      fields.push(`  number = {${source.issue}}`);
    }
    
    if (source.pages) {
      fields.push(`  pages = {${source.pages}}`);
    }
    
    if (source.doi) {
      fields.push(`  doi = {${source.doi}}`);
    }
    
    if (source.url) {
      fields.push(`  url = {${source.url}}`);
    }

    return `@${type}{${key},\n${fields.join(",\n")}\n}`;
  });

  return entries.join("\n\n");
}

function generateBibKey(source: Source): string {
  const authors = source.authorsJson as Array<{ family?: string }> | null;
  const firstAuthor = authors?.[0]?.family || "Unknown";
  const year = source.year || "nd";
  const titleWord = source.title?.split(" ")[0] || "untitled";
  return `${firstAuthor}${year}${titleWord}`.replace(/[^a-zA-Z0-9]/g, "");
}

function mapKindToBibType(kind: string): string {
  const map: Record<string, string> = {
    article: "article",
    book: "book",
    web: "misc",
    dataset: "misc",
    video: "misc",
    other: "misc",
  };
  return map[kind] || "misc";
}

function formatAuthors(authorsJson: any): string | null {
  if (!Array.isArray(authorsJson)) return null;
  return authorsJson
    .map((a: { family?: string; given?: string }) => {
      if (a.family && a.given) return `${a.family}, ${a.given}`;
      return a.family || a.given || "";
    })
    .filter(Boolean)
    .join(" and ");
}

function escapeBibTeX(str: string): string {
  return str
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[{}]/g, "\\$&")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/\$/g, "\\$");
}
```

#### Markdown Export

```typescript
// lib/stacks/export/markdown.ts

interface StackWithItems {
  name: string;
  description: string | null;
  owner: { name: string; username: string };
  items: Array<{
    block: {
      blockType: string;
      title: string | null;
      textContent: string | null;
      linkUrl: string | null;
      linkDescription: string | null;
      file_url: string | null;
    } | null;
    note: string | null;
  }>;
}

export function generateMarkdownExport(stack: StackWithItems): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${stack.name}`);
  lines.push("");
  if (stack.description) {
    lines.push(`> ${stack.description}`);
    lines.push("");
  }
  lines.push(`*Curated by ${stack.owner.name} (@${stack.owner.username})*`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Items
  for (const item of stack.items) {
    if (!item.block) continue;
    const block = item.block;

    switch (block.blockType) {
      case "pdf":
        lines.push(`## 📄 ${block.title || "Untitled PDF"}`);
        if (block.file_url) {
          lines.push(`- [Download PDF](${block.file_url})`);
        }
        break;

      case "link":
        lines.push(`## 🔗 ${block.title || block.linkUrl}`);
        if (block.linkUrl) {
          lines.push(`- URL: ${block.linkUrl}`);
        }
        if (block.linkDescription) {
          lines.push(`- ${block.linkDescription}`);
        }
        break;

      case "text":
        lines.push(`## 📝 ${block.title || "Note"}`);
        if (block.textContent) {
          lines.push("");
          lines.push(block.textContent);
        }
        break;

      default:
        lines.push(`## ${block.title || "Untitled"}`);
    }

    if (item.note) {
      lines.push("");
      lines.push(`> 💬 *${item.note}*`);
    }

    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Footer
  lines.push(`*Exported from Mesh on ${new Date().toISOString().split("T")[0]}*`);

  return lines.join("\n");
}
```

### 1.6.5 Export Button Component

```tsx
// components/stack/ExportButton.tsx

"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  DownloadIcon, 
  FileArchiveIcon, 
  FileTextIcon, 
  BookOpenIcon,
  FileJsonIcon 
} from "lucide-react";

interface ExportButtonProps {
  stackId: string;
  stackName: string;
}

export function ExportButton({ stackId, stackName }: ExportButtonProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: string) => {
    setExporting(format);
    
    try {
      const res = await fetch(`/api/stacks/${stackId}/export?format=${format}`);
      
      if (!res.ok) {
        throw new Error("Export failed");
      }

      // Get filename from Content-Disposition header or generate one
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `${stackName}.${format}`;

      // Download the file
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="btnv2 btnv2--ghost btnv2--sm flex items-center gap-1.5">
          <DownloadIcon className="h-4 w-4" />
          Export
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleExport("zip")}
          disabled={exporting !== null}
        >
          <FileArchiveIcon className="h-4 w-4 mr-2" />
          Download ZIP
          {exporting === "zip" && <span className="ml-auto">...</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("md")}
          disabled={exporting !== null}
        >
          <FileTextIcon className="h-4 w-4 mr-2" />
          Markdown
          {exporting === "md" && <span className="ml-auto">...</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("bibtex")}
          disabled={exporting !== null}
        >
          <BookOpenIcon className="h-4 w-4 mr-2" />
          BibTeX
          {exporting === "bibtex" && <span className="ml-auto">...</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("json")}
          disabled={exporting !== null}
        >
          <FileJsonIcon className="h-4 w-4 mr-2" />
          JSON
          {exporting === "json" && <span className="ml-auto">...</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 1.6.6 Acceptance Criteria

| Criterion | Test |
|-----------|------|
| ZIP contains all files | Export stack with 3 PDFs → ZIP has 3 PDFs + manifest |
| Markdown readable | Export → open in any markdown viewer → looks correct |
| BibTeX valid | Import into Zotero/Mendeley → parses correctly |
| JSON complete | Export → contains all stack metadata and items |
| Large stacks handled | Export 100+ item stack → completes (may need async) |

---

## Phase 1 Completion Checklist

Before proceeding to Phase 2, verify:

- [ ] **1.1 StackItem**: Migration complete, dual-write removed, old fields deprecated
- [ ] **1.2 Block Types**: Link and text blocks fully functional with processing
- [ ] **1.3 Connect UI**: Modal and contexts panel working
- [ ] **1.4 Stack Embeds**: Stacks can contain other stacks without cycles
- [ ] **1.5 Visibility**: All four modes working with correct permission checks
- [ ] **1.6 Export**: At least ZIP and BibTeX exports functional

**Estimated Phase 1 Duration**: 4-5 weeks

---
