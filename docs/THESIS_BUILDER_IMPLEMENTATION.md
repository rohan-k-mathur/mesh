# Thesis Builder: Implementation Examples

**Companion to**: THESIS_BUILDER_PROPOSAL.md and THESIS_BUILDER_ARCHITECTURE.md  
**Purpose**: Concrete code patterns and component examples

---

## 1. Schema Migrations (Prisma)

### Brief Model (Complete)

```prisma
// prisma/schema.prisma

model Brief {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  
  // Core structure
  thesisClaimId   String
  thesisClaim     Claim    @relation("BriefThesis", fields: [thesisClaimId], references: [id], onDelete: Restrict)
  
  // Components
  prongs          BriefProng[]
  sections        BriefSection[]
  
  // Context
  deliberationId  String?
  deliberation    Deliberation? @relation(fields: [deliberationId], references: [id], onDelete: SetNull)
  
  authorId        String
  author          User     @relation(fields: [authorId], references: [id])
  
  // Versioning
  status          BriefStatus  @default(DRAFT)
  version         Int          @default(1)
  publishedAt     DateTime?
  
  // Metadata
  template        BriefTemplate @default(GENERAL)
  summary         String?
  meta            Json?
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([deliberationId])
  @@index([authorId])
  @@index([thesisClaimId])
  @@index([status, publishedAt])
}

model BriefProng {
  id          String  @id @default(cuid())
  briefId     String
  brief       Brief   @relation(fields: [briefId], references: [id], onDelete: Cascade)
  
  order       Int
  title       String
  role        ProngRole @default(SUPPORT)
  
  // Optional sub-claim for this prong
  mainClaimId String?
  mainClaim   Claim?   @relation(fields: [mainClaimId], references: [id], onDelete: SetNull)
  
  // Argument chain
  arguments   BriefProngArgument[]
  
  // Prose framing (TipTap JSON)
  introduction Json?
  conclusion   Json?
  
  meta        Json?
  
  @@index([briefId, order])
  @@index([mainClaimId])
}

model BriefProngArgument {
  id          String  @id @default(cuid())
  prongId     String
  prong       BriefProng @relation(fields: [prongId], references: [id], onDelete: Cascade)
  
  argumentId  String
  argument    Argument @relation(fields: [argumentId], references: [id], onDelete: Restrict)
  
  order       Int
  role        ArgumentRole @default(PREMISE)
  note        String?  // Optional annotation
  
  @@unique([prongId, argumentId])
  @@index([prongId, order])
  @@index([argumentId])
}

model BriefSection {
  id          String  @id @default(cuid())
  briefId     String
  brief       Brief   @relation(fields: [briefId], references: [id], onDelete: Cascade)
  
  order       Int
  sectionType BriefSectionType
  title       String?
  
  // TipTap JSON content
  content     Json?
  
  @@index([briefId, order])
}

// Enums
enum BriefStatus {
  DRAFT
  SUBMITTED
  PUBLISHED
  ARCHIVED
}

enum BriefTemplate {
  LEGAL_DEFENSE
  POLICY_CASE
  ACADEMIC_THESIS
  GENERAL
}

enum ProngRole {
  SUPPORT   // Affirmative reasoning
  REBUT     // Counter opposing argument
  PREEMPT   // Address anticipated objection
}

enum ArgumentRole {
  PREMISE          // Establishes premise
  INFERENCE        // Links premises to conclusion
  COUNTER_RESPONSE // Responds to counter
}

enum BriefSectionType {
  INTRODUCTION
  BACKGROUND
  LEGAL_STANDARD
  CONCLUSION
  APPENDIX
}

// Add backlinks to existing models
model Claim {
  // ... existing fields ...
  
  // NEW: Brief relations
  briefsAsThesis BriefProng[] @relation("BriefThesis")
  prongClaims    BriefProng[]
}

model Argument {
  // ... existing fields ...
  
  // NEW: Brief relation
  briefProngArguments BriefProngArgument[]
}
```

### TheoryWork Enhancement

