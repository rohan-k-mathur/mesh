Perfect—here’s a concrete, end-to-end build plan for **Room Shards & Portable Rooms**, grounded in the briefs you shared and split into crisp steps you can hand to engineering today.

---

# Goal & guard-rails

**What we’re shipping (MVP):** one-click **Decentralise Room** (per-room schema + S3 bucket + KMS key), **Portable Export** (tar.zst with db dump, media, manifest + signature), **Mesh-Lite** import, **Re-import** to any Mesh instance, plus a **Sovereignty Receipt** and per-room cost meter.&#x20;

**Why it matters:** it delivers **Verified Exit** (auditable export that boots elsewhere) and **Dual-Control Data** (per-room keys/buckets with revocable grants), presented as a **sovereignty slider** (Pooled → Sovereign → Portable → BYOC).&#x20;

**System shape:** global **control plane** (auth, profiles, billing, search/notifications) + room **data plane** (content in per-room schema, media in per-room bucket, KMS CMK), with shard writes mirrored to a global index via CDC.&#x20;

---

# Sprint 1 — Schema, plumbing, and provisioner

1. **Room model changes**

   * Add `isSharded:Boolean @default(false)`, `shardUrl:String?`, `mediaBucket:String?`, `kmsKeyArn:String?` to `Room`.
   * Migration + backfill (all existing rooms `isSharded=false`).
     *Acceptance:* migrations run cleanly in staging.

2. **Prisma tenant routing**

   * Build `getPrismaForRoom(roomId)` → returns cached Prisma client; if `shardUrl` exists, instantiate with that DSN; otherwise use global client.
   * Cap pool per shard; add LRU with TTL to avoid client explosion.
     *Acceptance:* unit test proves cache reuse; connection counts stable under load.
     *Rationale:* per-room client factory is explicitly in the brief.&#x20;

3. **AWS resource helpers**

   * `createSchema(roomId)` → `CREATE SCHEMA room_<id>` + run baseline SQL.
   * `createBucket(roomId)` → S3 bucket with SSE-KMS; lifecycle (IA after 90d).
   * `createKmsKey(roomId)` → CMK + alias `room/<id>`; produce a **grant** for Mesh’s service role; store `kmsKeyArn`.
     *Acceptance:* idempotent creation; tagging (Cost Allocation) on bucket/KMS.
     *Rationale:* per-room isolation via schema + S3 + KMS is the core.&#x20;

4. **Provisioner orchestration**

   * `provisionShard(roomId, region)` does schema/bucket/KMS, writes `shardUrl`/`mediaBucket`/`kmsKeyArn`, flips `isSharded=true`.
     *Acceptance:* a new shard is reachable; writes go to shard schema; media writes land in the room bucket.

5. **CDC → global index**

   * When writing to a shard, also emit a compact event to a global stream (Redis/Kafka) consumed by your search/notifications indexer (no cross-shard joins).
     *Acceptance:* new room posts appear in global search within N seconds.
     *Rationale:* called out in the product brief.&#x20;

---

# Sprint 2 — “Decentralise Room” wizard (API + UI) + copy job

6. **Admin UI (Sovereignty slider)**

   * Room Settings → “Pooled / Sovereign / Portable / BYOC (coming soon)”.
   * Click **Decentralise**: region chooser, **cost estimate**, list of assets to be created; progress bar; **Sovereignty Receipt** at the end.
     *Acceptance:* strings match spec; receipt shows region, bucket, KMS alias, timestamp.&#x20;

7. **API routes**

   * `POST /api/rooms/:id/decentralise` (authz: room admins) → call `provisionShard`, then enqueue **copy job**:
     a) copy all room rows from global schema to shard schema,
     b) copy S3 objects from global bucket → room bucket,
     c) re-wire media URLs to room bucket.
   * `GET /api/rooms/:id/decentralise/status` (SSE) → progress events.
     *Acceptance:* job retries; partial failures resume; messages count parity.

8. **Sovereignty Receipt**

   * On success, write a small JSON object (room id, region, KMS alias, bucket, `manifestHash` placeholder) and **sign** it with your platform key; expose “Download receipt”.
     *Rationale:* user-visible proof is part of the promise.&#x20;

---

# Sprint 3 — Export, Mesh-Lite, and Re-import

9. **Portable export (download)**

   * `GET /api/rooms/:id/export` → stream a `room_<id>.tar.zst` containing:

     * `db.sql` (schema-scoped dump),
     * `media/` (all objects),
     * `manifest.json` (room metadata, versions, absolute counts, SHA-256 hashes),
     * `export.signature` (detached signature of `manifest.json` using Mesh export key).
       *Acceptance:* Tar streams; signature verifies; archive imports cleanly.
       *Rationale:* audit-ready export with manifest + signature is central to **Verified Exit**.&#x20;

