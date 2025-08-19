Absolutely—here are the four deliverables, polished and ready to drop into your repo/wiki.

---

# 1) Product brief (Notion‑ready)

> **Title:** Room Shards & Portable Rooms — *Verified Exit + Dual‑Control Data*

**Promise (1 line)**
**Own your room’s data, keys, and bill—without running servers.** If Mesh disappears or misbehaves, your room still runs from an export—verifiably, in minutes.

## Why this matters

* **Verified Exit (defensible):** First‑class, auditable export (DB + media + manifest + signature) that **boots** in Mesh‑Lite or re‑imports to any Mesh instance.
* **Dual‑Control Data:** Per‑room KMS key & S3 bucket with **revocable grants**; Mesh serves as control‑plane, your room is the data‑plane.
* **Sovereignty slider:** Pooled → **Sovereign** (shard) → **Portable** (export) → BYOC (later). No other mainstream platform offers a smooth continuum.

## Primary users

* **Community leads** (creators, DAOs, meetups): want *power without ops*; fear lock‑in & ToS drift.
* **Compliant teams** (health/education/NGO): need **region pinning** + right‑to‑exit warranties.
* **Open‑web believers:** want ownership & forkability with a polished UX.

## MVP scope (feels complete)

* **Decentralise Room wizard:** region, cost estimate, one‑click provision (schema + bucket + KMS key), real‑time progress, **Sovereignty Receipt**.
* **Room isolation:** per‑room DB schema + S3 bucket with SSE‑KMS; Mesh holds a revocable grant.
* **Portable export:** `room_<id>.tar.zst` (db.sql + media/ + manifest.json + signature).
* **Mesh‑Lite (Docker):** `docker compose up` + `import.sh` boots the room locally.
* **Re‑import:** upload the tarball to any Mesh instance → becomes a shard.
* **Observability:** per‑room usage & cost meter; soft limits & alerts.

## What’s explicitly *not* in MVP

* Global E2EE for all content types (design an **E2EE lane** later).
* Cross‑room ACID; we use events/CDC.
* Multi‑cloud BYOC orchestration (phase 2).

## Technical architecture (high‑level)

* **Control plane** (global): auth, profiles, billing, search index, notifications.
* **Data plane** (room): content in room schema + media in room bucket; per‑room KMS CMK.
* **Prisma factory:** LRU cache, per‑room clients, PgBouncer, low pool per shard.
* **CDC to index:** shard writes emit compact events → global searchable index.

## Risks & mitigations

* **Ops overhead:** start schema‑per‑room, cap shard count, strong observability.
* **Latency:** keep hot rooms in admin’s region; CDN for media; global index for search.
* **Cost surprises:** show **live cost meter**, lifecycle rules (e.g., transition after 90 days).

## Success metrics

* % rooms that decentralise in 30 days
* Export completion rate; average time to boot in Mesh‑Lite
* Cost overrun incidents/month (goal: < 1%)
* Admin NPS on “trust to leave” (target ≥ 60)

---

# 2) Wizard UI copy (final strings + flow)

## Flow overview

1. **Intro → Choose Level** (Pooled → Sovereign → Portable)
2. **Region & Estimate** (region picker, cost estimate, storage preview)
3. **Review & Confirm** (checklist, “I understand…” checkbox)
4. **Provisioning** (progress stream: schema → kms → bucket → copy → verify)
5. **Done** (Sovereignty Receipt + download links)

### Screen 1 — Intro

* **Title:** Make this room sovereign
* **Body:** You can move this room’s content into its own datastore with its own encryption keys and media bucket. You keep Mesh’s UX—now with ownership.
* **Bullets:**

  * Your data lives in a dedicated schema and S3 bucket.
  * A room‑specific KMS key encrypts media. You can revoke Mesh’s grant.
  * Export anytime into a bundle that boots in under five minutes.
* **CTA Primary:** Continue
* **CTA Secondary:** Learn more (opens docs)

### Screen 2 — Region & estimate

