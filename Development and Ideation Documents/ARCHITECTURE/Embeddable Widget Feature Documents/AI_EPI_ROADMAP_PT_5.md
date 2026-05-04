
# AI Epistemic Surface — Roadmap Pt. 5

**Theme:** Track D — federated, signed, portable arguments. Move every Isonomia attestation from *"Isonomia asserts X"* to *"author A asserts X, content-hash-pinned, verifiable without calling Isonomia"*, then make the same envelope portable across the open argumentation ecosystem.

**Companion:** [AI_EPI_ROADMAP_TRACK_D_BRAINSTORM.md](AI_EPI_ROADMAP_TRACK_D_BRAINSTORM.md) — conceptual exposition, custody-model trade-offs, and full reuse audit. This document is the actionable sprint plan derived from it, with the brainstorm's open questions resolved as defaults.

**Posture:** Pt. 5 is *not* a new-content sprint. It is a trust-relocation sprint — the corpus does not change; the trust path to it does. The signing layer (D.1) is the foundation; everything else composes on it. Sprint 1 ships the verifiable-attestation slice (D.1 + D.5 + D.2). Sprint 2 ships federation (D.3 + D.4).

---

## Decisions locked (defaults from brainstorm §"Open questions")

| # | Question | Locked answer |
|---|---|---|
| 1 | Key custody model for D.1 | **Server-held per-author keys, KMS-wrapped** (custody model "a"). Browser-held WebAuthn keys are an opt-in upgrade in a later sprint; signature shape is identical so no consumer breakage. |
| 2 | Federation peer policy | **Manual allowlist for v1**, documented escalation path in `/.well-known/federation-peers.json`. No open-federation endpoint until D.3 ships and is exercised by ≥2 vetted peers. |
| 3 | Zenodo DOI granularity | **Per deliberation snapshot, opt-in**. Author/facilitator triggers a snapshot at a citable milestone; snapshot is content-hash-sealed; DOI lives forever. No auto-snapshotting. |
| 4 | VC issuer identity | **`did:web:isonomia.app` primary + `did:key:` shadow** in the DID document as a backup verification method (survives domain change). |
| 5 | Backward compatibility | **Default `?format=attestation` stays unsigned.** Signed envelope is `?format=attestation&signed=1`. VC is `?format=vc`. No existing consumers break. |

These five answers are the contract this sprint plan is written against. If any one of them needs to change, the affected items below need re-scoping before kickoff — flagged inline.

---

## Sprint shape

Six items, leverage-ranked. Items 1–4 are Sprint 1 (verifiable attestation slice). Items 5–6 are Sprint 2 (federation + partnerships). Item 7 is the cross-cutting hardening that lands incrementally across both sprints. Items in *italics* are next-sprint candidates.

**Sprint 1 — Verifiable attestation slice**

1. **JCS canonicalization + per-author Ed25519 signing layer** — substrate for everything else
2. **`AuthorSigningKey` provisioning + `/.well-known/issuer-keys` JWK Set** — the verify path, no-Isonomia-trust-required
3. **Revocation: `RevokedAttestation` + `/.well-known/revoked-attestations` + `did:web` issuer doc** — D.5, bundled with D.1
4. **W3C Verifiable Credentials wrapping (`?format=vc`)** — D.2

**Sprint 2 — Federation + partnerships**

5. **Signed AIF inbound + outbound feed + federation peer registry** — D.3
6. **Replication / archival hooks (Internet Archive auto-save, Zenodo per-snapshot DOI, AIFdb dump endpoint)** — D.4

**Cross-sprint**

7. **Hardening: key rotation, witness-signed revocation root, federated-import sandbox, replay-window enforcement**
8. *Browser-held author keys (WebAuthn / `did:key`) opt-in upgrade* — Pt. 6
9. *Bluesky AT-Protocol record shape* — Pt. 6 research note
10. *Cross-instance counter-citation discovery (lights up after ≥1 federation peer)* — Pt. 6

Sprint 1 commits to **items 1–4**. Sprint 2 commits to **items 5–6**. Item 7 lands incrementally in both.

---

## 1 — JCS canonicalization + per-author Ed25519 signing layer

