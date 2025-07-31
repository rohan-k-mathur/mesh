Below is a **full build plan** for **“Room Shards & Portable Rooms,”** delivered in two parts:

---

## A. Technical blueprint (what we’re building)

### 1 · Room Shards (cloud‑hosted sovereign data)

| Component             | Design highlights                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Storage isolation** | Each decentralised room gets **its own PostgreSQL database schema** (or whole DB) and **its own S3 bucket** encrypted by a **dedicated AWS KMS key**.                                                                                                                                                                                                                                                                                     |
| **Tenant routing**    | Requests carry `x-room-id`.  A *RoomPrismaFactory* lazily instantiates (and caches) a `PrismaClient` whose `datasource.url` is swapped at runtime to `<BASE_URL>?schema=room_<id>`.                                                                                                                                                                                                                                                       |
| **Provisioning flow** | Room admin hits **“Decentralise Room”** in settings → a **wizard** triggers a backend job that:<br>1) Creates RDS schema, runs baseline migration.<br>2) Copies existing room rows from **global DB** to shard.<br>3) Creates S3 bucket `mesh-room-<id>` and KMS key; sets IAM policy so only that room’s service role can access it.<br>4) Updates `rooms` table (in global DB) with `shardConnectionString`, `bucketName`, `kmsKeyArn`. |
| **Billing**           | Attach AWS **Cost Allocation Tag** `RoomId=<id>` on bucket and KMS so the bill can be shown to the admin dashboard.                                                                                                                                                                                                                                                                                                                       |

\### 2 · Portable Rooms (self‑host option)

| Component              | Design highlights                                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Export bundle**      | One‑click “Export Room” produces `room_<id>.tar.zst` containing:<br>• `db.sql` (pg\_dump of shard schema)<br>• `/media/` directory (S3 objects)<br>• `metadata.json` (version, original IDs, hash)                                                                                                                                                          |
| **Mesh‑Lite docker**   | Minimal services: `postgres:15`, `minio` (S3‑compatible), `mesh-lite` (Next.js + API). Comes with volume mounts and `import.sh` that:<br>1) Restores `db.sql` into Postgres.<br>2) Syncs `/media` into MinIO bucket.<br>3) Re‑writes any absolute CDN URLs to local MinIO presigned links.<br>4) Emits new `roomUUID` mapping file for backward references. |
| **Re‑import to cloud** | Admin of a different Mesh instance can upload the same bundle; an **importer** script creates a new shard and translates IDs, preserving original authorship signatures.                                                                                                                                                                                    |

---

\## B. Step‑by‑step implementation packets

Feed each packet to Codex sequentially.  Use the prompt:

> “You are working in the Mesh monorepo. Implement everything in **PACKET N** exactly. When finished, reply only with the list of changed files.”

### PACKET 0 · Prep & dependencies (15 min)

