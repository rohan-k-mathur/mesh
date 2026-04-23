# Social Platform Features

Feed, Posts, Profiles, Friends, Messaging, Rooms & Stacks · /test/social-features

10 Features · 17+ post types · 4 modules

**The social layer that makes discourse stick.**

Mesh is a full social platform — feed, profiles, friends, messaging, rooms, libraries — designed as community infrastructure rather than an extraction apparatus. No algorithm. No ads. No engagement optimization. Chronological feed. Community-owned data. Every interaction is real-time via Supabase broadcast. When a community's conversation needs structure, the deliberation engine is one transition away. When it doesn't, the social layer is complete on its own.

- Real-time Feed
- 17+ Post Types
- Mutual-Follow Friends
- DMs + Group Chat
- Spatial Canvas Rooms
- Prediction Markets
- Friend Suggestions
- Curated Stacks

---

## Platform anatomy — four social layers

### 1. Feed & Posts
**Feed is the surface.**
Chronological, 17+ post types, real-time via Supabase.

### 2. Profiles & Social
**Identity is the anchor.**
Profiles, attributes, mutual-follow friends, discovery.

### 3. Messaging
**Chat is the glue.**
DMs, group chats, drifts, polls, starring, quoting.

### 4. Rooms & Spaces
**Rooms are the canvas.**
Spatial x/y posts, edge connections, stacks, collaboration.

---

## Feature Inventory

10 feature areas across 4 modules. All components are production-ready.

### Step 1.1 — Real-Time Feed
Infinite-scrolling feed with live updates via Supabase broadcast. Done.

- `RealtimeFeed` — infinite scroll with cursor-based pagination
- Dual post model: `FeedPost` (main feed) + `RealtimePost` (room-scoped)
- Real-time updates via Supabase broadcast channels
- Post type filtering (TEXT, IMAGE, VIDEO, MUSIC, ARTICLE…)
- Global feed at `/` and room-scoped feeds per canvas
- Optional animated scroll mode for visual presentation

### Step 1.2 — 17+ Post Types
Rich content model with type-specific renderers in `PostCard`. Done.

- TEXT — plain text posts
- IMAGE / IMAGE_COMPUTE — uploads & AI-generated images
- VIDEO — YouTube and embedded video players
- MUSIC — SoundCloud player integration
- GALLERY — multi-image carousel with swipe navigation
- ARTICLE — long-form with hero image, reading time, slug
- PREDICTION — LMSR prediction market with YES/NO trading
- PRODUCT_REVIEW — structured reviews with claims & vouching
- CODE, DRAW, LIBRARY, PORTAL, LIVECHAT, THREAD, DOCUMENT, ROOM_CANVAS
- `CreateFeedPost` — type selector + dedicated modals per type

### Step 1.3 — Post Interactions
Upvote, downvote, comment, repost, share — all with optimistic UI updates. Done.

- `LikeButton` — like/dislike/unlike with optimistic state updates
- `ExpandButton` — inline comment thread expansion
- `ReplicateButton` — repost content to your own feed
- `ShareButton` — copy link + external platform sharing
- `TimerButton` — set post expiration date
- `DeleteCardButton` — author-only post deletion
- Nested comment replies with threaded display

### Step 2.1 — User Profiles
ProfileHeader, tabbed content, attributes & customization. Done.

- `ProfileHeader` — avatar, name, @username, bio, follow/message buttons
- Profile tabs: Posts, Tagged, Messages, Friends, About
- `UserAttributes` — interests, hobbies, location, music, movies, books
- Per-attribute visibility: PUBLIC / FOLLOWERS / PRIVATE
- Profile customization page (`/profile/[id]/customize`)
- Sub-pages: `/profile/articles`, `/profile/stacks`, `/profile/deliberations`

### Step 2.2 — Friends & Following
Mutual follow = friends. Suggestions via Pinecone vector search. Done.

- `FollowButton` — three states: Follow → Following → Friends (mutual)
- `FriendsTab` — merged followings + followers with status labels
- Mutual follow = friends — no separate friend request system
- Friend suggestions: DeepSeek embeddings → Pinecone vector search
- `UserCard` — search results with inline follow button
- Automatic follow notifications via `createFollowNotification()`

### Step 2.3 — Notifications
Follow, message, trade, market — with read/unread tracking. Done.

