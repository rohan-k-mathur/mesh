# Software Requirement Specification: Social Discovery AI Model

## 1. Introduction

### 1.1 Purpose
This document defines the requirements for the Social Discovery AI Model of the Mesh platform. Its goal is to guide development, implementation, and testing of recommendation and user-matching features that leverage user interests and activities.

### 1.2 Scope
The Social Discovery AI Model expands on existing user attributes and introduces recommendation APIs, similarity scoring, and embedding techniques. It covers backend APIs, data model updates, and user interface integration to display relevant matches.

### 1.3 References
- `Social_Discovery_Engine_Roadmap.md`
- `Mesh_Roadmap.md`
- Project README and codebase

## 2. Overall Description
Mesh is a Next.js application that stores user interests in `UserAttributes` via Prisma. Current customization modals allow editing of interests like movies or albums. This SRS covers enhancements to capture additional attributes, compute similarity between users, and surface recommended profiles and rooms.

## 3. System Features
### 3.1 Data Model Expansion
- **Description:** Extend `UserAttributes` to include `location`, `birthday`, `hobbies`, and `communities`.
- **Requirements:**
  - Update the Prisma schema and regenerate the Prisma client.
  - Modify server action `upsertUserAttributes` to persist the new fields.
  - Update profile customization modals and onboarding steps so users can populate these fields.
  - All changes must maintain compatibility with existing interests, artists, movies, and other attributes.

### 3.2 Interest Capture APIs
- **Description:** RESTful endpoints to fetch, update, and search user attributes.
- **Requirements:**
  - Implement API routes under `app/api`.
  - Provide endpoints for reading and updating attributes by user ID.
  - Implement search endpoints that find users with overlapping interests or attribute vectors using simple array intersection initially.
  - Ensure endpoints enforce authentication and respect privacy settings for each attribute (public, followers only, private).

### 3.3 Similarity & Recommendation Engine
- **Description:** Service that compares interests, artists, movies, etc. to recommend profiles or rooms.
- **Requirements:**
  - Design scoring algorithm using set intersections of interests and favorites.
  - Add weighting factors for popularity or user engagement where appropriate.
  - Introduce collaborative filtering based on likes and room memberships.
  - Expose an endpoint returning recommended profiles or rooms for the active user.
  - Recalculate scores when a user updates interests or interacts with new content.

### 3.4 Embedding / Vector Representation
- **Description:** Represent user attributes as vectors for nearest-neighbor similarity queries.
- **Requirements:**
  - Use text embedding or related model to encode attributes.
  - Store vectors in a persistent database or vector store.
  - Allow nearest-neighbor queries to find similar users based on vector distance.
  - Evaluate the embedding approach and refine it using feedback metrics.

### 3.5 UI Integration & Experience
- **Description:** Surface recommendations and search filters in the user interface.
- **Requirements:**
  - Show recommended profiles or rooms on profile pages and within the feed, with brief explanations (e.g., "Suggested because you like hiking").
  - Add "Find similar users" button on profile pages.
  - Offer search filters by interests and location.
  - Provide modals for editing new attributes with live preview during profile customization.

### 3.6 Metrics & Continuous Improvement
- **Description:** Track profile changes and recommendation interactions to refine algorithms.
- **Requirements:**
  - Record when users edit profile attributes and which recommendations they engage with.
  - Use analytics to adjust similarity weights or embedding parameters.
  - Add unit tests for new APIs and recommendation logic.
  - `npm run lint` (or `yarn lint`) must pass for all code changes.

## 4. External Interface Requirements
### 4.1 User Interfaces
- Web-based modals for profile customization and onboarding.
- Feed and profile pages showing recommendations and search filters.

### 4.2 Hardware Interfaces
- None specific; the system runs on standard web server infrastructure.

### 4.3 Software Interfaces
- Prisma for database access.
- Next.js API routes for the REST endpoints.
- Vector store or database capable of nearest-neighbor queries.

### 4.4 Communication Interfaces
- HTTPS endpoints under `/api` for user attribute operations and recommendation requests.

## 5. Functional Requirements
1. **FR1**: The system shall store location, birthday, hobbies, and communities within `UserAttributes` in the database.
2. **FR2**: The system shall provide APIs to fetch and update `UserAttributes` by user ID, secured via existing authentication.
3. **FR3**: The system shall compute similarity scores between users based on intersections of interests, artists, movies, and other attributes.
4. **FR4**: The system shall return recommended profiles or rooms for the active user via an API endpoint.
5. **FR5**: The system shall recalculate recommendations when users update profile attributes or engage with content.
6. **FR6**: The system shall track changes to attributes and interactions with recommendations for analytics.
7. **FR7**: The user interface shall display recommended profiles or rooms and allow filtering by interests and location.

## 6. Non-Functional Requirements
- **Performance:** Recommendation endpoints should respond within typical API latency (e.g., under 200 ms for cached queries).
- **Scalability:** Data model and vector store must support growth in users and attributes.
- **Security:** API routes must verify authentication tokens and respect privacy settings.
- **Maintainability:** Code should follow project conventions (TypeScript, double quotes, lint passes).
- **Usability:** Modals and search filters should be accessible across devices.

## 7. System Architecture
The Social Discovery AI Model will be built as a set of API routes powered by Prisma models and a similarity service. A dedicated module will encode user attributes into vectors for nearest-neighbor searches. Recommendation logic will rely on both vector similarity and collaborative filtering signals (likes and room memberships). UI components will consume these APIs to display matches and suggestions.

## 8. Testing Plan
- Unit tests for API endpoints and similarity computations.
- Integration tests for the recommendation service with typical user flows.
- Snapshot tests for UI components displaying recommendations.
- Continuous linting with `npm run lint`.

## 9. Future Considerations
- Evaluate advanced embedding models to capture nuanced similarities.
- Extend collaborative filtering to incorporate more engagement signals.
- Provide A/B testing for different weighting schemes.

