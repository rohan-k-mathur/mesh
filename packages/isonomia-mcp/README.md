# @app/isonomia-mcp

Model Context Protocol (MCP) server exposing Isonomia's argument-graph as
structured tools for any MCP-compatible LLM client (Claude Desktop, Cursor,
Cline, Continue, etc.).

This is **Track B.2** of the AI-Epistemic-Infrastructure Roadmap. It's a thin
HTTP adapter — it holds no database connection, no secrets beyond an optional
bearer token, and is safe to run on any developer laptop.

## Tools exposed

### Argument-scope (read/write a single argument or claim)

| Tool                   | Purpose                                                                 | Auth         |
| ---------------------- | ----------------------------------------------------------------------- | ------------ |
| `search_arguments`     | Ranked permalinks by free-text query and filters                        | none         |
| `get_argument`         | Full attestation envelope (conclusion, premises, scheme, evidence, CQs) | none         |
| `get_claim`            | Claim by MOID + supporting argument permalinks                          | none         |
| `find_counterarguments`| Arguments contesting a target claim                                     | none         |
| `cite_argument`        | Ready-to-paste citation block (URL + content hash + pull quote)         | none         |
| `propose_argument`     | Create a new argument from claim + evidence                             | bearer token |

### Deliberation-scope (Track AI-EPI Pt. 4 — read-only projections over a whole deliberation)

| Tool                              | Purpose                                                                                                      | Auth |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---- |
| `get_synthetic_readout`           | **First call for any summary task.** One-stop bundle: fingerprint + frontier + missing moves + chains + cross-context + `refusalSurface` + hydrated `topArguments` (load-bearing) + `mostContested` (challenged) | none |
| `summarize_debate`                | Convenience alias for `get_synthetic_readout` — identical payload                                            | none |
| `get_deliberation_fingerprint`    | Narrow slice — statistical summary only                                                                     | none |
| `get_contested_frontier`          | Narrow slice — open dialectical edges + both rankings                                                       | none |
| `get_missing_moves`               | Narrow slice — catalog-vs-actual diff                                                                        | none |
| `get_chains`                      | Narrow slice — `ArgumentChain` projections                                                                   | none |
| `get_cross_context`               | Cross-deliberation projection (canonical-claim families, plexus edges, sibling-room scheme reuse)            | none |
| `get_deliberation_evidence_context` | Evidence corpus pre-bound to the deliberation (the source pool participants were given)                    | bearer token |

### ECC-scope (Sprint E — typed categorical algebra over a deliberation, deterministic, no LLM in loop)

| Tool                              | Purpose                                                                                                      | Auth |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---- |
| `ecc_arrow`                       | Typed `Hom(I, claim)` arrow + Ambler 1996 Def. 8/17 meta `{ simple, entire, selected, logical }`             | none |
| `ecc_culprits`                    | **The canonical demo tool.** Ambler §4 belief-revision: ranked retraction candidates per claim, hydrated | none |
| `ecc_confidence`                  | `confidence(arrow, monoid)` per claim with `mode ∈ {min, product, ds}` (closed enum, ECC plan §4 row 5)     | none |
| `ecc_enthymemes`                  | `detectEnthymemes()` per argument or per deliberation — names missing premise roles by scheme key           | none |
| `ecc_transport`                   | Read cached `RoomTransportSnapshot` rows; **one-hop only** by contract (ECC plan §4 row 2)                   | none |
| `ecc_aggregate`                   | `{ local, imported, total }` band per claim (Isonomia construction, ECC plan §0.5.7)                         | none |
| `ecc_evidential`                  | Whole-deliberation typed evidential projection; bypasses the `ECC_TYPED_PIPELINE` env feature flag           | none |
| `ecc_belief_revision_proposals`   | Cached `BeliefRevisionProposal` rows from the grounded-OUT hook (Sprint D1) — same algebra, pre-computed   | none |
| `propose_warrant`                 | Materialize a warrant claim `[A, B]` (Ambler §2.4 internal hom). AI-flagged + non-logical until human-ratified | bearer token |

Prefer `get_synthetic_readout` over the narrow slices — it returns all five
projections in one round trip plus pre-hydrated argument summaries that
eliminate ~25 follow-up `get_argument` calls.

Every read tool returns a payload that includes the canonical permalink, the
content-addressed `sha256` hash, the permalink version, and the dialectical
status — so when an LLM cites Isonomia it can prove **what** it cited and
**when**.

## Install & build

From the monorepo root:

```bash
npm install
npm run -w @app/isonomia-mcp build
```

This produces `packages/isonomia-mcp/dist/server.js`.

## Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```jsonc
{
  "mcpServers": {
    "isonomia": {
      "command": "node",
      "args": ["/absolute/path/to/mesh/packages/isonomia-mcp/dist/server.js"],
      "env": {
        "ISONOMIA_BASE_URL": "https://isonomia.app",
        "ISONOMIA_API_TOKEN": ""
      }
    }
  }
}
```

Restart Claude Desktop. The 24 tools should appear under the 🛠 menu.

## Configure Cursor / Cline / Continue

Any MCP client that supports stdio servers can launch `dist/server.js` the
same way. Cursor and Cline use the same JSON shape under their own settings
locations.

## Environment variables

| Var                  | Default                  | Purpose                                              |
| -------------------- | ------------------------ | ---------------------------------------------------- |
| `ISONOMIA_BASE_URL`  | `https://isonomia.app`   | API origin to call                                   |
| `ISONOMIA_API_TOKEN` | _(unset)_                | Bearer token for `propose_argument` and `propose_warrant` |
| `ISONOMIA_TIMEOUT_MS`| `30000`                  | Per-request timeout                                  |
| `MCP_API_TOKEN`      | _(unset, server-side)_   | Bearer token the **Next.js server** accepts as a valid MCP caller (server-side env on the Isonomia deploy, not the MCP client) |
| `MCP_AUTHOR_USER_ID` | `mcp-bot`                | User id the server records as the author when an MCP-tokened request creates rows (e.g. `propose_warrant`) |

## Local dev

```bash
ISONOMIA_BASE_URL=http://localhost:3000 npm run -w @app/isonomia-mcp dev
```

The server reads MCP requests on stdin and writes responses to stdout. Use
the verification script in [scripts/verify-mcp.ts](../../scripts/verify-mcp.ts)
to exercise every tool over a stdio pipe.

## Design notes

- **No DB access.** The MCP process makes plain HTTP calls to the public
  Isonomia API. This keeps the binary portable and makes it safe to ship to
  end users.
- **Permalink resolution.** `permalinkToShortCode()` accepts full URLs,
  relative paths, bare codes, and the immutable `<code>@<hash>` form so the
  LLM can pass whichever shape it has on hand.
- **Errors as MCP errors.** Tool handlers throw, the dispatcher converts the
  message into `{isError: true, content: [...]}`. The client surfaces the
  error to the user without crashing the server.
- **Stdout is the protocol stream.** All logging happens on stderr.

## Categorical algebra (Sprint E)

The `ecc_*` tools and `propose_warrant` expose Isonomia's typed
implementation of Ambler 1996, *An Evidential Category of Claims*. Every
row below is a contract the MCP surface honors and that callers can rely
on without re-deriving:

| Equational law / contract | Where it lives | Surfaced as |
|---------------------------|----------------|-------------|
| `Arrow<A, B> = { from, to, derivs, assumptions }` (Ambler §2) | `lib/argumentation/ecc.ts` | `ecc_arrow` |
| `f ∨ g` is the join in the hom-semilattice (Ambler Lemma 26) | `join()` | implicit in every ECC tool |
| `g ∘ f` carries the union of assumption sets (Ambler §2.3) | `compose()` | `ecc_arrow.derivations[].assumptionIds` |
| Internal hom Λ: `[A, B] ≃ Hom(A ⊗ —, B)` (Ambler §2.4) | `internalHom()` + `propose_warrant` route | `propose_warrant` write |
| `confidence(arrow, monoid)` is a closed-monoid fold (Ambler Thm. 30) | `confidence()` | `ecc_confidence`, `ecc_aggregate`, `ecc_evidential` |
| **Strict** `isLogical`: ACCEPTED-only AND HUMAN-or-ratified (ECC plan §4 row 1) | `isLogical()` | `meta.logical` on every ECC payload |
| **One-hop** transport: chained A→B→C is intentionally not supported (ECC plan §4 row 2) | `RoomTransportSnapshot` aggregator | `ecc_transport`, `ecc_aggregate` |
| **AI/HYBRID** warrants are non-logical until a HUMAN ratifies (ECC plan §4 row 3) | `derivationProvenance.humanRatified` | `propose_warrant` returns `awaitingHumanRatification: true` |
| **Closed monoid registry**: callers cannot supply ad-hoc monoids (ECC plan §4 row 5) | `MIN_MONOID`, `PRODUCT_MONOID`, `DS_MONOID` | `mode` is a closed enum on every confidence-bearing tool |
| Ambler §4 belief revision is deterministic | `culpritSets()` + `BeliefRevisionProposal` cache | `ecc_culprits`, `ecc_belief_revision_proposals` |

The canonical demo question — **"what would I have to retract to reject
claim X in this deliberation?"** — is answered by `ecc_culprits` (live
over the algebra) or `ecc_belief_revision_proposals` (cached, written by
the grounded-recompute hook when a claim transitions to OUT). Both paths
are graph-derived, deterministic, and verified by
[`tests/ecc-culprits-roundtrip.test.ts`](../../tests/ecc-culprits-roundtrip.test.ts)
(bit-identical JSON across repeated invocations).