* **Label:** Choose a region

  * **Helper:** Pick the data residency closest to your members or compliance needs.
* **Cost card:**

  * **Title:** Estimated monthly cost
  * **Line items:** Storage (XX GB), Egress (est.), DB hours
  * **Note:** This is an estimate. You pay pass‑through cloud cost + a small Mesh fee.
* **Info microcopy:**

  * “You can view detailed usage at any time in Room Settings → Sovereignty.”
* **CTA Primary:** Continue
* **CTA Secondary:** Back

**Validation errors:**

* “Please select a region to continue.”

### Screen 3 — Review & confirm

* **Checklist:**

  * A dedicated database schema will be created in **{region}**.
  * A dedicated S3 bucket will be created and encrypted with a **new KMS key**.
  * Mesh will receive a **grant** to use that key to serve your media.
  * You can revoke the grant later (media will stop serving via Mesh until you re‑grant or self‑host).
* **Acknowledgement box:**

  * **Checkbox label:** I understand the responsibilities and potential costs of a sovereign room.
* **CTA Primary:** Start decentralising
* **CTA Secondary:** Back

**Validation:**

* “Please acknowledge the responsibilities to continue.”

### Screen 4 — Provisioning (live progress)

* **Title:** Making your room sovereign…
* **Steps with statuses:**

  * Create database schema
  * Create KMS key
  * Create media bucket
  * Copy existing data ( {migrated}/{total} )
  * Verify & finalize
* **Inline log area (collapsible):** show timestamps and step outputs.
* **Failure footer:**

  * “Something went wrong. Your room remains pooled. View details or contact support.”

### Screen 5 — Success

* **Title:** Your room is now sovereign
* **Summary:**

  * Region: **{region}**
  * Schema: **{schemaName}**
  * Bucket: **{bucketName}**
  * KMS key alias: **{alias}**
* **Buttons:**

  * **Download Sovereignty Receipt (JSON)**
  * **Download Sovereignty Receipt (PDF)**
  * **Export room (tar.zst)**
* **Note:** Keep the receipt in a safe place. It contains the identifiers you’ll use to verify exports and audit access.

---

## i18n string bundle (JSON)

```json
{
  "sovereignty.intro.title": "Make this room sovereign",
  "sovereignty.intro.body": "You can move this room’s content into its own datastore with its own encryption keys and media bucket. You keep Mesh’s UX—now with ownership.",
  "sovereignty.intro.bullets": [
    "Your data lives in a dedicated schema and S3 bucket.",
    "A room‑specific KMS key encrypts media. You can revoke Mesh’s grant.",
    "Export anytime into a bundle that boots in under five minutes."
  ],
  "common.continue": "Continue",
  "common.back": "Back",
  "sovereignty.region.title": "Choose a region",
  "sovereignty.region.helper": "Pick the data residency closest to your members or compliance needs.",
  "sovereignty.cost.title": "Estimated monthly cost",
  "sovereignty.cost.note": "This is an estimate. You pay pass‑through cloud cost + a small Mesh fee.",
  "sovereignty.review.title": "Review & confirm",
  "sovereignty.review.points": [
    "A dedicated database schema will be created in {region}.",
    "A dedicated S3 bucket will be created and encrypted with a new KMS key.",
    "Mesh will receive a grant to use that key to serve your media.",
    "You can revoke the grant later (media will stop serving via Mesh until you re‑grant or self‑host)."
  ],
  "sovereignty.review.ack": "I understand the responsibilities and potential costs of a sovereign room.",
  "sovereignty.provisioning.title": "Making your room sovereign…",
  "sovereignty.provisioning.steps": [
    "Create database schema",
    "Create KMS key",
    "Create media bucket",
    "Copy existing data",
    "Verify & finalize"
  ],
  "sovereignty.success.title": "Your room is now sovereign",
  "sovereignty.success.summary.region": "Region",
  "sovereignty.success.summary.schema": "Schema",
  "sovereignty.success.summary.bucket": "Bucket",
  "sovereignty.success.summary.alias": "KMS key alias",
  "sovereignty.actions.downloadReceiptJson": "Download Sovereignty Receipt (JSON)",
  "sovereignty.actions.downloadReceiptPdf": "Download Sovereignty Receipt (PDF)",
  "sovereignty.actions.export": "Export room (tar.zst)",
  "errors.needRegion": "Please select a region to continue.",
  "errors.needAck": "Please acknowledge the responsibilities to continue.",
  "provisioning.failed": "Something went wrong. Your room remains pooled. View details or contact support."
}
```