**Why first:** every downstream item in Track D — VC wrapping, federation, archival — composes on a single byte-stable, JCS-canonicalized signature over the attestation envelope. The existing [server/trust/receipt.ts](server/trust/receipt.ts) uses `JSON.stringify`, which is fine for an internal export receipt but unsafe for cross-system verification because key ordering is implementation-defined. Replace before anything else ships.

**Files to touch**

- `lib/canonical/jcs.ts` (new) — RFC 8785 JCS canonicalization. Pure function `canonicalize(value: unknown): string`. Reject non-finite numbers, BigInt, undefined; sort object keys lexicographically by UTF-16 code unit order; serialize numbers per ECMA-262 7.1.12.1 (`Number.prototype.toString` produces the right form for normal cases, but verify against the RFC 8785 reference vectors).
- `server/trust/attestationSigner.ts` (new) — `signAttestation(envelope, keyHandle): SignedAttestation` and `verifyAttestation(signed, jwks): { ok, reason? }`. Internally calls `jcs.canonicalize` over the envelope minus the `signature` field, hashes with SHA-256, signs with Ed25519. Signature placement is **detached** at `signature = { alg: "Ed25519", keyId, sig, signedAt, signedFields, jcsHash }`.
- `server/trust/receipt.ts` — keep as-is for the existing decentralise/sovereignty receipt path (back-compat); add a deprecation comment pointing to `attestationSigner.ts` for new uses.
- `lib/citations/argumentAttestation.ts` — `buildArgumentAttestation` already returns the envelope. Add `buildSignedArgumentAttestation(...)` that wraps it via `signAttestation` when the requesting context has a key. **Do not** sign automatically when no signed copy is requested — keeps the unsigned default cheap.
- `app/api/a/[shortCode]/aif/route.ts` — when `?signed=1` (in any `format`), return the signed envelope. Default unchanged.

**Hard invariant:** `signedFields` is an explicit allowlist of envelope keys covered by the signature. Anything outside it (e.g., `attestation.derivedAt` — a server clock readout) MUST be excluded. The verifier rejects any envelope whose `signedFields` doesn't match the expected schema for its `attestation.version`. Prevents future fields from silently riding under an old signature.

**Verifier:** `__tests__/lib/jcs.test.ts` against the published RFC 8785 vectors. `__tests__/lib/attestationSignature.test.ts` — round-trip sign/verify; assert verification fails on (i) any field mutation in `signedFields`, (ii) substituted public key, (iii) `signedAt` outside the key's `notBefore`/`notAfter`. Benchmark JCS on a 200-node deliberation envelope and confirm it stays under 5 ms in `__tests__/perf/jcs.bench.ts` (skip on CI default; run locally).

---

## 2 — `AuthorSigningKey` provisioning + `/.well-known/issuer-keys`

**Why second:** the signing layer is useless without a published verify path. This is the work that makes the funder-pitch claim *"verifiable without our servers"* literally true: a CLI fetches the JWK Set from `/.well-known/issuer-keys`, fetches the envelope, calls `verifyAttestation`, prints OK. No call to the application API at any point.

**Files to touch**

- `lib/models/schema.prisma` — add:
  ```prisma
  model AuthorSigningKey {
    keyId           String   @id                    // "user:{userId}:{n}" or "platform:witness:{n}"
    userId          String?                          // null for the platform witness key
    user            User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
    alg             String   @default("Ed25519")
    publicKeyJwk    Json
    wrappedSecret   Bytes?                           // KMS-encrypted private key; null for browser-held (later)
    custody         String   @default("server-kms") // "server-kms" | "browser-webauthn"
    notBefore       DateTime
    notAfter        DateTime?
    revokedAt       DateTime?
    revokedReason   String?
    createdAt       DateTime @default(now())
    @@index([userId])
    @@index([notAfter])
  }
  ```
  Push via `npx prisma db push`. (No `migrate dev` per repo convention.)
