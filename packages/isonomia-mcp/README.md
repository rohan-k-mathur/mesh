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

Restart Claude Desktop. The six tools should appear under the 🛠 menu.

## Configure Cursor / Cline / Continue

Any MCP client that supports stdio servers can launch `dist/server.js` the
same way. Cursor and Cline use the same JSON shape under their own settings
locations.

## Environment variables

| Var                  | Default                  | Purpose                                              |
| -------------------- | ------------------------ | ---------------------------------------------------- |
| `ISONOMIA_BASE_URL`  | `https://isonomia.app`   | API origin to call                                   |
| `ISONOMIA_API_TOKEN` | _(unset)_                | Bearer token for `propose_argument`                  |
| `ISONOMIA_TIMEOUT_MS`| `30000`                  | Per-request timeout                                  |

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
