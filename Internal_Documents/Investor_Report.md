# Mesh Investor Report

## Overview
Mesh is an experimental social platform built with Next.js. Users interact in real-time collaborative rooms with a canvas of multimedia nodes ranging from text to livestreams and AI-generated images.

## Current Capabilities
- Real-time canvas with node types TEXT, VIDEO, IMAGE, LIVESTREAM, IMAGE_COMPUTE, COLLAGE.
- Node creation menu for text posts, uploads, AI image generation, and collages.
- Live collaboration via Supabase channels with presence broadcasting.
- Authentication middleware backed by Firebase.
- Prisma schema for posts, edges, rooms, and rich user attributes (interests, songs, movies, etc.).

## Completed Milestones
- Core canvas and node system.
- Supabase real-time channels for presence and data updates.
- Basic feed with global and friend posts.
- Firebase authentication and session middleware.
- Initial Prisma models for rooms, posts, and user attributes.

## Roadmap Highlights
### Foundation & Refinement
- Multi-factor and passwordless login flows.
- Role-based permissions for rooms.
- Middleware hardening and REST/GraphQL endpoints for room management.
- Node plugin architecture and standardized metadata model.
- Feed moderation queue and timeline filters.
- Cross-device responsiveness.

### Social Discovery Engine
- Extend UserAttributes with location, birthday, hobbies, and communities.
- APIs for interest capture and onboarding survey.
- Collaborative filtering recommendation API and full-text search.
- Map-based discovery and explore page.

### Advanced Node Workflows
- LLM instruction nodes and visual builder for chaining.
- State machine builder for workflow graphs.
- Collage, webpage portfolio, and DAW/Audio nodes with LiveKit support.

### Real-Time Collaboration Enhancements
- Presence indicators, ephemeral chat, emoji reactions.
- CRDT-based conflict resolution and node locking indicators.
- Livestream node UI for broadcasting.

### Production Hardening & Growth
- Unit tests and CI pipeline with metrics and security review.
- Guided tours, template marketplace, dogfooding feedback loop.
- Community node plugins and integrations with other platforms.

## Competitive Landscape
Mesh combines a real-time collaborative canvas with a familiar feed experience, differentiating it from standard social networks focused solely on linear posts. The roadmap’s emphasis on AI-driven nodes, rich user profiling, and live collaboration positions Mesh between traditional social media (e.g., Twitter) and creative collaboration tools (e.g., Figma) but adds social discovery and multimedia workflows not typically available in either space.

Other platforms may offer isolated features like livestreaming or content feeds, but Mesh uniquely integrates real-time canvas interaction, customizable node types, and planned recommendation APIs. Its plug-in architecture and open node formats aim to foster community contributions, similar to plugin ecosystems on developer platforms.

## Conclusion
Mesh has established core functionality with real-time rooms, multimedia posts, and secure authentication. The roadmap outlines a path toward richer discovery features, advanced node workflows, and production-ready scaling. With its combination of collaborative canvases and social discovery, Mesh targets a niche not fully addressed by existing social or creative platforms, representing an opportunity for continued growth and differentiation.