- `lib/keys/keyService.ts` (new) — `provisionUserKey(userId): Promise<AuthorSigningKey>` and `loadActiveSigningKey(userId): Promise<KeyHandle>`. Wraps the private key under AWS KMS using the existing AWS SDK plumbing in [lib/aws](lib/aws) (verify path); if KMS env vars are absent, fall back to local-encrypted with `process.env.MESH_EXPORT_SECRET_KEY` so dev environments still work.
- `app/.well-known/issuer-keys/route.ts` (new) — public, cacheable JWK Set:
  ```jsonc
  {
    "keys": [
      { "kid": "platform:witness:1", "kty": "OKP", "crv": "Ed25519", "x": "...", "use": "sig", "alg": "EdDSA",
        "iso:notBefore": "2026-05-01T00:00:00Z", "iso:notAfter": null, "iso:role": "platform-witness" },
      { "kid": "user:abc:1", ... "iso:role": "author" }
    ]
  }
  ```
  Cache: `public, max-age=300, stale-while-revalidate=3600`. Excludes revoked keys (those live on the revocation list, item 3).
- `scripts/verify-attestation.ts` (new, standalone, zero app deps beyond `node`) — usage: `node scripts/verify-attestation.ts <permalink>`. Fetches `?format=attestation&signed=1`, fetches `/.well-known/issuer-keys`, verifies. **CI gate** — if this script ever fails on a known-good fixture, the build fails.
- `app/.well-known/argument-graph/route.ts` — add a `signing` block: `{ jwksUrl, didDocumentUrl, revocationListUrl, signaturePolicy: "ed25519-detached-jcs", signedEnvelopeQuery: "?signed=1" }`.
- `packages/isonomia-mcp/src/server.ts` — `get_argument` already returns the envelope. Surface `attestation.signature` as a top-level field in the MCP tool response when present, with a one-line note in the tool description: *"Signature is detached Ed25519 over JCS-canonicalized envelope. Use issuer-keys JWKS at /.well-known/issuer-keys to verify without calling our API."*
- `lib/citation/serialize.ts` — `CitationBlock` gains optional `signature?: { keyId, sig, signedAt }` so signed citations propagate through every export format (BibTeX `note`, CSL-JSON `note`, etc.).

**Decisions locked here:**
- Custody = `server-kms`. Recovery story: if a user's key needs rotation, the old key is moved to `revokedAt`, a new key is provisioned, and previously-signed envelopes remain verifiable as long as the verifier checks `signedAt` against the original key's `notBefore`/`notAfter`. **The platform never re-signs old envelopes on rotation.**
- One active author key per user at a time. Multiple non-revoked keys is a bug; assert in `provisionUserKey`.

