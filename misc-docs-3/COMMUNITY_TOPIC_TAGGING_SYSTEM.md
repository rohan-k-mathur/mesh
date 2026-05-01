# Community Topic Tagging System

**Date**: November 4, 2025  
**Purpose**: Manual, community-driven topic/hashtag system for filtering, clustering, and exploring content across Mesh

---

## Executive Summary

A **user-driven tagging system** that allows community members to collaboratively tag deliberations, arguments, claims, and cards with topics/hashtags. Unlike automated extraction, this system empowers users to:

1. **Manually add tags** via UI interactions in DeepDivePanel, Hub, and Plexus
2. **Vote on tag relevance** to surface the most accurate topic associations
3. **Discover content** by browsing tag clouds, trending topics, and related discussions
4. **Filter ludics forests** by topic scope (already integrated with scoped designs)
5. **Build taxonomy** through community consensus and tag hierarchies

**Key Principle**: **Additive** - users can add tags, vote on them, but not remove others' tags (only admins/mods)

---

## Core Concepts

### 1. Tag Structure

```typescript
interface Topic {
  id: string;
  slug: string;              // "climate-policy", "carbon-tax"
  displayName: string;       // "Climate Policy", "Carbon Tax"
  description?: string;      // Optional longer explanation
  category?: string;         // "Science", "Policy", "Ethics", etc.
  
  // Hierarchy
  parentTopicId?: string;    // Optional parent (e.g., "energy" → "renewable-energy")
  
  // Community metrics
  usageCount: number;        // How many entities tagged
  upvotes: number;           // Community endorsement of tag's usefulness
  
  // Curation
  isOfficial: boolean;       // Curated by moderators
  isDeprecated: boolean;     // Replaced by better tag
  replacedBy?: string;       // Redirect to new tag
  
  createdById: string;
  createdAt: Date;
}
```

### 2. Tag Application (Junction)

```typescript
interface TopicTag {
  id: string;
  topicId: string;
  
  // Polymorphic target (what's being tagged)
  targetType: 'deliberation' | 'argument' | 'claim' | 'card' | 'room';
  targetId: string;
  
  // Community validation
  upvotes: number;
  downvotes: number;
  confidence: number;        // upvotes / (upvotes + downvotes)
  
  // Provenance
  addedById: string;
  addedAt: Date;
  
  // Curation
  isPinned: boolean;         // Moderator-pinned as canonical tag
  isHidden: boolean;         // Flagged as spam/irrelevant
}
```

### 3. Tag Suggestions (User → Topic Discovery)

```typescript
interface UserTopicSubscription {
  id: string;
  userId: string;
  topicId: string;
  
  // Notification preferences
  notifyOnNewContent: boolean;
  notifyOnVotes: boolean;
  
  followedAt: Date;
}
```

---

## Schema Extensions

### Add to `schema.prisma`

