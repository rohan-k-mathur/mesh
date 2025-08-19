Great question. Short answer:

**A room is a self-contained workspace**—people, conversations, posts, files, settings, and governance—**with its own boundary and identity**. It’s where a community or project actually lives in Mesh.

Here’s the shape of a room, from user view to guts:

---

## What a room is (in plain English)

* **One place for a group to do work**: chat threads + long-form posts (articles, sites, library stacks) + live events (auctions, forecasts) + decisions (proposals → compare → merge, locks).
* **Has its own rules**: membership, roles, moderation lenses, notification prefs, data region, cost meter.
* **Produces artifacts**: resolvable messages, merge receipts, digests, recap cards—shareable links that become the group’s memory.

Think “Discord channel + Notion space + decision log,” but **all in one page** and with a real exit if you need it.

---

## What lives inside a room

* **People**: members, roles (admin/mod/guest), optional invite links.
* **Conversation**: message streams, drifts (focused sub-threads), GitChat proposals/merges.
* **Posts**: Articles, Site/Portfolio posts, Library stacks, Prediction posts, SwapMeet stalls/auctions.
* **Attachments & media**: images, docs, embeds, link previews.
* **Views**: optional programmable feeds (“Show me recent merged decisions,” “My starred items”).
* **Governance**: moderation lenses, decision/merge receipts, optional agreement locks.
* **Bridges**: ActivityPub/email/RSS threads can flow in/out (Universal Inbox, reply-out).

---

## How a room differs from a Telegram group or Discord channel

* **Ends in decisions**: you can fork messages into proposals, compare, and **merge** back with attribution. Chat isn’t the end state.
* **Ownable data**: you can slide to **Sovereign** mode (your own shard/bucket/keys) and **export a runnable snapshot** (Verified Exit).
* **Structured content**: long-form posts, sites, and collections sit next to chat—no tool-sprawl.
* **Portable artifacts**: Compare/Merge pages, recaps, digests have public URLs; they travel into other apps and pull people back.

Use Discord/Telegram for ambient chatter; use rooms when you need **outcomes and memory.**

---

## Sovereignty & portability (why rooms matter)

* Each room can be:

  * **Pooled** (default): multi-tenant, zero setup.
  * **Sovereign**: its own DB schema + S3 bucket with a room KMS key (dual-control; revocable grant).
  * **Portable**: one-click **export** (`db.sql + media + signed manifest`) that **boots** in Mesh-Lite or re-imports elsewhere.
* This makes a room a **unit of ownership**—not just a UI tab.

---

## When to create multiple rooms

* Distinct projects or sub-communities
* Different data regimes (EU vs US residency)
* Separate cost centers or moderation norms
* Public community vs private core team

---

## Two quick examples

* **Open collective**: publishes articles, reviews proposals in threads, merges final text, runs a 60-sec auction fundraiser, exports quarterly for the board.
* **Research lab**: EU-resident sovereign room, ActivityPub bridge for public updates, locked agreements for IRB decisions, periodic exit drills.

---

## A tiny technical note

* **ID & boundary**: a `roomId` scopes content, permissions, costs, region.
* **Control plane vs data plane**: profiles/billing live globally; **room data** lives in the room’s schema/bucket (when sovereign).
* **APIs**: requests carry `roomId`; we route to the correct datastore; CDC streams power search/notifications.

---

### One-liner you can tell anyone

> **A Mesh room is your group’s home base—chat, content, and decisions—with the option to own the data and walk away with a runnable export.**