```prisma
// Enhance existing TheoryWork model

model TheoryWork {
  // ... existing fields ...
  
  // NEW: Sectioned composition
  sections  TheorySection[]
}

model TheorySection {
  id          String  @id @default(cuid())
  workId      String
  work        TheoryWork @relation(fields: [workId], references: [id], onDelete: Cascade)
  
  order       Int
  title       String?
  sectionType SectionType
  role        SectionRole?
  
  // For prose sections (TipTap JSON)
  content     Json?
  
  // For formal sections (references to primitives)
  claimIds    String[]  // Array of claim IDs
  argumentIds String[]  // Array of argument IDs
  
  meta        Json?
  
  @@index([workId, order])
}

enum SectionType {
  PROSE           // Free-form rich text
  CLAIM_BLOCK     // Display verified claims
  ARGUMENT_BLOCK  // Display arguments with schemes
  EVIDENCE        // Citations, sources
  DISCUSSION      // Analysis
}

enum SectionRole {
  THESIS       // Main claim
  PREMISE      // Supporting reason
  EXCEPTION    // Qualification
  COUNTER      // Objection + response
  SYNTHESIS    // Integration
}
```

---

## 2. API Endpoints

### Brief CRUD

```typescript
// app/api/briefs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const deliberationId = sp.get("deliberationId");
  const authorId = sp.get("authorId");
  const status = sp.get("status");
  
  const where: any = {};
  if (deliberationId) where.deliberationId = deliberationId;
  if (authorId) where.authorId = authorId;
  if (status) where.status = status;
  
  const briefs = await prisma.brief.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      template: true,
      thesisClaimId: true,
      thesisClaim: {
        select: { id: true, text: true }
      },
      authorId: true,
      deliberationId: true,
      publishedAt: true,
      createdAt: true,
      _count: {
        select: {
          prongs: true,
          sections: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });
  
  return NextResponse.json({ briefs });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const body = await req.json();
  const { title, thesisClaimId, deliberationId, template } = body;
  
  if (!title || !thesisClaimId) {
    return NextResponse.json(
      { error: "title and thesisClaimId required" },
      { status: 400 }
    );
  }
  
  // Generate slug
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${nanoid(6)}`;
  
  const brief = await prisma.brief.create({
    data: {
      slug,
      title,
      thesisClaimId,
      deliberationId,
      template: template || "GENERAL",
      authorId: userId,
    },
    include: {
      thesisClaim: {
        select: { id: true, text: true }
      }
    }
  });
  
  return NextResponse.json({ brief }, { status: 201 });
}
```

```typescript
// app/api/briefs/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const brief = await prisma.brief.findUnique({
    where: { id: params.id },
    include: {
      thesisClaim: {
        select: {
          id: true,
          text: true,
          ClaimLabel: {
            select: { label: true, semantics: true }
          }
        }
      },
      prongs: {
        orderBy: { order: "asc" },
        include: {
          mainClaim: {
            select: { id: true, text: true }
          },
          arguments: {
            orderBy: { order: "asc" },
            include: {
              argument: {
                select: {
                  id: true,
                  text: true,
                  schemeId: true,
                  scheme: {
                    select: { name: true, key: true }
                  },
                  conclusionClaimId: true,
                  conclusion: {
                    select: { id: true, text: true }
                  },
                  premises: {
                    select: {
                      claim: {
                        select: {
                          id: true,
                          text: true,
                          ClaimLabel: {
                            select: { label: true }
                          }
                        }
                      }
                    }
                  },
                  _count: {
                    select: {
                      cqStatuses: true  // Total CQs
                    }
                  }
                }
              }
            }
          }
        }
      },
      sections: {
        orderBy: { order: "asc" }
      },
      author: {
        select: {
          id: true,
          email: true,
          // ... other user fields
        }
      }
    }
  });
  
  if (!brief) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  return NextResponse.json({ brief });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const brief = await prisma.brief.findUnique({
    where: { id: params.id },
    select: { authorId: true }
  });
  
  if (!brief || brief.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  const body = await req.json();
  const { title, status, summary, meta } = body;
  
  const updated = await prisma.brief.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(status && { status }),
      ...(summary && { summary }),
      ...(meta && { meta }),
    }
  });
  
  return NextResponse.json({ brief: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const brief = await prisma.brief.findUnique({
    where: { id: params.id },
    select: { authorId: true }
  });
  
  if (!brief || brief.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  await prisma.brief.delete({
    where: { id: params.id }
  });
  
  return NextResponse.json({ ok: true });
}
```

### Prong Management

```typescript
// app/api/briefs/[id]/prongs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const brief = await prisma.brief.findUnique({
    where: { id: params.id },
    select: { authorId: true, _count: { select: { prongs: true } } }
  });
  
  if (!brief || brief.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  const body = await req.json();
  const { title, role, mainClaimId, introduction, conclusion } = body;
  
  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  
  const prong = await prisma.briefProng.create({
    data: {
      briefId: params.id,
      order: brief._count.prongs,  // Append to end
      title,
      role: role || "SUPPORT",
      mainClaimId,
      introduction,
      conclusion,
    },
    include: {
      mainClaim: {
        select: { id: true, text: true }
      }
    }
  });
  
  return NextResponse.json({ prong }, { status: 201 });
}
```

```typescript
// app/api/briefs/[id]/prongs/[prongId]/arguments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; prongId: string } }
) {
  const userId = await getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Verify ownership via brief
  const prong = await prisma.briefProng.findUnique({
    where: { id: params.prongId },
    select: {
      brief: { select: { authorId: true } },
      _count: { select: { arguments: true } }
    }
  });
  
  if (!prong || prong.brief.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  const body = await req.json();
  const { argumentId, role, note } = body;
  
  if (!argumentId) {
    return NextResponse.json(
      { error: "argumentId required" },
      { status: 400 }
    );
  }
  
  const prongArg = await prisma.briefProngArgument.create({
    data: {
      prongId: params.prongId,
      argumentId,
      order: prong._count.arguments,  // Append
      role: role || "PREMISE",
      note,
    },
    include: {
      argument: {
        select: {
          id: true,
          text: true,
          scheme: { select: { name: true } },
          conclusion: { select: { text: true } }
        }
      }
    }
  });
  
  return NextResponse.json({ prongArgument: prongArg }, { status: 201 });
}

// DELETE to remove argument from prong
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; prongId: string } }
) {
  const userId = await getCurrentUserId(req);
  const sp = req.nextUrl.searchParams;
  const prongArgumentId = sp.get("prongArgumentId");
  
  if (!prongArgumentId) {
    return NextResponse.json(
      { error: "prongArgumentId query param required" },
      { status: 400 }
    );
  }
  
  // Verify ownership
  const prongArg = await prisma.briefProngArgument.findUnique({
    where: { id: prongArgumentId },
    select: {
      prong: {
        select: {
          brief: { select: { authorId: true } }
        }
      }
    }
  });
  
  if (!prongArg || prongArg.prong.brief.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  await prisma.briefProngArgument.delete({
    where: { id: prongArgumentId }
  });
  
  return NextResponse.json({ ok: true });
}
```

### Publish Brief

```typescript
// app/api/briefs/[id]/publish/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const brief = await prisma.brief.findUnique({
    where: { id: params.id },
    select: {
      authorId: true,
      status: true,
      _count: {
        select: {
          prongs: true,
          sections: true,
        }
      }
    }
  });
  
  if (!brief || brief.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  if (brief.status === "PUBLISHED") {
    return NextResponse.json(
      { error: "Already published" },
      { status: 400 }
    );
  }
  
  if (brief._count.prongs === 0) {
    return NextResponse.json(
      { error: "Brief must have at least one prong" },
      { status: 400 }
    );
  }
  
  const updated = await prisma.brief.update({
    where: { id: params.id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      version: { increment: 1 },
    },
    select: { id: true, slug: true, status: true, publishedAt: true }
  });
  
  return NextResponse.json({ brief: updated });
}
```

---

## 3. React Components

### BriefComposer (Top-Level)

```tsx
// components/brief/BriefComposer.tsx

