# AI Epistemic Surface — Track D Brainstorm

**Track:** D — Federated, signed, portable arguments
**Status:** Planning (D.1–D.4 all "planned" on the demo board)
**Predecessors:** Tracks A / B / C / F shipped (attestation envelope, content-hashed immutable URLs, MCP, OpenAPI, well-knowns, deliberation-scope readiness layer).
**Companion roadmaps:** [AI_EPISTEMIC_INFRASTRUCTURE_ROADMAP.md](AI_EPISTEMIC_INFRASTRUCTURE_ROADMAP.md), [AI_EPI_ROADMAP_PT_2.md](AI_EPI_ROADMAP_PT_2.md), [AI_EPI_ROADMAP_PT_3.md](AI_EPI_ROADMAP_PT_3.md), [AI_EPI_ROADMAP_PT_4.md](AI_EPI_ROADMAP_PT_4.md)

---

## Theme

> Make every Isonomia attestation **independently verifiable, portable across systems, and ingestible from the open argumentation ecosystem** — without forcing trust in `isonomia.app` as the resolver of last resort.

Tracks A–C made each permalink a *self-describing* epistemic artifact. Track D removes Isonomia from the trust path: a third party can verify the citation came from the claimed author, at the claimed time, with the claimed graph state, **without calling our servers** — and external systems can both publish *into* and re-host *from* the corpus under standard formats.

---

## Pre-existing substrates (do not rebuild)

| Substrate | Where | What it gives D |
|---|---|---|
| Ed25519 sign/verify | [server/trust/receipt.ts](server/trust/receipt.ts) (tweetnacl) | Crypto primitives for D.1; needs upgrade from single server key to per-author keys |
| Attestation envelope (canonical citation unit) | `/api/a/{shortCode}/aif?format=attestation`, [lib/citations/argumentAttestation.ts](lib/citations/argumentAttestation.ts) | The exact payload to wrap in a signature / VC |
| `contentHash` (sha256 over canonical AIF subgraph) | wired through everything | The bytes that get signed |
| `bumpPermalinkVersion` + `version` field | `ArgumentPermalink` model in [lib/models/schema.prisma](lib/models/schema.prisma) | Version pinning for revocation / supersession |
| Immutable URL pattern `/a/{shortCode}@{contentHash}` | [app/.well-known/argument-graph/route.ts](app/.well-known/argument-graph/route.ts) | The URL shape signatures bind to |
| AIF JSON-LD export + context | [lib/aif/export.ts](lib/aif/export.ts), [lib/aif/context.json](lib/aif/context.json) | The serialization being signed and federated |
| AIF JSON-LD inbound endpoint (validate / upsert) | [app/api/batch/aif/route.ts](app/api/batch/aif/route.ts), [lib/aif/import.ts](lib/aif/import.ts), [packages/aif-core](packages/aif-core) | The federation endpoint exists; needs auth, provenance tracking, and signature verification on inbound |
| AIF roundtrip + import-assumptions test fixtures | [tests/aif-roundtrip.test.ts](tests/aif-roundtrip.test.ts), [tests/aif-import-assumptions.test.ts](tests/aif-import-assumptions.test.ts) | Verifier scaffolding for D.3 conformance |
| Well-known discovery | [app/.well-known/argument-graph/route.ts](app/.well-known/argument-graph/route.ts), [app/.well-known/webfinger/route.ts](app/.well-known/webfinger/route.ts), [app/.well-known/llms.txt/route.ts](app/.well-known/llms.txt/route.ts) | Where signing keys, federation actor doc, revocation list get published |
| Argdown-side serializers | [lib/aif/serializers.ts](lib/aif/serializers.ts) | Half of D.3's external-format coverage |

---

## Sprint shape — leverage-ranked

Items 1–3 are foundational; D.1 → D.2 → D.3 is a strict dependency chain (you sign before you wrap-as-VC; you publish a verifier before you federate). D.4 is partnership work that runs in parallel and lands when D.1–D.3 give it something credible to point at.