```prisma
// ============================================================================
// Community Topic Tagging System
// ============================================================================

model Topic {
  id          String   @id @default(cuid())
  slug        String   @unique // URL-friendly: "climate-policy"
  displayName String              // "Climate Policy"
  description String?  @db.Text
  category    String?             // "Science", "Policy", "Method", etc.
  
  // Hierarchy
  parentTopicId String?
  parentTopic   Topic?  @relation("TopicHierarchy", fields: [parentTopicId], references: [id])
  childTopics   Topic[] @relation("TopicHierarchy")
  
  // Community metrics
  usageCount  Int     @default(0)  // Cached count of tags using this topic
  upvotes     Int     @default(0)  // Community endorsement
  
  // Curation
  isOfficial   Boolean @default(false) // Curated by mods
  isDeprecated Boolean @default(false)
  replacedById String?
  replacedBy   Topic?  @relation("TopicReplacement", fields: [replacedById], references: [id])
  replacements Topic[] @relation("TopicReplacement")
  
  // Provenance
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tags          TopicTag[]
  subscriptions UserTopicSubscription[]
  
  // Ludics integration (existing)
  // LudicDesigns already have `scope: "Topic:<id>"` field
  
  @@index([slug])
  @@index([category])
  @@index([usageCount])
  @@index([createdAt])
}

model TopicTag {
  id       String @id @default(cuid())
  topicId  String
  topic    Topic  @relation(fields: [topicId], references: [id], onDelete: Cascade)
  
  // Polymorphic target (what's being tagged)
  targetType String // 'deliberation' | 'argument' | 'claim' | 'card' | 'room'
  targetId   String
  
  // Community validation
  upvotes    Int     @default(0)
  downvotes  Int     @default(0)
  confidence Float   @default(0.5) // upvotes / (upvotes + downvotes), updated on vote
  
  // Provenance
  addedById String
  addedAt   DateTime @default(now())
  
  // Curation
  isPinned Boolean @default(false) // Moderator endorsement
  isHidden Boolean @default(false) // Spam/off-topic
  
  // Relations
  votes TopicTagVote[]
  
  @@unique([topicId, targetType, targetId]) // Can't tag same entity twice with same topic
  @@index([targetType, targetId])
  @@index([topicId, confidence])
  @@index([addedById])
}

model TopicTagVote {
  id     String   @id @default(cuid())
  tagId  String
  tag    TopicTag @relation(fields: [tagId], references: [id], onDelete: Cascade)
  userId String
  value  Int // +1 (upvote) or -1 (downvote)
  
  votedAt DateTime @default(now())
  
  @@unique([tagId, userId]) // One vote per user per tag
  @@index([userId])
}

model UserTopicSubscription {
  id      String @id @default(cuid())
  userId  String
  topicId String
  topic   Topic  @relation(fields: [topicId], references: [id], onDelete: Cascade)
  
  // Notification preferences
  notifyOnNewContent Boolean @default(true)
  notifyOnVotes      Boolean @default(false)
  
  followedAt DateTime @default(now())
  
  @@unique([userId, topicId])
  @@index([userId])
  @@index([topicId])
}
```

---

## API Endpoints

### Topic CRUD

#### `GET /api/topics`
**Purpose**: List/search topics

**Query params**:
- `q`: Search query (matches slug, displayName, description)
- `category`: Filter by category
- `popular`: Sort by usageCount (trending topics)
- `cursor`: Pagination cursor
- `limit`: Results per page (default 20)

**Response**:
```json
{
  "topics": [
    {
      "id": "topic_123",
      "slug": "climate-policy",
      "displayName": "Climate Policy",
      "description": "Discussions on climate change policies",
      "category": "Policy",
      "usageCount": 47,
      "upvotes": 23,
      "isOfficial": true,
      "parentTopic": {
        "id": "topic_456",
        "slug": "environment",
        "displayName": "Environment"
      }
    }
  ],
  "nextCursor": "..."
}
```

#### `POST /api/topics`
**Purpose**: Create new topic

**Body**:
```json
{
  "slug": "carbon-tax",
  "displayName": "Carbon Tax",
  "description": "Discussions on carbon pricing mechanisms",
  "category": "Policy",
  "parentTopicId": "topic_123" // optional
}
```

**Response**: `201 Created` with topic object

**Validation**:
- Slug must be unique, lowercase, alphanumeric + hyphens
- DisplayName required
- Category from enum (Science, Policy, Ethics, Method, etc.)

#### `GET /api/topics/[slug]`
**Purpose**: Get topic details + related content

**Response**:
```json
{
  "topic": { ... },
  "stats": {
    "deliberationCount": 12,
    "argumentCount": 45,
    "claimCount": 89,
    "subscriberCount": 23
  },
  "recentTags": [
    {
      "id": "tag_789",
      "targetType": "deliberation",
      "targetId": "delib_abc",
      "target": {
        "title": "Carbon Tax vs Cap-and-Trade",
        "snippet": "..."
      },
      "confidence": 0.87,
      "addedBy": { "id": "user_1", "name": "Alice" },
      "addedAt": "2025-11-04T..."
    }
  ],
  "relatedTopics": [...]
}
```

#### `PATCH /api/topics/[slug]`
**Purpose**: Update topic (moderator only)

