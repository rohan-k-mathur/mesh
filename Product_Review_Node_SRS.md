# Software Requirement Specification: Product Review Node

## 1. Introduction
### 1.1 Purpose
This document defines the requirements for a **Product Review Node** that enables structured reviews with granular voting and micro vouching. Users can annotate specific claims within a review and respond directly to them. The goal is to foster trustworthy product discussions while leveraging Mesh's existing room and feed infrastructure.

### 1.2 Scope
The Product Review Node operates like other nodes in Mesh but introduces new data fields for product details, ratings, and claim sections. Each claim supports modular vote types (e.g., helpful/unhelpful, agree/disagree) and optional micro vouch tokens. An annotation system allows highlighting passages so other users can add comments or rebuttals. All interactions must remain compatible with current authentication and presence features.

### 1.3 References
- `Mesh_Roadmap.md`
- `Plugin_Architecture_SRS.md`
- Existing node components in `components/nodes`

## 2. Overall Description
Product Review Nodes capture opinions about a product in a standardized format. A review contains metadata (product name, rating, summary), followed by a series of claims. Each claim can be individually voted on or vouched for. Comments and annotations reference claim IDs so discussions remain focused. The node can be embedded in React Flow rooms and displayed on the feed like any other post type.

## 3. System Features
### 3.1 Structured Review Fields
- **Description:** Forms for product name, rating (1–5), pros/cons, and claim text.
- **Storage:** Persisted in the database alongside other post types.
- **UI:** Creation and edit modals validate required fields before saving.

### 3.2 Claim-Based Annotations
- **Description:** Users highlight text within a claim to attach comments or counterpoints.
- **Threading:** Each annotation forms a subthread linked to the claim ID.
- **Visibility:** Annotations appear inline when viewing the review.

### 3.3 Modular Voting & Micro Vouching
- **Description:** Vote widgets support configurable options (helpful, agree, etc.).
- **Micro Vouch:** Users can optionally attach small token amounts to support a claim.
- **Aggregation:** Vote counts and vouch totals are displayed per claim and for the overall review.

### 3.4 Integration with Rooms and Feed
- **Description:** Nodes behave like existing post types within React Flow rooms and on the main feed.
- **Permissions:** Standard authentication and room membership rules apply.

### 3.5 Access Controls
- **Description:** Review authors can choose whether annotations or micro vouching are allowed.
- **Moderation:** Room owners may hide or remove inappropriate comments.

## 4. External Interface Requirements
### 4.1 User Interfaces
- Modal to create or edit a Product Review Node.
- Inline annotation editor triggered by text selection.
- Voting widgets for each claim.

### 4.2 Hardware Interfaces
- None beyond typical browser and server infrastructure.

### 4.3 Software Interfaces
- Database models for reviews, claims, votes, and vouch transactions.
- API routes or server actions to submit votes and annotations.
- Existing authentication middleware for user identity.

### 4.4 Communication Interfaces
- HTTPS endpoints for fetching and submitting review data.
- WebSocket or Supabase channels for real-time updates to votes and annotations.

## 5. Functional Requirements
1. **FR1:** The system shall store product name, rating, summary, and an array of claims for each review.
2. **FR2:** The system shall allow users to highlight claim text and create annotations linked to that claim.
3. **FR3:** The system shall provide modular vote options on each claim and on the overall review.
4. **FR4:** The system shall optionally let users attach micro vouch tokens to a claim and track totals per user.
5. **FR5:** Product Review Nodes shall render in React Flow rooms and the feed with real-time updates to votes and annotations.
6. **FR6:** Permissions shall restrict editing, voting, and annotation based on room membership and author settings.

## 6. Non-Functional Requirements
- **Performance:** Voting and annotation actions should update within 200 ms for active viewers.
- **Security:** Only authenticated users may vote or vouch. Token transfers must be validated server-side.
- **Reliability:** Vote counts and vouch totals should remain consistent across sessions and after reconnects.
- **Maintainability:** Follow project coding standards and ensure `npm run lint` passes.
- **Usability:** Annotation and voting controls must be discoverable and accessible on both desktop and mobile.

## 7. System Architecture
The Product Review Node extends the existing node plug-in framework. A React component renders review content and claim sections. A voting module handles configurable vote types and stores results in the database. Micro vouch transactions interface with a wallet or credit system. Annotation threads reuse the comment infrastructure but are keyed by claim IDs. Real-time updates propagate via Supabase channels so all viewers stay in sync.

## 8. Testing Plan
- Unit tests for creation and editing logic, ensuring required fields are validated.
- Integration tests for vote tallying, micro vouch transactions, and annotation threads.
- Snapshot tests for the node's React component in various states.
- Continuous linting with `npm run lint`.

## 9. Future Considerations
- Support rich media (images or videos) within reviews.
- Introduce reputation scoring based on helpful votes and vouch amounts.
- Provide filters to sort reviews by rating or total vouches.

## 10. Development Roadmap
1. **Define Data Model** – Extend the Prisma schema with tables for product reviews, claims, votes, and vouch transactions.
2. **Build Node UI** – Create React components and modals for entering review details and claims.
3. **Implement Voting Module** – Add APIs to submit and retrieve vote totals per claim.
4. **Add Annotation System** – Allow text highlighting and threaded comments tied to claim IDs.
5. **Integrate Micro Vouching** – Connect to the existing credit or wallet service for small token transfers.
6. **Room & Feed Integration** – Render the node in rooms and the feed with real-time updates.
7. **Testing & Linting** – Write tests and ensure `npm run lint` passes before merging.
8. **Beta Feedback** – Deploy to a test environment and collect user feedback for refinements.