1. **D.1 — Per-author Ed25519 signed attestations** (foundation; everything else depends on it)
2. **D.2 — W3C Verifiable Credentials wrapping** (one serializer + one DID resolver on top of D.1)
3. **D.3 — Federation protocol: signed inbound AIF + outbound subscription** (turns Isonomia from app into hub)
4. **D.4 — Replication / archival partnerships** (AIFdb @ Dundee, Internet Archive, Zenodo for snapshot DOIs)
5. *D.5 — `did:web` issuer doc + revocation list endpoint* — sub-item of D.1 but called out for visibility
6. *D.6 — Cross-instance counter-citation discovery* — stretch; lights up once ≥1 federation peer exists

Sprint commits to **D.1 + D.5 + D.2** as the verifiable-attestation slice. **D.3 + D.4** are the next sprint, when there's a signed artifact worth federating.

---

## D.1 — Per-author Ed25519 signed attestations

**Why first:** the attestation envelope today says *Isonomia asserts that argument X had state Y at time T*. With D.1 it says *author A asserts X with state Y at time T, and Isonomia witnesses it*. That is the difference between "trust the platform" and "trust the math". It is also the layer every other Track D item composes on top of.

**Decisions to make before coding**

- **Key custody model.** Two viable shapes:
  - **(a) Server-held per-author keys** wrapped under AWS KMS. Lower friction, weaker non-repudiation (Isonomia could in principle sign on behalf of an author). Faster ship.
  - **(b) Browser-held author keys** (WebAuthn / WebCrypto generates Ed25519, private key never leaves the device, public key + `did:key` registered server-side). Stronger guarantees, harder UX. Required if the funder pitch is "Isonomia cannot forge author attestations".
  - **Recommendation:** ship **(a) first** (1-week effort, unblocks D.2/D.3), document the trust model honestly in `/.well-known/argument-graph`, and treat **(b)** as a per-user opt-in upgrade in a later sprint. The signature shape is identical; only the key-provisioning path changes.
- **What gets signed.** The canonical bytes are `sha256(canonical(attestation envelope minus the signature field))`, where canonical = JCS (RFC 8785) JSON canonicalization. JCS, not the existing ad-hoc `JSON.stringify` pattern in [server/trust/receipt.ts](server/trust/receipt.ts) — the existing code is fine for an internal export receipt but is unsafe for cross-system verification because key ordering is implementation-defined.
- **Signature placement.** Detached: returned alongside the envelope as `attestation.signature = { alg, keyId, sig, signedAt, signedFields: [...] }`. Embedded signatures complicate canonicalization.

**Files to touch**

- [server/trust/receipt.ts](server/trust/receipt.ts) — extend or new sibling `server/trust/attestationSigner.ts`. Replace `JSON.stringify` with JCS. Add `signAttestation(envelope, authorKeyHandle)` and `verifyAttestation(envelope)`.
- `lib/models/schema.prisma` — new model `AuthorSigningKey { userId, alg, publicKeyB64, keyId, createdAt, revokedAt? }`. Push via `npx prisma db push`. Stub a `KMSWrappedSecret` JSON column if going with custody model (a).
- `lib/citations/argumentAttestation.ts` — the existing `buildArgumentAttestation` returns the envelope; wrap it with `signAttestation` when the requesting context is the author or when a signed copy is requested via `?signed=1`.
- `app/api/a/[shortCode]/aif/route.ts` — when `?format=attestation&signed=1`, return the signed envelope. Otherwise unchanged (back-compat).
- `app/.well-known/argument-graph/route.ts` — advertise `signedAttestationEnvelope` shape and link to `/.well-known/issuer-keys` (the public key list).
- `app/.well-known/issuer-keys/route.ts` (new) — JWK Set of all active author public keys plus the platform witness key. **Public, cacheable.**
- `packages/isonomia-mcp/src/server.ts` — `get_argument` already returns the envelope; surface `attestation.signature` as a top-level field so LLMs can quote it without nesting confusion.
- `lib/citation/serialize.ts` — `CitationBlock` gains an optional `signature` block so signed citations propagate through every export format.

