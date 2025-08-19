Here’s a practical, engineer‑friendly overview of **ActivityPub**—what problem it solves, what it is, and exactly how you’d make Mesh speak it (without derailing your current codebase).

---

## What ActivityPub is (and why it exists)

**Motivation.** People want social apps that can talk to each other, like email does. Instead of one company owning your graph, ActivityPub defines a way for independent servers to exchange social events (posts, likes, follows) using standard web primitives. It has **two parts**: a **client‑to‑server (C2S)** API for an app’s own clients, and a **server‑to‑server (S2S)** protocol for federation between servers. Both use the **ActivityStreams 2.0** JSON vocabulary. ([W3C][1])

**Core model.** Three building blocks:

* **Actors** (Person, Group, Service…), each with an **`inbox`** and **`outbox`** URL.
* **Objects** (Note, Article, Image, Video, Question, etc.).
* **Activities** that tie them together (Create, Follow, Like, Announce/Boost, Delete, Undo, Accept/Reject…).
  Servers POST Activities to other actors’ **inboxes**; an actor’s **outbox** lists Activities it produced. ([W3C][1])

**Discovery.** Given an address like `@alice@mesh.example`, other servers resolve it with **WebFinger** at `/.well-known/webfinger` to find the actor’s URL. The actor document advertises `inbox`, `outbox`, keys, and collections (followers/following). ([IETF Datatracker][2], [Mastodon Docs][3])

**Security / access.** Most fediverse servers require **HTTP Signatures** on S2S POSTs; some enable **Authorized Fetch** (“secure mode”), requiring signatures even on GETs. That’s why actor documents include a **publicKey** (PEM) and servers sign/verify requests. (Implementations commonly use the older “Signature” header draft; newer work standardizes message signatures.) ([SWICG][4], [GitHub][5], [W3C][6])

**Addressing.** Delivery/visibility is controlled by ActivityStreams addressing fields (`to`, `cc`, etc.), including the public collection IRI `https://www.w3.org/ns/activitystreams#Public`. ([W3C][7])

---

## Minimal interop: what Mesh needs to implement

Below is the smallest set of endpoints & behaviors that will let Mesh accounts **follow** and be **followed** by Mastodon/Misskey/Akkoma (and co.) without adopting every AP feature at once.

### 1) Discovery/identity

1. **WebFinger**
   `GET /.well-known/webfinger?resource=acct:<username>@mesh.example`
   → Return a JRD like:

   ```json
   {
     "subject": "acct:alice@mesh.example",
     "links": [{
       "rel": "self",
       "type": "application/activity+json",
       "href": "https://mesh.example/users/alice"
     }]
   }
   ```

   This tells the world where Alice’s **Actor** lives. ([IETF Datatracker][2], [Mastodon Docs][3])

2. **Actor**
   `GET /users/:username` with `Accept: application/activity+json`
   → Return an **ActivityStreams Actor** (JSON‑LD):

   ```json
   {
     "@context": "https://www.w3.org/ns/activitystreams",
     "id": "https://mesh.example/users/alice",
     "type": "Person",
     "preferredUsername": "alice",
     "name": "Alice",
     "inbox": "https://mesh.example/users/alice/inbox",
     "outbox": "https://mesh.example/users/alice/outbox",
     "followers": "https://mesh.example/users/alice/followers",
     "following": "https://mesh.example/users/alice/following",
     "publicKey": {
       "id": "https://mesh.example/users/alice#main-key",
       "owner": "https://mesh.example/users/alice",
       "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n"
     }
   }
   ```

   (That `publicKey` enables signature verification.) ([W3C][1])

### 2) Federation transport (S2S)

3. **Inbox**
   `POST /users/:id/inbox` (and optionally `/inbox` for a shared inbox)

   * Verify **HTTP Signature** on every POST (required by major servers).
   * Handle a minimal set of Activities:

     * **Follow** → record follower; respond later with **Accept** (delivered back to follower’s inbox).
     * **Undo** (of Follow, Like, Announce) → revert prior activity.
     * **Create { Note | Article }** → store/render as a Mesh post/message (addressing rules respected).
     * **Delete** → mark object deleted.
     * **Like / Announce** → optionally reflect counters/boosts.
   * Deduplicate by `activity.id`. ([W3C][1])

4. **Outbox & delivery**
   On a local post in Mesh (or cross‑post), produce a `Create` Activity and **fan‑out** to followers’ **inboxes** (use their `endpoints.sharedInbox` if present). The Actor’s **outbox** should be an **OrderedCollection** of recent Activities, with pagination via `OrderedCollectionPage`. ([W3C][8])