- FOLLOW — new follower alerts
- MESSAGE — new message notifications
- TRADE_EXECUTED — prediction market trade confirmation
- MARKET_RESOLVED — prediction market outcome notifications
- Read / unread state tracking and bulk mark-read
- Notification center accessible from sidebar

### Step 3.1 — Conversations
DMs, group chats, and conversation inbox management. Done.

- `ConversationList` — unified DM + group chat inbox
- `getOrCreateDM()` — auto-creates DM on first message
- `createGroupConversation()` — group chat with title + participants
- `GroupCreationModal` + `MessageUserModal` for creation flows
- Unread count badges per conversation
- Conversation search and filtering

### Step 3.2 — Real-Time Chat
Virtualized messages, attachments, polls, drifts, quoting, starring. Done.

- `ChatRoom` — virtualized message list with Supabase realtime channels
- `MessageComposer` — rich input with attachments, polls, Sheaf composer
- `DriftChip` / `DriftPane` — threaded sub-conversations within a chat
- `QuoteBlock` — reply to specific messages with inline context
- `LinkCard` — automatic URL preview card generation
- `StarToggle` / `StarredFilterToggle` — message bookmarking and filter
- `PrivateChatDock` — floating overlay chat for quick conversations
- Cursor-based message pagination with infinite scroll

### Step 4.1 — Spatial Rooms
Canvases with posts positioned at x/y coordinates and edge connections between them. Done.

- `RealtimeRoom` — spatial canvas with x/y coordinate system
- `RealtimePost` — posts positioned on canvas with drag support
- `RealtimeEdge` — source → target connections between posts
- Room membership via `UserRealtimeRoom` join table
- Global 'Crypt' room — public-by-default community canvas
- Public vs private room access controls
- `RoomLogbookFeed` — chronological room activity log
- `RoomCanvasForm` — create posts directly on canvas

### Step 4.2 — Stacks
Curated post collections with collaborators and discussions. Done.

- Stack creation with title, description, public/private toggle
- Add/remove posts to curated collections
- Collaborator system — invite users to co-curate
- Stack discussion threads for commentary
- Stack discovery and browsing UI
- PDF stacks and library collection support

---

## Interactive Demos

Explore the feed, profile experience, messaging UI, and spatial room canvas. All data is seeded — interactions use toast feedback.

**Feed & Posts** · **Profile & Social** · **Messaging** · **Rooms & Spaces**

### Feed & Post Interactions — Interactive

The main feed uses `RealtimeFeed` with infinite scroll and live Supabase broadcast updates. Every post is rendered by `PostCard` with type-specific sections and a rich action bar.

**Filters:** All types · Text · Image · Music · Article · Prediction · Product Review

---

**R** · **Rimbaud** · @rimbaud · 2h · Text

Walked from the park through Chinatown to North Beach. The light on the fire escapes at 4pm does something the light at noon does not do. Related: the last paragraph of the Leopardi essay on the Zibaldone — the one about the specific quality of afternoon shadows in small towns.

▲ 3 · ▽ · ⊞ 1

---

**S** · **Simonides** · @simonides · 8h · Image

[Image: a photograph — black and white, high contrast, the interior of a concrete stairwell, light entering from a window at the top, the geometry of the banister casting a shadow grid across the steps]

▲ 7 · ▽ · ⊞ 0

---

**V** · **Varda** · @varda · 1d · Music

[SoundCloud Player]
Grouper — Headache

This has been on repeat for three days. The way the vocal sits underneath the guitar rather than on top of it. The voice is not performing the song. The voice is inside the song.

▲ 12 · ▽ · ⊞ 4

---

**E** · **Electra** · @electra · 1d · Article

**The Procedural Republic and the Unencumbered Self** — Michael Sandel

The Sandel piece from 1984 that still hasn't been adequately answered. The argument is not that liberalism is wrong but that it requires a self that no one has — a self prior to its ends, capable of choosing its attachments from a position of detachment. The procedural republic presupposes the unencumbered self and the unencumbered self does not exist.

14 min read

▲ 19 · ▽ · ⊞ 8

---

**P** · **Pyrrho** · @pyrrho · 2d · Prediction

**Prediction Market (LMSR)**

The EU AI Act's general-purpose AI provisions will require at least one major model provider to withdraw from the European market by end of 2027.