| Action                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------- |
| 0‑1 `git checkout -b room-shards`                                                                                                 |
| 0‑2 `pnpm add -w @aws-sdk/client-s3 @aws-sdk/client-kms pg pg-connection-string zod archiver prisma-multi-tenant`                 |
| 0‑3 Add **ENV vars** template to `.env.example`: `SHARD_PG_URL_BASE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. |

*Accept:* branch builds green.

---

### PACKET 1 · Schema updates (30 min)

| File(s)                         | Steps                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `prisma/schema.prisma`          | Add fields to `Room` model: `isSharded Boolean @default(false)`, `shardUrl String?`, `mediaBucket String?`, `kmsKeyArn String?`. |
| `prisma/migrations/*`           | Generate migration.                                                                                                              |
| `packages/shared-types/room.ts` | Update `Room` interface accordingly.                                                                                             |

*Accept:* `npx prisma migrate dev` runs.

---

### PACKET 2 · RoomPrismaFactory util (45 min)

| File(s)                                           | Steps                                                                                                                                                                                                                                                 |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/room-prisma-factory/index.ts` (new)     | Export `getPrismaForRoom(roomId: string)`. Logic:<br>1) Confirms shardUrl from global Prisma.<br>2) If absent → returns global client.<br>3) Else pulls from in‑memory LRU cache or instantiates new `PrismaClient` with `datasource.url = shardUrl`. |
| Add unit tests with Vitest (mock different URLs). |                                                                                                                                                                                                                                                       |

*Accept:* tests pass; repeated calls reuse cached client.

---

### PACKET 3 · AWS helper service (50 min)

| File(s)                                                   | Steps                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/lib/shardProvisioner.ts` (new)                  | Functions:<br>`createRdsSchema(roomId)` – `CREATE SCHEMA room_<id>` + run baseline migration via `prisma migrate deploy --schema room.sql`.<br>`createS3Bucket(roomId)` – calls S3 `CreateBucket`; applies bucket policy.<br>`createKmsKey(roomId)` – `CreateKey` + `CreateAlias`. |
| Expose single `provisionShard(room)` orchestrating above. |                                                                                                                                                                                                                                                                                    |

*Accept:* `provisionShard('abc')` integration test in localstack (optional) succeeds.

---

### PACKET 4 · “Decentralise Room” wizard API (40 min)

| File(s)                                     | Steps                                                                                                                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/api/room/[id]/decentralise/route.ts`   | Protected POST: verify admin, call `provisionShard`, then queue **data copy job** to background worker (`bullmq`).                                                                              |
| `workers/copyRoomJob.ts`                    | 1) Select all room‑scoped tables (`messages`, `media`, etc.) where `roomId=id`; insert into shard DB.<br>2) For each media object, copy from global bucket to new bucket using S3 `CopyObject`. |
| Update `Room.isSharded=true` on completion. |                                                                                                                                                                                                 |

*Accept:* Triggering endpoint sets job status, DB rows appear in shard, bucket exists.

---

### PACKET 5 · Runtime tenant routing middleware (30 min)

| File(s)                                                                                       | Steps                                                                                                          |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `apps/api/middleware/roomContext.ts`                                                          | Express/Next‑API middleware: extract `roomId` header or query, attach `req.prisma = getPrismaForRoom(roomId)`. |
| Refactor two representative endpoints (`/sendMessage`, `/fetchMessages`) to use `req.prisma`. |                                                                                                                |

*Accept:* Messages in sharded room are stored & fetched from shard DB (verify via psql).

---

### PACKET 6 · Frontend wizard UI (45 min)

| File(s)                                         | Steps                                                                                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/RoomSettings/DecentralisePanel.tsx` | 1) Shows cost estimate (RDS + S3 per GB) using AWS Pricing JSON.<br>2) “Start” button calls API, subscribes to job SSE `/api/room/[id]/decentralise/status`. |
| Show progress bar (migrated rows / total).      |                                                                                                                                                              |

*Accept:* Live progress updates; final toast “Room is now sovereign!”.

---

### PACKET 7 · Export bundle (60 min)

| File(s)                             | Steps                                                                                                                                                                                                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/api/room/[id]/export/route.ts` | 1) Dump schema: spawn `pg_dump --schema=room_<id>` to temp file.<br>2) Use S3 `ListObjects & GetObject` to stream media into `media/` folder.<br>3) Create `metadata.json` (room name, createdAt, schemaVer).<br>4) Use `archiver` to tar + zstd compress, pipe to response with `Content-Disposition: attachment`. |

*Accept:* Downloaded archive contains expected files and size.

---

### PACKET 8 · Mesh‑Lite docker (90 min)

| File(s)                               | Steps                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `deploy/mesh-lite/docker-compose.yml` | Services: `db`, `minio`, `mesh-lite` (light Next API + S3 proxy).                                                                    |
| `deploy/mesh-lite/import.sh`          | Parses tarball, restores DB, uploads media to MinIO, rewrites URLs in DB (`UPDATE media SET url=CONCAT('http://minio:9000/', key)`). |
| README with quick‑start.              |                                                                                                                                      |

*Accept:* `docker-compose up`, run `./import.sh path/to/tar`, open `localhost:3000/room/<slug>` shows content.

---

### PACKET 9 · Cloud re‑import (45 min)

| File(s)                       | Steps                                                                                                                                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/api/importRoom/route.ts` | Accept tar upload.<br>1) Allocate new room ID.<br>2) Provision shard & bucket.<br>3) Restore DB dump inside new schema.<br>4) Push media to S3.<br>5) Re‑map any user IDs that collide via mapping table; store mapping in `import_history`. |

*Accept:* Uploading an export spins up fully working room on cloud; post IDs preserved.

---

### PACKET 10 · Auth, billing & limits (35 min)

| Steps                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10‑1 Add Stripe metered billing item `room-shard-gb` (storage) and `room-shard-db-hours` (RDS).<br>10‑2 Cron job collects bucket size & RDS bytes, pushes to Stripe usage. |
| 10‑3 Add guard: free tier limit 1 GB / 30 days.                                                                                                                            |

*Accept:* Charges appear in Stripe test mode; over‑limit room shows banner.

---

### PACKET 11 · Monitoring & rollback (25 min)

| Steps                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------- |
| 11‑1 CloudWatch dashboard per bucket & RDS schema.<br>11‑2 “Re‑centralise” button: moves data back, deletes shard resources. |

*Accept:* Rollback executes safely, cost tags removed.

---

### PACKET 12 · E2E tests & docs (45 min)

| Steps                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Playwright: create room, decentralise, send messages, export, spin Mesh‑Lite, verify messages.<br>Docs: `/docs/room-shards.md` with diagrams & FAQ. |

*Accept:* CI green; doc merged.

---

## Build order & estimates

| Phase                  | Packets | ETA   |
| ---------------------- | ------- | ----- |
| **MVP operational**    | 0‑5     | \~6 h |
| **User workflow**      | 6‑7     | \~3 h |
| **Self‑host & import** | 8‑9     | \~4 h |
| **Billing + ops**      | 10‑12   | \~3 h |

Total ≈ **16 hours** for a senior/full‑stack engineer (parallelisable).

---

Implement these packets sequentially; once complete, Mesh will offer **true micro‑community sovereignty**—users gain the freedom of a Mastodon instance **without** the DevOps burden, while Mesh retains a seamless, multimodal user experience.
