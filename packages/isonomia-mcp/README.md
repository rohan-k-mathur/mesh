# @app/isonomia-mcp

Model Context Protocol (MCP) server exposing Isonomia's argument-graph as
structured tools for any MCP-compatible LLM client (Claude Desktop, Cursor,
Cline, Continue, etc.).

This is **Track B.2** of the AI-Epistemic-Infrastructure Roadmap. It's a thin
HTTP adapter — it holds no database connection, no secrets beyond an optional
bearer token, and is safe to run on any developer laptop.

## Tools exposed

| Tool                   | Purpose                                                                 | Auth         |
| ---------------------- | ----------------------------------------------------------------------- | ------------ |
| `search_arguments`     | Ranked permalinks by free-text query and filters                        | none         |
| `get_argument`         | Full attestation envelope (conclusion, premises, scheme, evidence, CQs) | none         |
| `get_claim`            | Claim by MOID + supporting argument permalinks                          | none         |
| `find_counterarguments`| Arguments contesting a target claim                                     | none         |
| `cite_argument`        | Ready-to-paste citation block (URL + content hash + pull quote)         | none         |
| `propose_argument`     | Create a new argument from claim + evidence                             | bearer token |

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
| `ISONOMIA_TIMEOUT_MS`| `15000`                  | Per-request timeout                                  |

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