---

# 3) Export **manifest & signature** formats + verification CLI

## 3.1 File layout (inside the tarball)

```
room_<id>.tar.zst
├─ manifest.json
├─ export.signature.json
├─ db.sql
└─ media/
   ├─ <object-key-1>
   ├─ <object-key-2>
   └─ ...
```

## 3.2 `manifest.json` (canonical content)

**Principles**

* Deterministic ordering (JCS‑style canonicalization) for signing/verification.
* Contains identifiers from the **Sovereignty Receipt** and a digest of `db.sql` and each media object.

**TypeScript type**

```ts
export type ExportManifest = {
  version: 1;
  room: {
    id: string;            // "482"
    slug: string;          // "opencity"
    title: string;
  };
  issuedAt: string;        // ISO 8601
  sovereignty: {
    region: string;        // "eu-central-1"
    schema: string;        // "room_482"
    bucket: string;        // "mesh-room-482"
    kmsKeyArn: string;     // "arn:aws:kms:…"
    kmsAlias: string;      // "alias/room/482"
  };
  dbDump: {
    file: "db.sql";
    sha256: string;        // hex digest of db.sql
    bytes: number;
  };
  media: {
    count: number;
    totalBytes: number;
    objects: { key: string; sha256: string; bytes: number }[];
  };
  counters: {
    users: number;
    messages: number;
    attachments: number;
    mergeReceipts: number;
  };
  // optional extra indexes
  activity: {
    firstMessageAt?: string | null;
    lastMessageAt?: string | null;
  };
};
```

**Example `manifest.json` (abridged)**

```json
{
  "version": 1,
  "room": { "id": "482", "slug": "opencity", "title": "OpenCity Collective" },
  "issuedAt": "2025-10-01T09:10:00Z",
  "sovereignty": {
    "region": "eu-central-1",
    "schema": "room_482",
    "bucket": "mesh-room-482",
    "kmsKeyArn": "arn:aws:kms:eu-central-1:…:key/…",
    "kmsAlias": "alias/room/482"
  },
  "dbDump": { "file": "db.sql", "sha256": "f1c2…", "bytes": 91234567 },
  "media": {
    "count": 1832,
    "totalBytes": 3719812345,
    "objects": [
      { "key": "images/2025/09/a.png", "sha256": "aa12…", "bytes": 234567 },
      { "key": "docs/spec.pdf", "sha256": "bb34…", "bytes": 845678 }
    ]
  },
  "counters": { "users": 712, "messages": 45812, "attachments": 1832, "mergeReceipts": 41 },
  "activity": { "firstMessageAt": "2024-03-12T18:02:11Z", "lastMessageAt": "2025-09-29T07:15:04Z" }
}
```

## 3.3 `export.signature.json`

**Design**

* Ed25519 signature over the **canonicalized bytes of `manifest.json`**.
* Include the manifest’s sha256 for quick visual checks, plus issuer metadata.

**TypeScript type**

```ts
export type ExportSignature = {
  algorithm: "ed25519-2020";
  issuer: "mesh.app";
  keyId: string;               // e.g. "mesh-exports:2025-01"
  signedAt: string;            // ISO 8601
  manifestSha256: string;      // hex of canonical bytes
  signature: string;           // base64 ed25519 signature over canonical manifest bytes
  publicKeyPem?: string;       // optional embed; else publish via docs or include in receipt
};
```