**Verifier:** `__tests__/lib/attestationSignature.test.ts` — round-trip sign/verify; assert verification fails on (i) any field mutation, (ii) substituted public key, (iii) revoked key as of `revokedAt`. Add `scripts/verify-attestation.ts` standalone CLI that fetches an envelope by URL and verifies it using only `/.well-known/issuer-keys` — proves the no-Isonomia-trust-path claim.

**Cross-link to F:** the deliberation-scope `DeliberationFingerprint` (Pt. 4 §1) is also worth a witness signature using the platform key — it certifies "as of `computedAt`, this is what the deliberation looked like." Cheap add; included.

---

## D.5 — `did:web` issuer doc + revocation list (sub-item of D.1)

**Why bundled with D.1:** signatures without a revocation surface are a security smell. Ship them together.

**Files to touch**

- `app/.well-known/did.json/route.ts` (new) — minimal `did:web:isonomia.app` document referencing the platform witness key and the issuer-keys endpoint.
- `app/.well-known/revoked-attestations/route.ts` (new) — newline-delimited list of `{shortCode}@{contentHash}` entries that have been revoked (author-initiated, abuse-takedown, or post-edit supersession). Cache headers: `Cache-Control: public, max-age=60, stale-while-revalidate=300`.
- `lib/models/schema.prisma` — `RevokedAttestation { shortCode, contentHash, reason, revokedAt, revokedBy }` (composite PK).
- `lib/citations/argumentAttestation.ts` — when an envelope is requested for a `(shortCode, contentHash)` that is in `RevokedAttestation`, return the signed envelope but flag `signature.status = "revoked"` and refuse to issue a fresh signature.

**Verifier:** assert revocation appears in the well-known list within one minute of the API call; assert MCP `cite_argument` flags revoked sources.

---

## D.2 — W3C Verifiable Credentials wrapping

**Why second:** this is one serializer and one VC context file on top of D.1. The substantive trust work was D.1; D.2 is what gets you into the *decentralized identity / receipts / Bluesky-AT-Protocol-adjacent / Trust over IP* conversation that is exactly where the AI-epistemic-infrastructure pitch is currently being heard.

**Shape**

```jsonc
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://isonomia.app/.well-known/aif-vc-context.json"
  ],
  "type": ["VerifiableCredential", "ArgumentAttestationCredential"],
  "issuer": "did:web:isonomia.app",                 // or did:key:... for author-held
  "validFrom": "2026-05-01T12:34:56Z",
  "credentialSubject": { /* the existing attestation envelope verbatim */ },
  "credentialStatus": {
    "type": "StatusList2021Entry",
    "statusListCredential": "https://isonomia.app/.well-known/revoked-attestations.vc",
    "statusListIndex": "..."
  },
  "proof": { /* ed25519-2020 detached JWS over JCS canonicalization */ }
}
```

**Files to touch**

- `lib/credentials/vcWrap.ts` (new) — `toVerifiableCredential(envelope, signer): VerifiableCredentialJson`.
- `app/.well-known/aif-vc-context.json/route.ts` (new) — VC `@context` aliasing the existing AIF context fields.
- `app/api/a/[shortCode]/aif/route.ts` — `?format=vc` returns the VC. (Keep `?format=attestation` as the lightweight default.)
- `app/.well-known/argument-graph/route.ts` — register `application/vc+ld+json` as a supported format; add `vcEndpoint` field.
- `packages/isonomia-mcp/src/server.ts` — optional `cite_argument(..., as: "vc")` returns the VC string for LLM clients that target VC-aware downstream systems.

**Verifier:** `__tests__/lib/verifiableCredential.test.ts` — round-trip; verify against the W3C VC v2 test vectors; assert StatusList2021 lookup correctly flags a revoked credential.

**Out of scope this sprint:** Bluesky AT-Protocol record shape (different graph commitment model — record into a separate research note); Solid pod hosting (the VC is portable; pod hosting is a deployment detail).

---

## D.3 — AIF / Argdown federation protocol

**Why third:** D.1 + D.2 give us a verifiable artifact; D.3 lets *other systems* publish artifacts of the same shape and lets us republish theirs. That is the move that converts "our tool" into "the protocol-layer player". It also dramatically widens the corpus the MCP search tool sees.

**The federation primitive**

