# Direct Messaging Extensions: Group Chat & Attachments Implementation Plan

This document describes a step-by-step process for evolving the existing direct messaging (DM) feature into a system that supports group chats and multimedia attachments. It references the current Mesh codebase to minimize friction during development.

## 1. Goals
- Allow conversations with three or more participants.
- Enable users to send images and files inside any conversation.
- Preserve existing one-to-one DM behaviour and real-time updates.

## 2. Database Layer
1. **Conversation model** (`lib/models/schema.prisma`)
   - Add `is_group Boolean @default(false)` and optional `title String?`.
   - Remove `user1_id`/`user2_id` uniques and indexes; retain fields for backward compatibility during migration.
2. **Participants**
   - Create new model `ConversationParticipant` with `id`, `conversation_id`, `user_id`, `joined_at`.
   - Seed this table for existing conversations with both participants.
3. **Attachments**
   - Create model `MessageAttachment` with `id`, `message_id`, `url`, `type`, `size`, `metadata Json?`.
   - Link via `message_id` foreign key with `onDelete: Cascade`.
4. Run `prisma migrate` to generate and apply migrations.

## 3. Server Actions & API
1. **Conversation helpers** (`lib/actions/message.actions.ts`)
   - Refactor `getOrCreateConversation` to handle only one-to-one chats.
   - Add `createGroupConversation({ creatorId, participantIds, title })` which writes `Conversation` and `ConversationParticipant` rows.
   - Update `fetchConversations`/`fetchConversation` to load `participants` (include `ConversationParticipant` relations) and compute display name/avatars on the server.
2. **Messages**
   - Extend `fetchMessages` to include `attachments` relation.
   - Update `sendMessage` to accept `{ text?: string; attachments?: UploadedFile[] }`.
   - When attachments are provided, save records in `MessageAttachment` and include them in the Supabase broadcast payload.
3. **API routes**
   - Add `POST /api/messages/group` for group creation.
   - Modify `POST /api/messages/[id]` to parse `FormData` and forward files to `sendMessage`.
   - Ensure `GET /api/messages/[id]` checks `ConversationParticipant` membership instead of `user1_id`/`user2_id`.
4. **Notifications** (`lib/actions/notification.actions.ts`)
   - Update `createMessageNotification` to select all participant IDs except the sender and create a notification per user.

## 4. File Storage
1. Create a Supabase Storage bucket `message-attachments` (public or signed URLs as needed).
2. Follow the pattern in `lib/uploadthumbnail.ts` to upload files and obtain public URLs.
3. Store the returned URL and metadata in `MessageAttachment`.

## 5. Realtime Updates
- Continue using Supabase channels named `conversation-${id}`.
- On group creation, subscribe each participant to the channel.
- Broadcast payload from `sendMessage` must now include `attachments` array and `sender_id`.

## 6. Front‑End
1. **Messages list** (`app/(root)/(standard)/profile/messages/page.tsx`)
   - Display group title or participant names.
   - Show composite avatar (first three participant images) for groups.
2. **Chat room** (`components/chat/ChatRoom.tsx`)
   - Render message attachments: images with `<Image>`; other files as download links.
   - Show participant list and allow opening their profiles.
3. **Composer** (`app/(root)/(standard)/messages/[id]/send-form.tsx`)
   - Replace the current JSON POST with `FormData` containing `text` and selected files (`<input type="file" multiple>`).
   - After upload, reset both text and file inputs.
4. **Group creation UI**
   - New page or modal to search and select multiple users, set a title, then call `POST /api/messages/group`.

## 7. Security & Authorization
- All API routes must verify membership via `ConversationParticipant` before returning data or accepting posts.
- Limit attachment size/type; validate on both client and server.

## 8. Testing Strategy
1. **Unit tests** for `createGroupConversation`, `sendMessage` with attachments, and notification fan‑out.
2. **Integration tests** for API routes: creating groups, sending messages with files, and retrieving conversations.
3. **UI tests** (Playwright) for composing group messages and viewing attachments.
4. Run `npm run lint` and existing test suites before commit.

## 9. Rollout Plan
1. Deploy database migrations and backfill `ConversationParticipant` for existing DMs.
2. Release server actions and API updates behind feature flag.
3. Roll out front‑end group chat UI to beta users.
4. Enable attachments after validating storage limits and security.

Following these steps will extend Mesh's direct messaging with low friction and align with current architecture and tooling.