**Example**

```json
{
  "algorithm": "ed25519-2020",
  "issuer": "mesh.app",
  "keyId": "mesh-exports:2025-01",
  "signedAt": "2025-10-01T09:12:43Z",
  "manifestSha256": "1d4a7fe0c0…",
  "signature": "5b5ScM1R0l0v0p1…==",
  "publicKeyPem": "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA…\n-----END PUBLIC KEY-----\n"
}
```

> **Note:** You can also distribute Mesh’s export public key in your docs and omit `publicKeyPem` here. Keeping it embedded simplifies offline verification.

## 3.4 Canonicalization (for signing & verifying)

Use a simple JCS‑style function:

* Sort object keys lexicographically.
* Preserve array order.
* No insignificant whitespace.
* Use JSON strings for all strings; numbers as numbers.

(You can adopt a third‑party JCS implementation later; below we include a tiny in‑repo version.)

## 3.5 Verification CLI (Node, no deps)

**File:** `tools/verify-export.ts`
Run: `node tools/verify-export.js --manifest manifest.json --sig export.signature.json [--pubkey mesh_pubkey.pem]`

```ts
#!/usr/bin/env node
/**
 * Verify a Mesh export (manifest + signature).
 * Usage:
 *   node tools/verify-export.js --manifest manifest.json --sig export.signature.json [--pubkey mesh_pubkey.pem]
 */
import { readFileSync } from "fs";
import { createHash, createPublicKey, verify as nodeVerify } from "crypto";

function parseArgs() {
  const a = process.argv.slice(2);
  const out: any = {};
  for (let i = 0; i < a.length; i += 2) out[a[i].replace(/^--/, "")] = a[i + 1];
  if (!out.manifest || !out.sig) {
    console.error("Usage: --manifest manifest.json --sig export.signature.json [--pubkey mesh_pubkey.pem]");
    process.exit(2);
  }
  return out;
}

function canonicalize(x: any): string {
  if (x === null || typeof x !== "object") return JSON.stringify(x);
  if (Array.isArray(x)) return "[" + x.map(canonicalize).join(",") + "]";
  const keys = Object.keys(x).sort();
  const items = keys.map((k) => JSON.stringify(k) + ":" + canonicalize(x[k]));
  return "{" + items.join(",") + "}";
}

(function main() {
  const { manifest, sig, pubkey } = parseArgs();
  const manifestObj = JSON.parse(readFileSync(manifest, "utf8"));
  const sigObj = JSON.parse(readFileSync(sig, "utf8"));
  const pubPem = sigObj.publicKeyPem || (pubkey ? readFileSync(pubkey, "utf8").toString() : null);
  if (!pubPem) {
    console.error("Missing public key: pass --pubkey or include publicKeyPem in export.signature.json");
    process.exit(3);
  }

  const canon = canonicalize(manifestObj);
  const manifestHash = createHash("sha256").update(canon).digest("hex");
  if (manifestHash !== sigObj.manifestSha256) {
    console.error("❌ Manifest hash mismatch.");
    console.error(" expected:", sigObj.manifestSha256);
    console.error("   actual:", manifestHash);
    process.exit(4);
  }

  const key = createPublicKey(pubPem);
  const sigBytes = Buffer.from(sigObj.signature, "base64");

  // Ed25519 uses 'null' algorithm param; verify() expects the raw bytes message
  const ok = nodeVerify(null, Buffer.from(canon, "utf8"), key, sigBytes);
  if (!ok) {
    console.error("❌ Signature verification FAILED.");
    process.exit(5);
  }

  console.log("✅ Export verified.");
  console.log(" issuer:", sigObj.issuer, " keyId:", sigObj.keyId, " signedAt:", sigObj.signedAt);
  console.log(" sha256(manifest):", manifestHash);
})();
```

(If you prefer a tiny JS version without TS, transpile or change imports to `require`.)

---

# 4) Launch checklist (pricing toggles, docs, demo path)

