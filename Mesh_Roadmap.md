# Mesh Product Development Roadmap

Codebase Overview

Mesh is a Next.js monorepo that implements collaborative “rooms” where users manipulate nodes in real time. Core components include:

Real‑time canvas implemented with React Flow. Different node types are registered in Room.tsx (TEXT, VIDEO, IMAGE, LIVESTREAM, IMAGE_COMPUTE, COLLAGE) and displayed on the canvas with cursor tracking and background layers.

Node creation menu defined in NodeSidebar.tsx. Users can create multiple node types via modals, including LLM‑powered features such as the “IMAGE_COMPUTE” node and a Collage node.

Live collaboration infrastructure via Supabase channels, enabling presence and database updates in real time. Helper utilities handle cursor broadcasting and new node/edge synchronization.

User authentication uses Firebase with server tokens validated in middleware, preventing unauthorized access to private pages.

Database schema (Prisma) includes real‑time posts, edges, rooms, and user attributes for storing interests, songs, movies, etc.

1. Foundation (Refinement)
Authentication & Security

Introduce multi‑factor auth and passwordless login to minimize friction.

Add role-based room permissions (owner, moderator, viewer).

Harden the middleware with stricter sameSite/cookie policies.

Room Management

Provide REST/GraphQL endpoints for room creation and membership invites.

Implement soft deletion and archival for rooms.

Node Canvas & Types

Expand node plugin architecture so additional node types can be loaded dynamically.

Include a standardized metadata model for nodes to store author info, tags, and visibility.

Feed Integration

Add a post moderation queue and trending algorithm.

Include timeline filters for “following” vs. “global” feed.

Device Responsiveness

Baseline cross‑device support early to ensure the canvas functions on touch devices.

2. Social Discovery Engine (Expansion)
Interest Profiling

Leverage the existing UserAttributes model for capturing movies, albums, etc., and expose update APIs.

Provide an onboarding survey to seed recommendations.

Recommendation API

Use collaborative filtering from interactions (likes, room membership).

Expose an endpoint returning recommended rooms or threads; integrate into the feed.

Search and Explore

Implement full-text search via Postgres tsvector or a dedicated search service.

Support map-based discovery using the geocoding API route.

3. Advanced Node Workflows (Detail)
LLM Instruction Nodes

Model instruction nodes in the database with references to prompts and parameters.

Provide a visual builder UI for chaining instructions (e.g., convert text → image).

State Machine Builder

Represent node connections as a directed graph with triggers/conditions.

Allow storing and sharing these workflows with others.

Multimedia Nodes

Photowall/Collage node: integrate existing Collage modal, store resulting images, and allow public sharing.

Webpage Portfolio node: export to static HTML/CSS for personal pages.

DAW/Audio nodes: connect to third‑party APIs (e.g., LiveKit for recording) and store audio in Supabase.

4. Real‑Time Collaboration Enhancements (Detail)
Multiplayer UX

Extend cursor broadcasting with presence indicators (username labels, join/leave notifications).

Add ephemeral chat and emoji reactions stored in memory (optional persistence for the last N messages).

Concurrency Handling

Introduce operational transform or CRDT-based conflict resolution for simultaneous edits, especially for text nodes.

Provide visual indicators when nodes are locked by others.

Live Streaming Support

The /get-participant-token route already issues tokens via LiveKit. Build a Livestream node UI enabling hosts to broadcast to viewers.

5. Production Hardening (Addition)
Testing

Implement unit tests for actions and React components.

Integrate a CI pipeline running lint, type-check, and e2e tests.

Monitoring & Metrics

Instrument API routes and real-time events with metrics (e.g., Prometheus or a SaaS).

Track latency, errors, and usage patterns to inform scaling.

Security

Conduct a thorough review of file upload paths (e.g., uploadthing) for vulnerabilities.

Enforce strict rate limiting on real-time channels.

6. Launch & Growth (Expansion)
Onboarding & Templates

Include guided tours of the room UI and a “demo” room.

Build a template marketplace (starter rooms) that can be cloned.

Feedback Loop

Integrate user surveys and Net Promoter Score (NPS) in-app.

Establish a public changelog and feature request board.

Community & Partnerships

Encourage community-created node plugins, with a submission and review process.

Evaluate integrations with existing social platforms for cross‑posting content.