5. **Authorized Fetch compatibility (optional but pragmatic)**

   * When a remote instance is in secure mode, sign **GET** requests for objects and actors with your actor key.
   * Add a server switch to require signatures on your own GETs if you want a “private by default” stance. ([W3C][6], [SWICG][4])

### 3) Collections & metadata

6. **Followers/Following**
   `GET /users/:id/followers` and `/following` as ActivityStreams **OrderedCollection**s.
   `POST /users/:id/inbox` (Follow) should update these consistently. ([W3C][1])

7. **Object fetch**
   `GET /objects/:id` returns ActivityStreams objects (Note, Article…). Content types include `application/activity+json` (or `application/ld+json; profile="https://www.w3.org/ns/activitystreams"`). ([W3C][9])

---

## How Mesh’s existing models map to ActivityStreams

* **Plain messages / chat notes** → `Note` (with `inReplyTo` for threads).
* **Articles** → `Article`.
* **Sheaf** content → represent as `Note`/`Article` with `attachment` (Image/Document/Link), and extend via namespaced JSON‑LD (e.g., `"@context": ["https://www.w3.org/ns/activitystreams", {"mesh":"https://mesh.example/ns#"}], "mesh:facets": [...]`). The AS2 model is explicitly designed to be **extensible**. ([W3C][10], [GitHub][11])
* **Polls** → `Question` (use `oneOf`/`anyOf` options), which many fediverse servers understand. ([W3C][12], [Mastodon Docs][13])
* **Predictions / markets** → custom extension (e.g., `mesh:Market` + linked `Offer`/`Trade` objects) with your namespace; keep a simple public summary so remote UIs still show something sensible. (AP encourages well‑scoped extensions.) ([SocialHub][14])
* **Bookmarks / stars** → either private, local metadata, or federate as `Add` to a user’s `Collection` (e.g., `Bookmarks`) and `Like`, respectively. ([W3C][9])

---

## A phased compatibility plan for Mesh

**Phase A — Can follow / be followed (MVP S2S)**

* Implement **WebFinger**, **Actor**, **Inbox** (Follow/Accept, Create/Note), **Outbox** (Create/Note fan‑out), **Followers/Following** collections.
* Generate a per‑user key pair; publish **publicKey** in the actor; sign POST deliveries.
* Ship a minimal **“Public post to fediverse”** toggle in your composer (address: `as:Public` + followers) and render inbound remote Notes in your timelines. ([W3C][1])

**Phase B — Quality & safety**

* Add **shared inbox** for efficient fan‑out.
* Support **Undo**, **Delete**, **Announce**, **Like**.
* Implement a simple **domain block/allow list** and rate‑limits to avoid spam/defederation fallout (common in the fediverse). (Practice rather than spec, but essential in production.)

**Phase C — Rich Mesh objects**

* Map **Articles**, **Sheaf** attachments, **Polls (Question)**, and include a conservative **JSON‑LD extension** for Mesh‑specific fields.
* Support **Authorized Fetch** if you want to interoperate with privacy‑strict servers, and gate your own GETs if you later decide to run in “secure” mode. ([W3C][6])

**Phase D — Universal Inbox bridge**

* Connect your **Polyglot Bridge Bots** so ActivityPub mentions/replies appear in Mesh conversations with source metadata (`origin: "activitypub"`). This is outside the spec but aligned with your roadmap.

---

## Implementation notes (concrete)

**1) Content types & headers**

* Serve actors/objects with `application/activity+json`.
* Many implementations accept compact JSON without JSON‑LD processing; keep the standard `@context` and stable IDs. ([W3C][9])

**2) Signatures**

* Publish `publicKeyPem` on the actor; sign S2S POSTs using the classic “Signature” header format (keyId → your `actor#main-key`). Verify inbound signatures before trusting the payload. Add GET signing when talking to secure‑mode servers. ([SWICG][4])

**3) Addressing & privacy**

* For public posts, set `to: [as:Public]` and `cc: [followers]`.
* For followers‑only, omit `as:Public` and target only your followers’ inboxes (or your own followers collection). ([W3C][7])

**4) Pagination**

* Use **OrderedCollection** and **OrderedCollectionPage** for outbox/followers/following; include `first`, `next`, `prev` links. (Simple ascending ID pages work fine.) ([W3C][1])

**5) Testing**

* From a Mastodon account, search `@alice@mesh.example`, click **Follow** → ensure your inbox records it and you deliver an **Accept**.
* Post a public `Note` from Mesh → confirm it appears for that Mastodon follower.
* Try a server with **Authorized Fetch** to confirm signed GETs.

---

## How this fits Mesh’s strategy

