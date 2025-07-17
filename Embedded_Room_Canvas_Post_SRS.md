# Software Requirement Specification: Embedded Room Canvas Post

## 1. Introduction
### 1.1 Purpose
This document specifies the requirements for a new **Embedded Room Canvas Post** type in Mesh. Similar to existing Draw posts built with tldraw, this feature allows users to capture a snapshot of an entire React Flow room and embed that interactive canvas inside a PostCard.

### 1.2 Scope
The new post type will let users share room canvases to the global feed or within other rooms. Viewers can pan and zoom the embedded canvas but cannot modify it. The post should load quickly and preserve node layouts exactly as they appear in the original room.

### 1.3 References
- `README.md`
- `Mesh_Roadmap.md`
- Existing Draw node components (`components/cards/DrawCanvas.tsx`)

## 2. Overall Description
An Embedded Room Canvas Post stores the serialized React Flow state of a room. When rendered in a PostCard, it reconstructs the mini room view using read‑only React Flow components. The post is created from a room settings menu where the author chooses **"Share Canvas to Feed"**.

## 3. System Features
### 3.1 Canvas Capture and Serialization
- **Description:** Export the room's nodes and edges into JSON including metadata such as positions and zoom level.
- **Requirements:**
  - Reuse existing serialization logic from the room export feature.
  - Store the JSON in a new `room_post_content` column linked to the post record.
  - Limit size to keep posts under 1 MB.

### 3.2 Read‑Only Canvas Rendering
- **Description:** Display the captured canvas within the standard PostCard layout.
- **Requirements:**
  - Use React Flow in view mode with controls disabled.
  - Fit the canvas into a fixed container (~400x400 px) with pan and zoom enabled.
  - Allow clicking nodes to open a modal linking back to the original room.

### 3.3 Post Creation Flow
- **Description:** Users can publish a canvas snapshot from any room they own or collaborate in.
- **Requirements:**
  - Add a **Share Canvas** option in the room menu.
  - Show a preview modal with description text before publishing.
  - Save the serialized content and create a post record referencing the room ID.

### 3.4 Feed and Room Integration
- **Description:** Embedded canvases behave like other posts in timelines and comment threads.
- **Requirements:**
  - Support likes, comments, and replication like existing post types.
  - In rooms, allow embedding another room's canvas as a node via the embedPost prop.
  - Enforce viewing permissions based on the original room's privacy settings.

### 3.5 Data Retention and Updates
- **Description:** Posts represent a snapshot in time; subsequent room changes do not update the embedded canvas.
- **Requirements:**
  - Display a timestamp of when the snapshot was taken.
  - Optionally provide a **Refresh Snapshot** action for the author.

## 4. External Interface Requirements
### 4.1 User Interfaces
- Share Canvas option in room toolbar.
- Preview modal with description field.
- PostCard component rendering the read‑only React Flow canvas.

### 4.2 Hardware Interfaces
- Standard web and mobile browsers.

### 4.3 Software Interfaces
- Next.js frontend using React Flow components.
- Prisma models for posts and rooms.
- Supabase storage for post assets.

### 4.4 Communication Interfaces
- HTTPS API calls for post creation and retrieval.
- WebSocket connections for room serialization if needed.

## 5. Functional Requirements
1. **FR1:** Selecting **Share Canvas** exports the current room state as JSON and stores it with the post.
2. **FR2:** The PostCard shall display the canvas in read‑only mode with pan and zoom enabled.
3. **FR3:** Clicking a node within the embedded canvas shall open the original room in a new tab.
4. **FR4:** The system shall respect room privacy settings when rendering embedded canvases.
5. **FR5:** The author may refresh the snapshot to update the post content.

## 6. Non‑Functional Requirements
- **Performance:** Embedded canvases load under 2 seconds on broadband.
- **Security:** Only authorized users can capture private rooms.
- **Usability:** View controls should be intuitive for mouse and touch.
- **Maintainability:** Code changes must pass `npm run lint`.

## 7. Software Architecture
```
PostCard (Next.js)
 └─ EmbeddedCanvas component (React Flow view only)
     ├─ loads serialized room JSON
     └─ links nodes back to /room/[id]
Backend API
 ├─ POST /api/room-posts (creates post with canvas JSON)
 └─ GET  /api/posts/:id (returns post data)
Database
 └─ posts table (new type: ROOM_CANVAS, room_post_content JSON)
```
All components run in existing Next.js and Prisma infrastructure.

## 8. Product Development Roadmap
1. **Design Phase** – Finalize serialization format and UI mockups.
2. **Milestone 1:** Implement canvas capture and database fields.
3. **Milestone 2:** Build EmbeddedCanvas viewer and PostCard integration.
4. **Milestone 3:** Add Share Canvas UI and preview workflow.
5. **Milestone 4:** Permissions handling and privacy checks.
6. **Milestone 5:** Testing, linting, and beta rollout.

## 9. User Flows
1. **Share Canvas to Feed**
   - User opens room menu and selects **Share Canvas**.
   - Preview modal shows snapshot with description field.
   - User confirms → post appears in feed with embedded canvas.
2. **View Embedded Canvas**
   - Viewer scrolls feed and sees the canvas inside a PostCard.
   - Zoom and pan to inspect nodes; clicking a node opens original room.

## 10. Planning Methods Incorporated
- **MoSCoW** prioritization for backlog items.
- **Agile Scrum** two‑week sprints.
- **RACI** assignments per milestone (Owner, Dev, QA, Docs).

---

### End of Document