"use client";

import * as React from "react";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { ProngEditor } from "./ProngEditor";
import { SectionEditor } from "./SectionEditor";
import { ThesisSelector } from "./ThesisSelector";
import { BriefTemplateSelector } from "./BriefTemplateSelector";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
  briefId: string;
  onPublished?: (slug: string) => void;
}

export function BriefComposer({ briefId, onPublished }: Props) {
  const { data, error } = useSWR(`/api/briefs/${briefId}`, fetcher);
  const [publishing, setPublishing] = useState(false);
  
  const brief = data?.brief;
  
  if (error) return <div>Error loading brief</div>;
  if (!brief) return <div>Loading...</div>;
  
  async function handlePublish() {
    setPublishing(true);
    try {
      const res = await fetch(`/api/briefs/${briefId}/publish`, {
        method: "POST",
      });
      const { brief: updated } = await res.json();
      mutate(`/api/briefs/${briefId}`);
      onPublished?.(updated.slug);
    } catch (e: any) {
      alert(e.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  }
  
  async function addProng() {
    const title = prompt("Prong title:");
    if (!title) return;
    
    await fetch(`/api/briefs/${briefId}/prongs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, role: "SUPPORT" }),
    });
    
    mutate(`/api/briefs/${briefId}`);
  }
  
  async function addSection(type: string) {
    await fetch(`/api/briefs/${briefId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionType: type }),
    });
    
    mutate(`/api/briefs/${briefId}`);
  }
  
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{brief.title}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">
            Status: {brief.status}
          </span>
          {brief.status === "DRAFT" && (
            <button
              className="btnv2 btnv2--sm"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? "Publishing..." : "Publish"}
            </button>
          )}
        </div>
      </div>
      
      {/* Template */}
      <BriefTemplateSelector
        briefId={briefId}
        currentTemplate={brief.template}
      />
      
      {/* Thesis */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="text-sm font-medium mb-2">Thesis</h3>
        <ThesisSelector
          briefId={briefId}
          currentClaim={brief.thesisClaim}
        />
      </div>
      
      {/* Sections (Intro, Background, etc.) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Sections</h3>
          <button
            className="btnv2--ghost btnv2--sm"
            onClick={() => addSection("INTRODUCTION")}
          >
            + Add Section
          </button>
        </div>
        {brief.sections.map((section: any) => (
          <SectionEditor key={section.id} section={section} briefId={briefId} />
        ))}
      </div>
      
      {/* Prongs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Prongs</h3>
          <button className="btnv2--ghost btnv2--sm" onClick={addProng}>
            + Add Prong
          </button>
        </div>
        {brief.prongs.map((prong: any, idx: number) => (
          <ProngEditor
            key={prong.id}
            prong={prong}
            briefId={briefId}
            index={idx + 1}
          />
        ))}
      </div>
    </div>
  );
}
```

### ProngEditor

```tsx
// components/brief/ProngEditor.tsx

"use client";

import * as React from "react";
import { useState } from "react";
import { mutate } from "swr";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ArgumentPicker } from "./ArgumentPicker";
import { ArgumentCard } from "../arguments/ArgumentCard";

interface Props {
  prong: any;
  briefId: string;
  index: number;
}

export function ProngEditor({ prong, briefId, index }: Props) {
  const [adding, setAdding] = useState(false);
  
  const introEditor = useEditor({
    extensions: [StarterKit],
    content: prong.introduction || { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: ({ editor }) => {
      // Debounced save
      debouncedSave("introduction", editor.getJSON());
    },
  });
  
  const conclusionEditor = useEditor({
    extensions: [StarterKit],
    content: prong.conclusion || { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: ({ editor }) => {
      debouncedSave("conclusion", editor.getJSON());
    },
  });
  
  const debouncedSave = React.useMemo(
    () => {
      let timeout: NodeJS.Timeout;
      return (field: string, value: any) => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          await fetch(`/api/briefs/${briefId}/prongs/${prong.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value }),
          });
        }, 1000);
      };
    },
    [briefId, prong.id]
  );
  
  async function addArgument(argumentId: string) {
    await fetch(`/api/briefs/${briefId}/prongs/${prong.id}/arguments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ argumentId, role: "PREMISE" }),
    });
    
    mutate(`/api/briefs/${briefId}`);
    setAdding(false);
  }
  
  async function removeArgument(prongArgumentId: string) {
    await fetch(
      `/api/briefs/${briefId}/prongs/${prong.id}/arguments?prongArgumentId=${prongArgumentId}`,
      { method: "DELETE" }
    );
    
    mutate(`/api/briefs/${briefId}`);
  }
  
  return (
    <div className="rounded-lg border bg-white p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-neutral-500">
            Prong {index}
          </span>
          <h3 className="text-lg font-semibold">{prong.title}</h3>
          <span className="text-xs text-neutral-600">Role: {prong.role}</span>
        </div>
        <button className="text-xs text-red-600">Delete Prong</button>
      </div>
      
      {/* Introduction */}
      <div>
        <label className="text-xs font-medium text-neutral-700">
          Introduction
        </label>
        <div className="mt-1 rounded border bg-neutral-50 p-2">
          <EditorContent editor={introEditor} />
        </div>
      </div>
      
      {/* Argument Chain */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-700">
            Argument Chain
          </label>
          <button
            className="btnv2--ghost btnv2--sm"
            onClick={() => setAdding(true)}
          >
            + Add Argument
          </button>
        </div>
        
        {prong.arguments.length === 0 && (
          <div className="text-xs text-neutral-500 italic">
            No arguments yet. Add arguments to build your case.
          </div>
        )}
        
        {prong.arguments.map((prongArg: any, idx: number) => (
          <div key={prongArg.id} className="relative">
            <div className="absolute left-0 top-0 -ml-6 flex h-full items-center">
              <span className="text-xs font-medium text-neutral-400">
                {idx + 1}
              </span>
            </div>
            <ArgumentCard
              argument={prongArg.argument}
              compact
              actions={
                <button
                  className="text-xs text-red-600"
                  onClick={() => removeArgument(prongArg.id)}
                >
                  Remove
                </button>
              }
            />
          </div>
        ))}
      </div>
      
      {/* Argument Picker Modal */}
      {adding && (
        <ArgumentPicker
          deliberationId={prong.brief.deliberationId}
          onSelect={addArgument}
          onClose={() => setAdding(false)}
        />
      )}
      
      {/* Conclusion */}
      <div>
        <label className="text-xs font-medium text-neutral-700">
          Conclusion
        </label>
        <div className="mt-1 rounded border bg-neutral-50 p-2">
          <EditorContent editor={conclusionEditor} />
        </div>
      </div>
    </div>
  );
}
```

### ArgumentCard (Enhanced for Brief Context)

```tsx
// components/arguments/ArgumentCard.tsx (enhanced)

