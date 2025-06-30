# Software Requirement Specification: Livechat Node

## 1. Introduction
### 1.1 Purpose
This document defines the requirements for a Livechat node type that enables ephemeral realtime text conversations on the Mesh platform. The node must allow two users to see each other’s messages as they are typed while ensuring that no chat logs are persisted.

### 1.2 Scope
The Livechat node will work inside React Flow rooms and on the feed page. It is visible only to the invited participants. Text is deleted immediately after sending, guaranteeing that no history remains on the server or client.

### 1.3 References
- `Mesh_Roadmap.md`
- `README.md`
- Existing node components in `components/nodes`

## 2. Overall Description
Livechat nodes simulate realtime text chats by displaying two stacked text areas. Each participant sees the other’s typing instantly. When a user presses **Send**, the text is transmitted to the peer and then cleared from both the input and any transient storage. No record is saved to the database or log files. The node must have very low latency so the typing experience feels instantaneous.

## 3. System Features
### 3.1 Ephemeral Text Areas
- Two vertically stacked text fields within one container.
- Local keystrokes are streamed to the other user in realtime.
- Upon pressing **Send**, the text disappears for both users and is never stored.

### 3.2 Invitation Workflow
- Creation and edit modals include a field to specify the user to invite.
- Only the invited user and the creator can view or interact with the node.
- Permissions are enforced on both the server and client.

### 3.3 Low Latency Transport
- Use WebSocket or Supabase channels for realtime synchronization.
- Updates should propagate with minimal delay (<100 ms target).

### 3.4 Placement in Rooms and Feed
- The node can be added inside React Flow rooms like other nodes.
- Livechat threads can appear in the standard feed page for the participants.
- The component should reuse existing room and feed infrastructure.

## 4. External Interface Requirements
### 4.1 User Interfaces
- Creation modal requesting the user to invite.
- Edit modal to change the invited user.
- Node UI showing two text areas with a **Send** button.

### 4.2 Hardware Interfaces
- None beyond normal browser and server infrastructure.

### 4.3 Software Interfaces
- Supabase or WebSocket backend for realtime updates.
- React components in `components/nodes` for rendering.
- Middleware to verify user access to the chat.

### 4.4 Communication Interfaces
- Secure WebSocket/Supabase channels for each Livechat instance.

## 5. Functional Requirements
1. **FR1**: The system shall display two text areas in one container for the two participants.
2. **FR2**: The system shall transmit typed characters in realtime so that both users see updates immediately.
3. **FR3**: The system shall erase the text from both clients once **Send** is pressed.
4. **FR4**: The system shall avoid storing chat messages in any database or log.
5. **FR5**: The system shall restrict visibility of the node to the creator and invited user.
6. **FR6**: The creation and edit modals shall require selecting the user to invite.
7. **FR7**: The node shall function inside React Flow rooms and on the feed page.

## 6. Non-Functional Requirements
- **Performance:** Latency for keystroke transmission should be under 100 ms.
- **Security:** Access control must ensure only the two participants can read or write messages.
- **Reliability:** The chat should handle temporary connection drops gracefully, without persisting data.
- **Maintainability:** Implementation should follow project coding standards and pass `npm run lint`.
- **Usability:** The interface must be simple with clear Send actions and immediate feedback.

## 7. System Architecture
The Livechat node will utilize Supabase channels (or a similar WebSocket service) for realtime events. When a user types, characters are broadcast to the peer. The node component manages local state but never writes messages to persistent storage. Access control logic checks user IDs against the invitation list before establishing the channel. Both React Flow rooms and the feed page render the node using shared UI components.

## 8. Testing Plan
- Unit tests for the invitation workflow and permission checks.
- Integration tests simulating two users typing to verify realtime behavior and text deletion.
- Linting with `npm run lint` on every commit.

## 9. Future Considerations
- Explore typing indicators or ephemeral emoji reactions.
- Add optional encryption for transport layer security.
- Consider extending to group chats while still avoiding data persistence.

