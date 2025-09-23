# Software Requirement Specification: Direct Messaging System

## 1. Introduction
### 1.1 Purpose
This document defines the requirements for a Direct Messaging (DM) system within the Mesh platform. The feature enables private conversations between two users, similar to Instagram or Messenger.

### 1.2 Scope
The DM system allows a user to start a chat from another user's profile via a **Send Message** button. A dedicated Messages page lists all existing chats for the logged-in user. Each chat room provides a realtime conversation interface.

### 1.3 References
- `README.md`
- `Mesh_Roadmap.md`
- Existing SRS documents in this repository

## 2. Overall Description
The DM system builds on the current Next.js application and Supabase backend. When a user clicks **Send Message** on a profile, the app checks if a conversation with that user exists; if not, it creates one. Chats are accessible from `/profile/messages` and are displayed with a mobile-friendly UI inspired by Instagram. Messages persist in the database and update via realtime channels so both participants see new content instantly.

## 3. System Features
### 3.1 Start Chat from Profile
- A **Send Message** button appears next to **Follow** on every user profile.
- Clicking the button navigates to a unique chat room between the two users.

### 3.2 Messages Tab
- The profile page includes a **Messages** tab listing all conversations for the current user.
- Each list item shows the other participant's avatar, name, and a preview of the most recent message.

### 3.3 Realtime Chat Room
- Conversations display messages in chronological order with timestamps.
- Sending a message updates both clients in realtime using Supabase channels or WebSockets.
- Basic read receipts and typing indicators may be added in later phases.

### 3.4 Notifications
- Users receive in-app notifications when new messages arrive in other tabs or pages.
- Push notifications can be added for mobile devices.

## 4. External Interface Requirements
### 4.1 User Interfaces
- **Send Message** button on user profiles.
- Messages list accessible from the profile's **Messages** tab.
- Chat room UI resembling Instagram DMs.

### 4.2 Hardware Interfaces
- Standard web and mobile browsers.

### 4.3 Software Interfaces
- Next.js frontend with React components.
- Supabase Postgres for message storage.
- Supabase realtime channels for live updates.

### 4.4 Communication Interfaces
- Secure HTTPS for API calls.
- WebSocket connections via Supabase for realtime messaging.

## 5. Functional Requirements
1. **FR1:** Clicking **Send Message** on a profile opens a dedicated chat room with that user.
2. **FR2:** The system shall persist messages in the database with sender, recipient, text, and timestamp.
3. **FR3:** The chat room shall update in realtime when either participant sends a message.
4. **FR4:** The Messages tab shall list all conversations for the current user sorted by recent activity.
5. **FR5:** Selecting a conversation from the Messages list shall navigate to that chat room.
6. **FR6:** Only participants of a conversation can read or send messages within it.

## 6. Non-Functional Requirements
- **Performance:** Message delivery latency should be under 500 ms.
- **Security:** Conversations must be private and transmitted over encrypted channels.
- **Usability:** The interface should be intuitive on both desktop and mobile.
- **Reliability:** Chats should remain accessible if a user reloads or temporarily loses connection.
- **Maintainability:** Code must follow project conventions and pass `npm run lint`.

## 7. Software Architecture
The DM feature consists of:
- **Database Tables:** `conversations` (id, participant ids, timestamps) and `messages` (id, conversation id, sender id, text, created at).
- **API Routes:** CRUD operations for conversations and messages, secured by authentication middleware.
- **Realtime Layer:** Supabase channels broadcast new messages to conversation participants.
- **Client Components:** React pages for the Messages list and individual chat rooms.
Navigation relies on Next.js routing, using conversation IDs in the URL (e.g., `/messages/[conversationId]`).

## 8. Product Development Roadmap
1. **Design Phase**
   - Finalize database schema and API contract.
   - Create wireframes for chat room and message list pages.
2. **Milestone 1: Basic Messaging**
   - Implement database tables and API routes.
   - Build the chat room page with realtime updates.
   - Add **Send Message** button on profiles.
3. **Milestone 2: Messages List**
   - Create the Messages tab listing all conversations.
   - Implement navigation from the list to chat rooms.
4. **Milestone 3: Notifications & Polishing**
   - Add in-app notifications for new messages.
   - Refine mobile UI and accessibility.
5. **Milestone 4: Optional Enhancements**
   - Push notifications for mobile devices.
   - Typing indicators and read receipts.

## 9. User Flows
1. **Start a Conversation**
   - User visits another profile.
   - Clicks **Send Message**.
   - App creates or retrieves a conversation and navigates to `/messages/[conversationId]`.
2. **View Existing Chats**
   - User opens the **Messages** tab on their profile.
   - A list of conversations appears.
   - Clicking a conversation opens the corresponding chat room.
3. **Send a Message**
   - Within a chat room, user types a message and presses **Send**.
   - Message is stored in the database and broadcast to the other participant.
   - Both users see the new message instantly.

## 10. Testing Plan
- Unit tests for conversation and message API routes.
- Integration tests covering starting a chat, sending messages, and retrieving conversations.
- UI tests for the chat room and message list pages.
- Continuous linting with `npm run lint` before merging changes.

## 11. Future Considerations
- Extend to group chats with multiple participants.
- Support attachments such as images or files.
- Implement search across conversations and messages.