"use client";

import * as React from "react";
import { ClaimChip } from "../claims/ClaimChip";

interface Props {
  argument: any;
  compact?: boolean;
  actions?: React.ReactNode;
}

export function ArgumentCard({ argument, compact, actions }: Props) {
  if (compact) {
    // Compact view for briefs
    return (
      <div className="rounded border bg-white p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-xs text-neutral-500">
              {argument.scheme?.name || "Argument"}
            </div>
            <div className="text-sm font-medium mt-1">
              {argument.conclusion?.text || argument.text}
            </div>
          </div>
          {actions}
        </div>
        
        <div>
          <div className="text-xs text-neutral-600 mb-1">Premises:</div>
          <div className="flex flex-wrap gap-1">
            {argument.premises.map((p: any) => (
              <ClaimChip
                key={p.claim.id}
                claim={p.claim}
                showLabel
              />
            ))}
          </div>
        </div>
        
        {argument._count?.cqStatuses > 0 && (
          <div className="text-xs text-neutral-500">
            CQs: {argument._count.cqStatuses} total
          </div>
        )}
      </div>
    );
  }
  
  // Full view (existing implementation)
  return (
    <div className="rounded-lg border bg-white p-4">
      {/* ... existing full ArgumentCard implementation ... */}
    </div>
  );
}
```

### BriefRenderer (Public View)

```tsx
// components/brief/BriefRenderer.tsx