10. **Mesh-Lite (Docker)**

    * Compose file with `postgres`, `minio`, `mesh-lite` API.
    * `import.sh` unpacks tarball, restores `db.sql`, uploads `media/` to MinIO, rewrites URLs, starts `mesh-lite`.
      *Acceptance:* `docker compose up` + `import.sh` shows the room locally, matching counts.
      *Rationale:* “boots in minutes” is part of the one-line promise.&#x20;

11. **Re-import to cloud**

    * `POST /api/rooms/import` → accepts tarball, provisions shard, restores SQL, uploads media, maps legacy IDs if necessary, and emits a new **Sovereignty Receipt**.
      *Acceptance:* a new room is live on Mesh from the tarball.

---

# Sprint 4 — Runtime hardening, costs, quotas

12. **Cost metering & billing**

    * Nightly job: measure bucket size + estimated DB size per shard; write to `room_usage` and push metered usage to Stripe.
    * UI: “live cost meter”, soft quotas, lifecycle rules surfaced (e.g., transition to infrequent access at 90d).
      *Rationale:* avoid cost surprises; explicitly called out.&#x20;

13. **Security posture**

    * KMS: per-room key **grants** for Mesh; “Revoke Mesh” button (warn: room becomes sealed).
    * Key rotation: toggle rotates CMK alias; lazy re-encrypt media on access.
    * S3: block public ACLs; presigned URLs only.

14. **Observability & limits**

    * Per-room dashboards: connection count, query latency, media egress, error rate.
    * Global caps: maximum active shards; alarms on pool pressure.
    * Backups: PITR for Postgres; S3 versioning enabled.

---

# Sprint 5 — Trust & compliance surfaces (ship alongside MVP)

15. **Passport & Verifier (Right-to-Exit)**

    * `/passport`: export page + **download verifier** (CLI/web) to validate signatures + hashes; link from Room Settings.
      *Rationale:* “export with cryptographic proofs” + verifier turns trust into a product, and is a headline commitment.&#x20;

16. **Trust Center**

    * `/trust`: show policy hash, bridge uptime, moderation metrics, export endpoints; publish policy-as-code change log.
      *Rationale:* part of the “reg-hacking” blueprint to win power users and avoid knee-jerk dismissal.&#x20;

17. **Data residency**

    * Region pinning in the decentralise wizard; document residency in the Trust Center.
      *Rationale:* requested by compliant teams.&#x20;

---

# Sprint 6 — Interop fit & follow-ups

18. **ActivityPub fit**

    * Keep control plane actor discovery & inbox/outbox global; for sovereign rooms, allow per-room actor namespaces and shared inbox routing if enabled.
    * Add **Authorized Fetch** and signed GETs for secure servers.
      *Rationale:* aligns with the ActivityPub plan and Universal Inbox bridge. &#x20;

19. **Universal Inbox**

    * Tag messages from shards with `roomId`; stream to inbox UI via CDC as today; spam/rate limits at the inbox boundary.
      *Rationale:* interop is a pillar of differentiation.&#x20;

---

# Rollout plan & acceptance

* **Feature flags:** `roomShards.enabled`, `roomExport.enabled`, `meshLite.link`.
* **Dark launch:** decentralise a private internal room; run export/import drill; publish a public “Sovereignty Receipt.”
* **Beta cohort:** 5–10 rooms with >1k messages; monitor cost/latency; gather NPS on “trust to leave.”&#x20;
* **GA criteria:** success metrics trending (decentralise %; export success rate; cost incidents <1%/mo).&#x20;

---

# Exact deliverables checklist (engineer-ready)

**Backend**

* [ ] Prisma schema + migrations (Room fields).
* [ ] Prisma tenant factory (LRU, pool limits).
* [ ] AWS provisioner (schema/bucket/KMS) + idempotency.
* [ ] Copy job (DB rows + S3 objects) with resume.
* [ ] CDC emitter to search/notifications.
* [ ] Export route (tar.zst + manifest + signature).
* [ ] Re-import route (provision, restore, remap).
* [ ] Usage meter + Stripe metered billing.

**Frontend**

* [ ] Sovereignty slider panel + cost preview.
* [ ] Decentralise progress (SSE) + **Sovereignty Receipt** download.
* [ ] Export button + “How to run Mesh-Lite” modal.
* [ ] Cost meter + quota banners in Room Settings.

**Ops**

* [ ] IAM policies for per-room buckets; KMS grants.
* [ ] Monitoring dashboards; pool pressure alarms.
* [ ] Backups: PITR + S3 versioning; run restore drill.

**Trust**

* [ ] `/passport` + verifier (CLI/web).
* [ ] `/trust` with policy hash & transparency counters.&#x20;

---

# What we’ll deliberately **defer** (post-MVP)

* **Global, generalized E2EE** for all content types; start later with an **E2EE lane** for DMs/private rooms.&#x20;
* **BYOC** multi-cloud orchestrations; keep as phase two.&#x20;

---

If you want this split into **tickets (with file paths and code scaffolds)**, say the word and I’ll turn each Sprint block into PR-sized tasks you can paste into your tracker.
