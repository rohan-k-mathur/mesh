# Mesh Product Development Roadmap

## Codebase Overview

Mesh is a Next.js monorepo that powers real‑time collaborative “rooms.” Major building blocks already in place include:

* **Real‑time canvas** via React Flow. Room.tsx registers node types (TEXT, VIDEO, IMAGE, LIVESTREAM, IMAGE_COMPUTE, COLLAGE) and handles presence/cursor updates.
* **Node creation menu** in NodeSidebar.tsx with modals for adding text posts, multimedia uploads, AI‑generated images, and collages.
* **Live collaboration** using Supabase channels. Presence broadcasting and database synchronization keep all participants in sync.
* **Authentication middleware** backed by Firebase, restricting access to private content.
* **Prisma schema** defining posts, edges, rooms, and rich UserAttributes for interests, songs, movies, and more.

These components form a working prototype where users can create rooms, post multimedia nodes, and collaborate live.

## Completed Milestones

- [x] Core canvas and node system
- [x] Supabase real‑time channels for presence and data updates
- [x] Basic feed with global and friend posts
- [x] Firebase authentication and session middleware
- [x] Initial Prisma models for rooms, posts, and user attributes
- [x] Explore page exposing recommended users and rooms
- [x] Livechat node for ephemeral conversations

## Summary of Current Progress

The investor report highlights that the real‑time canvas, authentication middleware, Prisma models, and feed are fully functional【F:Investor_Report.md†L6-L18】. Social discovery is partially implemented: the schema now stores `location`, `birthday`, `hobbies`, and `communities` in `UserAttributes`, and server actions compute embeddings for friend suggestions. A recommendations API aggregates similar users and rooms, and an Explore page surfaces these suggestions. The Livechat node type has been built in line with the SRS, providing ephemeral chat within rooms and the feed.

The next sections outline the remaining work required for a public launch.

## Road to Public Launch

1. **Internal Dogfooding** – use Mesh daily within the team, logging bugs and collecting usability notes.
2. **Closed Beta** – invite a small group of external users, monitor feedback, and refine onboarding.
3. **Performance Optimization** – profile React rendering and Supabase queries; add caching and asset compression where needed.
4. **Security Review** – audit authentication flows, dependency versions, and file uploads before opening to the public.
5. **Open Beta / Production Release** – gradually roll out to a larger audience, scaling infrastructure based on monitoring data.

## 1. Foundation and Refinement

### Authentication & Security

* Introduce multi‑factor and passwordless login flows to minimize friction while maintaining strong account security.
* Add role‑based permissions for rooms (owner, moderator, viewer) enforced on both the client and server.
* Harden middleware with stricter `sameSite` and cookie policies.

### Room Management

* Provide REST/GraphQL endpoints for room creation and membership invites.
* Implement soft deletion and archival for rooms so data is not immediately lost.

### Node Canvas & Types

* Expand the node plug‑in architecture so additional node types can be loaded dynamically.
* Define a standardized metadata model for nodes, storing author info, tags, and visibility levels.

### Feed Integration

* Build a post moderation queue and trending algorithm for visibility control.
* Add timeline filters to switch between “following” and “global” feeds.

### Device Responsiveness

* Establish cross‑device support early so the canvas functions well on touch devices.

## 2. Social Discovery Engine

### Interest Profiling

* [x] Extend `UserAttributes` with optional fields (location, birthday, hobbies, communities).
* [x] Provide update APIs and an onboarding survey to capture initial interests (forms under construction).

### Recommendation API

* [x] Apply collaborative filtering from likes, room membership, and profile overlaps.
* [x] Expose an endpoint returning recommended rooms or threads and integrate it into the feed UI.

### Search and Explore

* Implement full‑text search (Postgres `tsvector` or a dedicated service).
* Support map‑based discovery using the existing geocoding API route.

## 3. Advanced Node Workflows

### LLM Instruction Nodes

* Model instruction nodes in the database with references to prompts and parameters.
* Provide a visual builder UI for chaining instructions (e.g., convert text → image).

### State Machine Builder

* Represent node connections as a directed graph with triggers and conditions.
* Allow storing and sharing these workflows with others.

### Multimedia Nodes

* Collage node: integrate the existing collage modal, store resulting images, and enable public sharing.
* Webpage portfolio node: export to static HTML/CSS for personal pages.
* DAW/Audio nodes: connect to third‑party APIs (e.g., LiveKit for recording) and store audio in Supabase.

## 4. Real‑Time Collaboration Enhancements

### Multiplayer UX

* Extend cursor broadcasting with presence indicators (username labels and join/leave notifications).
* [x] Add ephemeral chat and emoji reactions stored in memory (optionally persisted for the last N messages).

### Concurrency Handling

* Introduce operational transform or CRDT‑based conflict resolution for simultaneous edits, especially text nodes.
* Provide visual indicators when nodes are locked by others.

### Live Streaming Support

* The `/get-participant-token` route already issues LiveKit tokens. Build a livestream node UI enabling hosts to broadcast to viewers.

## 5. Production Hardening

### Testing

* Implement unit tests for actions and React components.
* Integrate a CI pipeline running lint, type‑check, and end‑to‑end tests.

### Monitoring & Metrics

* Instrument API routes and real‑time events with metrics (e.g., Prometheus or a SaaS solution).
* Track latency, errors, and usage patterns to inform scaling and optimization.

### Security

* Conduct a thorough review of file upload paths (e.g., `uploadthing`) for vulnerabilities.
* Enforce strict rate limiting on real‑time channels.

## 6. Launch & Growth

### Onboarding & Templates

* Include guided tours of the room UI and a “demo” room.
* Build a template marketplace (starter rooms) that users can clone.

### Feedback Loop & Dogfooding

* Run an internal dogfooding program with staged rollouts to collect bug reports and usability feedback.
* Integrate user surveys and Net Promoter Score (NPS) in‑app.
* Establish a public changelog and feature request board.

### Community & Partnerships

* Encourage community‑created node plugins with a submission and review process.
* Evaluate integrations with existing social platforms for cross‑posting content.