"use client";

import * as React from "react";
import { ArgumentCard } from "../arguments/ArgumentCard";
import { ClaimBlock } from "../claims/ClaimBlock";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

interface Props {
  brief: any;
}

export function BriefRenderer({ brief }: Props) {
  return (
    <article className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow">
      {/* Title */}
      <header className="border-b pb-6 mb-8">
        <div className="text-xs text-neutral-500 mb-2">
          {brief.template.replace(/_/g, " ")}
        </div>
        <h1 className="text-3xl font-bold">{brief.title}</h1>
        <div className="text-sm text-neutral-600 mt-2">
          By {brief.author.email} • Published{" "}
          {new Date(brief.publishedAt).toLocaleDateString()}
        </div>
      </header>
      
      {/* Thesis */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Thesis</h2>
        <ClaimBlock claim={brief.thesisClaim} />
      </section>
      
      {/* Sections (Intro, etc.) */}
      {brief.sections.map((section: any) => (
        <section key={section.id} className="mb-8">
          {section.title && (
            <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
          )}
          {section.content && (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: generateHTML(section.content, [StarterKit]),
              }}
            />
          )}
        </section>
      ))}
      
      {/* Prongs */}
      {brief.prongs.map((prong: any, idx: number) => (
        <section key={prong.id} className="mb-12">
          <h2 className="text-xl font-semibold mb-2">
            {idx + 1}. {prong.title}
          </h2>
          <div className="text-xs text-neutral-500 mb-4">
            Role: {prong.role}
          </div>
          
          {/* Introduction */}
          {prong.introduction && (
            <div
              className="prose prose-sm max-w-none mb-6"
              dangerouslySetInnerHTML={{
                __html: generateHTML(prong.introduction, [StarterKit]),
              }}
            />
          )}
          
          {/* Argument Chain */}
          {prong.arguments.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-medium text-neutral-700">
                Argument Chain
              </h3>
              {prong.arguments.map((prongArg: any, argIdx: number) => (
                <div key={prongArg.id}>
                  <div className="text-xs text-neutral-500 mb-1">
                    Step {argIdx + 1}
                  </div>
                  <ArgumentCard argument={prongArg.argument} />
                </div>
              ))}
            </div>
          )}
          
          {/* Conclusion */}
          {prong.conclusion && (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: generateHTML(prong.conclusion, [StarterKit]),
              }}
            />
          )}
        </section>
      ))}
      
      {/* Footer */}
      <footer className="border-t pt-6 mt-12">
        <div className="text-xs text-neutral-500">
          Brief ID: {brief.id} • Version {brief.version}
        </div>
      </footer>
    </article>
  );
}
```

---

## 4. Integration Points

### "Promote to Brief" Button on ClaimMiniMap

```tsx
// components/claims/ClaimMiniMap.tsx (add this)