**Body**: Partial topic object

**Response**: Updated topic

#### `DELETE /api/topics/[slug]`
**Purpose**: Soft-delete (set isDeprecated=true)

**Requires**: Moderator role

---

### Tagging Actions

#### `POST /api/topics/[slug]/tag`
**Purpose**: Add topic tag to entity

**Body**:
```json
{
  "targetType": "deliberation",
  "targetId": "delib_abc"
}
```

**Response**: `201 Created` with TopicTag object

**Side effects**:
- Increments `Topic.usageCount`
- Creates notification for topic subscribers (if enabled)

#### `POST /api/tags/[tagId]/vote`
**Purpose**: Upvote/downvote a tag

**Body**:
```json
{
  "value": 1  // +1 or -1
}
```

**Response**: Updated tag with new confidence score

**Side effects**:
- Updates `TopicTag.confidence = upvotes / (upvotes + downvotes)`
- Updates `TopicTag.upvotes` or `downvotes`

#### `GET /api/[targetType]/[targetId]/topics`
**Purpose**: Get all topics tagged on an entity

**Example**: `GET /api/deliberations/delib_abc/topics`

**Response**:
```json
{
  "tags": [
    {
      "id": "tag_789",
      "topic": {
        "id": "topic_123",
        "slug": "climate-policy",
        "displayName": "Climate Policy"
      },
      "confidence": 0.87,
      "upvotes": 20,
      "downvotes": 3,
      "isPinned": false,
      "addedBy": { "name": "Alice" },
      "userVote": 1  // Current user's vote (if any)
    }
  ]
}
```

---

## UI Components

### 1. TopicPicker (Shared Component)

**Location**: `components/topics/TopicPicker.tsx`

**Usage**: DeepDivePanel, Hub filters, Plexus sidebar

**Features**:
- Typeahead search (queries `/api/topics?q=...`)
- Multi-select chips (like MUI Autocomplete)
- Shows topic category badges
- Displays usage count
- "Create new topic" inline option
- Keyboard navigation (arrow keys, enter to select)

**Props**:
```typescript
interface TopicPickerProps {
  value: Topic[];                    // Selected topics
  onChange: (topics: Topic[]) => void;
  placeholder?: string;
  maxSelections?: number;            // Limit selections
  allowCreate?: boolean;             // Allow creating new topics
  filterByCategory?: string[];       // Only show certain categories
}
```

**Visual Design**:
```
┌─────────────────────────────────────────────────┐
│ Search topics or create new...                 │ 🔍
├─────────────────────────────────────────────────┤
│ ✓ Climate Policy [Policy] (47 uses)            │ ← Selected
│   Carbon Tax [Policy] (23 uses)                │
│   Renewable Energy [Science] (89 uses)         │
│   + Create "solar-subsidies"                   │ ← Create option
└─────────────────────────────────────────────────┘

Selected: [Climate Policy ×] [Carbon Tax ×]
```

---

### 2. TopicTag Badge

**Location**: `components/topics/TopicBadge.tsx`

**Usage**: Inline display of topic chips

**Features**:
- Displays topic name
- Category color-coding
- Click to filter/navigate
- Hover shows usage count

**Visual**:
```
[🏛️ Climate Policy] [💰 Carbon Tax] [⚡ Renewables]
```

**Props**:
```typescript
interface TopicBadgeProps {
  topic: Topic;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  onRemove?: () => void;  // Show × button if provided
}
```

---

### 3. EntityTopicTagger

**Location**: `components/topics/EntityTopicTagger.tsx`

**Usage**: Embedded in DeepDivePanel, Card modals, Argument popovers

**Features**:
- Shows existing tags with confidence scores
- Upvote/downvote buttons
- "Add tag" button → opens TopicPicker
- Moderator: Pin/Hide tag actions
- User's vote highlighted

**Visual**:
```
┌─────────────────────────────────────────────────┐
│ Topics (3)                             [+ Add]  │
├─────────────────────────────────────────────────┤
│ 🏛️ Climate Policy                87% ⬆ 20 ⬇ 3  │ ← You upvoted
│ 💰 Carbon Tax                    73%  ⬆ 15 ⬇ 5  │
│ ⚡ Renewable Energy              100%  ⬆ 10 ⬇ 0  │ (Pinned)
└─────────────────────────────────────────────────┘
```