YES 28¢ · NO 72¢ · Vol: $4,230

[Buy YES] · [Buy NO]

▲ 6 · ▽ · ⊞ 3

---

**R** · **Rimbaud** · @rimbaud · 3d · Library

[PDF Stack: 6 documents]

**Reading group — Week 4: Attention & Perception**

- Crary, Jonathan — *Suspensions of Perception* (Ch. 2)
- Stiegler, Bernard — *Taking Care of Youth and the Generations* (Introduction)
- Simondon, Gilbert — "The Genesis of the Individual" (excerpt)
- Citton, Yves — *The Ecology of Attention* (Ch. 4-5)
- Merleau-Ponty — *Phenomenology of Perception* (Part I, §3)
- Weil, Simone — "Reflections on the Right Use of School Studies" (complete)

▲ 15 · ▽ · ⊞ 2

---

**S** · **Simonides** · @simonides · 3d · Product Review

**Review:** Libertine Libertine Smoke Trousers

★★★★☆ · 4/5

Wide straight leg, heavy cotton twill, sits high. The only trouser I've found that works for skating and doesn't look like skatewear. Seams held through six months of daily use including two rips I thought were terminal. The fabric broke in around week three — stiff before that. Size down if you're between.

▲ 4 · ▽ · ⊞ 2

---

**E** · **Elaine** · @elainem · 4d · Text

Has anyone here read the Chiesa book *The Not-Two*? 

▲ 11 · ▽ · ⊞ 6

---

[Load more posts]

---

## How It's Built

Four social layers, each with dedicated server actions, components, and real-time infrastructure.

### 1. Feed Layer
`RealtimeFeed.tsx` · `PostCard.tsx` · `CreateFeedPost.tsx`

Uses `fetchFeedPosts()` for SSR + `useInfiniteRealtimePosts` for infinite scroll. Posts are `BasePost` typed via `mapFeedPost()`.

### 2. Social Layer
`ProfileHeader.tsx` · `follow.actions.ts` · `friend-suggestions.actions.ts`

Mutual follows via `areFriends()`. Suggestions via DeepSeek embeddings → Pinecone nearest-neighbor.

### 3. Chat Layer
`ChatRoom.tsx` · `MessageComposer.tsx` · `conversation.actions.ts`

Real-time via Supabase channels. DMs auto-created with `getOrCreateDM()`. Cursor-based pagination for message history.

### 4. Spatial Layer
`realtimeroom.actions.ts` · `RoomCanvasForm.tsx` · `stack.actions.ts`

Posts at (x, y) with `RealtimePost`. Edges via `RealtimeEdge`. Stacks for curated collections with collaborators.

---

## Key Files

Primary components, pages, and server actions for the social platform layer.

| Type | Path | Description |
|------|------|-------------|
| Component | `components/shared/RealtimeFeed.tsx` | Infinite scroll feed with Supabase realtime |
| Component | `components/cards/PostCard.tsx` | Universal post renderer — 17+ type-specific sections |
| Component | `components/forms/CreateFeedPost.tsx` | Post creation with type selector & modals |
| Component | `components/shared/ProfileHeader.tsx` | Profile header with avatar, bio, action buttons |
| Component | `components/buttons/FollowButton.tsx` | Follow / Following / Friends state button |
| Action | `lib/actions/feed.actions.ts` | `createFeedPost()`, `fetchFeedPosts()` |
| Action | `lib/actions/follow.actions.ts` | `followUser()`, `unfollowUser()`, `areFriends()` |
| Action | `lib/actions/conversation.actions.ts` | `getOrCreateDM()`, `createGroupConversation()` |
| Action | `lib/actions/message.actions.ts` | `sendMessage()`, `fetchMessages()` (cursor-based) |
| Action | `lib/actions/realtimeroom.actions.ts` | `fetchRealtimeRoom()`, `joinRoom()` |
| Page | `app/(root)/(standard)/page.tsx` | Main feed page (global feed) |
| Page | `app/(root)/(standard)/profile/[id]/page.tsx` | User profile page with tabs |
| Page | `app/(root)/(standard)/profile/messages/page.tsx` | Conversation inbox |
| Type | `lib/types/post.ts` | `BasePost` interface, post type definitions |

---

Mesh — Social Platform Layer · [Deliberation demo →] · [Embed demo →]