async function handlePromoteToBrief() {
  // Create draft brief with this claim as thesis
  const res = await fetch("/api/briefs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: `Brief: ${claim.text.slice(0, 50)}...`,
      thesisClaimId: claim.id,
      deliberationId: claim.deliberationId,
      template: "GENERAL",
    }),
  });
  
  const { brief } = await res.json();
  
  // Navigate to brief composer
  router.push(`/brief/${brief.id}/edit`);
}

// In render:
<button
  className="btnv2--ghost btnv2--sm"
  onClick={handlePromoteToBrief}
>
  Promote to Brief
</button>
```

### "Cite in Brief" Action on ArgumentCard

```tsx
// components/arguments/ArgumentCard.tsx (add to actions menu)

<Popover>
  <PopoverTrigger>
    <button className="btnv2--ghost btnv2--sm">
      Add to Brief
    </button>
  </PopoverTrigger>
  <PopoverContent>
    <div className="space-y-2">
      <div className="text-sm font-medium">Select Brief</div>
      {userBriefs.map(brief => (
        <button
          key={brief.id}
          className="w-full text-left px-2 py-1 rounded hover:bg-neutral-100"
          onClick={() => addToBrief(brief.id)}
        >
          {brief.title}
        </button>
      ))}
      <button
        className="w-full text-left px-2 py-1 rounded text-blue-600"
        onClick={createNewBrief}
      >
        + Create New Brief
      </button>
    </div>
  </PopoverContent>
