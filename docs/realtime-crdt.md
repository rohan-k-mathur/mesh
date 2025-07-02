# Real-time Text Collaboration with Yjs

This repository experiments with CRDT-based editing for text nodes. Each `TextInputNode` creates a [Yjs](https://github.com/yjs/yjs) document and synchronizes updates over Supabase realtime channels.

1. When a text node mounts, it joins a channel named `text-{id}`.
2. Local edits update the Yjs document and broadcast the encoded update.
3. Remote clients apply incoming updates to resolve conflicts automatically.
4. Only the latest text is persisted to the database when the user submits the modal.

The history is kept in memory so simultaneous edits merge without losing data. This is an initial prototype and can be extended with awareness data and more efficient update handling.