**Props**:
```typescript
interface EntityTopicTaggerProps {
  targetType: 'deliberation' | 'argument' | 'claim' | 'card';
  targetId: string;
  compact?: boolean;  // Show condensed version
}
```

---

### 4. Hub Topic Filter

**Location**: `app/hub/ui/Hub.tsx` (extend existing filter bar)

**Features**:
- TopicPicker in filter bar
- "Trending topics" dropdown
- Topic cloud visualization
- Filter by multiple topics (AND/OR logic)

**Updated Hub Filter Bar**:
```
┌──────────────────────────────────────────────────────────┐
│ 🔍 Search...      [Topics ▼]  [Sort ▼]  [View ▼]  ⚙️    │
└──────────────────────────────────────────────────────────┘

Topics dropdown:
┌──────────────────────────────────────────┐
│ 🔥 Trending                              │
│   • Climate Policy (47)                  │
│   • Carbon Tax (23)                      │
│   • Renewable Energy (89)                │
│                                          │
│ 📂 Browse by Category                    │
│   • Science (23 topics)                  │
│   • Policy (18 topics)                   │
│   • Ethics (12 topics)                   │
│                                          │
│ 🔍 Search topics...                      │
└──────────────────────────────────────────┘
```

---

### 5. DeepDivePanel Topic Integration

**Location**: `components/deepdive/DeepDivePanelV2.tsx`

**Integration Points**:

#### A. Header Section
Add topic chips next to deliberation title:
```
┌─────────────────────────────────────────────────┐
│ Carbon Tax vs Cap-and-Trade                     │
│ [🏛️ Climate Policy] [💰 Carbon Tax] [+ Add]    │
└─────────────────────────────────────────────────┘
```

#### B. Ludics Tab → Forest View
Filter designs by topic:
```
┌─────────────────────────────────────────────────┐
│ Ludics Forest                                   │
│ [Scope: Topic-Based ▼]  [Filter Topics... ▼]   │
│                                                 │
│ 🏛️ Climate Policy (3 designs)                  │
│ ├─ P: 5 acts   O: 3 acts   Status: DIVERGENT  │
│ └─ [View Defense Tree]                         │
│                                                 │
│ 💰 Carbon Tax (2 designs)                      │
│ ├─ P: 8 acts   O: 6 acts   Status: CONVERGENT │
│ └─ [View Defense Tree]                         │
└─────────────────────────────────────────────────┘
```

#### C. Argument Nodes
Add tag button to argument cards in Plexus view:
```
┌────────────────────────────────────────┐
│ Carbon taxes reduce emissions         │
│ [🏛️ Climate] [💰 Tax]        [🏷️ Tag] │
└────────────────────────────────────────┘
```

---

### 6. Plexus Topic Sidebar

**Location**: `components/plexus/PlexusSidebar.tsx` (new component)

**Features**:
- Topic filter panel (like layers panel)
- Multi-select topics
- Shows node count per topic
- "Show only tagged nodes" toggle
- Topic legend with color mapping

**Visual**:
```
┌────────────────────────────────┐
│ Topics                         │
├────────────────────────────────┤
│ ☑ Climate Policy (23 nodes)   │
│ ☐ Carbon Tax (12 nodes)       │
│ ☑ Renewable Energy (45 nodes) │
│ ☐ Nuclear (8 nodes)           │
│                                │
│ [+ Add Topic Filter]           │
│                                │
│ ☐ Show only tagged nodes       │
└────────────────────────────────┘
```

---

## User Workflows

### Workflow 1: Tagging a Deliberation

**Persona**: Alice exploring climate debates