</Popover>
```

---

## 5. Export (PDF Generation)

```typescript
// app/api/briefs/[id]/export/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Fetch full brief data (same as BriefRenderer)
  const brief = await prisma.brief.findUnique({
    where: { id: params.id },
    include: {
      // ... (same includes as GET /api/briefs/[id])
    }
  });
  
  if (!brief) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  // Generate Markdown
  const md: string[] = [];
  
  md.push(`# ${brief.title}\n`);
  md.push(`**${brief.template.replace(/_/g, " ")}**\n`);
  md.push(`Author: ${brief.author.email}\n`);
  md.push(`Published: ${new Date(brief.publishedAt).toLocaleDateString()}\n\n`);
  
  md.push(`## Thesis\n`);
  md.push(`${brief.thesisClaim.text}\n`);
  if (brief.thesisClaim.ClaimLabel) {
    md.push(`*Label: ${brief.thesisClaim.ClaimLabel.label} (${brief.thesisClaim.ClaimLabel.semantics})*\n\n`);
  }
  
  // Sections
  for (const section of brief.sections) {
    if (section.title) md.push(`## ${section.title}\n`);
    if (section.content) {
      const html = generateHTML(section.content, [StarterKit]);
      // Convert HTML to Markdown (or just include HTML)
      md.push(`${html}\n\n`);
    }
  }
  
  // Prongs
  for (let i = 0; i < brief.prongs.length; i++) {
    const prong = brief.prongs[i];
    md.push(`## ${i + 1}. ${prong.title}\n`);
    md.push(`*Role: ${prong.role}*\n\n`);
    
    if (prong.introduction) {
      const html = generateHTML(prong.introduction, [StarterKit]);
      md.push(`${html}\n\n`);
    }
    
    if (prong.arguments.length > 0) {
      md.push(`### Argument Chain\n\n`);
      for (let j = 0; j < prong.arguments.length; j++) {
        const prongArg = prong.arguments[j];
        const arg = prongArg.argument;
        md.push(`**Step ${j + 1}: ${arg.scheme?.name || "Argument"}**\n\n`);
        md.push(`Conclusion: ${arg.conclusion.text}\n\n`);
        md.push(`Premises:\n`);
        for (const p of arg.premises) {
          md.push(`- ${p.claim.text}`);
          if (p.claim.ClaimLabel) {
            md.push(` [${p.claim.ClaimLabel.label}]`);
          }
          md.push(`\n`);
        }
        md.push(`\n`);
      }
    }
    
    if (prong.conclusion) {
      const html = generateHTML(prong.conclusion, [StarterKit]);
      md.push(`${html}\n\n`);
    }
  }
  
  const markdown = md.join("");
  
  // Return as downloadable Markdown
  // (In production, you'd use a tool like Pandoc to convert to PDF)
  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${brief.slug}.md"`,
    },
  });
}
```

---

## 6. UI Patterns Summary

### Key Components Built

✅ `BriefComposer` - Top-level composition interface  
✅ `ProngEditor` - Prong with argument chain + prose  
✅ `ArgumentPicker` - Search/select arguments to add  
✅ `SectionEditor` - Prose sections (intro, conclusion, etc.)  
✅ `BriefRenderer` - Public view of published brief  
✅ `ThesisSelector` - Pick/create thesis claim  
✅ `BriefTemplateSelector` - Choose brief type  

### Reused Components

✅ `ArgumentCard` (enhanced with compact mode)  
✅ `ClaimChip` (shows claim with label)  
✅ `ClaimBlock` (full claim display with support/attack graph)  
✅ `CitationCollector` (for evidence sections)  
✅ TipTap editor infrastructure (from ArticleEditor)  

---

## Next Steps

1. **Schema Migration**: Run `prisma migrate dev --name add_brief_model`
2. **Seed Data**: Create example briefs for testing
3. **UI Development**: Build components in order:
   - ThesisSelector
   - BriefTemplateSelector
   - SectionEditor
   - ProngEditor
   - BriefComposer (assembles all)
   - BriefRenderer
4. **Integration**: Add "Promote to Brief" buttons throughout app
5. **Export**: Implement PDF generation (Pandoc integration or headless Chrome)
6. **Testing**: End-to-end test creating and publishing a multi-prong brief

This gives you the complete implementation foundation for the Brief model. The TheoryWork enhancement follows a similar pattern but with theory-specific scaffolding (DN/IH/TC/OP).

Let me know which part you'd like to dive into first!