* **No lock‑in.** Users can talk to the fediverse without leaving Mesh, and Mesh’s richer content (Sheaf, Articles, GitChat proposals) still renders as sensible Notes/Articles with attachments. (Extensions degrade gracefully.) ([W3C][9])
* **Meta‑layer value.** Your **Universal Inbox** becomes strictly more useful when ActivityPub is just “another bus” alongside email/ATProto.
* **Governance & ethics.** You can honor local moderation norms by domain‑level controls while giving creators identity portability.

---

## Quick reference: example payloads

**Create → Note**

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://mesh.example/activities/01H...",
  "type": "Create",
  "actor": "https://mesh.example/users/alice",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://mesh.example/users/alice/followers"],
  "object": {
    "id": "https://mesh.example/notes/01H...",
    "type": "Note",
    "attributedTo": "https://mesh.example/users/alice",
    "content": "<p>Hello, fediverse!</p>",
    "published": "2025-08-19T12:00:00Z"
  }
}
```

**Follow (inbound to your inbox) → Accept (outbound)**

```json
// inbound
{ "@context":"https://www.w3.org/ns/activitystreams",
  "id":"https://remote.example/activities/abc",
  "type":"Follow",
  "actor":"https://remote.example/users/bob",
  "object":"https://mesh.example/users/alice" }

// your response
{ "@context":"https://www.w3.org/ns/activitystreams",
  "id":"https://mesh.example/activities/def",
  "type":"Accept",
  "actor":"https://mesh.example/users/alice",
  "object":{
    "type":"Follow",
    "actor":"https://remote.example/users/bob",
    "object":"https://mesh.example/users/alice"
  } }
```

(IDs must be dereferenceable where appropriate; store and de‑dupe by `id`.)

---

## Useful primary references

* **ActivityPub (W3C Rec):** model, inbox/outbox, C2S vs S2S. ([W3C][1])
* **ActivityStreams 2.0 (Core & Vocabulary):** object types, extensibility. ([W3C][9])
* **WebFinger (RFC 7033):** discovery of `acct:` identifiers → actor URL. ([IETF Datatracker][2])
* **Actor/inbox/outbox primer:** concrete behaviors & requirements. ([W3C][1])
* **Addressing & Public visibility:** using `to/cc` and `as:Public`. ([W3C][7])
* **Authorized Fetch / HTTP Signatures:** why some servers require signed GETs; compatibility guidance. ([SWICG][4], [W3C][6])

---

If you want, I can draft **exact Next.js route stubs** (`/.well-known/webfinger`, `/users/[id]`, `/users/[id]/inbox`, `/users/[id]/outbox`) plus a tiny signer/verifier module (PEM keypair, `Signature` header) using your existing auth & Prisma—kept minimal so you can iterate safely.

[1]: https://www.w3.org/TR/activitypub/?utm_source=chatgpt.com "ActivityPub"
[2]: https://datatracker.ietf.org/doc/html/rfc7033?utm_source=chatgpt.com "RFC 7033 - WebFinger"
[3]: https://docs.joinmastodon.org/spec/webfinger/?utm_source=chatgpt.com "WebFinger - Mastodon documentation"
[4]: https://swicg.github.io/activitypub-http-signature/?utm_source=chatgpt.com "ActivityPub and HTTP Signatures"
[5]: https://github.com/w3c/activitypub/issues/402?utm_source=chatgpt.com "Document authorized fetch · Issue #402 · w3c/activitypub"
[6]: https://www.w3.org/wiki/ActivityPub/Primer/Authentication_Authorization?utm_source=chatgpt.com "ActivityPub/Primer/Authentication Authorization"
[7]: https://www.w3.org/wiki/ActivityPub/Primer/Addressing?utm_source=chatgpt.com "ActivityPub/Primer/Addressing - W3C Wiki"
[8]: https://www.w3.org/wiki/ActivityPub/Primer/Outbox?utm_source=chatgpt.com "ActivityPub/Primer/Outbox - W3C Wiki"
[9]: https://www.w3.org/TR/activitystreams-core/?utm_source=chatgpt.com "Activity Streams 2.0"
[10]: https://www.w3.org/ns/activitystreams?utm_source=chatgpt.com "ActivityStreams 2.0 Terms"
[11]: https://github.com/w3c/activitystreams?utm_source=chatgpt.com "w3c/activitystreams: Activity Streams 2.0"
[12]: https://www.w3.org/wiki/Activity_Streams/Primer/Representing_Questions?utm_source=chatgpt.com "Activity Streams/Primer/Representing Questions"
[13]: https://docs.joinmastodon.org/spec/activitypub/?utm_source=chatgpt.com "ActivityPub - Mastodon documentation"
[14]: https://socialhub.activitypub.rocks/t/best-practices-for-ap-vocabulary-extensions/3162?page=2&utm_source=chatgpt.com "Best-practices for AP vocabulary extensions? - Page 2"