**Verifier:** `__tests__/keys/keyService.test.ts` — provision, sign, verify, rotate, verify-old-still-passes, revoke, verify-now-fails. The `verify-attestation.ts` CLI is a separate CI gate (item 7's hardening fold-in).

**Cross-link to F (Pt. 4):** the deliberation-scope `DeliberationFingerprint` envelope ([lib/deliberation/fingerprint.ts](lib/deliberation/fingerprint.ts)) gets a witness signature using the platform key, certifying *"as of `computedAt`, this is what the deliberation looked like."* One-line wrap call; included in this item.

---

## 3 — Revocation: list + `did:web` issuer doc (D.5)

**Why bundled with D.1 / item 2:** signatures without a revocation surface are a security smell. A signed envelope a user has retracted, or a key that has been rotated under suspicion, must surface as `signature.status = "revoked"` to any verifier. Ship together.

**Files to touch**

- `lib/models/schema.prisma`:
  ```prisma
  model RevokedAttestation {
    shortCode    String
    contentHash  String
    reason       String                              // "author-retraction" | "abuse-takedown" | "key-rotation" | "superseded"
    revokedAt    DateTime @default(now())
    revokedBy    String                              // userId or "platform"
    witnessSig   String                              // platform key signature over (shortCode, contentHash, reason, revokedAt)
    @@id([shortCode, contentHash])
    @@index([revokedAt])
  }
  ```
- `app/.well-known/revoked-attestations/route.ts` (new) — newline-delimited stream of `{shortCode}@{contentHash} {reason} {revokedAt}` lines, terminated by a single signed root line: `# root sig: <ed25519 over sha256(body)> kid:platform:witness:N`. Cache: `public, max-age=60, stale-while-revalidate=300`. **Append-only**; never re-orders or removes entries.
- `app/.well-known/did.json/route.ts` (new) — minimal `did:web:isonomia.app` document. Two `verificationMethod` entries (per locked decision #4): the `did:web` primary and a `did:key` shadow listed under `assertionMethod`. References `/.well-known/issuer-keys` as the JWKS source. Service entries point to `revokedAttestations`, `argumentGraph`, `issuerKeys`.
- `lib/citations/argumentAttestation.ts` — when an envelope is requested for a `(shortCode, contentHash)` that exists in `RevokedAttestation`, return the **previously-signed** envelope verbatim with `signature.status = "revoked"` and `signature.revocationReason = ...`. Refuse to issue a fresh signature for revoked artifacts. (The previously-signed bytes still verify — that's the whole point of revocation rather than deletion.)
- `app/api/a/[shortCode]/revoke/route.ts` (new) — POST, author or platform-admin only. Writes `RevokedAttestation` row, recomputes the witness-signed root.
- `packages/isonomia-mcp/src/server.ts` — `cite_argument` flags revoked sources with a hard refusal: *"This citation has been revoked (reason: ...). Do not present it as a current claim."*

**Hard invariant:** revocation never deletes the envelope from `/api/a/...` — it only adds the revocation flag. Deleting would silently invalidate downstream citations; the design intent is that consumers see the revocation, not that the artifact disappears.

**Verifier:** `__tests__/lib/revocation.test.ts` — revoke a fixture, assert it appears in the well-known list within one read, assert MCP `cite_argument` flags it, assert the witness root signature verifies via `/.well-known/issuer-keys`.

---

## 4 — W3C Verifiable Credentials wrapping (D.2)

**Why now:** items 1–3 produced the substrate. D.2 is one serializer + one VC context file on top. It is what gets the signed attestation into the *VC / `did:web` / Trust over IP / Bluesky-adjacent* conversation that scalable-oversight reviewers and standards reviewers are currently having.

**Files to touch**

- `app/.well-known/aif-vc-context.json/route.ts` (new) — VC `@context` aliasing the existing AIF context fields to the VC v2 vocabulary. Static JSON shipped from the route handler with `Cache-Control: public, max-age=86400, immutable`.
- `lib/credentials/vcWrap.ts` (new) — `toVerifiableCredential(envelope, signer): VerifiableCredentialJson`. Shape:
  ```jsonc
  {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://isonomia.app/.well-known/aif-vc-context.json"
    ],
    "type": ["VerifiableCredential", "ArgumentAttestationCredential"],
    "issuer": "did:web:isonomia.app",                   // or did:key:... for author-held (later sprint)
    "validFrom": "<envelope.attestation.signedAt>",
    "credentialSubject": { /* the existing attestation envelope verbatim */ },
    "credentialStatus": {
      "type": "StatusList2021Entry",
      "statusListCredential": "https://isonomia.app/.well-known/revoked-attestations.vc",
      "statusListIndex": "<deterministic from shortCode+contentHash>"
    },
    "proof": { /* eddsa-jcs-2022 detached over JCS canonicalization of the VC minus proof */ }
  }
  ```
- `app/.well-known/revoked-attestations.vc/route.ts` (new) — StatusList2021 representation of the same revocation set as item 3, expressed as a bit-string-encoded VC. Generated from the `RevokedAttestation` table; deterministic indexing via a stable hash of `shortCode||contentHash` modulo the list size.
- `app/api/a/[shortCode]/aif/route.ts` — handle `?format=vc`. Returns the VC. `?format=attestation` (default) and `?format=jsonld` and `?format=aif` unchanged.
- `app/.well-known/argument-graph/route.ts` — register `application/vc+ld+json` as a supported format under the existing `formats` block; add `vcEndpoint` field; add `vcContext: "https://isonomia.app/.well-known/aif-vc-context.json"`.
- `packages/isonomia-mcp/src/server.ts` — optional argument on `cite_argument`: `as: "attestation" | "vc" | "markdown"` (default `"attestation"`). Returns the VC string when `as: "vc"`. Tool description: *"Use `as: 'vc'` for downstream systems that target W3C Verifiable Credentials (wallets, Solid pods, VC-aware verification stacks)."*

**Out of scope this sprint** (per locked decisions and brainstorm): Bluesky AT-Protocol record shape; Solid pod hosting; ed25519-2020 cryptosuite (we use eddsa-jcs-2022 to match item 1's canonicalization).

**Verifier:** `__tests__/lib/verifiableCredential.test.ts` — round-trip a fixture envelope → VC → verify proof; assert the VC validates against the W3C VC v2 schema; assert StatusList2021 lookup correctly flags a revoked credential. CI gate: `scripts/verify-vc.ts` standalone CLI mirroring `verify-attestation.ts`.

**Definition of done — Sprint 1:** five verifiers green (`verify-jcs`, `verify-attestation`, `verify-revocation`, `verify-issuer-keys`, `verify-vc`), `/.well-known/argument-graph` advertises the signing block + VC endpoint, `scripts/verify-attestation.ts` and `scripts/verify-vc.ts` succeed on a known-good fixture without ever calling `/api/...`, and the `app/test/ai-epistemic/page.tsx` board flips D.1, D.2, D.5 from "planned" to "shipped".

---

## 5 — Signed AIF inbound + outbound feed + federation peers (D.3)

**Why first in Sprint 2:** D.1 + D.2 give a verifiable artifact; D.3 is the move that lets *other systems* publish artifacts of the same shape and lets us republish theirs. Converts "our tool" into "the protocol-layer player". Also dramatically widens the corpus the MCP `search_arguments` tool sees.

**Files to touch**

- `lib/models/schema.prisma`:
  ```prisma
  model FederationPeer {
    id            String   @id @default(cuid())
    displayName   String
    baseUrl       String   @unique
    publicKeyJwk  Json
    status        String   @default("vetted")        // "vetted" | "paused" | "rejected"
    perDayQuota   Int      @default(500)
    addedAt       DateTime @default(now())
    addedBy       String
    notes         String?
  }

  model FederationImportLog {
    id              String   @id @default(cuid())
    peerId          String
    originPermalink String
    originHash      String
    localArgumentId String?                           // null when validate-only or rejected
    sandboxedUntil  DateTime?
    importedAt      DateTime @default(now())
    @@index([peerId, importedAt])
    @@index([originPermalink])
  }
  ```
  Extend `ArgumentPermalink`: `originRef Json?` capturing `{ peerId, originPermalink, originHash, originSignature, importedAt }`.
- `app/.well-known/federation-peers.json/route.ts` (new) — published list of vetted peers. Includes the documented escalation path text inline so peers can read the policy at the same URL they fetch the registry from.
- `app/api/batch/aif/route.ts` — extend with `?federated=1` path:
  - Require `Authorization: Signature keyId="...", signature="..."` header (HTTP Message Signatures, RFC 9421-ish — keep it simple: peer signs the request body hash).
  - Look up peer in `FederationPeer`; reject if missing, `paused`, or quota-exceeded.
  - Verify each imported argument's *origin* attestation signature using the peer's `publicKeyJwk` (preserves cross-system signature; we do **not** re-sign).
  - Write to `FederationImportLog`; set `sandboxedUntil = now + 7d` so imports do not participate in CQ catalogs / scheme enforcement until accepted by a local reviewer.
- `app/api/v3/federation/feed/route.ts` (new) — paginated outbound feed of signed envelopes (WebSub-shaped per locked decision). Cursor-based; cached at the CDN edge with short SWR. Emits `argument.created`, `argument.updated`, `attestation.revoked` event types.
- `lib/aif/serializers.ts` — confirm Argdown export round-trips through inbound. Add a `?format=argdown` to the public argument page if not already present (verify via existing roadmap audit).
- `app/.well-known/argument-graph/route.ts` — add a `federation` block: `peersList`, `feedEndpoint`, `inboundEndpoint`, `signaturePolicy`, `sandboxWindow: "P7D"`.
- `scripts/verify-federation.ts` (new) — fetches the peer list, pulls a recent signed envelope from the feed, verifies signature against the peer's published key. CI gate.

**Hard invariants:**
- **Federated inbound is sandboxed.** Imported arguments do not contribute to local CQ catalogs, scheme-typical-move catalogs, or `DeliberationFingerprint` percentages until a local reviewer flips `sandboxedUntil` to null. Otherwise a hostile peer can pollute the local epistemic-state arithmetic.
- **Origin signature is preserved, not replaced.** When an imported argument is re-served from our API, its `attestation.signature` is the origin peer's signature, with an additional `attestation.witnessedBy` block carrying the platform witness signature over `(originPermalink, originHash, importedAt)`. Two signatures, one envelope; both must verify.
- **Replay window enforced.** Inbound signatures with `signedAt` more than 24 h before the request `Date` header are rejected. Prevents replay of long-leaked signed envelopes.

**Verifier:** `__tests__/integration/federation.test.ts` — spin up an in-process fake peer with its own keypair, publish a signed argument to its feed, ingest into the local instance via `?federated=1`, assert provenance fields on the resulting `ArgumentPermalink`, assert the argument surfaces in MCP `search_arguments` with origin-peer attribution and a "sandboxed" flag, assert it is excluded from local CQ-coverage percentages until `sandboxedUntil` is cleared.

---

## 6 — Replication / archival hooks (D.4)

**Why parallel to D.3:** outreach plus three thin technical gestures. Each lands more credibly when there's something signed and federable to point at, but none block on D.3.

**Files to touch**

- `workers/archiveOnPermalinkCreate.ts` (new) — fires on `ArgumentPermalink.create` via the existing BullMQ event stream (verify path in [workers/index.ts](workers/index.ts)). Calls archive.org Save Page Now API on the new public permalink URL; persists `archivedUrl` and `archivedAt` on the `ArgumentPermalink` row (extend schema if not already present). Retries with backoff; logs failures but does not block creation.
- `lib/models/schema.prisma` — extend `ArgumentPermalink` with `archivedUrl String?`, `archivedAt DateTime?`. Push.
- `workers/mintDeliberationSnapshotDoi.ts` (new) — manual-trigger worker. Generates an AIF JSON-LD dump of the deliberation at its current `contentHash`, generates a `README.md` describing it (deterministic — uses the existing `SyntheticReadout.honestyLine` template), uploads to Zenodo deposition API, persists the returned DOI on a new `DeliberationSnapshot` table.
- `lib/models/schema.prisma`:
  ```prisma
  model DeliberationSnapshot {
    id             String   @id @default(cuid())
    deliberationId String
    contentHash    String
    doi            String?  @unique
    aifDumpUrl     String                              // S3 URL of the immutable dump
    readmeMd       String
    mintedAt       DateTime @default(now())
    mintedBy       String
    @@index([deliberationId, contentHash])
  }
  ```
- `app/api/v3/deliberations/[id]/mint-snapshot-doi/route.ts` (new) — POST, author/facilitator only. Enqueues the worker; returns the `DeliberationSnapshot.id`.
- `app/api/v3/export/aifdb/route.ts` (new) — paginated AIF JSON-LD dump in AIFdb's expected envelope shape. Public, cacheable.
- `components/deliberation/SnapshotMintButton.tsx` (new) — surfaces the mint action in the existing facilitator panel. Confirmation modal explains immutability ("this snapshot will be permanently citable; the DOI cannot be retracted").
- `app/.well-known/argument-graph/route.ts` — add `archival` block: `aifdbExport`, `snapshotMintEndpoint`, `archiveOrgPolicy: "save-on-create"`.

**Hard invariant:** snapshot mint is **opt-in per deliberation**, never automatic. Auto-snapshotting every active deliberation will exhaust Zenodo quotas and pollute the DOI namespace with throwaway records — exactly the failure mode locked decision #3 prevents.

**Verifier:** integration test against Zenodo sandbox env; assert mint produces a valid DOI; assert `archive.org` Save call returns 200 and a Wayback URL within 30 s on a fresh permalink; assert AIFdb dump validates against AIFdb's published JSON schema (vendored in `tests/fixtures/aifdb-schema.json`).

**Definition of done — Sprint 2:** two new verifiers green (`verify-federation`, `verify-snapshot-mint`), `/.well-known/argument-graph` advertises both blocks, the demo flow can ingest a signed argument from a fake peer and re-serve it with both origin + witness signatures verifying via the standalone CLIs, and a Zenodo-sandbox snapshot DOI exists for the demo deliberation.

---

## 7 — Hardening (cross-sprint)

Items that land incrementally across both sprints; each one is a single small file or schema addition. Tracked here so they don't fall through the cracks.

- **Key rotation enforcement.** `keyService.loadActiveSigningKey` rejects loading a key whose `notAfter < now`. Old keys remain in `AuthorSigningKey` and `/.well-known/issuer-keys` for verifier compatibility but are excluded from new signatures.
- **Witness-signed revocation root.** The trailing `# root sig:` line on `/.well-known/revoked-attestations` is recomputed on every `RevokedAttestation` write. The witness key signs `sha256(canonical body)`; verifiers MUST check this before trusting any list entry.
- **Replay-window enforcement on federated inbound.** 24 h skew tolerance, configurable per peer in `FederationPeer.notes` if a partner needs more.
- **Sandbox flag in MCP responses.** `search_arguments` and `get_argument` responses for federated arguments carry a top-level `provenance.sandboxed: boolean` and `provenance.originPeer: { id, displayName }`. LLMs see the sandbox status before composing citations.
- **Issuer-keys + revocation list in `/.well-known/llms.txt`.** One-line additions pointing LLM-aware crawlers at the verify path so signed envelopes are findable without reading the full discovery doc.
- **CI gates.** `scripts/verify-attestation.ts`, `scripts/verify-vc.ts`, `scripts/verify-federation.ts`, `scripts/verify-snapshot-mint.ts` all run on a known-good fixture in CI. Failure on any one fails the build.

---

## What this unlocks for the funder pitch

After Sprint 1:

1. *"Isonomia attestations are author-signed, content-hash-pinned, and verifiable without our servers."* — Demo: `node scripts/verify-attestation.ts https://isonomia.app/a/Bx7kQ2mN` validates against `/.well-known/issuer-keys`, no call to `/api/...` at any point.
2. *"Every argument can be issued as a W3C Verifiable Credential."* — Demo: `?format=vc` returns the same envelope wrapped, slottable into a wallet or a Solid pod.
3. *"Revocation is published as a witness-signed list; consumers see retraction without depending on us to enforce it."* — Demo: revoke a fixture, refresh `/.well-known/revoked-attestations`, watch MCP `cite_argument` flag the source within one minute.

After Sprint 2:

4. *"Other deliberation systems can publish into Isonomia under signed AIF JSON-LD; Isonomia republishes to AIFdb and archives to Internet Archive on creation."* — Demo: a fake peer ingests, the same argument shows up signed in the federation feed, the permalink carries a Wayback URL, and a Zenodo-sandbox snapshot DOI exists for the deliberation.

That demo set is exactly what scalable-oversight reviewers (Schmidt, OpenPhil, Templeton, ARIA) and standards-adjacent reviewers (W3C VC WG, IFCN, Bluesky AT-Proto) want to see. None of it requires net-new corpus content; all of it composes on artifacts already in the database.

---

## Sequencing summary

| Item | Sprint | Depends on | Unblocks |
|---|---|---|---|
| 1 — JCS + signing | 1 | — | 2, 3, 4, 5 |
| 2 — Author keys + JWKS | 1 | 1 | 4, 5 |
| 3 — Revocation + DID doc | 1 | 1, 2 | 4 (StatusList2021), 5 (revoke event in feed) |
| 4 — VC wrapping | 1 | 1, 2, 3 | external VC ecosystem demos |
| 5 — Federation | 2 | 1, 2, 3 | 6 (DOI per snapshot is more credible with federation peers consuming) |
| 6 — Archival | 2 | 1, 2 | external partnerships (AIFdb, Internet Archive, Zenodo, OpenAIRE) |
| 7 — Hardening | both | 1–6 | production safety |

Sprint 1 is on the critical path. Sprint 2 starts the day Sprint 1's five verifiers go green.