1. Opens Hub → Searches "carbon tax"
2. Clicks deliberation "Carbon Tax vs Cap-and-Trade"
3. DeepDivePanel opens → Header shows existing tags: `[Climate Policy]`
4. Alice clicks **[+ Add]** → TopicPicker opens
5. Types "renewable" → Sees "Renewable Energy (89 uses)"
6. Selects it → Tag added with confidence 50%
7. Other users upvote → Confidence increases to 87%

---

### Workflow 2: Discovering Content by Topic

**Persona**: Bob researching renewable energy

1. Opens Hub → Clicks "Browse Topics"
2. Selects category "Science" → Sees list of topics
3. Clicks "Renewable Energy" topic
4. Lands on `/topics/renewable-energy` page showing:
   - Topic description
   - 89 tagged deliberations
   - 234 tagged arguments
   - Related topics (Solar, Wind, Hydro)
5. Filters by "Most debated" → Sees top deliberations
6. Clicks "Subscribe" → Gets notifications on new content

---

### Workflow 3: Filtering Ludics Forest by Topic

**Persona**: Charlie analyzing debate structure

1. Opens DeepDivePanel for climate deliberation
2. Clicks "Ludics" tab → Forest view shows 5 topic scopes
3. Too many scopes → Clicks **[Filter Topics...]**
4. Selects only "Carbon Tax" and "Nuclear"
5. Forest view updates → Shows only 2 scopes
6. Each scope has P/O design pair, acts, trace status
7. Charlie compares defensive strategies per topic

---

### Workflow 4: Creating a New Topic

**Persona**: Dana moderating a new debate area

1. Opens Hub → Clicks "Create Topic" button
2. Modal opens:
   - Slug: `carbon-border-adjustment`
   - Display Name: `Carbon Border Adjustment`
   - Description: `Policies to prevent carbon leakage via tariffs`
   - Category: `Policy`
   - Parent Topic: `Climate Policy` (selected from picker)
3. Clicks "Create" → Topic created
4. Dana tags 3 relevant deliberations immediately
5. Topic appears in trending list (3 uses)

---

## Curation & Moderation

### Moderator Powers

1. **Pin Tags**: Mark tag as canonical for entity
2. **Hide Tags**: Remove spam/off-topic tags
3. **Merge Topics**: Combine duplicates (e.g., "climate-change" + "global-warming")
4. **Deprecate Topics**: Mark as replaced by better tag
5. **Curate Official Topics**: Create pre-approved topic list

### Community Self-Moderation

1. **Voting**: Users upvote/downvote tags
2. **Confidence Threshold**: Tags below 30% confidence are grayed out
3. **Flag for Review**: Users can flag inappropriate tags
4. **Usage Count**: Popular topics rise to top

### Anti-Spam Measures

1. **Rate Limiting**: Max 10 tags per user per hour
2. **New User Restrictions**: Accounts < 7 days can only use existing topics
3. **Duplicate Detection**: Can't tag same entity twice with same topic
4. **Review Queue**: New topics require mod approval if creator is new user

---

## Integration with Existing Features

### 1. Ludics Scoped Designs

**Already integrated!** The `LudicDesign.scope` field supports `"Topic:<id>"` format.

**Flow**:
1. User tags deliberation with "Climate Policy"
2. Compilation runs with `scopingStrategy: "topic"`
3. Creates designs with `scope: "Topic:topic_123"`
4. Forest view groups designs by topic
5. Each topic has independent P/O pair

**API Update**:
```typescript
// GET /api/ludics/designs?deliberationId=xxx&scopingStrategy=topic
// Returns designs grouped by Topic tag

{
  "designs": [
    {
      "scope": "Topic:topic_123",
      "scopeType": "topic",
      "scopeMetadata": {
        "label": "Climate Policy",
        "topicId": "topic_123",
        "topicSlug": "climate-policy",
        "moveCount": 15,
        "actors": { ... }
      },
      "participantId": "Proponent",
      "acts": [ ... ]
    }
  ]
}
```

---

### 2. Hub Discovery

**Enhancement**: Add topic-based exploration

**New Hub Sections**:

#### A. Topic Cloud (Home Page)
```
Popular Topics:

[Climate Policy]₄₇  [Carbon Tax]₂₃  [Renewable Energy]₈₉
[Nuclear]₁₂  [Solar]₃₄  [Wind]₂₈  [Hydro]₁₅
```
- Size based on usage count
- Click → filter hub by topic

#### B. Topic Sidebar
```
┌─────────────────────────┐
│ Browse Topics           │
├─────────────────────────┤
│ 🔥 Trending             │
│   Climate Policy (47)   │
│   Renewables (89)       │
│                         │
│ 📂 Categories           │
│   Science (23)          │
│   Policy (18)           │
│   Ethics (12)           │
│   Method (8)            │
└─────────────────────────┘
```

---

### 3. Plexus Visualization

**Enhancement**: Topic-based node coloring

**Features**:
1. Color nodes by primary topic
2. Filter graph to show only tagged nodes
3. Cluster by topic (force-directed layout)
4. Edge highlighting for cross-topic connections

**Implementation**:
```typescript
// In Plexus component
const nodeColor = (node: Node) => {
  const primaryTopic = node.topics?.[0]; // Highest confidence tag
  return topicColorMap[primaryTopic.category] || '#gray';
};

const filteredNodes = selectedTopics.length > 0
  ? nodes.filter(n => n.topics.some(t => selectedTopics.includes(t.id)))
  : nodes;
```

---

### 4. Search Enhancement

**Extend search to include topics**:

```typescript
// GET /api/search?q=carbon&type=all

{
  "results": {
    "deliberations": [ ... ],
    "topics": [
      {
        "type": "topic",
        "id": "topic_123",
        "slug": "carbon-tax",
        "displayName": "Carbon Tax",
        "usageCount": 23,
        "matchReason": "slug match"
      }
    ]
  }
}
```

User clicks topic → Redirects to `/topics/carbon-tax`

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

**Schema & API**:
- [ ] Add `Topic`, `TopicTag`, `TopicTagVote`, `UserTopicSubscription` models
- [ ] Run `npx prisma db push`
- [ ] Implement CRUD endpoints: `/api/topics`, `/api/topics/[slug]`
- [ ] Implement tagging endpoints: `/api/topics/[slug]/tag`, `/api/tags/[tagId]/vote`

**Components**:
- [ ] Build `TopicPicker` component (typeahead, multi-select)
- [ ] Build `TopicBadge` component (display chip)
- [ ] Build `EntityTopicTagger` component (tag management UI)

**Testing**:
- [ ] Unit tests for tag voting logic (confidence calculation)
- [ ] API integration tests for tagging flow

---

### Phase 2: Hub Integration (Week 2)

**Hub UI**:
- [ ] Add topic filter to Hub filter bar
- [ ] Create "Browse Topics" page (`/topics`)
- [ ] Create topic detail page (`/topics/[slug]`)
- [ ] Add trending topics section to Hub home

**Search**:
- [ ] Extend search API to include topics
- [ ] Add topic results to search UI

**Testing**:
- [ ] E2E test: Create topic → Tag deliberation → Find via hub

---

### Phase 3: DeepDivePanel Integration (Week 3)

**Panel Enhancements**:
- [ ] Add topic chips to deliberation header
- [ ] Add EntityTopicTagger to Ludics tab
- [ ] Add topic filter to Forest view
- [ ] Show topic metadata in scope cards

**Argument Tagging**:
- [ ] Add tag button to argument cards in grid view
- [ ] Show topic chips on claim nodes

**Testing**:
- [ ] E2E test: Tag argument → Filter forest by topic

---

### Phase 4: Plexus Integration (Week 4)

**Plexus UI**:
- [ ] Build PlexusSidebar with topic filters
- [ ] Implement topic-based node coloring
- [ ] Add "Show only tagged nodes" toggle
- [ ] Implement topic clustering layout

**Advanced Features**:
- [ ] Cross-topic edge highlighting
- [ ] Topic co-occurrence heatmap
- [ ] Export tagged subgraph

**Testing**:
- [ ] E2E test: Filter Plexus by topic → Verify node visibility

---

### Phase 5: Curation & Community (Week 5)