## A. Product toggles & pricing

* [ ] **Feature flag:** `rooms.sovereignty.enabled` (global)
* [ ] **Per‑room gate:** `rooms:{id}:sovereignty:allowed` (override for pilots)
* [ ] **Pricing plan fields:**

  * `tier = pooled | sovereign`
  * `sovereign.basePrice` (monthly), `platform.feePct`
  * usage meters (GB stored, DB size, egress GB)
* [ ] **Lifecycle rules:** default S3 transition after 90 days (configurable)
* [ ] **Soft limits & alerts:** thresholds at 80% usage

## B. Docs (ship day‑1)

* [ ] **Concept:** Sovereignty as a slider (plain‑English)
* [ ] **How‑to:** Decentralise a room (wizard walkthrough)
* [ ] **Security:** KMS keys, grants, revocation consequences
* [ ] **Export & verify:** What’s in the tarball; `verify-export` CLI usage
* [ ] **Mesh‑Lite:** Docker compose quick‑start + `import.sh`
* [ ] **FAQ:** Costs, regions, revocation, re‑import, downtime

## C. Demo script (10‑minute live)

1. Create a test room; show status **Pooled**.
2. Open wizard → pick **eu‑central‑1**, show estimate, confirm.
3. Watch progress; on success, **download receipt**.
4. Click **Export**; while it downloads, show the **receipt JSON** (identifiers).
5. Run `docker compose up` for Mesh‑Lite; `./import.sh room_*.tar.zst`.
6. Open `localhost:3000/room/demo` → the room is live.
7. Run `node tools/verify-export.js …` → see ✅ verified.
8. (Optional) Show **Revoke grant** banner and explain consequences (Sealed Room state).

## D. QA matrix

* [ ] Provision succeeds in all supported regions
* [ ] Copy job handles >1M messages, >5,000 media objects
* [ ] Export verifies with CLI on macOS/Linux/Windows
* [ ] Re‑import preserves message IDs, attributions, merge receipts
* [ ] Cost meter updates daily; alerts fire at thresholds
* [ ] Revocation warning copy is clear; unseal flow documented

## E. Runbooks

* [ ] **Provision failures** (rollback & retry)
* [ ] **Key rotation** (KMS rotate + lazy re‑encrypt on access)
* [ ] **Region outage** (clone to new region, flip DNS)
* [ ] **Cost spike** (identify large objects, lifecycle recommendations)
* [ ] **Legal request** (SOP; dual‑control implications)

## F. Analytics / success

* [ ] Track wizard start → success funnel
* [ ] Track exports per room; verify‑CLI telemetry (optional via docs tutorial)
* [ ] NPS prompt after 14 days in sovereign mode
* [ ] Churn interviews include “did the export reassure you?”

---

### Optional: Sovereignty Receipt format (final)

**File:** downloadable after success, and viewable in settings.

```json
{
  "schemaVersion": 1,
  "room": { "id": "482", "slug": "opencity", "title": "OpenCity Collective" },
  "issuedAt": "2025-10-01T09:12:43Z",
  "environment": { "baseUrl": "https://mesh.app" },
  "sovereignty": {
    "region": "eu-central-1",
    "schema": "room_482",
    "bucket": "mesh-room-482",
    "kmsKeyArn": "arn:aws:kms:eu-central-1:…:key/…",
    "kmsAlias": "alias/room/482"
  },
  "exportProfile": { "format": "tar.zst", "manifestSchema": 1 },
  "signing": {
    "issuer": "mesh.app",
    "keyId": "mesh-exports:2025-01",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----\n"
  }
}
```

A simple **PDF rendering** of the same content (with the Mesh logo and a QR code linking to the JSON) works well for grants/boards.

---

If you want, I can also supply:

* a **React component** to render the progress stream & receipt,
* a `zod` schema for `manifest.json` + `export.signature.json`,
* and a minimal `import.sh` for Mesh‑Lite to restore the DB & media.
