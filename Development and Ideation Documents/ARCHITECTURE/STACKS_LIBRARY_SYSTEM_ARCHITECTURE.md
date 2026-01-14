# Stacks/Library System Architecture & Design

## Mesh Platform - Comprehensive Technical Specification

**Version:** 1.0  
**Last Updated:** December 15, 2025  
**Document Type:** End-to-End System Architecture

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architecture Diagrams](#3-architecture-diagrams)
4. [Data Models](#4-data-models)
5. [Component Architecture](#5-component-architecture)
6. [API Specifications](#6-api-specifications)
7. [Citation Pipeline](#7-citation-pipeline)
8. [Deliberation Integration](#8-deliberation-integration)
9. [Feed Integration](#9-feed-integration)
10. [Security & Authorization](#10-security--authorization)
11. [Performance Considerations](#11-performance-considerations)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

The Mesh Stacks/Library System is a document management and knowledge organization infrastructure that enables users to curate collections of PDFs and other documents. It provides deep integration with the deliberation engine, enabling evidence-based argumentation through a sophisticated citation pipeline.

### 1.2 Key Capabilities

| Capability | Description |
|------------|-------------|
| **Document Management** | Upload, organize, and preview PDFs in curated stacks |
| **Citation Infrastructure** | Attach sources (URL, DOI, Library items) to arguments and claims |
| **Deliberation Hosting** | Stacks can host deliberations via `library_stack` host type |
| **Discussion Threads** | FeedPost-based comment system with citation support |
| **Evidence Aggregation** | Track source usage and quality ratings across deliberations |
| **Collaborative Editing** | RBAC with owner/editor/viewer roles |
| **Cross-Deliberation References** | StackReference model for knowledge graph edges |

### 1.3 Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Drag-and-Drop:** @dnd-kit/core, @dnd-kit/sortable
- **Backend:** Next.js Server Actions, API Routes
- **Database:** PostgreSQL via Prisma ORM
- **Storage:** Supabase Storage (pdfs, pdf-thumbs buckets)
- **Real-Time:** Custom event bus (`emitBus`)

### 1.4 Core Entities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CORE ENTITY RELATIONSHIPS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    User ──owns──▶ Stack ──contains──▶ LibraryPost ──resolves──▶ Source     │
│      │              │                       │                      │        │
│      │              │                       │                      │        │
│   subscribes    hosts                   annotated              cited-by     │
│      │              │                       │                      │        │
│      ▼              ▼                       ▼                      ▼        │
│  Subscription   Deliberation           Annotation              Citation    │
│                     │                                              │        │
│                     │                                              │        │
│                  contains                                       targets     │
│                     │                                              │        │
│                     ▼                                              ▼        │
│             Claims + Arguments ◀──────────────────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Overview

### 2.1 Architectural Principles

1. **Server-First Operations** - Stack mutations via Next.js server actions
2. **Optimistic Updates** - Local state changes with background sync
3. **Polymorphic Citations** - Single Citation model targets multiple entity types
4. **Source Deduplication** - SHA1 fingerprinting prevents duplicate sources
5. **FeedPost Reuse** - Discussion threads leverage existing FeedPost infrastructure
6. **Event-Driven Updates** - Bus emissions for real-time synchronization

### 2.2 System Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          STACKS/LIBRARY SYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   Stack Page    │    │  PDF Viewer     │    │      Citation Picker        │ │
│  │                 │    │                 │    │                             │ │
│  │ • SortablePdf   │    │ • PdfLightbox   │    │ • URL/DOI/Library tabs      │ │
│  │   Grid          │    │ • Annotations   │    │ • LibrarySearchModal        │ │
│  │ • StackDiscuss  │    │ • CiteButton    │    │ • Locator/Quote/Note        │ │
│  │ • Collaborators │    │                 │    │                             │ │
│  └────────┬────────┘    └────────┬────────┘    └─────────────┬───────────────┘ │
│           │                      │                           │                  │
│           └──────────────────────┴───────────────────────────┘                  │
│                                  │                                               │
│                                  ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                         SERVER ACTIONS / API ROUTES                        │ │
│  │                                                                            │ │
│  │  stack.actions.ts    /api/library/*    /api/citations/*    /api/comments  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                  │                                               │
│                                  ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                              DATABASE                                       │ │
│  │                                                                            │ │
│  │  Stack  │  LibraryPost  │  Source  │  Citation  │  FeedPost  │  Delib...  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                  │                                               │
│                                  ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                          SUPABASE STORAGE                                   │ │
│  │                                                                            │ │
│  │           pdfs/                              pdf-thumbs/                   │ │
│  │      {userId}/{hash}.pdf              {userId}/{hash}.png                 │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Integration Points

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL INTEGRATIONS                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────────┐  │
│  │  DELIBERATION    │    │     FEED         │    │    KNOWLEDGE BASE        │  │
│  │    SYSTEM        │    │    SYSTEM        │    │       (KB)               │  │
│  │                  │    │                  │    │                          │  │
│  │ • library_stack  │    │ • LIBRARY type   │    │ • StackReference         │  │
│  │   host type      │    │ • LibraryCard    │    │ • Cross-delib edges      │  │
│  │ • Lift to debate │    │ • Cover hydrate  │    │ • ArgumentImport         │  │
│  │ • EvidenceList   │    │                  │    │                          │  │
│  └──────────────────┘    └──────────────────┘    └──────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────────┐  │
│  │    REAL-TIME     │    │    EXTERNAL      │    │      ARTICLE             │  │
│  │      BUS         │    │    SOURCES       │    │      SYSTEM              │  │
│  │                  │    │                  │    │                          │  │
│  │ • stacks:changed │    │ • Zotero import  │    │ • Article citations      │  │
│  │ • comments:chngd │    │ • DOI resolution │    │ • Shared Source model    │  │
│  │ • citations:chgd │    │ • URL metadata   │    │                          │  │
│  └──────────────────┘    └──────────────────┘    └──────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Architecture Diagrams

### 3.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         STACK PAGE (/stacks/[slugOrId])                  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │   │
│  │  │   Header        │  │   Collaborators │  │   Subscribe Button      │  │   │
│  │  │   (name, desc)  │  │   Form          │  │                         │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │   │
│  │                                                                          │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │                      SortablePdfGrid                               │  │   │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │  │   │
│  │  │  │ PDF     │  │ PDF     │  │ PDF     │  │ PDF     │              │  │   │
│  │  │  │ Tile    │  │ Tile    │  │ Tile    │  │ Tile    │   ...        │  │   │
│  │  │  │ [Cite]  │  │ [Cite]  │  │ [Cite]  │  │ [Cite]  │              │  │   │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘              │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │                      StackDiscussion                               │  │   │
│  │  │  ┌─────────────────────────────────────────────────────────────┐  │  │   │
│  │  │  │  CommentComposer  [textarea] [Citations] [Send]             │  │  │   │
│  │  │  └─────────────────────────────────────────────────────────────┘  │  │   │
│  │  │  ┌────────────────────────────────────────────┐                   │  │   │
│  │  │  │  Comment 1           [Deliberate] [Open]   │                   │  │   │
│  │  │  │    └─ Citation chips                       │                   │  │   │
│  │  │  ├────────────────────────────────────────────┤                   │  │   │
│  │  │  │  Comment 2           [Deliberate] [Open]   │                   │  │   │
│  │  │  └────────────────────────────────────────────┘                   │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SERVER LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        SERVER ACTIONS                                    │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐               │   │
│  │  │ getStackPage  │  │ addStack      │  │ setStackOrder │               │   │
│  │  │ Data          │  │ Comment       │  │               │               │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘               │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐               │   │
│  │  │ toggleStack   │  │ removeFrom    │  │ add/remove    │               │   │
│  │  │ Subscription  │  │ Stack         │  │ Collaborator  │               │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          API ROUTES                                      │   │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌──────────────────────┐ │   │
│  │  │ /api/library/*    │  │ /api/citations/*  │  │ /api/comments/lift   │ │   │
│  │  │ • upload          │  │ • resolve         │  │                      │ │   │
│  │  │ • search          │  │ • attach          │  │                      │ │   │
│  │  │ • status          │  │ • batch           │  │                      │ │   │
│  │  └───────────────────┘  └───────────────────┘  └──────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         PRISMA / POSTGRESQL                              │   │
│  │                                                                          │   │
│  │  Stack ◀─────────▶ LibraryPost ◀─────────▶ Source ◀─────────▶ Citation  │   │
│  │    │                     │                    │                          │   │
│  │    │                     │                    │                          │   │
│  │    ▼                     ▼                    ▼                          │   │
│  │  FeedPost            Annotation          SourceRating                    │   │
│  │  (discussion)                                                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                       SUPABASE STORAGE                                   │   │
│  │                                                                          │   │
│  │         pdfs bucket                    pdf-thumbs bucket                 │   │
│  │    /{userId}/{hash}.pdf            /{userId}/{hash}.png                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Upload Flow Sequence

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐     ┌─────────────┐
│  User    │     │ StackAddModal│     │ /api/library/   │     │  Supabase   │
│          │     │              │     │    upload       │     │  Storage    │
└────┬─────┘     └──────┬───────┘     └────────┬────────┘     └──────┬──────┘
     │                  │                      │                     │
     │  Select PDFs     │                      │                     │
     ├─────────────────▶│                      │                     │
     │                  │                      │                     │
     │  Generate        │                      │                     │
     │  previews        │                      │                     │
     │  (client-side)   │                      │                     │
     │                  │                      │                     │
     │                  │  POST multipart      │                     │
     │                  │  (files + previews)  │                     │
     │                  ├─────────────────────▶│                     │
     │                  │                      │                     │
     │                  │                      │  Upload PDF         │
     │                  │                      ├────────────────────▶│
     │                  │                      │                     │
     │                  │                      │  Upload thumb       │
     │                  │                      ├────────────────────▶│
     │                  │                      │                     │
     │                  │                      │  Return URLs        │
     │                  │                      │◀────────────────────┤
     │                  │                      │                     │
     │                  │                      │  Create/Get Stack   │
     │                  │                      │  (getOrCreateStackId)│
     │                  │                      │                     │
     │                  │                      │  Create LibraryPost │
     │                  │                      │  (file_url, thumb_urls)│
     │                  │                      │                     │
     │                  │                      │  Update stack.order │
     │                  │                      │                     │
     │                  │  { stackId, posts }  │                     │
     │                  │◀─────────────────────┤                     │
     │                  │                      │                     │
     │  Refresh page    │                      │                     │
     │◀─────────────────┤                      │                     │
     │                  │                      │                     │
```

### 3.3 Citation Attachment Flow

```
┌──────────┐  ┌───────────┐  ┌────────────────┐  ┌──────────────┐  ┌─────────────┐
│  PDF     │  │ Comment   │  │  /api/citations│  │ /api/citations│  │  Database   │
│  Tile    │  │ Composer  │  │  /resolve      │  │ /attach       │  │             │
└────┬─────┘  └─────┬─────┘  └───────┬────────┘  └──────┬───────┘  └──────┬──────┘
     │              │                │                  │                 │
     │  Click Cite  │                │                  │                 │
     ├─────────────▶│                │                  │                 │
     │              │                │                  │                 │
     │  CustomEvent │                │                  │                 │
     │  composer:cite                │                  │                 │
     │  {libraryPostId,              │                  │                 │
     │   mode: "quick"}              │                  │                 │
     │              │                │                  │                 │
     │              │  POST resolve  │                  │                 │
     │              │  {libraryPostId}                  │                 │
     │              ├───────────────▶│                  │                 │
     │              │                │                  │                 │
     │              │                │  Compute         │                 │
     │              │                │  fingerprint     │                 │
     │              │                │                  │                 │
     │              │                │  Find/Create     │                 │
     │              │                │  Source          │                 │
     │              │                ├─────────────────────────────────▶│
     │              │                │                  │                 │
     │              │  {source: {id}}│                  │                 │
     │              │◀───────────────┤                  │                 │
     │              │                │                  │                 │
     │              │  POST attach   │                  │                 │
     │              │  {targetType,  │                  │                 │
     │              │   targetId,    │                  │                 │
     │              │   sourceId}    │                  │                 │
     │              ├──────────────────────────────────▶│                 │
     │              │                │                  │                 │
     │              │                │                  │  Create Citation│
     │              │                │                  ├────────────────▶│
     │              │                │                  │                 │
     │              │  {citation}    │                  │                 │
     │              │◀──────────────────────────────────┤                 │
     │              │                │                  │                 │
     │              │  Dispatch      │                  │                 │
     │              │  citations:changed                │                 │
     │              │                │                  │                 │
```

### 3.4 Lift-to-Debate Flow

```
┌──────────┐  ┌───────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│  User    │  │ LiftToDebate  │  │ /api/comments/   │  │      Database       │
│          │  │ Button        │  │    lift          │  │                     │
└────┬─────┘  └──────┬────────┘  └────────┬─────────┘  └──────────┬──────────┘
     │               │                    │                       │
     │  Click        │                    │                       │
     │  "Deliberate" │                    │                       │
     ├──────────────▶│                    │                       │
     │               │                    │                       │
     │               │  POST              │                       │
     │               │  {commentId,       │                       │
     │               │   hostType:"stack",│                       │
     │               │   hostId, as:"claim"}                      │
     │               ├───────────────────▶│                       │
     │               │                    │                       │
     │               │                    │  Normalize hostType   │
     │               │                    │  → library_stack      │
     │               │                    │                       │
     │               │                    │  Find/Create          │
     │               │                    │  Deliberation         │
     │               │                    ├──────────────────────▶│
     │               │                    │                       │
     │               │                    │  Fetch comment text   │
     │               │                    │  from FeedPost        │
     │               │                    ├──────────────────────▶│
     │               │                    │                       │
     │               │                    │  Create Claim         │
     │               │                    │  {text, deliberationId}│
     │               │                    ├──────────────────────▶│
     │               │                    │                       │
     │               │                    │  Create DialogueMove  │
     │               │                    │  {kind: ASSERT}       │
     │               │                    ├──────────────────────▶│
     │               │                    │                       │
     │               │                    │  Emit bus events      │
     │               │                    │                       │
     │               │  {deliberationId,  │                       │
     │               │   claimId}         │                       │
     │               │◀───────────────────┤                       │
     │               │                    │                       │
     │  Redirect to  │                    │                       │
     │  /deliberation│                    │                       │
     │  /{id}        │                    │                       │
     │◀──────────────┤                    │                       │
```

---

## 4. Data Models

### 4.1 Stack Model

The Stack model represents a curated collection of documents.

```prisma
model Stack {
  id             String              @id @default(cuid())
  owner_id       BigInt
  name           String
  description    String?
  is_public      Boolean             @default(false)
  order          String[]            // Ordered LibraryPost IDs
  created_at     DateTime            @default(now()) @db.Timestamptz(6)
  parent_id      String?             // Hierarchical stacks
  slug           String?             @unique

  // Relations
  owner          User                @relation(fields: [owner_id], references: [id], onDelete: Cascade)
  posts          LibraryPost[]
  parent         Stack?              @relation("StackHierarchy", fields: [parent_id], references: [id])
  children       Stack[]             @relation("StackHierarchy")
  feedPosts      FeedPost[]
  collaborators  StackCollaborator[]
  subscribers    StackSubscription[]
  StackReference StackReference[]

  @@unique([owner_id, name])
  @@map("stacks")
}
```

**Key Features:**
- **Ordering:** `order` array maintains custom document sequence
- **Hierarchy:** Self-referential `parent_id` enables nested stacks
- **Slugs:** Human-readable URLs via unique `slug` field
- **Access Control:** `is_public` flag + collaborators for fine-grained access

### 4.2 LibraryPost Model

Individual documents within stacks.

```prisma
model LibraryPost {
  id          String   @id @default(cuid())
  uploader_id BigInt
  stack_id    String?
  title       String?
  page_count  Int
  file_url    String           // Supabase storage URL
  thumb_urls  String[]         // Generated preview images
  created_at  DateTime @default(now()) @db.Timestamptz(6)

  // Relations
  annotations Annotation[]
  stack       Stack?       @relation(fields: [stack_id], references: [id])
  uploader    User         @relation(fields: [uploader_id], references: [id], onDelete: Cascade)
  feedPosts   FeedPost[]

  @@index([uploader_id, created_at])
  @@index([stack_id])
  @@map("library_posts")
}
```

**Key Features:**
- **Flexible Attachment:** Optional `stack_id` allows standalone documents
- **Thumbnails:** Array of preview URLs for multi-page support
- **Annotations:** Page-level annotations with rect coordinates

### 4.3 Source Model

Canonical reference entity for citations.

```prisma
model Source {
  id            String    @id @default(cuid())
  kind          String    // 'article' | 'book' | 'web' | 'dataset' | 'video' | 'other'
  title         String?
  authorsJson   Json?     // [{family, given}] CSL-style
  year          Int?
  container     String?   // Journal, site, channel name
  publisher     String?
  volume        String?
  issue         String?
  pages         String?
  doi           String?   @unique
  url           String?   @unique
  platform      String?   // 'arxiv' | 'substack' | 'youtube' | ...
  accessedAt    DateTime?
  archiveUrl    String?   // Wayback/perma.cc link
  zoteroKey     String?   // Cross-reference key
  libraryPostId String?   // Link to internal LibraryPost
  fingerprint   String?   // SHA1 dedup key
  createdById   String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  citations Citation[]
  ratings   SourceRating[]
}
```

**Key Features:**
- **Deduplication:** `fingerprint` field prevents duplicate sources
- **Flexible Origin:** Can come from URL, DOI, or internal LibraryPost
- **Rich Metadata:** CSL-compatible author JSON, publication details
- **Quality Tracking:** Related `SourceRating` entries

### 4.4 Citation Model

Links sources to target entities.

```prisma
model Citation {
  id          String   @id @default(cuid())
  targetType  String   // 'argument' | 'claim' | 'card' | 'comment' | 'move' | 'proposition'
  targetId    String
  sourceId    String
  locator     String?  // 'p. 13', 'fig. 2', '08:14'
  quote       String?  // ≤280 chars excerpt
  note        String?  // User annotation
  relevance   Int?     // 1-5 quick rating
  createdById String
  createdAt   DateTime @default(now())

  // Relations
  source Source @relation(fields: [sourceId], references: [id])

  @@unique([targetType, targetId, sourceId, locator])
}
```

**Key Features:**
- **Polymorphic Target:** `targetType` + `targetId` pattern
- **Rich Annotations:** locator, quote, note fields
- **Duplicate Prevention:** Composite unique constraint

### 4.5 Supporting Models

#### StackCollaborator
```prisma
model StackCollaborator {
  stack_id   String
  user_id    BigInt
  role       StackRole @default(EDITOR)  // OWNER | EDITOR | VIEWER
  created_at DateTime  @default(now())

  stack Stack @relation(fields: [stack_id], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@id([stack_id, user_id])
}
```

#### StackSubscription
```prisma
model StackSubscription {
  stack_id   String
  user_id    BigInt
  created_at DateTime @default(now())

  stack Stack @relation(fields: [stack_id], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@id([stack_id, user_id])
}
```

#### SourceRating
```prisma
model SourceRating {
  id        String   @id @default(cuid())
  sourceId  String
  userId    BigInt
  rating    Int      // 1-10 scale
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  source Source @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([sourceId, userId])
}
```

#### StackReference (Cross-Deliberation)
```prisma
model StackReference {
  id                 String  @id @default(cuid())
  fromDeliberationId String
  toDeliberationId   String
  stackId            String?
  relation           String? // 'attached' | 'cites' | 'embeds'
  createdAt          DateTime @default(now())

  fromDeliberation Deliberation @relation("StackRefFrom", ...)
  toDeliberation   Deliberation @relation("StackRefTo", ...)
  stack            Stack?       @relation(...)

  @@unique([fromDeliberationId, toDeliberationId, stackId, relation])
}
```

### 4.6 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENTITY RELATIONSHIPS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────┐          ┌──────────────┐          ┌──────────────┐             │
│   │   User   │──owns───▶│    Stack     │──contains▶│ LibraryPost  │             │
│   │          │          │              │          │              │             │
│   │ id       │          │ id           │          │ id           │             │
│   │ name     │          │ name         │          │ title        │             │
│   │ ...      │          │ order[]      │          │ file_url     │             │
│   └────┬─────┘          │ is_public    │          │ thumb_urls[] │             │
│        │                └──────┬───────┘          └──────┬───────┘             │
│        │                       │                         │                      │
│        │                       │                         │                      │
│   subscribes              hosts                     resolves-to                 │
│        │                       │                         │                      │
│        ▼                       ▼                         ▼                      │
│   ┌──────────────┐      ┌──────────────┐          ┌──────────────┐             │
│   │ StackSub     │      │ Deliberation │          │    Source    │             │
│   │              │      │              │          │              │             │
│   │ stack_id     │      │ id           │          │ id           │             │
│   │ user_id      │      │ hostType     │◀─────────│ libraryPostId│             │
│   └──────────────┘      │ hostId       │          │ url/doi      │             │
│                         └──────┬───────┘          │ fingerprint  │             │
│                                │                   └──────┬───────┘             │
│                                │                          │                      │
│                           contains                    cited-by                   │
│                                │                          │                      │
│                                ▼                          ▼                      │
│                         ┌──────────────┐          ┌──────────────┐             │
│                         │ Claim/Arg    │◀─────────│   Citation   │             │
│                         │              │          │              │             │
│                         │ id           │          │ targetType   │             │
│                         │ text         │          │ targetId     │             │
│                         │ deliberation │          │ sourceId     │             │
│                         └──────────────┘          │ locator      │             │
│                                                   │ quote        │             │
│                                                   └──────────────┘             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Component Architecture

### 5.1 Stack Page Components

#### 5.1.1 Component Hierarchy

```
app/stacks/[slugOrId]/page.tsx (Server Component)
│
├── Header Section
│   ├── Stack name & description
│   ├── Visibility badge
│   └── Subscribe button (form → toggleStackSubscription)
│
├── Collaborators Section (owner only)
│   └── Add collaborator form → addCollaborator
│
├── SortablePdfGrid (Client Component)
│   └── SortableTile[]
│       ├── PdfLightbox (trigger)
│       ├── Drag handle
│       ├── CiteButton
│       └── Remove button → removeFromStack
│
└── StackDiscussion (Server Component)
    ├── CommentComposer (Client Component)
    │   ├── Textarea
    │   ├── Citations button
    │   └── CitePickerInlinePro (conditional)
    │
    └── Comment List
        └── Comment Row
            ├── Author avatar
            ├── Comment text
            ├── Citation chips
            ├── LiftToDebateButton
            └── OpenInDiscussionsButton
```

#### 5.1.2 SortablePdfGrid

**Location:** `components/stack/SortablePdfGrid.tsx`

Provides drag-and-drop reordering of PDF tiles with optimistic updates.

```tsx
type StackPostTile = {
  id: string;
  title?: string | null;
  file_url: string;
  thumb_urls?: string[] | null;
};

type Props = {
  stackId: string;
  posts: StackPostTile[];
  editable: boolean;
};

export default function SortablePdfGrid({ stackId, posts, editable }: Props) {
  // Local optimistic state
  const [items, setItems] = React.useState<StackPostTile[]>(posts);

  // Sensors for pointer and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  // Hidden form for server action
  const formRef = React.useRef<HTMLFormElement>(null);
  const orderInputRef = React.useRef<HTMLInputElement>(null);

  function onDragEnd(evt: any) {
    const { active, over } = evt;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((it) => it.id === String(active.id));
    const newIndex = items.findIndex((it) => it.id === String(over.id));
    
    // Optimistic update
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    // Submit to server
    const ids = next.map((i) => i.id);
    orderInputRef.current!.value = JSON.stringify(ids);
    formRef.current!.requestSubmit();
  }

  return (
    <>
      <form action={setStackOrder} ref={formRef} className="hidden">
        <input type="hidden" name="stackId" value={stackId} />
        <input type="hidden" name="orderJson" ref={orderInputRef} />
      </form>

      <DndContext sensors={sensors} onDragEnd={editable ? onDragEnd : undefined}>
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((p) => (
              <SortableTile key={p.id} tile={p} editable={editable} stackId={stackId} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
```

**Key Features:**
- Uses `@dnd-kit/core` and `@dnd-kit/sortable`
- Optimistic local state with form submission
- Distance activation constraint prevents accidental drags

#### 5.1.3 StackDiscussion

**Location:** `components/stack/StackDiscussion.tsx`

Server component that renders the discussion thread with citations.

```tsx
export default async function StackDiscussion({
  feedPostId,
}: {
  feedPostId: number | bigint;
}) {
  const rootId = BigInt(feedPostId);

  // Fetch comments under the root FeedPost
  const comments = await prisma.feedPost.findMany({
    where: { parent_id: rootId },
    orderBy: { created_at: "asc" },
    select: {
      id: true,
      content: true,
      created_at: true,
      author: { select: { id: true, name: true, image: true } },
    },
  });

  // Fetch citations for comments
  const commentIds = comments.map((c) => c.id.toString());
  const citations = await prisma.citation.findMany({
    where: { targetType: "comment", targetId: { in: commentIds } },
    include: { source: true },
  });

  // Group citations by comment
  const citesByComment = new Map<string, typeof citations>();
  for (const cit of citations) {
    const arr = citesByComment.get(cit.targetId) ?? [];
    arr.push(cit);
    citesByComment.set(cit.targetId, arr);
  }

  return (
    <div className="flex flex-col space-y-4">
      <CommentComposer rootId={rootId.toString()} />
      
      <div className="space-y-4">
        {comments.map((c) => (
          <CommentRow 
            key={c.id.toString()} 
            comment={c} 
            citations={citesByComment.get(c.id.toString()) ?? []} 
          />
        ))}
      </div>
    </div>
  );
}
```

#### 5.1.4 LiftToDebateButton

**Location:** `components/stack/LiftToDebateButton.tsx`

Client component that promotes a comment to a claim in the deliberation system.

```tsx
export default function LiftToDebateButton({ 
  commentId, 
  hostType, 
  hostId 
}: {
  commentId: string; 
  hostType: string; 
  hostId: string;
}) {
  async function go() {
    const r = await fetch("/api/comments/lift", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ 
        commentId, 
        hostType,   // "stack"
        hostId,     // stackId
        as: "claim" 
      }),
    });
    
    const j = await r.json();
    if (r.ok && j?.deliberationId) {
      location.href = `/deliberation/${j.deliberationId}`;
    } else {
      alert(j?.error || `Lift failed (HTTP ${r.status})`);
    }
  }
  
  return (
    <button onClick={go} className="btnv2 btnv2--sm text-xs">
      Deliberate
    </button>
  );
}
```

#### 5.1.5 CommentComposer

**Location:** `components/stack/CommentComposer.tsx`

Client component for posting comments with citation support.

```tsx
export default function CommentComposer({ rootId }: { rootId: string }) {
  const [text, setText] = React.useState("");
  const [justPostedId, setJustPostedId] = React.useState<string | null>(null);
  const [inlineOpen, setInlineOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);

  // Ensure we have a comment to attach citations to
  async function ensureTargetComment() {
    if (text.trim()) {
      const fd = new FormData();
      fd.set("rootId", String(rootId));
      fd.set("text", text);
      const id = await addStackComment(fd);
      setJustPostedId(String(id));
      setText("");
      return String(id);
    }
    if (justPostedId) return justPostedId;
    // Create placeholder
    const fd = new FormData();
    fd.set("rootId", String(rootId));
    fd.set("text", "Sources:");
    const id = await addStackComment(fd);
    setJustPostedId(String(id));
    return String(id);
  }

  // Listen for cite events from PDF tiles
  React.useEffect(() => {
    async function handleCite(ev: CustomEvent) {
      const { mode, libraryPostId, locator, quote, note } = ev.detail;
      const targetId = await ensureTargetComment();

      if (mode === "quick" && libraryPostId) {
        // Immediate resolve + attach
        const r = await fetch("/api/citations/resolve", {
          method: "POST",
          body: JSON.stringify({ libraryPostId }),
        });
        const { source } = await r.json();
        
        await fetch("/api/citations/attach", {
          method: "POST",
          body: JSON.stringify({
            targetType: "comment",
            targetId,
            sourceId: source.id,
            locator, quote, note,
          }),
        });
        
        window.dispatchEvent(new CustomEvent("citations:changed"));
      } else {
        // Open modal for detailed citation
        setModalOpen(true);
      }
    }

    window.addEventListener("composer:cite", handleCite);
    return () => window.removeEventListener("composer:cite", handleCite);
  }, [rootId, justPostedId, text]);

  return (
    <div className="flex flex-col gap-2">
      <form action={addStackComment} className="flex items-start gap-3">
        <input type="hidden" name="rootId" value={rootId} />
        <textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 border rounded-xl"
        />
        <button type="submit">Send</button>
        <button type="button" onClick={() => setInlineOpen(true)}>
          Citations
        </button>
      </form>

      {inlineOpen && justPostedId && (
        <CitePickerInlinePro
          targetType="comment"
          targetId={justPostedId}
          onDone={() => setInlineOpen(false)}
        />
      )}
    </div>
  );
}
```

### 5.2 Citation Components

#### 5.2.1 CitePickerInlinePro

**Location:** `components/citations/CitePickerInlinePro.tsx`

Full-featured citation picker with URL, DOI, and Library tabs.

```tsx
type Props = {
  targetType: "comment" | "claim" | "argument" | "card" | "move" | "work" | "proposition";
  targetId: string;
  onDone?: () => void;
  initialUrl?: string;
  initialDOI?: string;
  initialLocator?: string;
  initialQuote?: string;
  initialNote?: string;
};

export default function CitePickerInlinePro({
  targetType,
  targetId,
  onDone,
  ...prefills
}: Props) {
  const [tab, setTab] = React.useState<"url" | "doi" | "library">("url");
  
  // Form state for each tab
  const [url, setUrl] = React.useState(prefills.initialUrl ?? "");
  const [doi, setDoi] = React.useState(prefills.initialDOI ?? "");
  const [libraryId, setLibraryId] = React.useState("");
  
  // Common fields
  const [locator, setLocator] = React.useState(prefills.initialLocator ?? "");
  const [quote, setQuote] = React.useState(prefills.initialQuote ?? "");
  const [note, setNote] = React.useState(prefills.initialNote ?? "");

  async function doAttach() {
    let sourceId: string;

    // Resolve source based on active tab
    if (tab === "url") {
      const { source } = await resolveSource({ url });
      sourceId = source.id;
    } else if (tab === "doi") {
      const { source } = await resolveSource({ doi });
      sourceId = source.id;
    } else {
      const { source } = await resolveSource({ libraryPostId: libraryId });
      sourceId = source.id;
    }

    // Attach to target
    await attachCitation({
      targetType,
      targetId,
      sourceId,
      locator: locator || undefined,
      quote: quote || undefined,
      note: note || undefined,
    });

    // Notify listeners
    window.dispatchEvent(new CustomEvent("citations:changed", {
      detail: { targetType, targetId }
    }));

    onDone?.();
  }

  return (
    <div className="border rounded-xl p-3">
      {/* Tab buttons */}
      <div className="flex gap-2 mb-2">
        {["url", "doi", "library"].map((t) => (
          <button
            key={t}
            className={tab === t ? "bg-slate-300" : "bg-white"}
            onClick={() => setTab(t as any)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "url" && <UrlInput value={url} onChange={setUrl} />}
      {tab === "doi" && <DoiInput value={doi} onChange={setDoi} />}
      {tab === "library" && (
        <LibraryPicker value={libraryId} onChange={setLibraryId} />
      )}

      {/* Common fields */}
      <input placeholder="Locator (p. 13, fig. 2)" value={locator} onChange={...} />
      <input placeholder="Note" value={note} onChange={...} />
      <textarea placeholder="Quote (≤280 chars)" value={quote} onChange={...} />

      {/* Submit */}
      <button onClick={doAttach}>Attach citation</button>
    </div>
  );
}
```

#### 5.2.2 CitationCollector

**Location:** `components/citations/CitationCollector.tsx`

Collects citations before the target entity exists (for composition flows).

```tsx
type PendingCitation = {
  type: "url" | "doi" | "library";
  value: string;
  locator?: string;
  quote?: string;
  note?: string;
  title?: string;
  quality?: "strong" | "moderate" | "weak";
};

type Props = {
  citations: PendingCitation[];
  onChange: (citations: PendingCitation[]) => void;
  showQualityHints?: boolean;
};

export default function CitationCollector({ citations, onChange }: Props) {
  const [showForm, setShowForm] = React.useState(false);
  const [tab, setTab] = React.useState<"url" | "doi" | "library">("url");

  function addCitation() {
    let newCitation: PendingCitation | null = null;

    if (tab === "url" && url.trim()) {
      newCitation = { type: "url", value: url.trim(), ... };
    } else if (tab === "doi" && doi.trim()) {
      newCitation = { type: "doi", value: doi.trim(), ... };
    } else if (tab === "library" && libraryId.trim()) {
      newCitation = { type: "library", value: libraryId.trim(), ... };
    }

    if (newCitation) {
      onChange([...citations, newCitation]);
      resetForm();
    }
  }

  function removeCitation(index: number) {
    onChange(citations.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex gap-3 mb-2">
        <label>Evidence & Citations</label>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Hide" : "Add citation"}
        </button>
      </div>

      {showForm && <CitationForm onAdd={addCitation} />}

      {/* Display pending citations */}
      <div className="flex flex-wrap gap-1">
        {citations.map((c, i) => (
          <CitationBadge key={i} citation={c} onRemove={() => removeCitation(i)} />
        ))}
      </div>
    </div>
  );
}
```

**Usage Pattern:**
```tsx
// In PropositionComposerPro or ArgumentComposer
const [citations, setCitations] = useState<PendingCitation[]>([]);

// On submit:
const proposition = await createProposition(...);
for (const c of citations) {
  const source = await resolveSource(c);
  await attachCitation({ targetType: "proposition", targetId: proposition.id, sourceId: source.id });
}
```

#### 5.2.3 LibrarySearchModal

**Location:** `components/citations/LibrarySearchModal.tsx`

Modal for searching the user's library items.

```tsx
export default function LibrarySearchModal({
  open,
  onOpenChange,
  onPick,
  trigger,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  onPick: (libraryPostId: string) => void;
  trigger?: React.ReactNode;
}) {
  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(false);

  async function search() {
    setBusy(true);
    const res = await fetch(`/api/library/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setBusy(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Find a library item</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <input
            placeholder="Search your library…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={search} disabled={busy}>Search</button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {items.map((it) => (
            <div key={it.id} className="flex justify-between p-2 border-b">
              <span>{it.title || it.file_url}</span>
              <button onClick={() => { onPick(it.id); onOpenChange?.(false); }}>
                Pick
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.3 Feed Integration Components

#### 5.3.1 LibraryCard

**Location:** `components/cards/LibraryCard.tsx`

Renders stacks and single PDFs in the social feed.

```tsx
export type LibraryCardProps = {
  kind: "single" | "stack";
  coverUrl?: string;              // For single PDF
  libraryPostId?: string;
  stackId?: string;               // For stacks
  coverUrls?: string[];           // Stack thumbnails
  size?: number;                  // Stack size
  caption?: string | null;
  onOpenPdf?: (libraryPostId: string) => void;
  onOpenStack?: (stackId: string) => void;
};

export default function LibraryCard(props: LibraryCardProps) {
  const { kind, coverUrl, coverUrls = [], size = 0, caption, ... } = props;

  if (kind === "single") {
    if (coverUrl) {
      return (
        <div>
          <img src={coverUrl} onClick={() => onOpenPdf?.(libraryPostId!)} />
          {caption && <div className="text-sm">{caption}</div>}
        </div>
      );
    }
    return <Placeholder label="PDF" sublabel={caption} onClick={...} />;
  }

  if (kind === "stack") {
    if (size <= 10 && coverUrls.length > 0) {
      return <StackCarousel urls={coverUrls} caption={caption} />;
    }
    
    if (coverUrls.length > 0) {
      // 2x2 collage for large stacks
      return (
        <div className="grid grid-cols-2 gap-1">
          {coverUrls.slice(0, 4).map((u, i) => (
            <img key={i} src={u} className="aspect-[4/3] object-cover" />
          ))}
        </div>
      );
    }
    
    return <Placeholder label={`Stack (${size})`} onClick={...} />;
  }

  return null;
}
```

### 5.4 Evidence Components

#### 5.4.1 EvidenceList

**Location:** `components/evidence/EvidenceList.tsx`

Displays all sources used in a deliberation with usage metrics and ratings.

```tsx
type EvidenceSource = {
  sourceId: string;
  title: string;
  url: string;
  type: string;
  authorsJson: any;
  year: number | null;
  usageCount: number;
  usedInArguments: number;
  usedInClaims: number;
  uniqueUsers: number;
  averageRating: number | null;
  ratingCount: number;
};

export function EvidenceList({ deliberationId }: { deliberationId: string }) {
  const [sortBy, setSortBy] = React.useState<"usage" | "rating">("usage");
  const [selectedSource, setSelectedSource] = React.useState<string | null>(null);

  const { data, mutate } = useSWR(
    `/api/deliberations/${deliberationId}/sources`,
    fetcher
  );

  const sources = data?.sources || [];

  const sortedSources = React.useMemo(() => {
    const sorted = [...sources];
    if (sortBy === "usage") {
      sorted.sort((a, b) => b.usageCount - a.usageCount);
    } else {
      sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }
    return sorted;
  }, [sources, sortBy]);

  async function submitRating(sourceId: string, rating: number) {
    await fetch(`/api/sources/${sourceId}/rate`, {
      method: "POST",
      body: JSON.stringify({ rating }),
    });
    mutate(); // Refresh
  }

  return (
    <div className="space-y-4">
      {/* Header with stats and sort */}
      <div className="flex justify-between">
        <span>{data?.totalSources} Sources • {data?.totalCitations} citations</span>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="usage">Most Used</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Source list */}
      {sortedSources.map((source) => (
        <SourceCard
          key={source.sourceId}
          source={source}
          onRate={(rating) => submitRating(source.sourceId, rating)}
        />
      ))}
    </div>
  );
}
```

---

## 6. API Specifications

### 6.1 Library Routes

#### POST /api/library/upload

Uploads PDF files with optional preview images.

**Request:**
```http
POST /api/library/upload
Content-Type: multipart/form-data

files: File[]               # Required: PDF files
previews: JSON string       # Optional: base64 data URLs for previews
stackId: string             # Optional: existing stack ID
stackName: string           # Optional: create/find stack by name
isPublic: "true" | "false"  # Optional: stack visibility
```

**Response:**
```json
{
  "stackId": "clxxxx",
  "posts": [
    {
      "id": "clyyyy",
      "file_url": "https://supabase.../pdfs/user/hash.pdf",
      "thumb_urls": ["https://supabase.../pdf-thumbs/user/hash.png"]
    }
  ]
}
```

**Implementation Flow:**
1. Authenticate user
2. Validate stack permissions if `stackId` provided
3. Get or create stack via `getOrCreateStackId()`
4. For each file:
   - Generate safe filename
   - Upload to Supabase `pdfs` bucket
   - If preview provided, upload to `pdf-thumbs` bucket
   - Create `LibraryPost` record
5. Update `stack.order` array
6. Return created resources

#### GET /api/library/search

Searches the user's library items.

**Request:**
```http
GET /api/library/search?q=keyword
```

**Response:**
```json
{
  "items": [
    {
      "id": "clxxxx",
      "title": "Research Paper.pdf",
      "file_url": "https://...",
      "thumb_urls": ["https://..."],
      "stack_id": "clyyyy"
    }
  ]
}
```

### 6.2 Citation Routes

#### POST /api/citations/resolve

Finds or creates a Source from URL, DOI, or LibraryPost.

**Request:**
```json
{
  "url": "https://example.com/article",    // Option 1
  "doi": "10.1234/example",                 // Option 2
  "libraryPostId": "clxxxx",               // Option 3
  "meta": {                                 // Optional metadata
    "title": "Article Title",
    "authorsJson": [{"family": "Smith", "given": "John"}],
    "year": 2024
  }
}
```

**Response:**
```json
{
  "source": {
    "id": "clxxxx",
    "title": "Article Title",
    "url": "https://example.com/article",
    "kind": "web",
    "platform": "web"
  }
}
```

**Implementation:**
1. Normalize input to canonical form
2. Compute SHA1 fingerprint
3. Search for existing Source by fingerprint/url/doi
4. If found, return existing
5. If not found, create new Source with metadata
6. Return source record

#### POST /api/citations/attach

Attaches a Source to a target entity.

**Request:**
```json
{
  "targetType": "argument",    // argument | claim | card | comment | move | proposition
  "targetId": "clxxxx",
  "sourceId": "clyyyy",
  "locator": "p. 13-15",       // Optional
  "quote": "Key excerpt...",   // Optional, ≤280 chars
  "note": "Supports claim X",  // Optional
  "relevance": 4               // Optional, 1-5
}
```

**Response:**
```json
{
  "citation": {
    "id": "clzzzz",
    "targetType": "argument",
    "targetId": "clxxxx",
    "sourceId": "clyyyy",
    "locator": "p. 13-15",
    "createdAt": "2025-12-15T..."
  }
}
```

#### GET /api/citations/batch

Fetches citations for multiple targets.

**Request:**
```http
GET /api/citations/batch?targetType=claim&targetIds=id1,id2,id3
```

**Response:**
```json
{
  "items": {
    "id1": [{ "id": "...", "source": {...}, "locator": "..." }],
    "id2": [{ "id": "...", "source": {...} }],
    "id3": []
  }
}
```

### 6.3 Comment/Lift Routes

#### POST /api/comments/lift

Promotes a stack comment to a claim in the deliberation system.

**Request:**
```json
{
  "commentId": "123456789",    // FeedPost ID (bigint as string)
  "hostType": "stack",         // Normalized to library_stack
  "hostId": "clxxxx",          // Stack ID
  "as": "claim"                // Currently only "claim" supported
}
```

**Response:**
```json
{
  "deliberationId": "clyyyy",
  "claimId": "clzzzz"
}
```

**Implementation:**
1. Authenticate user
2. Normalize `hostType` → `DeliberationHostType.library_stack`
3. Find or create Deliberation with hostType/hostId
4. Fetch comment text from FeedPost
5. Create Claim with text
6. Create DialogueMove (kind: ASSERT)
7. Emit bus events for real-time updates
8. Return IDs for client redirect

### 6.4 Deliberation Sources Route

#### GET /api/deliberations/[id]/sources

Fetches all sources used in a deliberation with aggregated metrics.

**Response:**
```json
{
  "totalSources": 12,
  "totalCitations": 47,
  "sources": [
    {
      "sourceId": "clxxxx",
      "title": "Research Paper",
      "url": "https://...",
      "type": "article",
      "authorsJson": [...],
      "year": 2024,
      "usageCount": 8,
      "usedInArguments": 5,
      "usedInClaims": 3,
      "uniqueUsers": 4,
      "firstUsed": "2025-12-01T...",
      "lastUsed": "2025-12-15T...",
      "averageRating": 7.5,
      "ratingCount": 6
    }
  ]
}
```

---

## 7. Citation Pipeline

### 7.1 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CITATION PIPELINE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  INPUT SOURCES                      RESOLUTION                    OUTPUT        │
│  ────────────────                   ──────────                   ───────        │
│                                                                                  │
│  ┌─────────────┐                 ┌──────────────┐             ┌─────────────┐  │
│  │   URL       │────┐            │   /resolve   │             │   Source    │  │
│  │ https://... │    │            │              │             │             │  │
│  └─────────────┘    │            │ 1. Normalize │             │ id          │  │
│                     │            │ 2. Fingerprint│───────────▶│ title       │  │
│  ┌─────────────┐    ├───────────▶│ 3. Find/Create             │ url/doi     │  │
│  │   DOI       │    │            │              │             │ platform    │  │
│  │ 10.xxx/...  │────┤            └──────────────┘             │ fingerprint │  │
│  └─────────────┘    │                    │                    └──────┬──────┘  │
│                     │                    │                           │         │
│  ┌─────────────┐    │                    │                           │         │
│  │ LibraryPost │────┘                    │                           │         │
│  │ clxxxx      │                         │                           │         │
│  └─────────────┘                         │                           │         │
│                                          ▼                           │         │
│                                   ┌──────────────┐                   │         │
│                                   │   /attach    │                   │         │
│                                   │              │                   │         │
│  TARGET ENTITIES                  │ targetType   │                   │         │
│  ────────────────                 │ targetId     │◀──────────────────┘         │
│                                   │ sourceId     │                             │
│  • Argument                       │ locator?     │                             │
│  • Claim                          │ quote?       │                             │
│  • Comment                        │ note?        │                             │
│  • Card                           │              │                             │
│  • Move                           └──────┬───────┘                             │
│  • Proposition                           │                                      │
│                                          ▼                                      │
│                                   ┌──────────────┐                             │
│                                   │   Citation   │                             │
│                                   │              │                             │
│                                   │ id           │                             │
│                                   │ targetType   │                             │
│                                   │ targetId     │                             │
│                                   │ sourceId     │                             │
│                                   │ locator      │                             │
│                                   │ quote        │                             │
│                                   └──────────────┘                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Source Resolution

#### 7.2.1 Fingerprint Computation

```typescript
function fpFrom(parts: {
  doi?: string | null;
  url?: string | null;
  libraryPostId?: string | null;
  workId?: string | null;
}) {
  const base =
    (parts.doi?.toLowerCase() || "") +
    "|" +
    (parts.url?.toLowerCase() || "") +
    "|" +
    (parts.libraryPostId || "") +
    "|" +
    (parts.workId || "");
  return crypto.createHash("sha1").update(base, "utf8").digest("hex");
}
```

#### 7.2.2 URL Canonicalization

```typescript
function canonicalUrl(u?: string | null) {
  if (!u) return null;
  try {
    const url = new URL(u);
    url.hash = "";  // Remove fragment
    // Remove tracking parameters
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]
      .forEach((k) => url.searchParams.delete(k));
    return url.toString();
  } catch {
    return u.trim();
  }
}
```

#### 7.2.3 Platform Inference

```typescript
function inferPlatform(u?: string | null) {
  if (!u) return "web";
  try {
    const h = new URL(u).hostname;
    if (h.includes("arxiv")) return "arxiv";
    if (h.includes("substack")) return "substack";
    if (h.includes("youtube") || h.includes("youtu.be")) return "youtube";
    return "web";
  } catch {
    return "web";
  }
}
```

### 7.3 Citation Attachment Patterns

#### 7.3.1 Quick Cite (from PDF Tile)

```
User clicks [Cite] on PDF tile
        │
        ▼
CiteButton dispatches CustomEvent
  { libraryPostId, mode: "quick" }
        │
        ▼
CommentComposer.handleCite()
        │
        ├─── ensureTargetComment()
        │    (creates comment if needed)
        │
        ▼
POST /api/citations/resolve
  { libraryPostId }
        │
        ▼
POST /api/citations/attach
  { targetType: "comment", targetId, sourceId }
        │
        ▼
Dispatch "citations:changed" event
```

#### 7.3.2 Detailed Cite (with Modal)

```
User clicks [Cite with details...]
        │
        ▼
CitePickerModal opens
        │
        ▼
User selects tab (URL/DOI/Library)
User fills locator, quote, note
        │
        ▼
Click [Attach citation]
        │
        ▼
doAttach()
  ├─── resolveSource({ url | doi | libraryPostId })
  └─── attachCitation({ targetType, targetId, sourceId, locator, quote, note })
        │
        ▼
Modal closes, citations:changed dispatched
```

#### 7.3.3 Pre-Composition Collection

```
PropositionComposerPro / ArgumentComposer
        │
        ▼
CitationCollector manages PendingCitation[]
        │
        ▼
User adds citations (stored in state)
        │
        ▼
On Submit:
  1. Create Proposition/Argument
  2. For each PendingCitation:
     a. resolveSource(citation)
     b. attachCitation({ targetType, targetId: newEntity.id, sourceId })
```

### 7.4 Evidence Aggregation

```
GET /api/deliberations/{id}/sources
        │
        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│  1. Find all Arguments in deliberation                                          │
│  2. Find all Claims in deliberation                                             │
│  3. Query Citations where:                                                       │
│     - (targetType: "argument" AND targetId IN argumentIds) OR                   │
│     - (targetType: "claim" AND targetId IN claimIds)                            │
│  4. Group by sourceId:                                                          │
│     - Count total uses                                                          │
│     - Count uses in arguments vs claims                                         │
│     - Track unique users                                                         │
│     - Track first/last used dates                                               │
│  5. Join with SourceRating for average ratings                                  │
│  6. Return aggregated source list                                               │
└────────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
EvidenceList component renders with sort options
```

---

## 8. Deliberation Integration

### 8.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    STACKS ↔ DELIBERATION INTEGRATION                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           STACK                                          │   │
│  │                                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │   │
│  │  │    PDF      │  │    PDF      │  │    PDF      │                      │   │
│  │  │   [Cite]    │  │   [Cite]    │  │   [Cite]    │                      │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                      │   │
│  │         │                │                │                              │   │
│  │         └────────────────┼────────────────┘                              │   │
│  │                          │                                               │   │
│  │                          ▼                                               │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │                     DISCUSSION THREAD                              │  │   │
│  │  │                                                                    │  │   │
│  │  │  ┌─────────────────────────────────────────────────────────────┐  │  │   │
│  │  │  │  Comment: "This paper supports..."  [📎 Source] [Deliberate]│  │  │   │
│  │  │  └─────────────────────────────────────────────────────────────┘  │  │   │
│  │  │                              │                                     │  │   │
│  │  │                              │ POST /api/comments/lift             │  │   │
│  │  │                              ▼                                     │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        DELIBERATION                                      │   │
│  │                                                                          │   │
│  │  hostType: library_stack                                                 │   │
│  │  hostId: {stackId}                                                       │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                         CLAIMS                                   │    │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐    │    │   │
│  │  │  │  Claim: "This paper supports..." (lifted from comment)  │    │    │   │
│  │  │  │  └─ Citations: [PDF Source]                             │    │    │   │
│  │  │  └─────────────────────────────────────────────────────────┘    │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                       ARGUMENTS                                  │    │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐    │    │   │
│  │  │  │  Argument supporting claim                              │    │    │   │
│  │  │  │  └─ Citations: [PDF Source], [URL Source]               │    │    │   │
│  │  │  └─────────────────────────────────────────────────────────┘    │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    EVIDENCE LIST (Sources Tab)                   │    │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │    │   │
│  │  │  │ PDF Source   │  │ URL Source   │  │ DOI Source   │           │    │   │
│  │  │  │ Used: 5x     │  │ Used: 3x     │  │ Used: 2x     │           │    │   │
│  │  │  │ Rating: 8.2  │  │ Rating: 7.0  │  │ Rating: 9.1  │           │    │   │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘           │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Host Type Configuration

Stacks can host deliberations via the `library_stack` host type:

```typescript
enum DeliberationHostType {
  article
  post
  room_thread
  library_stack      // ← Stack-hosted deliberation
  site
  inbox_thread
  discussion
  free
  work
}
```

### 8.3 Lift-to-Debate Implementation

**Route:** `/api/comments/lift`

```typescript
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  const { commentId, hostType, hostId, as = "claim" } = await req.json();

  // Normalize host type (handle aliases)
  const hostTypeEnum = normalizeHostType(String(hostType));
  // "stack" | "stacks" | "library" → DeliberationHostType.library_stack

  // Find or create deliberation
  let d = await prisma.deliberation.findFirst({
    where: { hostType: hostTypeEnum, hostId: String(hostId) },
    select: { id: true },
  });
  
  if (!d) {
    d = await prisma.deliberation.create({
      data: { 
        hostType: hostTypeEnum, 
        hostId: String(hostId), 
        createdById: String(userId) 
      },
      select: { id: true },
    });
  }

  // Fetch comment text
  const post = await prisma.feedPost.findUnique({
    where: { id: BigInt(commentId) },
    select: { content: true },
  });
  
  const text = (post?.content ?? "").trim();
  if (!text) throw new Error("Cannot lift empty comment");

  // Create claim
  const claim = await prisma.claim.create({
    data: {
      text: text.slice(0, 4000),
      createdById: String(userId),
      moid: `cm-${commentId}-${Date.now()}`,
      deliberationId: d.id,
    },
  });

  // Create dialogue move for provenance
  const move = await prisma.dialogueMove.create({
    data: {
      deliberationId: d.id,
      targetType: "claim",
      targetId: claim.id,
      kind: "ASSERT",
      payload: { text: claim.text },
      actorId: String(userId),
      signature: `lift:${commentId}:${Date.now()}`,
    },
  });

  // Emit events for real-time updates
  emitBus("deliberations:created", { 
    id: d.id, 
    hostType: hostTypeEnum, 
    hostId: String(hostId) 
  });
  emitBus("dialogue:moves:refresh", { 
    moveId: move.id, 
    deliberationId: d.id 
  });

  return NextResponse.json({ 
    deliberationId: d.id, 
    claimId: claim.id 
  });
}
```

### 8.4 Citation Flow to Deliberation

When citations are attached to claims/arguments in a stack-hosted deliberation:

```
Stack PDF → Citation attached to comment
     │
     │ Lift to debate
     ▼
Claim created in Deliberation
     │
     │ User adds citation to claim
     ▼
POST /api/citations/attach
  { targetType: "claim", targetId: claimId, sourceId }
     │
     ▼
Citation linked to Source (may be LibraryPost-backed)
     │
     ▼
EvidenceList aggregates all sources in deliberation
```

### 8.5 DeepDivePanelV2 Sources Tab

The Sources tab in the deliberation panel displays all evidence:

```tsx
// From DeepDivePanelV2.tsx
<TabsContent value="sources">
  <SectionCard
    title="Evidence & Sources"
    action={
      <div className="text-xs text-neutral-500">
        Community-evaluated sources used across arguments and claims
      </div>
    }
  >
    <div className="text-sm text-neutral-600 mb-4">
      All citations and sources referenced in this deliberation. 
      Rate sources to help the community evaluate evidence quality.
    </div>
    <EvidenceList deliberationId={deliberationId} />
  </SectionCard>
</TabsContent>
```

### 8.6 Cross-Deliberation References

The `StackReference` model enables knowledge graph edges between deliberations:

```typescript
// When a stack in one deliberation references content from another
model StackReference {
  id                 String
  fromDeliberationId String    // Source deliberation
  toDeliberationId   String    // Referenced deliberation
  stackId            String?   // Linking stack
  relation           String?   // 'attached' | 'cites' | 'embeds'
  createdAt          DateTime

  @@unique([fromDeliberationId, toDeliberationId, stackId, relation])
}
```

**Use Cases:**
- Stack in Deliberation A cites research from Deliberation B
- Arguments imported across deliberations via stacks
- Building knowledge graphs from interconnected discussions

---

## 9. Feed Integration

### 9.1 LIBRARY Post Type

Stacks and library items appear in the social feed via the `LIBRARY` post type:

```typescript
enum feed_post_type {
  TEXT
  IMAGE
  VIDEO
  // ...
  LIBRARY           // ← Stack/PDF posts
  ARTICLE
  // ...
}
```

### 9.2 FeedPost Structure for Library Items

```typescript
// FeedPost record for a stack
{
  id: bigint,
  type: "LIBRARY",
  author_id: bigint,
  stack_id: string,           // Link to Stack
  library_post_id: string?,   // Link to single LibraryPost (if not stack)
  content: JSON.stringify({   // Fallback metadata
    kind: "stack",
    stackId: "...",
    name: "...",
    size: 5
  }),
  image_url: string?,         // Cover image
  caption: string?
}
```

### 9.3 Feed Hydration Pipeline

When fetching feed posts, library items are hydrated with cover images:

```typescript
// From feed.actions.ts
export async function fetchFeedPosts() {
  const rows = await prisma.feedPost.findMany({
    where: { isPublic: true, parent_id: null },
    orderBy: { created_at: "desc" },
    // ... includes author, likes, etc.
  });

  // Hydrate LIBRARY posts with covers
  const stackIds = rows
    .filter(r => r.type === "LIBRARY" && r.stack_id)
    .map(r => r.stack_id!);

  // Fetch first thumbnail for each stack
  const stackCovers = await getStackCovers(stackIds);

  const hydrated = rows.map((r) => {
    if (r.type !== "LIBRARY") return r;
    
    if (r.stack_id && stackCovers[r.stack_id]) {
      const { urls, size } = stackCovers[r.stack_id];
      return {
        ...r,
        library: { 
          kind: "stack", 
          stackId: r.stack_id, 
          coverUrls: urls, 
          size 
        },
      };
    }
    
    if (r.library_post_id) {
      return {
        ...r,
        library: { 
          kind: "single", 
          libraryPostId: r.library_post_id, 
          coverUrl: singleCovers[r.library_post_id] 
        },
      };
    }
    
    return r;
  });

  return hydrated;
}
```

### 9.4 LibraryCard Rendering

```tsx
// In PostCard.tsx, handle LIBRARY type
{type === "LIBRARY" && library && (
  <LibraryCard
    kind={library.kind}
    stackId={library.stackId}
    libraryPostId={library.libraryPostId}
    coverUrl={library.coverUrl}
    coverUrls={library.coverUrls}
    size={library.size}
    caption={caption}
    onOpenStack={(id) => router.push(`/stacks/${id}`)}
    onOpenPdf={(id) => openLightbox(id)}
  />
)}
```

### 9.5 Stack Sharing Flow

```
User creates/updates Stack
        │
        │ (optional) Create FeedPost
        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│  POST /api/feed (or automatic on stack creation)                                │
│                                                                                 │
│  {                                                                              │
│    type: "LIBRARY",                                                             │
│    stack_id: stackId,                                                           │
│    caption: "Check out my research collection",                                 │
│    isPublic: true                                                               │
│  }                                                                              │
└────────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
FeedPost created → appears in followers' feeds
        │
        ▼
LibraryCard renders with StackCarousel or collage
```

---

## 10. Security & Authorization

### 10.1 Stack Access Control

#### 10.1.1 Role-Based Permissions

| Role | View | Comment | Edit Posts | Manage Collaborators | Delete |
|------|------|---------|------------|---------------------|--------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ | ❌ | ❌ |
| Viewer | ✅ | ✅ | ❌ | ❌ | ❌ |
| Subscriber | ✅* | ✅* | ❌ | ❌ | ❌ |
| Public | ✅** | ❌ | ❌ | ❌ | ❌ |

*\* Only if stack is public or user is collaborator*  
*\*\* Only if `is_public = true`*

#### 10.1.2 Permission Checks

```typescript
// lib/actions/stack.actions.ts

function canEdit(stack: any, viewer: { id: bigint | null }) {
  if (!viewer.id) return false;
  if (stack.owner_id === viewer.id) return true;
  if (!stack.collaborators) return false;
  return stack.collaborators.some(
    (c) => c.user_id === viewer.id && 
           (c.role === "EDITOR" || c.role === "OWNER")
  );
}

function canView(stack: any, viewer: { id: bigint | null }) {
  if (stack.is_public) return true;
  if (!viewer.id) return false;
  if (stack.owner_id === viewer.id) return true;
  return stack.collaborators?.some((c) => c.user_id === viewer.id) ?? false;
}

export async function assertCanEditStack(stackId: string, userId: bigint) {
  const stack = await prisma.stack.findUnique({
    where: { id: stackId },
    include: { collaborators: true },
  });
  if (!stack) throw new Error("Stack not found");
  if (!canEdit(stack, { id: userId })) throw new Error("Forbidden");
  return true;
}
```

### 10.2 Comment Authorization

```typescript
// Only allow comment if:
// 1. Stack is public, OR
// 2. User is owner/editor/subscriber

export async function addStackComment(formData: FormData) {
  const userId = BigInt(u.userId);
  
  const stack = await prisma.stack.findUnique({
    where: { id: stackId },
    include: {
      collaborators: true,
      subscribers: { where: { user_id: userId } },
    },
  });
  
  const isOwner = stack?.owner_id === userId;
  const isEditor = stack?.collaborators?.some(
    (c) => c.user_id === userId && (c.role === "EDITOR" || c.role === "OWNER")
  );
  const isSub = !!stack?.subscribers?.length;
  
  const allowed = stack?.is_public || isOwner || isEditor || isSub;
  if (!allowed) throw new Error("Forbidden");
  
  // Create comment...
}
```

### 10.3 Citation Authorization

Citations inherit permissions from their target:

```typescript
// POST /api/citations/attach
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();

  const { targetType, targetId, sourceId } = await req.json();

  // Validate user can access target
  // (Specific validation depends on targetType)
  
  // For comments: check stack permissions
  if (targetType === "comment") {
    const comment = await prisma.feedPost.findUnique({
      where: { id: BigInt(targetId) },
      select: { author_id: true, parent_id: true },
    });
    // Allow if user is comment author or has stack edit rights
  }
  
  // For claims/arguments: check deliberation access
  if (targetType === "claim" || targetType === "argument") {
    // Deliberation access check
  }
  
  // Create citation...
}
```

### 10.4 Storage Security

```typescript
// Supabase storage buckets
const buckets = {
  pdfs: {
    public: false,           // Requires signed URLs
    allowedMimeTypes: ["application/pdf"],
    fileSizeLimit: "50MB",
  },
  "pdf-thumbs": {
    public: true,            // Thumbnails are public
    allowedMimeTypes: ["image/png"],
    fileSizeLimit: "10MB",
  },
};

// Generate signed URL for PDF access
const { data } = await supabase.storage
  .from("pdfs")
  .createSignedUrl(key, 3600); // 1 hour expiry
```

---

## 11. Performance Considerations

### 11.1 Thumbnail Generation

```
PDF Upload
    │
    ├─── Client-side preview generation (optional)
    │    • PDF.js renders first page to canvas
    │    • Canvas exported as PNG data URL
    │    • Sent with upload as base64
    │
    └─── Server-side fallback
         • Detect missing thumbnails
         • Queue background job
         • Generate via pdf-lib or similar
```

### 11.2 Feed Hydration Optimization

```typescript
// Batch fetch stack covers instead of N+1 queries
const stackIds = posts
  .filter(p => p.type === "LIBRARY" && p.stack_id)
  .map(p => p.stack_id!);

// Single query for all stack thumbnails
const items = await prisma.libraryPost.findMany({
  where: { stack_id: { in: stackIds } },
  orderBy: { created_at: "asc" },
  select: { stack_id: true, thumb_urls: true },
});

// Group and extract first thumb per stack
const stackCovers = groupBy(items, 'stack_id', (items) => ({
  urls: items.map(i => i.thumb_urls?.[0]).filter(Boolean),
  size: items.length,
}));
```

### 11.3 Citation Aggregation

```typescript
// Efficient source aggregation for deliberation
// Uses two queries instead of per-entity lookups

// 1. Get all entity IDs
const [argumentIds, claimIds] = await Promise.all([
  prisma.argument.findMany({ where: { deliberationId }, select: { id: true } }),
  prisma.claim.findMany({ where: { deliberationId }, select: { id: true } }),
]);

// 2. Single citation query with OR
const citations = await prisma.citation.findMany({
  where: {
    OR: [
      { targetType: "argument", targetId: { in: argumentIds.map(a => a.id) } },
      { targetType: "claim", targetId: { in: claimIds.map(c => c.id) } },
    ],
  },
  include: { source: true },
});

// 3. In-memory aggregation
const sourceMap = new Map();
citations.forEach(c => {
  const entry = sourceMap.get(c.sourceId) || { usageCount: 0, ... };
  entry.usageCount++;
  sourceMap.set(c.sourceId, entry);
});
```

### 11.4 Drag-and-Drop Performance

```typescript
// Optimistic updates with deferred server sync
function onDragEnd(evt) {
  // 1. Immediate local state update
  const next = arrayMove(items, oldIndex, newIndex);
  setItems(next);

  // 2. Async server sync (non-blocking)
  orderInputRef.current.value = JSON.stringify(next.map(i => i.id));
  formRef.current.requestSubmit();
  
  // Server action revalidates path on completion
}
```

### 11.5 Caching Strategies

| Data | Cache Strategy |
|------|---------------|
| Stack metadata | SWR with revalidateOnFocus |
| Thumbnails | CDN + browser cache (long TTL) |
| Citations | SWR with event-based invalidation |
| Evidence aggregates | Fresh fetch on tab open |

---

## 12. Appendices

### Appendix A: File Reference

| Path | Purpose |
|------|---------|
| `lib/actions/stack.actions.ts` | Server actions for stack operations |
| `lib/server/stack-helpers.ts` | Stack creation utilities |
| `components/stack/SortablePdfGrid.tsx` | Drag-and-drop PDF grid |
| `components/stack/StackDiscussion.tsx` | Server-rendered comment thread |
| `components/stack/LiftToDebateButton.tsx` | Promote comment to claim |
| `components/stack/CommentComposer.tsx` | Comment input with citations |
| `components/citations/CitePickerInlinePro.tsx` | Full citation picker |
| `components/citations/CitationCollector.tsx` | Pre-composition citation collection |
| `components/citations/LibrarySearchModal.tsx` | Library item search |
| `components/citations/CitePickerModal.tsx` | Modal wrapper for picker |
| `components/citations/SourcesSidebar.tsx` | Sidebar source display |
| `components/cards/LibraryCard.tsx` | Feed card for stacks/PDFs |
| `components/evidence/EvidenceList.tsx` | Deliberation sources view |
| `app/stacks/[slugOrId]/page.tsx` | Stack page route |
| `app/api/library/upload/route.ts` | PDF upload endpoint |
| `app/api/library/search/route.ts` | Library search endpoint |
| `app/api/citations/resolve/route.ts` | Source resolution |
| `app/api/citations/attach/route.ts` | Citation attachment |
| `app/api/comments/lift/route.ts` | Lift to debate |
| `app/api/deliberations/[id]/sources/route.ts` | Evidence aggregation |

### Appendix B: Environment Variables

```env
# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# Database
DATABASE_URL=postgresql://...

# (Optional) External metadata APIs
CROSSREF_API_KEY=...
```

### Appendix C: Event Bus Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `stacks:changed` | `{ stackId, op, postId?, userId? }` | Add/remove/reorder posts, subscribe |
| `comments:changed` | `{ stackId, op }` | Add/delete comments |
| `citations:changed` | `{ targetType, targetId, sourceId? }` | Attach citation |
| `deliberations:created` | `{ id, hostType, hostId, source }` | Lift creates deliberation |
| `dialogue:moves:refresh` | `{ moveId, deliberationId, kind }` | Lift creates move |

### Appendix D: Glossary

| Term | Definition |
|------|------------|
| **Stack** | A curated collection of documents (LibraryPosts) |
| **LibraryPost** | Individual document (PDF) with metadata and thumbnails |
| **Source** | Canonical reference entity for citations (URL, DOI, or LibraryPost-backed) |
| **Citation** | Link between a Source and a target entity (argument, claim, etc.) |
| **Lift** | Promote a stack comment to a claim in the deliberation system |
| **Fingerprint** | SHA1 hash for Source deduplication |
| **EvidenceList** | Aggregated view of all sources in a deliberation |

### Appendix E: Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         END-TO-END DATA FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. UPLOAD                                                                       │
│     User → StackAddModal → /api/library/upload → Supabase → LibraryPost         │
│                                                                                  │
│  2. ORGANIZE                                                                     │
│     SortablePdfGrid → setStackOrder action → Stack.order update                 │
│                                                                                  │
│  3. DISCUSS                                                                      │
│     CommentComposer → addStackComment action → FeedPost (child of root)         │
│                                                                                  │
│  4. CITE                                                                         │
│     CiteButton → /api/citations/resolve → Source                                │
│                → /api/citations/attach → Citation                               │
│                                                                                  │
│  5. LIFT                                                                         │
│     LiftToDebateButton → /api/comments/lift → Deliberation + Claim + Move       │
│                                                                                  │
│  6. DELIBERATE                                                                   │
│     DeepDivePanel → EvidenceList → /api/deliberations/{id}/sources              │
│     PropositionComposer → CitationCollector → resolve + attach                  │
│                                                                                  │
│  7. SHARE                                                                        │
│     Stack → FeedPost (LIBRARY) → LibraryCard in feed                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-15 | Initial comprehensive documentation |

---

*This document is part of the Mesh Platform Architecture Documentation Suite.*  
*For questions or updates, consult the ArgumentChainDevelopmentDocuments folder.*