Use existing AIF JSON-LD as the wire format. Two directions:

1. **Inbound (already half there):** [app/api/batch/aif/route.ts](app/api/batch/aif/route.ts) accepts AIF JSON-LD today via `mode=upsert`. Track D adds:
   - **Required signature** in `?federated=1` mode: must verify against a published peer key in `/.well-known/federation-peers.json`.
   - **Provenance tracking**: every imported argument records `originPeer`, `originPermalink`, `originContentHash`, `importedAt`, `importedSignature`. Schema: extend `ArgumentPermalink` with `originRef` (nullable JSON column).
   - **Content-hash sealing**: the imported argument's content hash is the *origin* hash, not a re-canonicalized hash — preserves the cross-system signature.
2. **Outbound (new):** subscription stream of argument creates / edits / revocations. Two acceptable shapes:
   - **WebSub / RSS-shaped** — simple, polling-friendly. New endpoint `app/api/v3/federation/feed/route.ts` paginated by cursor.
   - **ActivityPub-style outbox** at `/api/v3/federation/outbox` with `Note`-style activities embedding the signed attestation. Heavier but slots into Mastodon/Bluesky bridge work.
   - **Recommendation:** ship the WebSub-shaped feed first; it is one route and a cursor. ActivityPub is a follow-on if a partner asks for it.

**Files to touch**

- `lib/models/schema.prisma` — `FederationPeer { id, displayName, baseUrl, publicKeyB64, status, addedAt }`; `ArgumentPermalink.originRef Json?`.
- `app/.well-known/federation-peers.json/route.ts` (new) — published list of peers we trust.
- `app/api/batch/aif/route.ts` — extend with `?federated=1` signature-required path; reject when signature missing or peer unknown.
- `app/api/v3/federation/feed/route.ts` (new) — paginated outbound feed of signed envelopes.
- `lib/aif/serializers.ts` — confirm Argdown export round-trips through inbound (already partially there).
- `app/.well-known/argument-graph/route.ts` — add `federation` block: `peersList`, `feedEndpoint`, `inboundEndpoint`, `signaturePolicy`.
- `scripts/verify-federation.ts` (new) — fetches peer-list, pulls a recent signed envelope from the feed, verifies signature; CI gate.

**Decision needed:** rate limits + abuse model. A federated peer that floods the outbound endpoint with low-quality signed envelopes can degrade the corpus. Mitigation: peers are vetted (added to `FederationPeer` by hand initially), and ingest enforces a per-peer quota. Document the policy in `/.well-known/federation-peers.json` itself.

**Verifier:** `__tests__/integration/federation.test.ts` — round-trip: spin up a fake peer with its own keypair, publish a signed argument to its feed, ingest into the local instance via `?federated=1`, verify provenance fields, verify it surfaces in MCP `search_arguments` with origin-peer attribution.

---

## D.4 — Replication / archival partnerships

**Why parallel, not blocking:** this is outreach plus three thin technical gestures. None require D.1–D.3 to be complete, but each lands more credibly when there's something signed and federable to hand to the partner.

**Targets and the technical hook each one needs**

| Partner | Hook | New file |
|---|---|---|
| **AIFdb** (Dundee, Reed/Budzynska) | Bulk AIF JSON-LD export endpoint matching their importer | `app/api/v3/export/aifdb/route.ts` — paginated dump with their expected envelope shape |
| **Internet Archive** | Submit periodic snapshot tarball to archive.org Item; auto-archive every public permalink on first creation via Wayback Save API | `workers/archiveOnPermalinkCreate.ts` — fires on `ArgumentPermalink.create`; persists `archivedUrl` on the row |
| **Zenodo** | Mint a DOI per *deliberation snapshot* (not per argument — too noisy). Calls Zenodo deposition API with the AIF dump + a generated `README.md` describing the deliberation. | `workers/mintDeliberationSnapshotDoi.ts` — manual trigger via `/api/v3/deliberations/{id}/mint-snapshot-doi` |
| **OpenAIRE / Crossref Event Data** | Already possible if Zenodo DOIs land — Crossref Event Data ingests from Zenodo automatically. No code work; one config registration. | n/a |