**Moderation**:
- [ ] Build mod dashboard for topic management
- [ ] Implement pin/hide/merge actions
- [ ] Add review queue for new topics

**Gamification**:
- [ ] Track user contribution stats (tags added, votes cast)
- [ ] Display "Top Taggers" leaderboard
- [ ] Award badges for curation (e.g., "Taxonomist")

**Analytics**:
- [ ] Topic growth over time
- [ ] Tag confidence trends
- [ ] Cross-topic collaboration metrics

---

## Open Questions

### 1. Auto-Suggest Topics?

**Question**: Should we suggest topics based on content analysis?

**Options**:
- **A. Pure Manual**: Users add all tags (high quality, slow growth)
- **B. Hybrid**: AI suggests, users approve (faster growth, may need cleanup)
- **C. Auto + Override**: Auto-tag, users can remove (fastest, risk of spam)

**Recommendation**: Start with **Pure Manual** (Option A), add AI suggestions in Phase 6 after taxonomy stabilizes.

---

### 2. Topic Hierarchy Depth?

**Question**: How many levels of parent/child topics?

**Options**:
- **Flat**: No hierarchy (simpler, less structure)
- **2-Level**: Category → Topic (e.g., Science → Climate)
- **3+ Levels**: Deep taxonomy (complex, more organized)

**Recommendation**: **2-Level** to start (category is parent, topics are children). Expand if users request deeper structure.

---

### 3. Tag Ownership?

**Question**: Can users remove their own tags?

**Options**:
- **A. Permanent**: Tags can't be removed (prevents abuse)
- **B. Self-Delete**: Users can remove own tags (flexibility)
- **C. Time-Limited**: Can remove within 24h (compromise)

**Recommendation**: **Self-Delete** (Option B) - empowers users, trust community moderation to flag bad actors.

---

### 4. Topic Name Conflicts?

**Question**: What if two users create similar topics?

**Examples**:
- "climate-change" vs "global-warming"
- "carbon-tax" vs "carbon-pricing"

**Solutions**:
- **Slug Validation**: Show existing similar slugs before creating
- **Merge Tool**: Moderators can merge duplicates
- **Redirect**: Deprecated topics redirect to canonical version

**Recommendation**: Implement all three - prevention, merge tool, and redirects.

---

### 5. Topic Scope?

**Question**: Should topics be global or per-room/community?

**Options**:
- **Global**: One topic namespace across all of Mesh
- **Scoped**: Each room/agora has own topics
- **Hybrid**: Global + room-specific

**Recommendation**: **Global** to start - builds unified taxonomy. Add room-specific topics in Phase 6 if communities diverge significantly.

---

## Success Metrics

### Adoption Metrics

- **Topic Count**: 100+ topics within 3 months
- **Tagged Entities**: 50%+ deliberations have ≥1 tag
- **Active Taggers**: 20%+ users add tags monthly
- **Tag Quality**: 80%+ tags have confidence >70%

### Engagement Metrics

- **Topic Page Views**: 1000+ views/week
- **Tag Votes**: 500+ votes/week
- **Subscriptions**: 30%+ users follow ≥1 topic
- **Discovery**: 40%+ hub traffic from topic filters

### Quality Metrics

- **Consensus**: Avg confidence score >75%
- **Curation**: <5% tags flagged as spam
- **Coverage**: 80%+ topics have descriptions
- **Hierarchy**: 60%+ topics have parent category

---

## Conclusion

This **community-driven topic tagging system** provides:

1. ✅ **Manual Control**: Users decide what tags are relevant
2. ✅ **Community Validation**: Voting ensures tag quality
3. ✅ **Flexible Discovery**: Browse, filter, cluster by topics
4. ✅ **Ludics Integration**: Already wired into scoped designs
5. ✅ **Additive Growth**: Starts simple, grows with community

**Next Steps**:
1. Review this design
2. Approve schema changes
3. Begin Phase 1 implementation (Core Infrastructure)
4. Run `npx prisma db push` after schema addition
5. Build TopicPicker component
6. Wire into DeepDivePanel header as first integration point

**Ready to build!** 🚀