**Decision needed:** snapshot frequency for Zenodo. Per-deliberation-on-demand is the right shipping default — auto-snapshotting every active deliberation will exhaust Zenodo quotas and produce noisy DOIs. Authors / facilitators trigger snapshots when a deliberation reaches a citable milestone; the snapshot is immutable (content-hash-sealed) and the DOI lives forever.

**Verifier:** snapshot mint produces a valid DOI in Zenodo sandbox; archive.org Save API call returns a 200 and a Wayback URL within 30 s; AIFdb dump validates against AIFdb's published JSON schema.

---

## Cross-cutting

**Standards alignment**

- Ed25519 (RFC 8032) + JCS (RFC 8785) for the signing layer
- W3C Verifiable Credentials Data Model 2.0 + ed25519-2020 cryptosuite
- W3C `did:web` and `did:key`
- StatusList2021 for revocation
- AIF JSON-LD (existing) for the wire format
- WebSub or ActivityPub for the federation transport

**Security**

- Issuer-keys endpoint must support key rotation: keys carry `notBefore` / `notAfter`; verifiers MUST check signature time against active window.
- Revocation list MUST be append-only and witness-signed (the platform key signs the daily revocation root) so a hostile mirror cannot un-revoke.
- Federated inbound MUST sandbox: imported claims do not get to participate in CQ catalogs or scheme enforcement until a local reviewer accepts them. Otherwise a hostile peer can pollute the local CQ space.
- Author-held key custody (custody model b) requires a documented recovery story; without one we will lose attestations to lost devices and damage user trust. Acceptable to defer (a) → (b) by one sprint; not acceptable to ship (b) without it.

**Performance**

- Signature verification is cheap (~50 µs per envelope); no caching needed on the verify path.
- JCS canonicalization is the hot path on the *sign* path; benchmark on a 200-node deliberation envelope and confirm it stays under 5 ms before shipping.
- Federation outbound feed is read-heavy and append-only — cache aggressively at the CDN edge with a short SWR window keyed by cursor.

**What this unlocks for funder pitch**

1. *"Isonomia attestations are author-signed, content-hash-pinned, and verifiable without our servers"* — D.1 demo: `verify-attestation` CLI fetches a citation and validates against `/.well-known/issuer-keys`, no network call to the API.
2. *"Every argument can be issued as a W3C Verifiable Credential"* — D.2 demo: the same envelope rendered as a VC, slotted into a wallet or a Solid pod.
3. *"Other deliberation systems can publish into Isonomia under signed AIF JSON-LD; Isonomia can republish to AIFdb and archive to Internet Archive"* — D.3 + D.4 demo: a fake peer ingests into the local instance, the same argument shows up signed in the federation feed, with a Wayback snapshot URL on the permalink.

That demo is exactly what scalable-oversight reviewers (Schmidt, OpenPhil, Templeton) and standards-adjacent reviewers (W3C VC WG, IFCN, Bluesky AT-Proto) want to see. None of it requires net-new corpus content; all of it composes on artifacts already in the database.

---

## Open questions to resolve before sprint kickoff

1. **Custody model (a) vs (b) for D.1** — recommend (a) first; needs explicit user-pitch decision before ship.
2. **Federation peer-vetting policy** — manual allowlist for v1, but we need a documented escalation path (who decides, what disqualifies).
3. **Zenodo DOI per snapshot vs per argument** — recommend per-snapshot, opt-in. Confirm with whoever will field DOI questions.
4. **VC issuer identity for platform-witnessed envelopes** — `did:web:isonomia.app` only, or also a `did:key:` shadow that survives domain change? Recommend both, with `did:web` as primary and a `did:key` listed in the DID document as a backup verification method.
5. **Backward compatibility** — the unsigned attestation envelope stays the default at `?format=attestation`. Signed envelope is `?format=attestation&signed=1`. VC is `?format=vc`. No existing consumers break.

---

*Draft. Once items 1–4 above are resolved, fold the agreed answers in and promote this to a Pt. 5 actionable sprint plan in the same shape as [AI_EPI_ROADMAP_PT_4.md](AI_EPI_ROADMAP_PT_4.md).*
