# Mesh

Mesh is an experimental social platform built with **Next.js** that lets users interact in real-time rooms. Each room hosts a collaborative canvas where posts are represented as nodes. Node types range from simple text posts to livestreams and AI-generated images.

See [`Mesh_Roadmap.md`](Mesh_Roadmap.md) for the long term product plan.
For the step‑by‑step rollout of the Prediction Market module, check
[`PredictionMarket_Development_Playbook.md`](PredictionMarket_Development_Playbook.md).

## Current Features

Mesh already includes the following capabilities:

- **Real-time canvas** powered by React Flow with nodes for text, images, video, livestreams and AI-generated content.
- **Presence synchronization** via Supabase channels so collaborators see each other's cursors and updates instantly.
- **Firebase authentication middleware** protecting private content.
- **Prisma data models** defining posts, edges, rooms and extended `UserAttributes` for interests like music or movies.
- **Global and friends feed** built on Next.js pages alongside the real-time canvas.
- **Livechat node** providing ephemeral conversations as described in `Livechat_Node_SRS.md`.

## Project layout

```
app/                Next.js route handlers and pages
  (auth)/           Public auth routes (login, register, onboarding)
  (root)/           Authenticated application routes
  api/              Edge API routes (LiveKit tokens, geocoding, uploads)
components/         React components grouped by feature (nodes, modals, ui)
lib/                Server code: Prisma models, firebase config and actions
constants/          Static values used across the app
public/             Static assets (icons, fonts, sounds)
```

`tsconfig.json` defines the `@/` alias that maps to the project root.

The app/(root)/(standard)/ folder contains the code for the standard linear infinite scroll twitter like feed which is connected to posts 
created in the global rooms and by friends and rooms that are subscribed to.

The app/(root)/(realtime)/ folder contains the code for the reactflow canvas rooms.

## Setup

To avoid missing-bucket errors when uploading audio posts, create the `realtimepostaudio` bucket in Supabase:

1. Navigate to **Storage** → **Create a new bucket**.
2. Name it `realtimepostaudio` and set it to **public** (or adjust policies).
3. Ensure public read access and upload permissions are allowed.
4. Under the bucket's **Policies** tab, add an **INSERT** policy that grants the
   `anon` role upload access (for example, use condition `auth.role() = 'anon'`).
   Without this policy uploads fail with "new row violates row-level security policy".

Apply the same steps to create a `realtime_post_images` bucket if it does not already exist.
Create another public bucket named `stall-images` for SwapMeet thumbnails.

## Development

1. Install dependencies

   ```bash
npm install
```

2. Create `.env.local` with the required environment variables (Firebase, DeepSeek, database, etc.) and copy it to `.env` so Prisma can read them:

   ```bash
   cp .env.local .env
   ```
3. Start the development server

   ```bash
   npm run dev
   ```

4. Apply Prisma schema changes

   ```bash
   npx prisma db push
   ```

5. Seed the database

   ```bash
   npm run seed    # populate the Supabase database with sample users and posts
   ```

The app runs at [http://localhost:3000](http://localhost:3000).

### Scripts

- `npm run build` – build for production
- `npm run start` – start a production build
- `npm run lint` – run ESLint

## Adding new node types

Nodes are defined in `components/nodes` and typed in `lib/reactflow/types.ts`. To add a node type, create a new React component, extend the types, and register it in the React Flow store.

### Plug-ins

Drop plug-ins into the `plugins/` folder. Each plug-in exports a `descriptor` with a `type`, the React component, and optional config. Restart the dev server with `npm run dev` and the new nodes become available.

## Deployment

### CRDT Prototype
See [docs/realtime-crdt.md](docs/realtime-crdt.md) for notes on the experimental Yjs integration used for text nodes.

### Workflow API
Versioned workflows can be queried via [docs/workflows.md](docs/workflows.md).


## Faster setup in Codex
See `Codex_Environment_Guide.md` for tips on caching dependencies and using a Docker image so the development server starts quickly.

### Embedding Service
See services/embedding/README.md for setup.

### Discovery Candidates API
`GET /api/v2/discovery/candidates?k=50` returns the top‑K users with similar
taste. Authentication via Supabase session is required. Results are cached in
Redis for `CANDIDATE_CACHE_TTL` seconds.

## Portfolio Builder shortcuts

- Cmd/Ctrl+Z = Undo
- Cmd/Ctrl+Shift+Z or Ctrl+Y = Redo
- Draft autosaves locally every 0.8 s; clear via "New / Clear" in menu

## Roadmap Highlights

The documents in this repo outline the path toward a public launch. Key themes include:

- **Foundation & Refinement** – multi‑factor auth, role‑based room permissions and a hardened middleware layer.
- **Social Discovery Engine** – expanded user attributes and a recommendation API combining embeddings with collaborative filtering.
- **Advanced Node Workflows** – instruction nodes, a state machine builder and plug‑in architecture for custom node types.
- **Real-Time Collaboration Enhancements** – presence labels, ephemeral chat and CRDT conflict resolution.
- **Production Hardening** – CI pipelines, performance monitoring and security reviews.

See `Mesh_Roadmap.md`, `SocialDiscoverEngine_V2_SRS.md`, `Flowstate_v2_SRS.md` and other SRS files for full details.

```
mesh
├─ -a
├─ -p
├─ .editorconfig
├─ .eslintrc.json
├─ .next
│  ├─ app-build-manifest.json
│  ├─ build-manifest.json
│  ├─ cache
│  │  ├─ fetch-cache
│  │  │  └─ tags-manifest.json
│  │  ├─ images
│  │  │ 
│  │  ├─ swc
│  │  │  └─ plugins
│  │  │     └─ v7_macos_aarch64_0.106.15
│  │  └─ webpack
│  │     ├─ client-development
│  │     │  ├─ 0.pack.gz
│  │     │  ├─ 1.pack.gz
│  │     │  ├─ 10.pack.gz
│  │     │  ├─ 11.pack.gz
│  │     │  ├─ 12.pack.gz
│  │     │  ├─ 13.pack.gz
│  │     │  ├─ 14.pack.gz
│  │     │  ├─ 15.pack.gz
│  │     │  ├─ 16.pack.gz
│  │     │  ├─ 17.pack.gz
│  │     │  ├─ 18.pack.gz
│  │     │  ├─ 19.pack.gz
│  │     │  ├─ 2.pack.gz
│  │     │  ├─ 20.pack.gz
│  │     │  ├─ 21.pack.gz
│  │     │  ├─ 22.pack.gz
│  │     │  ├─ 23.pack.gz
│  │     │  ├─ 24.pack.gz
│  │     │  ├─ 25.pack.gz
│  │     │  ├─ 26.pack.gz
│  │     │  ├─ 3.pack.gz
│  │     │  ├─ 4.pack.gz
│  │     │  ├─ 5.pack.gz
│  │     │  ├─ 6.pack.gz
│  │     │  ├─ 7.pack.gz
│  │     │  ├─ 8.pack.gz
│  │     │  ├─ 9.pack.gz
│  │     │  ├─ index.pack.gz
│  │     │  └─ index.pack.gz.old
│  │     ├─ client-development-fallback
│  │     │  ├─ 0.pack.gz
│  │     │  ├─ 1.pack.gz
│  │     │  └─ index.pack.gz.old
│  │     ├─ edge-server-development
│  │     │  ├─ 0.pack.gz
│  │     │  ├─ 1.pack.gz
│  │     │  ├─ 2.pack.gz
│  │     │  ├─ 3.pack.gz
│  │     │  ├─ 4.pack.gz
│  │     │  ├─ index.pack.gz
│  │     │  └─ index.pack.gz.old
│  │     └─ server-development
│  │        ├─ 0.pack.gz
│  │        ├─ 1.pack.gz
│  │        ├─ 10.pack.gz
│  │        ├─ 11.pack.gz
│  │        ├─ 12.pack.gz
│  │        ├─ 13.pack.gz
│  │        ├─ 14.pack.gz
│  │        ├─ 15.pack.gz
│  │        ├─ 16.pack.gz
│  │        ├─ 17.pack.gz
│  │        ├─ 18.pack.gz
│  │        ├─ 19.pack.gz
│  │        ├─ 2.pack.gz
│  │        ├─ 20.pack.gz
│  │        ├─ 21.pack.gz
│  │        ├─ 22.pack.gz
│  │        ├─ 23.pack.gz
│  │        ├─ 24.pack.gz
│  │        ├─ 25.pack.gz
│  │        ├─ 26.pack.gz
│  │        ├─ 27.pack.gz
│  │        ├─ 28.pack.gz
│  │        ├─ 29.pack.gz
│  │        ├─ 3.pack.gz
│  │        ├─ 30.pack.gz
│  │        ├─ 31.pack.gz
│  │        ├─ 32.pack.gz
│  │        ├─ 33.pack.gz
│  │        ├─ 4.pack.gz
│  │        ├─ 5.pack.gz
│  │        ├─ 6.pack.gz
│  │        ├─ 7.pack.gz
│  │        ├─ 8.pack.gz
│  │        ├─ 9.pack.gz
│  │        ├─ index.pack.gz
│  │        └─ index.pack.gz.old
│  ├─ package.json
│  ├─ react-loadable-manifest.json
│  ├─ server
│  │  ├─ _rsc_packages_ludics-engine_testers_ts.js
│  │  ├─ app
│  │  │  ├─ api
│  │  │  │  ├─ arguments
│  │  │  │  │  └─ batch
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ claim-citations
│  │  │  │  │  └─ route.js
│  │  │  │  ├─ claims
│  │  │  │  │  ├─ [id]
│  │  │  │  │  │  └─ toulmin
│  │  │  │  │  │     └─ route.js
│  │  │  │  │  ├─ batch
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  ├─ labels
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  └─ summary
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ commitments
│  │  │  │  │  └─ state
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ compose
│  │  │  │  │  └─ preflight
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ content-status
│  │  │  │  │  └─ route.js
│  │  │  │  ├─ deliberations
│  │  │  │  │  └─ [id]
│  │  │  │  │     ├─ approvals
│  │  │  │  │     │  └─ summary
│  │  │  │  │     │     └─ route.js
│  │  │  │  │     ├─ arguments
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ bridges
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ cards
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ clusters
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ cq
│  │  │  │  │     │  └─ summary
│  │  │  │  │     │     └─ route.js
│  │  │  │  │     ├─ dialectic
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ graph
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ issues
│  │  │  │  │     │  ├─ counts
│  │  │  │  │     │  │  └─ route.js
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ prefs
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ route.js
│  │  │  │  │     ├─ rsa
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ topology
│  │  │  │  │     │  └─ summary
│  │  │  │  │     │     └─ route.js
│  │  │  │  │     └─ viewpoints
│  │  │  │  │        └─ select
│  │  │  │  │           └─ route.js
│  │  │  │  ├─ knowledge-edges
│  │  │  │  │  └─ route.js
│  │  │  │  ├─ loci
│  │  │  │  │  └─ instantiate
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ ludics
│  │  │  │  │  ├─ compile
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  ├─ compile-step
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  ├─ designs
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  ├─ orthogonal
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  └─ step
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ nli
│  │  │  │  │  └─ batch
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ schemes
│  │  │  │  │  └─ route.js
│  │  │  │  └─ works
│  │  │  │     ├─ [id]
│  │  │  │     │  ├─ ludics-testers
│  │  │  │     │  │  └─ route.js
│  │  │  │     │  ├─ practical
│  │  │  │     │  │  └─ route.js
│  │  │  │     │  ├─ route.js
│  │  │  │     │  ├─ slots
│  │  │  │     │  │  └─ promote
│  │  │  │     │  │     └─ route.js
│  │  │  │     │  └─ tc
│  │  │  │     │     └─ route.js
│  │  │  │     ├─ page.js
│  │  │  │     ├─ page_client-reference-manifest.js
│  │  │  │     └─ route.js
│  │  │  ├─ article
│  │  │  │  └─ (by-key)
│  │  │  │     └─ [key]
│  │  │  │        ├─ page.js
│  │  │  │        └─ page_client-reference-manifest.js
│  │  │  ├─ favicon.ico
│  │  │  │  └─ route.js
│  │  │  └─ works
│  │  │     └─ [id]
│  │  │        ├─ page.js
│  │  │        └─ page_client-reference-manifest.js
│  │  ├─ app-paths-manifest.json
│  │  ├─ edge-runtime-webpack.js
│  │  ├─ interception-route-rewrite-manifest.js
│  │  ├─ middleware-build-manifest.js
│  │  ├─ middleware-manifest.json
│  │  ├─ middleware-react-loadable-manifest.js
│  │  ├─ middleware.js
│  │  ├─ next-font-manifest.js
│  │  ├─ next-font-manifest.json
│  │  ├─ pages-manifest.json
│  │  ├─ server-reference-manifest.js
│  │  ├─ server-reference-manifest.json
│  │  ├─ static
│  │  │  └─ webpack
│  │  │     └─ 633457081244afec._.hot-update.json
│  │  ├─ vendor-chunks
│  │  │  ├─ @floating-ui.js
│  │  │  ├─ @opentelemetry.js
│  │  │  ├─ @radix-ui.js
│  │  │  ├─ @supabase.js
│  │  │  ├─ @swc.js
│  │  │  ├─ @tiptap.js
│  │  │  ├─ aria-hidden.js
│  │  │  ├─ class-variance-authority.js
│  │  │  ├─ clsx.js
│  │  │  ├─ compromise.js
│  │  │  ├─ css-what.js
│  │  │  ├─ date-fns.js
│  │  │  ├─ dequal.js
│  │  │  ├─ devlop.js
│  │  │  ├─ efrt.js
│  │  │  ├─ get-nonce.js
│  │  │  ├─ grad-school.js
│  │  │  ├─ highlight.js.js
│  │  │  ├─ katex.js
│  │  │  ├─ linkifyjs.js
│  │  │  ├─ lowlight.js
│  │  │  ├─ lucide-react.js
│  │  │  ├─ nanoid.js
│  │  │  ├─ next-firebase-auth-edge.js
│  │  │  ├─ next.js
│  │  │  ├─ orderedmap.js
│  │  │  ├─ prosemirror-commands.js
│  │  │  ├─ prosemirror-dropcursor.js
│  │  │  ├─ prosemirror-gapcursor.js
│  │  │  ├─ prosemirror-history.js
│  │  │  ├─ prosemirror-keymap.js
│  │  │  ├─ prosemirror-model.js
│  │  │  ├─ prosemirror-schema-list.js
│  │  │  ├─ prosemirror-state.js
│  │  │  ├─ prosemirror-transform.js
│  │  │  ├─ prosemirror-view.js
│  │  │  ├─ react-remove-scroll-bar.js
│  │  │  ├─ react-remove-scroll.js
│  │  │  ├─ react-style-singleton.js
│  │  │  ├─ react-virtuoso.js
│  │  │  ├─ rope-sequence.js
│  │  │  ├─ suffix-thumb.js
│  │  │  ├─ swr.js
│  │  │  ├─ tailwind-merge.js
│  │  │  ├─ tr46.js
│  │  │  ├─ tslib.js
│  │  │  ├─ use-callback-ref.js
│  │  │  ├─ use-sidecar.js
│  │  │  ├─ use-sync-external-store.js
│  │  │  ├─ w3c-keyname.js
│  │  │  ├─ whatwg-url.js
│  │  │  ├─ zeed-dom.js
│  │  │  └─ zod.js
│  │  └─ webpack-runtime.js
│  ├─ static
│  │  ├─ chunks
│  │  │  ├─ _app-pages-browser_components_graph_GraphPanel_tsx.js
│  │  │  ├─ app
│  │  │  │  ├─ api
│  │  │  │  │  ├─ layout.js
│  │  │  │  │  └─ works
│  │  │  │  │     └─ page.js
│  │  │  │  ├─ article
│  │  │  │  │  ├─ (by-key)
│  │  │  │  │  │  └─ [key]
│  │  │  │  │  │     └─ page.js
│  │  │  │  │  └─ layout.js
│  │  │  │  └─ works
│  │  │  │     ├─ [id]
│  │  │  │     │  └─ page.js
│  │  │  │     └─ layout.js
│  │  │  ├─ app-pages-internals.js
│  │  │  ├─ main-app.js
│  │  │  ├─ polyfills.js
│  │  │  └─ webpack.js
│  │  ├─ css
│  │  │  └─ app
│  │  │     ├─ article
│  │  │     │  └─ layout.css
│  │  │     └─ works
│  │  │        └─ layout.css
│  │  ├─ development
│  │  │  ├─ _buildManifest.js
│  │  │  └─ _ssgManifest.js
│  │  └─ webpack
│  │     ├─ 13413510fcded812.webpack.hot-update.json
│  │     ├─ 38ace0c08bd30df8.webpack.hot-update.json
│  │     ├─ 4053d033e874c314.webpack.hot-update.json
│  │     ├─ 42ef34d88b755c25.webpack.hot-update.json
│  │     ├─ 494f1b7c58773211.webpack.hot-update.json
│  │     ├─ 4c6aa8fb4b5289c4.webpack.hot-update.json
│  │     ├─ 5a01f5500b28f076.webpack.hot-update.json
│  │     ├─ 633457081244afec._.hot-update.json
│  │     ├─ 66fdc4e8353a0f5f.webpack.hot-update.json
│  │     ├─ 7b46c9b915acf460.webpack.hot-update.json
│  │     ├─ 83291807e9944359.webpack.hot-update.json
│  │     ├─ 9fd2eef6da4e918e.webpack.hot-update.json
│  │     ├─ af8ed37442e827a4.webpack.hot-update.json
│  │     ├─ app
│  │     │  ├─ article
│  │     │  │  ├─ (by-key)
│  │     │  │  │  └─ [key]
│  │     │  │  │     ├─ page.38ace0c08bd30df8.hot-update.js
│  │     │  │  │     ├─ page.4053d033e874c314.hot-update.js
│  │     │  │  │     ├─ page.494f1b7c58773211.hot-update.js
│  │     │  │  │     ├─ page.5a01f5500b28f076.hot-update.js
│  │     │  │  │     ├─ page.66fdc4e8353a0f5f.hot-update.js
│  │     │  │  │     ├─ page.7b46c9b915acf460.hot-update.js
│  │     │  │  │     ├─ page.af8ed37442e827a4.hot-update.js
│  │     │  │  │     ├─ page.b9c08df019dacc11.hot-update.js
│  │     │  │  │     └─ page.ea458e00116d374c.hot-update.js
│  │     │  │  ├─ layout.38ace0c08bd30df8.hot-update.js
│  │     │  │  ├─ layout.4053d033e874c314.hot-update.js
│  │     │  │  ├─ layout.42ef34d88b755c25.hot-update.js
│  │     │  │  ├─ layout.494f1b7c58773211.hot-update.js
│  │     │  │  ├─ layout.4c6aa8fb4b5289c4.hot-update.js
│  │     │  │  ├─ layout.5a01f5500b28f076.hot-update.js
│  │     │  │  ├─ layout.66fdc4e8353a0f5f.hot-update.js
│  │     │  │  ├─ layout.7b46c9b915acf460.hot-update.js
│  │     │  │  ├─ layout.9fd2eef6da4e918e.hot-update.js
│  │     │  │  ├─ layout.af8ed37442e827a4.hot-update.js
│  │     │  │  ├─ layout.b9c08df019dacc11.hot-update.js
│  │     │  │  ├─ layout.ea458e00116d374c.hot-update.js
│  │     │  │  └─ layout.ec45039e230ae4de.hot-update.js
│  │     │  └─ works
│  │     │     ├─ layout.38ace0c08bd30df8.hot-update.js
│  │     │     ├─ layout.4053d033e874c314.hot-update.js
│  │     │     ├─ layout.5a01f5500b28f076.hot-update.js
│  │     │     ├─ layout.af8ed37442e827a4.hot-update.js
│  │     │     └─ layout.ea458e00116d374c.hot-update.js
│  │     ├─ b9c08df019dacc11.webpack.hot-update.json
│  │     ├─ ea458e00116d374c.webpack.hot-update.json
│  │     ├─ ec45039e230ae4de.webpack.hot-update.json
│  │     ├─ webpack.13413510fcded812.hot-update.js
│  │     ├─ webpack.38ace0c08bd30df8.hot-update.js
│  │     ├─ webpack.4053d033e874c314.hot-update.js
│  │     ├─ webpack.42ef34d88b755c25.hot-update.js
│  │     ├─ webpack.494f1b7c58773211.hot-update.js
│  │     ├─ webpack.4c6aa8fb4b5289c4.hot-update.js
│  │     ├─ webpack.5a01f5500b28f076.hot-update.js
│  │     ├─ webpack.66fdc4e8353a0f5f.hot-update.js
│  │     ├─ webpack.7b46c9b915acf460.hot-update.js
│  │     ├─ webpack.83291807e9944359.hot-update.js
│  │     ├─ webpack.9fd2eef6da4e918e.hot-update.js
│  │     ├─ webpack.af8ed37442e827a4.hot-update.js
│  │     ├─ webpack.b9c08df019dacc11.hot-update.js
│  │     ├─ webpack.ea458e00116d374c.hot-update.js
│  │     └─ webpack.ec45039e230ae4de.hot-update.js
│  ├─ trace
│  └─ types
│     ├─ app
│     │  ├─ api
│     │  │  ├─ arguments
│     │  │  │  └─ batch
│     │  │  │     └─ route.ts
│     │  │  ├─ claim-citations
│     │  │  │  └─ route.ts
│     │  │  ├─ claims
│     │  │  │  ├─ [id]
│     │  │  │  │  └─ toulmin
│     │  │  │  │     └─ route.ts
│     │  │  │  ├─ batch
│     │  │  │  │  └─ route.ts
│     │  │  │  ├─ labels
│     │  │  │  │  └─ route.ts
│     │  │  │  └─ summary
│     │  │  │     └─ route.ts
│     │  │  ├─ commitments
│     │  │  │  └─ state
│     │  │  │     └─ route.ts
│     │  │  ├─ compose
│     │  │  │  └─ preflight
│     │  │  │     └─ route.ts
│     │  │  ├─ content-status
│     │  │  │  └─ route.ts
│     │  │  ├─ deliberations
│     │  │  │  └─ [id]
│     │  │  │     ├─ approvals
│     │  │  │     │  └─ summary
│     │  │  │     │     └─ route.ts
│     │  │  │     ├─ arguments
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ bridges
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ cards
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ clusters
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ cq
│     │  │  │     │  └─ summary
│     │  │  │     │     └─ route.ts
│     │  │  │     ├─ dialectic
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ graph
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ issues
│     │  │  │     │  ├─ counts
│     │  │  │     │  │  └─ route.ts
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ prefs
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ route.ts
│     │  │  │     ├─ rsa
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ topology
│     │  │  │     │  └─ summary
│     │  │  │     │     └─ route.ts
│     │  │  │     └─ viewpoints
│     │  │  │        └─ select
│     │  │  │           └─ route.ts
│     │  │  ├─ knowledge-edges
│     │  │  │  └─ route.ts
│     │  │  ├─ layout.ts
│     │  │  ├─ loci
│     │  │  │  └─ instantiate
│     │  │  │     └─ route.ts
│     │  │  ├─ ludics
│     │  │  │  ├─ compile
│     │  │  │  │  └─ route.ts
│     │  │  │  ├─ compile-step
│     │  │  │  │  └─ route.ts
│     │  │  │  ├─ designs
│     │  │  │  │  └─ route.ts
│     │  │  │  ├─ orthogonal
│     │  │  │  │  └─ route.ts
│     │  │  │  └─ step
│     │  │  │     └─ route.ts
│     │  │  ├─ nli
│     │  │  │  └─ batch
│     │  │  │     └─ route.ts
│     │  │  ├─ schemes
│     │  │  │  └─ route.ts
│     │  │  └─ works
│     │  │     ├─ [id]
│     │  │     │  ├─ ludics-testers
│     │  │     │  │  └─ route.ts
│     │  │     │  ├─ practical
│     │  │     │  │  └─ route.ts
│     │  │     │  ├─ route.ts
│     │  │     │  ├─ slots
│     │  │     │  │  └─ promote
│     │  │     │  │     └─ route.ts
│     │  │     │  └─ tc
│     │  │     │     └─ route.ts
│     │  │     ├─ page.ts
│     │  │     └─ route.ts
│     │  ├─ article
│     │  │  ├─ (by-key)
│     │  │  │  └─ [key]
│     │  │  │     └─ page.ts
│     │  │  └─ layout.ts
│     │  └─ works
│     │     ├─ [id]
│     │     │  └─ page.ts
│     │     └─ layout.ts
│     └─ package.json
├─ .npmrc
├─ .yarnrc.yml
├─ AGENTS.md
├─ Advanced_Node_System_SRS.md
├─ Advanced_Prediction_Market_Guide.md
├─ Analytics_Dashboard_Flow_Builder_SRS.md
├─ Article_Annotations_Guide.md
├─ Article_New_Post_Type.md
├─ Article_Post_Packets.md
├─ Article_Post_Type_Brainstorm.md
├─ Article_Post_Type_SRS.md
├─ Article_Template_Switcher.md
├─ Codex_Environment_Guide.md
├─ CoolUnicodeSymbols.md
├─ Creating_New_Post_Type_Guide.md
├─ DigitalAgoraPlanning
│  ├─ ML_Deliberation_v2.md
│  └─ Sep_5_Roadmaps.md
├─ Direct_Message_GroupChat_Attachments_Plan.md
├─ Direct_Message_SRS.md
├─ Dockerfile
├─ Embedded_Room_Canvas_Post_SRS.md
├─ EndtoEnd_Security_Manual.md
├─ Entropy_Game.md
├─ FlowBuilder_Case_Study.md
├─ Flow_Builder_FLOWSTATE_Report.md
├─ Flowstate_Codex_Guide.md
├─ Flowstate_Flow_Builder.md
├─ Flowstate_v2_Overview.md
├─ Flowstate_v2_SRS.md
├─ Ideas_Backlog.md
├─ Internetwork_Interoperability_Roadmap.md
├─ Investor_Report.md
├─ LaunchDay_Preparation_Guide.md
├─ Library_Post_Type_SRS.md
├─ Linear_Workflow_Builder_SRS.md
├─ Livechat_Node_SRS.md
├─ MESH_ActivityPub.md
├─ MESH_DIFFERENTIATION.md
├─ MESH_REGULATION_STRATEGY.md
├─ MESH_ROOM_EXPLANATION.md
├─ MESH_RSS.md
├─ MESH_SECURITY_GUIDE_V1.md
├─ MESH_SITE_BLOCKS_ROADMAP.md
├─ Makefile
├─ Mesh_Governance_Roadmap.md
├─ Mesh_Performance_Improvements.md
├─ Mesh_Perplexity_Principle.md
├─ Mesh_Product_Overview
├─ Mesh_Product_Overview.txt
├─ Mesh_Roadmap.md
├─ Mesh_Settings_Implementation.md
├─ Mobile_App_SRS.md
├─ Pivot_Game_srs.md
├─ Pivot_V2_Game_ROADMAP.md
├─ Platform_Integrations_UserFlow_SRS.md
├─ Plugin_Architecture_SRS.md
├─ Portfolio_Node_SRS.md
├─ Portfolio_Page_Builder_SRS.md
├─ PredictionMarket_Development_Playbook.md
├─ PredictionMarket_Implementation_Plan.md
├─ PredictionMarket_Next_Steps.md
├─ PredictionMarket_Post_Type_Guide.md
├─ Product_Review_Node_SRS.md
├─ README.md
├─ RoomShard_Sprints.md
├─ Room_Shards_Development_Guide.md
├─ Shards_Product_Brief.md
├─ Site_Builder_Next_Steps.md
├─ SocialDiscoverEngine_V2_SRS.md
├─ SocialDiscoveryEnginev2.md
├─ SocialDiscovery_Codex_Guide.md
├─ Social_Discovery_Engine_Roadmap.md
├─ Social_Discovery_SRS.md
├─ Spotify_Favorites_Import_Ingest.md
├─ SwapMeet_Docs
│  ├─ SM_AUG4_TASKS.md
│  ├─ SwapMeet_Advanced_Features.md
│  ├─ SwapMeet_Docs
│  │  └─ SwapMeet_Phase2_Task_List.md
│  ├─ SwapMeet_Implementation_Plan.md
│  ├─ SwapMeet_Libraries_Tools_SDKs.md
│  ├─ SwapMeet_Phase2_Task_List.md
│  ├─ SwapMeet_ProductPlaybook.md
│  ├─ SwapMeet_Steps.md
│  ├─ SwapMeet_UI_Guide.md
│  ├─ SwapMeet_v1_SRS.md
│  └─ Swapmeet_Differentiation.md
├─ Word_Rails_Game_srs.md
├─ __tests__
│  ├─ roles.test.ts
│  └─ tenant.spec.ts
├─ adding-elements-sitebuilder.md
├─ api
│  └─ embed.py
├─ app
│  ├─ (auth)
│  │  ├─ MetaBg.tsx
│  │  ├─ auth-bg.css
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  ├─ NewEdgeTest-LightRounded.otf
│  │  │  └─ page.tsx
│  │  ├─ meta-bg.css
│  │  ├─ onboarding
│  │  │  ├─ NewEdgeTest-LightRounded.otf
│  │  │  ├─ layout.tsx
│  │  │  ├─ onboarding-flow.tsx
│  │  │  └─ page.tsx
│  │  └─ register
│  │     └─ page.tsx
│  ├─ (dashboard)
│  │  ├─ components
│  │  │  └─ CostEstimate.tsx
│  │  └─ rooms
│  │     └─ [id]
│  │        └─ settings
│  │           └─ SovereigntyPanel.tsx
│  ├─ (editor)
│  │  ├─ EditorStyleGate.tsx
│  │  ├─ article
│  │  │  ├─ article.global.scss
│  │  │  ├─ by-id
│  │  │  │  └─ [id]
│  │  │  │     └─ edit
│  │  │  │        └─ page.tsx
│  │  │  ├─ new
│  │  │  │  └─ page.tsx
│  │  │  └─ styles
│  │  ├─ editor.global.css
│  │  ├─ layout.tsx
│  │  ├─ profile
│  │  │  └─ edit
│  │  └─ prosemirror.css
│  ├─ (pages)
│  │  ├─ layout.tsx
│  │  └─ settings
│  │     └─ integrations
│  │        ├─ SpotifyButton.tsx
│  │        └─ page.tsx
│  ├─ (root)
│  │  ├─ (realtime)
│  │  │  ├─ post
│  │  │  │  ├─ [id]
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ layout.tsx
│  │  │  └─ room
│  │  │     ├─ [id]
│  │  │     │  └─ page.tsx
│  │  │     ├─ join
│  │  │     │  └─ [id]
│  │  │     │     └─ page.tsx
│  │  │     └─ layout.tsx
│  │  ├─ (standard)
│  │  │  ├─ BugrinoTrials-Bold.otf
│  │  │  ├─ BugrinoTrials-Heavy.otf
│  │  │  ├─ BugrinoTrials-Regular.otf
│  │  │  ├─ BugrinoTrials-Thin.otf
│  │  │  ├─ KoloniaTrial-Regular.woff2
│  │  │  ├─ MediaanTrial-Regular.woff2
│  │  │  ├─ NewEdgeTest-LightRounded.otf
│  │  │  ├─ NewEdgeTest-RegularRounded.otf
│  │  │  ├─ NewEdgeTest-SemiboldRounded.otf
│  │  │  ├─ NewEdgeTest-UltraLightRounded.otf
│  │  │  ├─ activity
│  │  │  │  └─ page.tsx
│  │  │  ├─ applications
│  │  │  │  └─ page.tsx
│  │  │  ├─ client-providers.tsx
│  │  │  ├─ create-lounge
│  │  │  │  └─ page.tsx
│  │  │  ├─ create-room
│  │  │  │  └─ page.tsx
│  │  │  ├─ create-thread
│  │  │  │  └─ page.tsx
│  │  │  ├─ entropy
│  │  │  │  ├─ data.ts
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ utilities.ts
│  │  │  ├─ explore
│  │  │  │  └─ page.tsx
│  │  │  ├─ feed
│  │  │  │  └─ page.tsx
│  │  │  ├─ foundersgrotesk.woff2
│  │  │  ├─ groups
│  │  │  │  └─ page.tsx
│  │  │  ├─ halfway
│  │  │  │  └─ page.tsx
│  │  │  ├─ integrations
│  │  │  │  ├─ integration-form.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ layout.tsx
│  │  │  ├─ lounges
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx
│  │  │  ├─ messages
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx
│  │  │  ├─ notifications
│  │  │  │  ├─ NotificationsList.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ page.tsx
│  │  │  ├─ pageflow
│  │  │  │  └─ page.tsx
│  │  │  ├─ pivot
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ pivotGenerator.ts
│  │  │  │  ├─ pivotReducer.ts
│  │  │  │  ├─ types
│  │  │  │  │  └─ pivot.ts
│  │  │  │  └─ words4.ts
│  │  │  ├─ profile
│  │  │  │  ├─ [id]
│  │  │  │  │  ├─ customize
│  │  │  │  │  │  ├─ customize-components.tsx
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  ├─ messages
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ articles
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  └─ ui
│  │  │  │  │     └─ ArticlesDashboard.tsx
│  │  │  │  ├─ messages
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ settings
│  │  │  │  │  ├─ (admin)
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  ├─ (client)
│  │  │  │  │  │  └─ AccountForm.tsx
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ sites
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  └─ ui
│  │  │  │  │     └─ SitesDashboard.tsx
│  │  │  │  └─ stacks
│  │  │  │     ├─ page.tsx
│  │  │  │     └─ ui
│  │  │  │        └─ StacksDashboard.tsx
│  │  │  ├─ search
│  │  │  │  └─ page.tsx
│  │  │  ├─ thread
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx
│  │  │  ├─ wordrails
│  │  │  │  ├─ data.ts
│  │  │  │  └─ page.tsx
│  │  │  └─ workflows
│  │  │     ├─ [id]
│  │  │     │  └─ page.tsx
│  │  │     ├─ click-counter
│  │  │     │  └─ page.tsx
│  │  │     ├─ example
│  │  │     │  └─ page.tsx
│  │  │     ├─ new
│  │  │     │  └─ page.tsx
│  │  │     ├─ page.tsx
│  │  │     └─ templates
│  │  │        └─ page.tsx
│  │  └─ WebVitals.tsx
│  ├─ (server)
│  │  └─ sheafActions.ts
│  ├─ .well-known
│  │  └─ webfinger
│  │     └─ route.ts
│  ├─ _startup
│  │  └─ ludics-hooks.ts
│  ├─ admin
│  │  └─ sheaf
│  │     ├─ layout.tsx
│  │     └─ page.tsx
│  ├─ api
│  │  ├─ _cron
│  │  │  ├─ close_auctions
│  │  │  │  └─ route.ts
│  │  │  ├─ embed_retry_worker
│  │  │  │  └─ route.ts
│  │  │  └─ favorites_builder
│  │  │     └─ route.ts
│  │  ├─ _internal
│  │  │  └─ run_favorites_builder
│  │  │     └─ route.ts
│  │  ├─ _sheaf-acl-demo
│  │  │  ├─ _store.ts
│  │  │  ├─ _util.ts
│  │  │  ├─ admin
│  │  │  │  ├─ messages
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ forward-check
│  │  │  │  └─ route.ts
│  │  │  ├─ messages
│  │  │  │  └─ route.ts
│  │  │  └─ preview
│  │  │     └─ route.ts
│  │  ├─ af
│  │  │  ├─ explain
│  │  │  │  └─ route.ts
│  │  │  └─ stable
│  │  │     └─ route.ts
│  │  ├─ amplification-events
│  │  │  ├─ by-origin
│  │  │  │  └─ [originId]
│  │  │  │     └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ ap
│  │  │  └─ follow
│  │  │     └─ route.ts
│  │  ├─ argument-annotations
│  │  │  └─ route.ts
│  │  ├─ arguments
│  │  │  ├─ [id]
│  │  │  │  ├─ meta
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ qualifier
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  └─ batch
│  │  │     └─ route.ts
│  │  ├─ articles
│  │  │  ├─ [id]
│  │  │  │  ├─ (by-id)
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ (draft)
│  │  │  │  │  └─ draft
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ (publish)
│  │  │  │  │  └─ publish
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ (restore)
│  │  │  │  │  └─ restore
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ (revisions)
│  │  │  │  │  └─ revisions
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ threads
│  │  │  │     └─ route.ts
│  │  │  ├─ layout.tsx
│  │  │  ├─ mine
│  │  │  │  └─ route.ts
│  │  │  ├─ presign.ts
│  │  │  ├─ preview
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ attacks
│  │  │  └─ route.ts
│  │  ├─ auction
│  │  │  ├─ [id]
│  │  │  │  ├─ events
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ bid
│  │  │  │  └─ route.ts
│  │  │  ├─ create
│  │  │  │  └─ route.ts
│  │  │  └─ finalize
│  │  │     └─ route.ts
│  │  ├─ behaviors
│  │  │  ├─ arrow-check
│  │  │  │  └─ route.ts
│  │  │  ├─ function-space
│  │  │  │  └─ run
│  │  │  │     └─ route.ts
│  │  │  └─ scan-contradictions
│  │  │     └─ route.ts
│  │  ├─ blocks
│  │  │  ├─ [id]
│  │  │  │  ├─ fork
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ thumbnail
│  │  │  │     └─ route.ts
│  │  │  ├─ from-element
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ bridges
│  │  │  ├─ [id]
│  │  │  │  ├─ assign
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ complete
│  │  │  │     └─ route.ts
│  │  │  ├─ assignments
│  │  │  │  ├─ [id]
│  │  │  │  │  ├─ accept
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ complete
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ preview
│  │  │  │  └─ route.ts
│  │  │  └─ requests
│  │  │     ├─ [id]
│  │  │     │  └─ assign
│  │  │     │     └─ route.ts
│  │  │     └─ route.ts
│  │  ├─ briefs
│  │  │  ├─ [brief]
│  │  │  │  ├─ provenance
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ publish
│  │  │  │     └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ cart
│  │  │  ├─ add
│  │  │  │  └─ route.ts
│  │  │  ├─ checkout
│  │  │  │  └─ route.ts
│  │  │  ├─ count
│  │  │  │  └─ route.ts
│  │  │  ├─ expire
│  │  │  │  └─ route.ts
│  │  │  ├─ release
│  │  │  │  └─ route.ts
│  │  │  └─ view
│  │  │     └─ route.ts
│  │  ├─ citations
│  │  │  ├─ [id]
│  │  │  │  └─ verify
│  │  │  │     └─ route.ts
│  │  │  └─ verify
│  │  │     └─ route.ts
│  │  ├─ claim-citations
│  │  │  └─ route.ts
│  │  ├─ claims
│  │  │  ├─ [id]
│  │  │  │  ├─ citations
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ cq
│  │  │  │  │  └─ summary
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ edges
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ evidence
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ grounds
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ rebut
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ toulmin
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ warrant
│  │  │  │     └─ route.ts
│  │  │  ├─ batch
│  │  │  │  └─ route.ts
│  │  │  ├─ label
│  │  │  │  ├─ compute
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ labels
│  │  │  │  └─ route.ts
│  │  │  ├─ quick-create
│  │  │  │  └─ route.ts
│  │  │  ├─ route.ts
│  │  │  ├─ search
│  │  │  │  └─ route.ts
│  │  │  └─ summary
│  │  │     └─ route.ts
│  │  ├─ comment-threads
│  │  │  └─ [id]
│  │  │     └─ resolve
│  │  │        └─ route.ts
│  │  ├─ comments
│  │  │  ├─ [id]
│  │  │  │  ├─ reply
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ vote
│  │  │  │     └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ commitments
│  │  │  ├─ apply
│  │  │  │  └─ route.ts
│  │  │  ├─ contradictions
│  │  │  │  └─ route.ts
│  │  │  ├─ entitlement
│  │  │  │  └─ route.ts
│  │  │  └─ state
│  │  │     └─ route.ts
│  │  ├─ compose
│  │  │  └─ preflight
│  │  │     └─ route.ts
│  │  ├─ computeRoutes
│  │  │  └─ route.ts
│  │  ├─ connections
│  │  │  └─ info
│  │  │     └─ route.ts
│  │  ├─ content-status
│  │  │  └─ route.ts
│  │  ├─ conversations
│  │  │  ├─ [id]
│  │  │  │  ├─ bookmark
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ read
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ readers
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ stars
│  │  │  │     └─ route.ts
│  │  │  ├─ group
│  │  │  │  └─ route.ts
│  │  │  └─ list
│  │  │     └─ route.ts
│  │  ├─ cqs
│  │  │  ├─ attachments
│  │  │  │  └─ route.ts
│  │  │  ├─ route.ts
│  │  │  └─ toggle
│  │  │     └─ route.ts
│  │  ├─ debug
│  │  │  └─ db
│  │  │     └─ route.ts
│  │  ├─ deliberations
│  │  │  ├─ [id]
│  │  │  │  ├─ activity
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ aif
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ approvals
│  │  │  │  │  └─ summary
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ approve
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ arguments
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ bridges
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ cards
│  │  │  │  │  ├─ [cardId]
│  │  │  │  │  │  └─ warrant
│  │  │  │  │  │     └─ undercut
│  │  │  │  │  │        └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ ceg
│  │  │  │  │  └─ mini
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ claims
│  │  │  │  │  ├─ backfill
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ clusters
│  │  │  │  │  ├─ affinity
│  │  │  │  │  │  └─ recompute
│  │  │  │  │  │     └─ route.ts
│  │  │  │  │  ├─ recompute
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ cq
│  │  │  │  │  └─ summary
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ dialectic
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ digest
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ edges
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ graph
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ issues
│  │  │  │  │  ├─ [issueId]
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  ├─ counts
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ moves
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ prefs
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  ├─ rsa
│  │  │  │  │  ├─ :targetType
│  │  │  │  │  │  └─ :targetId
│  │  │  │  │  │     └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ timeline
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ topology
│  │  │  │  │  └─ summary
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ viewpoints
│  │  │  │     └─ select
│  │  │  │        └─ route.ts
│  │  │  └─ upsert
│  │  │     └─ route.ts
│  │  ├─ dev
│  │  │  └─ verify
│  │  │     └─ route.ts
│  │  ├─ dialogue
│  │  │  ├─ answer-and-commit
│  │  │  │  └─ route.ts
│  │  │  ├─ legal-attacks
│  │  │  │  └─ route.ts
│  │  │  ├─ legal-moves
│  │  │  │  └─ route.ts
│  │  │  ├─ move
│  │  │  │  └─ route.ts
│  │  │  └─ open-cqs
│  │  │     └─ route.ts
│  │  ├─ drifts
│  │  │  ├─ [id]
│  │  │  │  └─ messages
│  │  │  │     └─ route.ts
│  │  │  ├─ list
│  │  │  │  └─ route.ts
│  │  │  ├─ query
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ embed
│  │  │  └─ route.ts
│  │  ├─ entail
│  │  │  └─ dialogical
│  │  │     ├─ route.ts
│  │  │     └─ visualize
│  │  │        └─ route.ts
│  │  ├─ eristic
│  │  │  └─ marks
│  │  │     └─ route.ts
│  │  ├─ escrow
│  │  │  └─ release
│  │  │     └─ route.ts
│  │  ├─ esp
│  │  │  └─ open
│  │  │     └─ route.ts
│  │  ├─ feed
│  │  │  ├─ [id]
│  │  │  │  └─ route.ts
│  │  │  ├─ delete
│  │  │  │  └─ route.ts
│  │  │  ├─ replicate
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ geocode
│  │  │  └─ route.ts
│  │  ├─ get-participant-token
│  │  │  └─ route.ts
│  │  ├─ googleProxy
│  │  │  └─ route.ts
│  │  ├─ governance
│  │  │  └─ status
│  │  │     └─ route.ts
│  │  ├─ group-halfway
│  │  │  ├─ create
│  │  │  │  └─ route.ts
│  │  │  ├─ heatmap
│  │  │  │  └─ [id]
│  │  │  │     └─ route.ts
│  │  │  ├─ info
│  │  │  │  └─ [id]
│  │  │  │     └─ route.ts
│  │  │  ├─ origins
│  │  │  │  └─ [id]
│  │  │  │     └─ route.ts
│  │  │  └─ vote
│  │  │     └─ [id]
│  │  │        └─ route.ts
│  │  ├─ integrations
│  │  │  └─ route.ts
│  │  ├─ knowledge-edges
│  │  │  └─ route.ts
│  │  ├─ labels
│  │  │  └─ route.ts
│  │  ├─ layout.tsx
│  │  ├─ ledger
│  │  │  └─ route.ts
│  │  ├─ legal-moves
│  │  │  └─ route.ts
│  │  ├─ library
│  │  │  ├─ import
│  │  │  │  └─ route.ts
│  │  │  ├─ post
│  │  │  │  └─ route.ts
│  │  │  ├─ status
│  │  │  │  └─ route.ts
│  │  │  └─ upload
│  │  │     └─ route.ts
│  │  ├─ livekit-token
│  │  │  └─ route.ts
│  │  ├─ loci
│  │  │  ├─ copy
│  │  │  │  └─ route.ts
│  │  │  ├─ instantiate
│  │  │  │  └─ route.ts
│  │  │  └─ saturate
│  │  │     └─ route.ts
│  │  ├─ ludics
│  │  │  ├─ acts
│  │  │  │  └─ route.ts
│  │  │  ├─ additive
│  │  │  │  └─ pick
│  │  │  │     └─ route.ts
│  │  │  ├─ compile
│  │  │  │  └─ route.ts
│  │  │  ├─ compile-step
│  │  │  │  └─ route.ts
│  │  │  ├─ concession
│  │  │  │  └─ route.ts
│  │  │  ├─ delocate
│  │  │  │  └─ route.ts
│  │  │  ├─ designs
│  │  │  │  └─ route.ts
│  │  │  ├─ fax
│  │  │  │  ├─ branch
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ clone
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ judge
│  │  │  │  └─ force
│  │  │  │     └─ route.ts
│  │  │  ├─ orthogonal
│  │  │  │  └─ route.ts
│  │  │  └─ step
│  │  │     └─ route.ts
│  │  ├─ map
│  │  │  ├─ edges
│  │  │  │  └─ route.ts
│  │  │  ├─ nodes
│  │  │  │  └─ route.ts
│  │  │  └─ seed
│  │  │     └─ route.ts
│  │  ├─ market
│  │  │  ├─ [id]
│  │  │  │  ├─ resolve
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ trade
│  │  │  │     └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ me
│  │  │  └─ route.ts
│  │  ├─ messages
│  │  │  ├─ [id]
│  │  │  │  ├─ ack
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ bookmark
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ lock
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ receipts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ star
│  │  │  │     └─ route.ts
│  │  │  ├─ attachments
│  │  │  │  └─ [id]
│  │  │  │     └─ sign
│  │  │  │        └─ route.ts
│  │  │  ├─ ensureParticipant.ts
│  │  │  ├─ item
│  │  │  │  └─ [messageId]
│  │  │  │     └─ route.ts
│  │  │  └─ start
│  │  │     └─ route.ts
│  │  ├─ missing-premises
│  │  │  ├─ [id]
│  │  │  │  ├─ accept
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ decline
│  │  │  │     └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ monological
│  │  │  ├─ bridge
│  │  │  │  └─ route.ts
│  │  │  ├─ extract
│  │  │  │  └─ route.ts
│  │  │  └─ slots
│  │  │     └─ route.ts
│  │  ├─ nearbyPlaces
│  │  │  └─ route.ts
│  │  ├─ nl
│  │  │  └─ normalize
│  │  │     └─ route.ts
│  │  ├─ nli
│  │  │  └─ batch
│  │  │     └─ route.ts
│  │  ├─ notifications
│  │  │  ├─ [id]
│  │  │  │  └─ route.ts
│  │  │  ├─ clear
│  │  │  │  └─ route.ts
│  │  │  ├─ read
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ orthogonality
│  │  │  └─ run
│  │  │     └─ route.ts
│  │  ├─ panels
│  │  │  ├─ [panelId]
│  │  │  │  ├─ close
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ decide
│  │  │  │     └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ party
│  │  │  ├─ [id]
│  │  │  │  └─ events
│  │  │  │     └─ route.ts
│  │  │  ├─ join
│  │  │  │  └─ route.ts
│  │  │  └─ leave
│  │  │     └─ route.ts
│  │  ├─ polls
│  │  │  ├─ [id]
│  │  │  │  └─ vote
│  │  │  │     └─ route.ts
│  │  │  ├─ query
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ portfolio
│  │  │  └─ export
│  │  │     └─ route.ts
│  │  ├─ proposals
│  │  │  ├─ candidates
│  │  │  │  └─ route.ts
│  │  │  ├─ ensure
│  │  │  │  └─ route.ts
│  │  │  ├─ list
│  │  │  │  └─ route.ts
│  │  │  ├─ merge
│  │  │  │  └─ route.ts
│  │  │  └─ signal
│  │  │     └─ route.ts
│  │  ├─ random-rooms
│  │  │  └─ route.ts
│  │  ├─ random-secret
│  │  │  └─ route.ts
│  │  ├─ random-users
│  │  │  └─ route.ts
│  │  ├─ reactions
│  │  │  └─ route.ts
│  │  ├─ realtime-posts
│  │  │  ├─ [id]
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ recommendations
│  │  │  ├─ click
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ replicated-post
│  │  │  └─ route.ts
│  │  ├─ rooms
│  │  │  ├─ [id]
│  │  │  │  ├─ decentralise
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ status
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ export
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ kms
│  │  │  │  │  ├─ revoke
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ rotate
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ logbook
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ receipts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ settings
│  │  │  │  │  └─ representation-rule
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ usage
│  │  │  │     └─ route.ts
│  │  │  └─ import
│  │  │     ├─ restore.ts
│  │  │     └─ route.ts
│  │  ├─ routeMidpoint
│  │  │  └─ route.ts
│  │  ├─ schemes
│  │  │  ├─ instances
│  │  │  │  └─ route.ts
│  │  │  ├─ questions
│  │  │  │  └─ [id]
│  │  │  │     └─ counter
│  │  │  │        └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ semantics
│  │  │  ├─ hints
│  │  │  │  └─ route.ts
│  │  │  └─ lf
│  │  │     └─ route.ts
│  │  ├─ settings
│  │  │  └─ me
│  │  │     └─ route.ts
│  │  ├─ sheaf
│  │  │  ├─ _map.ts
│  │  │  ├─ _prisma.ts
│  │  │  ├─ _util.ts
│  │  │  ├─ forward-check
│  │  │  │  └─ route.ts
│  │  │  ├─ lists
│  │  │  │  └─ route.ts
│  │  │  ├─ messages
│  │  │  │  └─ route.ts
│  │  │  ├─ participants
│  │  │  │  └─ route.ts
│  │  │  ├─ preview
│  │  │  │  └─ route.ts
│  │  │  └─ upload
│  │  │     └─ route.ts
│  │  ├─ sites
│  │  │  ├─ [id]
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ snapshots
│  │  │  └─ route.ts
│  │  ├─ stacks
│  │  │  ├─ [id]
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ stall
│  │  │  └─ [id]
│  │  │     ├─ doc
│  │  │     │  └─ route.ts
│  │  │     └─ heat
│  │  │        └─ route.ts
│  │  ├─ stalls
│  │  │  └─ [stallId]
│  │  │     ├─ events
│  │  │     │  └─ route.ts
│  │  │     └─ items
│  │  │        ├─ [itemId]
│  │  │        │  └─ checkout
│  │  │        │     └─ route.ts
│  │  │        └─ route.ts
│  │  ├─ stripe
│  │  │  ├─ onboard
│  │  │  │  └─ route.ts
│  │  │  ├─ status
│  │  │  │  └─ route.ts
│  │  │  └─ webhook
│  │  │     └─ route.ts
│  │  ├─ suggested-friends
│  │  │  └─ route.ts
│  │  ├─ swapmeet
│  │  │  ├─ orders
│  │  │  │  └─ route.ts
│  │  │  └─ spawn
│  │  │     └─ route.ts
│  │  ├─ telemetry
│  │  │  └─ route.ts
│  │  ├─ theoryworks
│  │  │  ├─ [id]
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ threads
│  │  │  ├─ [id]
│  │  │  │  └─ resolve
│  │  │  │     └─ route.ts
│  │  │  └─ ensure
│  │  │     └─ route.ts
│  │  ├─ track
│  │  │  └─ route.ts
│  │  ├─ triggers
│  │  │  └─ webhook
│  │  │     └─ [workflowId]
│  │  │        └─ [secret]
│  │  │           └─ route.ts
│  │  ├─ uniformity
│  │  │  └─ check
│  │  │     └─ route.ts
│  │  ├─ uploadthing
│  │  │  ├─ core.ts
│  │  │  └─ route.ts
│  │  ├─ urns
│  │  │  └─ mint
│  │  │     └─ route.ts
│  │  ├─ user-attributes
│  │  │  ├─ route.ts
│  │  │  └─ search
│  │  │     └─ route.ts
│  │  ├─ users
│  │  │  └─ search
│  │  │     └─ route.ts
│  │  ├─ v2
│  │  │  ├─ discovery
│  │  │  │  ├─ candidates
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ feedback
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ why
│  │  │  │     └─ [targetId]
│  │  │  │        └─ route.ts
│  │  │  ├─ favorites
│  │  │  │  ├─ import
│  │  │  │  │  └─ spotify
│  │  │  │  │     ├─ route.ts
│  │  │  │  │     ├─ status
│  │  │  │  │     │  └─ route.ts
│  │  │  │  │     └─ summary
│  │  │  │  │        └─ route.ts
│  │  │  │  └─ spotify
│  │  │  │     ├─ status
│  │  │  │     │  └─ route.ts
│  │  │  │     └─ summary
│  │  │  │        └─ route.ts
│  │  │  ├─ music
│  │  │  │  └─ candidates
│  │  │  │     └─ route.ts
│  │  │  └─ people
│  │  │     └─ candidates
│  │  │        └─ route.ts
│  │  ├─ wallet
│  │  │  └─ route.ts
│  │  ├─ workflow-broadcast
│  │  │  └─ route.ts
│  │  ├─ workflows
│  │  │  ├─ [id]
│  │  │  │  ├─ route.ts
│  │  │  │  └─ runs
│  │  │  │     └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ works
│  │  │  ├─ [id]
│  │  │  │  ├─ dn
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ dossier
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ hermeneutic
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ ih
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ integrity
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ ludics-testers
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ op
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ pascal
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ practical
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ promote-claim
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  ├─ slots
│  │  │  │  │  └─ promote
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ supplies
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ tc
│  │  │  │     └─ route.ts
│  │  │  ├─ by-ids
│  │  │  │  └─ route.ts
│  │  │  ├─ page.tsx
│  │  │  └─ route.ts
│  │  └─ youtube-audio
│  │     └─ route.ts
│  ├─ article
│  │  ├─ (by-key)
│  │  │  └─ [key]
│  │  │     └─ page.tsx
│  │  ├─ article.templates.css
│  │  ├─ editor.global.css
│  │  ├─ layout.tsx
│  │  ├─ rhetoric.css
│  │  ├─ type-tokens.css
│  │  └─ type-utilities.css
│  ├─ article.templates.css
│  ├─ blocks
│  │  └─ [id]
│  │     └─ preview
│  │        └─ page.tsx
│  ├─ briefs
│  │  ├─ [slug]
│  │  │  └─ page.tsx
│  │  └─ layout.tsx
│  ├─ cancel
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ deliberation
│  │  ├─ [id]
│  │  │  └─ page.tsx
│  │  ├─ components
│  │  │  ├─ DeliberationPage.tsx
│  │  │  └─ layout
│  │  │     └─ ReaderColumn.tsx
│  │  └─ layout.tsx
│  ├─ favicon.ico
│  ├─ fonts
│  │  └─ fonts.css
│  ├─ globals.css
│  ├─ group-halfway
│  │  ├─ [id]
│  │  │  ├─ page.tsx
│  │  │  └─ wizard.tsx
│  │  └─ layout.tsx
│  ├─ ledger
│  │  └─ [id]
│  │     └─ page.tsx
│  ├─ m
│  │  ├─ [messageId]
│  │  │  └─ compare
│  │  │     └─ page.tsx
│  │  └─ layout.tsx
│  ├─ passport
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ verifier
│  │     └─ page.tsx
│  ├─ portfolio
│  │  ├─ [slug]
│  │  │  ├─ data
│  │  │  │  └─ route.ts
│  │  │  ├─ page.tsx
│  │  │  └─ tailwind.css
│  │  │     └─ route.ts
│  │  ├─ builder
│  │  │  ├─ BlockLibrary.tsx
│  │  │  ├─ ResizeHandle.tsx
│  │  │  ├─ RightPanelAccordians.tsx
│  │  │  ├─ page.tsx
│  │  │  └─ resize-handles.module.css
│  │  ├─ builder.global.css
│  │  └─ layout.tsx
│  ├─ providers.tsx
│  ├─ server
│  │  ├─ db
│  │  │  └─ tenant.ts
│  │  └─ rooms
│  │     └─ dao.ts
│  ├─ spotify
│  │  ├─ callback
│  │  │  ├─ DashboardCharts.tsx
│  │  │  └─ page.tsx
│  │  └─ layout.tsx
│  ├─ stacks
│  │  ├─ [slugOrId]
│  │  │  └─ page.tsx
│  │  └─ layout.tsx
│  ├─ success
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ swapmeet
│  │  ├─ api
│  │  │  ├─ chat
│  │  │  │  └─ route.ts
│  │  │  ├─ heatmap
│  │  │  │  └─ route.ts
│  │  │  ├─ items
│  │  │  │  └─ route.ts
│  │  │  ├─ my-stalls
│  │  │  │  └─ route.ts
│  │  │  ├─ offers
│  │  │  │  ├─ route.ts
│  │  │  │  └─ stream
│  │  │  │     └─ route.ts
│  │  │  ├─ section
│  │  │  │  └─ route.ts
│  │  │  ├─ spawn
│  │  │  │  └─ route.ts
│  │  │  ├─ stall
│  │  │  │  ├─ [id]
│  │  │  │  │  ├─ events
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  ├─ items
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  ├─ live
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  ├─ orders
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ viewers
│  │  │  │     └─ route.ts
│  │  │  ├─ stall-image
│  │  │  │  └─ route.ts
│  │  │  └─ teleport
│  │  │     └─ route.ts
│  │  ├─ auctions
│  │  │  └─ page.tsx
│  │  ├─ components
│  │  │  ├─ AnimatedBoard.tsx
│  │  │  ├─ AuctionBar.tsx
│  │  │  ├─ AuctionCard.tsx
│  │  │  ├─ BuyNowButton.tsx
│  │  │  ├─ ChatPane.tsx
│  │  │  ├─ CreateAuctionDialog.tsx
│  │  │  ├─ EdgeNav.tsx
│  │  │  ├─ ImageCarousel.tsx
│  │  │  ├─ ItemsPane.tsx
│  │  │  ├─ Minimap.tsx
│  │  │  ├─ NavArrow.tsx
│  │  │  ├─ NavHook.tsx
│  │  │  ├─ NickCompleter.tsx
│  │  │  ├─ OfferLadder.tsx
│  │  │  ├─ ReviewPane.tsx
│  │  │  ├─ StallCard.tsx
│  │  │  ├─ StallGrid.tsx
│  │  │  ├─ StallSheet.tsx
│  │  │  ├─ TeleportButton.tsx
│  │  │  ├─ ThumbPad.tsx
│  │  │  ├─ TrackGrid.tsx
│  │  │  ├─ VideoPane.tsx
│  │  │  ├─ dashboard
│  │  │  │  ├─ LivePanel.tsx
│  │  │  │  └─ LivePanelClient.tsx
│  │  │  ├─ useArrowNav.ts
│  │  │  └─ useMove.ts
│  │  ├─ dashboard
│  │  │  └─ stalls
│  │  │     └─ page.tsx
│  │  ├─ layout.tsx
│  │  ├─ market
│  │  │  └─ [x]
│  │  │     └─ [y]
│  │  │        ├─ loading.tsx
│  │  │        └─ page.tsx
│  │  ├─ page.tsx
│  │  └─ stall
│  │     ├─ [id]
│  │     │  ├─ dashboard
│  │     │  │  └─ page.tsx
│  │     │  ├─ layout.tsx
│  │     │  └─ page.tsx
│  │     └─ layout.tsx
│  ├─ users
│  │  └─ [handle]
│  │     ├─ followers
│  │     │  └─ route.ts
│  │     ├─ inbox
│  │     │  └─ route.ts
│  │     ├─ outbox
│  │     │  └─ route.ts
│  │     └─ route.ts
│  └─ works
│     ├─ [id]
│     │  └─ page.tsx
│     ├─ layout.tsx
│     └─ page.tsx
├─ apply_copy_module.py
├─ apply_room_shards_drop.py
├─ apps
│  ├─ builder
│  │  └─ __tests__
│  │     └─ embed.spec.ts
│  └─ web
│     └─ src
│        └─ components
│           └─ modals
│              └─ ResolveMarketDialog.tsx
├─ backup.dump
├─ components
│  ├─ @modal
│  │  ├─ (.)article
│  │  │  └─ [slug]
│  │  │     └─ page.tsx
│  │  └─ default.tsx
│  ├─ CartButton.tsx
│  ├─ Discovery
│  │  └─ CardStack.tsx
│  ├─ GridNavControls.tsx
│  ├─ GroupHalfwayMap.tsx
│  ├─ HeatWidget.tsx
│  ├─ ImageDropzone.tsx
│  ├─ Minimap.tsx
│  ├─ NotificationBell.tsx
│  ├─ PartyOverlay.tsx
│  ├─ PresenceBadge.tsx
│  ├─ PrivateChatPane.tsx
│  ├─ SkeletonSquare.tsx
│  ├─ TimeRemaining.tsx
│  ├─ af
│  ├─ article
│  │  ├─ ArticleActions.tsx
│  │  ├─ ArticleCard.tsx
│  │  ├─ ArticleEditor.tsx
│  │  ├─ ArticleReader.tsx
│  │  ├─ ArticleReaderWithPins.tsx
│  │  ├─ CommentModal.tsx
│  │  ├─ CommentSidebar.tsx
│  │  ├─ DeepDiveBackground.tsx
│  │  ├─ Editor.tsx
│  │  ├─ HeroRenderer.tsx
│  │  ├─ SectionState.tsx
│  │  ├─ article.annotations.css
│  │  ├─ article.module.scss
│  │  ├─ editor
│  │  │  ├─ Outline.tsx
│  │  │  ├─ SlashCommand.tsx
│  │  │  ├─ TemplateSelector.tsx
│  │  │  └─ Toolbar.tsx
│  │  ├─ extensions
│  │  │  ├─ font-family.ts
│  │  │  └─ font-size.ts
│  │  └─ templates.ts
│  ├─ blocks
│  │  ├─ BlockPreviewClient.tsx
│  │  └─ EmbedBlock.tsx
│  ├─ bridge
│  │  ├─ BridgeInbox.tsx
│  │  ├─ RequestBridgeButton.tsx
│  │  └─ SummaryComposer.tsx
│  ├─ briefs
│  │  ├─ BriefCompiler.tsx
│  │  ├─ BriefDiffViewer.tsx
│  │  ├─ BriefViewer.tsx
│  │  ├─ DiffSection.tsx
│  │  └─ ProvenanceRibbon.tsx
│  ├─ buttons
│  │  ├─ ArticlePortal.tsx
│  │  ├─ DeleteButton.tsx
│  │  ├─ DeleteCardButton.tsx
│  │  ├─ EditButton.tsx
│  │  ├─ ExpandButton.tsx
│  │  ├─ FollowButton.tsx
│  │  ├─ GenerateButton.tsx
│  │  ├─ HomeButton.tsx
│  │  ├─ LikeButton.tsx
│  │  ├─ LockButton.tsx
│  │  ├─ MessageButton.tsx
│  │  ├─ NodeDropdown.tsx
│  │  ├─ ReplicateButton.tsx
│  │  ├─ ReplyButton.tsx
│  │  ├─ SearchFollowButton.tsx
│  │  ├─ ShareButton.tsx
│  │  ├─ SitesPortal.tsx
│  │  ├─ StacksPortal.tsx
│  │  └─ TimerButton.tsx
│  ├─ cards
│  │  ├─ DrawCanvas.tsx
│  │  ├─ EmbeddedCanvas.tsx
│  │  ├─ EntropyCard.tsx
│  │  ├─ GalleryCarousel.tsx
│  │  ├─ ImageCard.tsx
│  │  ├─ LibraryCard.tsx
│  │  ├─ LivechatCard.tsx
│  │  ├─ NewEdgeTest-RegularRounded.otf
│  │  ├─ NewEdgeTest-SemiboldRounded.otf
│  │  ├─ PortfolioCard.tsx
│  │  ├─ PostCard.tsx
│  │  ├─ PredictionMarketCard.tsx
│  │  ├─ ProductReviewCard.tsx
│  │  ├─ Repeater.exp.tsx
│  │  ├─ Repeater.lite.tsx
│  │  ├─ Repeater.tsx
│  │  ├─ ReplicatedPostCard.tsx
│  │  ├─ StackCarousel.tsx
│  │  ├─ ThreadCard.tsx
│  │  ├─ UserCard.tsx
│  │  └─ helpers
│  │     └─ slideVariants.ts
│  ├─ cart
│  │  └─ CartDrawer.tsx
│  ├─ chat
│  │  ├─ ChatRoom.tsx
│  │  ├─ ConversationList.tsx
│  │  ├─ ConversationView.tsx
│  │  ├─ DriftChip.tsx
│  │  ├─ DriftPane.tsx
│  │  ├─ GroupCreationModal.tsx
│  │  ├─ LinkCard.tsx
│  │  ├─ MessageActions.tsx
│  │  ├─ MessageComposer.tsx
│  │  ├─ MessageUserModal.tsx
│  │  ├─ MessagesRealtimeBootstrap.tsx
│  │  ├─ MessengerPane.tsx
│  │  ├─ PollChip.tsx
│  │  ├─ PrivateChatDock.tsx
│  │  ├─ PrivateChatShell.tsx
│  │  ├─ QuickPollComposer.tsx
│  │  ├─ QuickPollModal.tsx
│  │  ├─ QuickTempModal.tsx
│  │  ├─ QuoteBlock.tsx
│  │  ├─ StarToggle.tsx
│  │  └─ StarredFilterToggle.tsx
│  ├─ citations
│  │  ├─ CitePicker.tsx
│  │  └─ CitePickerInline.tsx
│  ├─ cite
│  │  └─ SchemePicker.tsx
│  ├─ claims
│  │  ├─ ClaimMiniMap.tsx
│  │  ├─ CriticalQuestions.tsx
│  │  └─ PromoteToClaimButton.tsx
│  ├─ compose
│  │  └─ TheoryFraming.tsx
│  ├─ cq
│  │  └─ useCQSummaryBatch.ts
│  ├─ cursors
│  │  ├─ Cursor.tsx
│  │  ├─ LiveCursors.tsx
│  │  └─ OwnCursor.tsx
│  ├─ dashboard
│  │  ├─ AddItemModal.tsx
│  │  ├─ DashboardShell.tsx
│  │  ├─ ItemsPanel.tsx
│  │  ├─ OrdersPanel.tsx
│  │  └─ PayoutsPanel.tsx
│  ├─ deepdive
│  │  ├─ AddGroundRebut.tsx
│  │  ├─ ApprovalsHeatStrip.tsx
│  │  ├─ ArgumentsList.tsx
│  │  ├─ CQBar.tsx
│  │  ├─ CardComposerTab.tsx
│  │  ├─ CardList.tsx
│  │  ├─ CardListVirtuoso.tsx
│  │  ├─ CegMiniMap.tsx
│  │  ├─ ChallengeWarrantCard.tsx
│  │  ├─ ClaimsVirtuoso.tsx
│  │  ├─ DeepDivePanel.tsx
│  │  ├─ DeepDivePanelClient.tsx
│  │  ├─ DeliberationComposer.tsx
│  │  ├─ DialogueTimeline.tsx
│  │  ├─ EnthymemeNudge.tsx
│  │  ├─ IssueRegister.tsx
│  │  ├─ LudicsPanel.tsx
│  │  ├─ RepresentativeViewpoints.tsx
│  │  ├─ RhetoricLensToggle.tsx
│  │  ├─ StartDeepDive.tsx
│  │  ├─ TopologyWidget.tsx
│  │  ├─ ToulminMini.tsx
│  │  ├─ WhyButton.tsx
│  │  └─ WhyQueue.tsx
│  ├─ dialogue
│  │  ├─ CommitmentDelta.tsx
│  │  ├─ DialogicalPanel.tsx
│  │  ├─ DialogueMoves.tsx
│  │  ├─ DialogueTargetContext.tsx
│  │  ├─ InlineMoveForm.tsx
│  │  ├─ LegalMoveChips.tsx
│  │  ├─ LudicsBadge.tsx
│  │  ├─ NLCommitPopover.tsx
│  │  ├─ SuggestedAttacks.tsx
│  │  ├─ WinningnessBadge.tsx
│  │  ├─ narrateTrace.ts
│  │  ├─ normalizeNL.ts
│  │  ├─ useDialogueMoves.ts
│  │  ├─ useGraphAF.ts
│  │  ├─ useLegalMoves.ts
│  │  ├─ useLudicsPhase.ts
│  │  └─ useSemanticsHints.ts
│  ├─ edges
│  │  └─ DefaultEdge.tsx
│  ├─ engine
│  │  └─ CompositionModeToggle.tsx
│  ├─ entail
│  │  └─ EntailmentWidget.tsx
│  ├─ feed
│  │  └─ WhyThis.tsx
│  ├─ forms
│  │  ├─ AccountProfile.tsx
│  │  ├─ Comment.tsx
│  │  ├─ CreateFeedPost.tsx
│  │  ├─ CreateLounge.tsx
│  │  ├─ CreateLoungePost.tsx
│  │  ├─ CreatePredictionPost.tsx
│  │  ├─ CreateRoom.tsx
│  │  ├─ EntropyNodeForm.tsx
│  │  ├─ GalleryNodeForm.tsx
│  │  ├─ ImageNodeForm.tsx
│  │  ├─ LivechatNodeForm.tsx
│  │  ├─ MusicNodeForm.tsx
│  │  ├─ PdfViewerNodeForm.tsx
│  │  ├─ PortalNodeForm.tsx
│  │  ├─ PortfolioNodeForm.tsx
│  │  ├─ PostThread.tsx
│  │  ├─ ProductReviewNodeForm.tsx
│  │  ├─ RoomCanvasForm.tsx
│  │  ├─ SetPostDuration.tsx
│  │  ├─ SplineViewerNodeForm.tsx
│  │  ├─ StallForm.tsx
│  │  ├─ TextNodeForm.tsx
│  │  └─ YoutubeNodeForm.tsx
│  ├─ gitchat
│  │  └─ ReceiptChip.tsx
│  ├─ governance
│  │  ├─ RoomLogbookFeed.tsx
│  │  ├─ StatusChip.tsx
│  │  └─ StatusDropdown.tsx
│  ├─ graph
│  │  ├─ AFLens.tsx
│  │  ├─ BipolarLens.tsx
│  │  ├─ CapsuleOverlay.tsx
│  │  ├─ CyCanvas.tsx
│  │  ├─ GraphHeaderValueToggle.tsx
│  │  ├─ GraphPanel.tsx
│  │  ├─ HullOverlay.tsx
│  │  ├─ Overlays
│  │  │  └─ SchemaOverlay.tsx
│  │  ├─ SchemeOverlayFetch.tsx
│  │  ├─ Toolbar.tsx
│  │  └─ useCegData.ts
│  ├─ help
│  │  ├─ HelpModal.tsx
│  │  ├─ HelpPage.tsx
│  │  └─ RepresentativeViewpointsHelp.md
│  ├─ hermeneutic
│  │  └─ HermeneuticBuilder.tsx
│  ├─ hooks
│  │  └─ MousePosition.tsx
│  ├─ ids
│  │  └─ CopyUrnButton.tsx
│  ├─ integrity
│  │  ├─ IntegrityBadge.tsx
│  │  └─ WorkIntegrityBadge.tsx
│  ├─ issues
│  │  ├─ IssueBadge.tsx
│  │  ├─ IssueComposer.tsx
│  │  ├─ IssueDetail.tsx
│  │  └─ IssuesDrawer.tsx
│  ├─ ludics
│  │  ├─ BehaviourInspectorCard.tsx
│  │  ├─ LociTreeWithControls.tsx
│  │  ├─ LocusControls.tsx
│  │  └─ UniformityPill.tsx
│  ├─ map
│  │  ├─ AnchorToMapButton.tsx
│  │  ├─ MapCanvas.tsx
│  │  ├─ NegotiationDrawer.tsx
│  │  └─ NegotiationDrawerV2.tsx
│  ├─ modals
│  │  ├─ ArticlePostModal.tsx
│  │  ├─ CollageCreationModal.tsx
│  │  ├─ CollageModal.tsx
│  │  ├─ ConnectAccountModal.tsx
│  │  ├─ EntropyNodeModal.tsx
│  │  ├─ GalleryNodeModal.tsx
│  │  ├─ ImageNodeModal.tsx
│  │  ├─ IntegrationConfigModal.tsx
│  │  ├─ LibraryPostModal.tsx
│  │  ├─ LivechatNodeModal.tsx
│  │  ├─ Modal.tsx
│  │  ├─ MusicNodeModal.tsx
│  │  ├─ PdfLightbox.tsx
│  │  ├─ PdfViewerNodeModal.tsx
│  │  ├─ PortalNodeModal.tsx
│  │  ├─ PortfolioModal.tsx
│  │  ├─ PortfolioNodeModal.tsx
│  │  ├─ PortfolioSiteBuilderModal.tsx
│  │  ├─ PredictionMarketModal.tsx
│  │  ├─ ProductPhotoGalleryModal.tsx
│  │  ├─ ProductReviewNodeModal.tsx
│  │  ├─ ResolveMarketDialog.tsx
│  │  ├─ RoomCanvasModal.tsx
│  │  ├─ SendEmailModal.tsx
│  │  ├─ ShareCanvasModal.tsx
│  │  ├─ SharePostModal.tsx
│  │  ├─ ShareRoomModal.tsx
│  │  ├─ SplineViewerNodeModal.tsx
│  │  ├─ StackAddModal.tsx
│  │  ├─ TextNodeModal.tsx
│  │  ├─ TimerModal.tsx
│  │  ├─ TradePredictionModal.tsx
│  │  ├─ UserRoomsModal.tsx
│  │  ├─ ViewGalleryModal.tsx
│  │  ├─ ViewImageModal.tsx
│  │  └─ YoutubeNodeModal.tsx
│  ├─ monological
│  │  ├─ InlineSlotEditor.tsx
│  │  ├─ MonologicalToolbar.tsx
│  │  ├─ QualityBadge.tsx
│  │  ├─ QualityBadgeBreakdown.tsx
│  │  ├─ QuantifierModalityPicker.tsx
│  │  └─ ToulminBox.tsx
│  ├─ nodes
│  │  ├─ AudioNode.tsx
│  │  ├─ BaseNode.tsx
│  │  ├─ CodeNode.tsx
│  │  ├─ CollageNode.tsx
│  │  ├─ DocumentNode.tsx
│  │  ├─ DrawNode.tsx
│  │  ├─ EntropyNode.tsx
│  │  ├─ GalleryNode.tsx
│  │  ├─ ImageComputeNode.tsx
│  │  ├─ ImageURLNode.tsx
│  │  ├─ LLMInstructionNode.tsx
│  │  ├─ LiveStreamNode.tsx
│  │  ├─ LivechatNode.tsx
│  │  ├─ MusicNode.tsx
│  │  ├─ PortalNode.tsx
│  │  ├─ PortfolioNode.tsx
│  │  ├─ ProductReviewNode.tsx
│  │  ├─ RoomCanvasNode.tsx
│  │  ├─ TextInputNode.tsx
│  │  ├─ ThreadNode.tsx
│  │  └─ YoutubeNode.tsx
│  ├─ pageflow
│  │  └─ PageFlowBuilder.tsx
│  ├─ pascal
│  │  └─ PascalBuilder.tsx
│  ├─ players
│  │  └─ SoundCloudPlayer.tsx
│  ├─ portfolio
│  │  ├─ AutoInspector.tsx
│  │  ├─ EmbedEnv.tsx
│  │  ├─ GalleryInspector.tsx
│  │  ├─ GalleryPropsPanel.tsx
│  │  ├─ RepeaterInspector.tsx
│  │  └─ RepeaterPropsPanel.tsx
│  ├─ practical
│  │  ├─ PracticalBuilder.tsx
│  │  ├─ PracticalLedger.tsx
│  │  └─ PracticalSummary.tsx
│  ├─ proposals
│  │  └─ ProposalsCompareModal.tsx
│  ├─ reactflow
│  │  ├─ NodeAuthorDisplay.tsx
│  │  ├─ NodeButtons.tsx
│  │  └─ Room.tsx
│  ├─ reactions
│  │  ├─ EmojiReactions.tsx
│  │  ├─ ReactionBar.tsx
│  │  ├─ ReactionSummary.tsx
│  │  └─ ReactionTrigger.tsx
│  ├─ rhetoric
│  │  ├─ EmotionBadge.tsx
│  │  ├─ FallacyBadge.tsx
│  │  ├─ FrameChips.tsx
│  │  ├─ MethodChip.tsx
│  │  ├─ MiniStructureBox.tsx
│  │  ├─ MixBadge.tsx
│  │  ├─ MixDebug.tsx
│  │  ├─ RhetoricContext.tsx
│  │  ├─ RhetoricControls.tsx
│  │  ├─ RhetoricHtml.tsx
│  │  ├─ RhetoricLensBlock.tsx
│  │  ├─ RhetoricText.tsx
│  │  ├─ SaveHighlights.tsx
│  │  ├─ SchemeCues.tsx
│  │  ├─ SourceQualityBadge.tsx
│  │  ├─ StyleDensityBadge.tsx
│  │  ├─ detect.ts
│  │  ├─ detectors.ts
│  │  ├─ lexiconAnalyzers.ts
│  │  ├─ lexicons
│  │  │  ├─ emotionLex.ts
│  │  │  ├─ framesLex.ts
│  │  │  └─ liwcLite.ts
│  │  ├─ nlpLite.ts
│  │  ├─ schemeSignals.ts
│  │  └─ styleStats.ts
│  ├─ rooms
│  │  ├─ RepresentationRuleSetting.tsx
│  │  ├─ RoomLogbookFeed.tsx
│  │  └─ useDecentraliseStatus.ts
│  ├─ shared
│  │  ├─ AboutTab.tsx
│  │  ├─ AuthProvider.tsx
│  │  ├─ Bottombar.tsx
│  │  ├─ CommentTree.tsx
│  │  ├─ DnDSidebar.tsx
│  │  ├─ FriendsTab.tsx
│  │  ├─ HamburgerMenu.tsx
│  │  ├─ LeftSidebar.tsx
│  │  ├─ MessagesTab.tsx
│  │  ├─ NodeSidebar.tsx
│  │  ├─ Pagination.tsx
│  │  ├─ Parabole-DisplayRegular.woff2
│  │  ├─ ProfileHeader.tsx
│  │  ├─ RealtimeFeed.tsx
│  │  ├─ RealtimePostsTab.tsx
│  │  ├─ RightSidebar.tsx
│  │  ├─ ScrollAnalytics.tsx
│  │  ├─ ScrollList.tsx
│  │  ├─ Searchbar.tsx
│  │  ├─ ThreadsTab.tsx
│  │  └─ Topbar.tsx
│  ├─ sheaf
│  │  ├─ AttachmentList.tsx
│  │  ├─ AudiencePickers.tsx
│  │  ├─ ConflictBanner.tsx
│  │  ├─ FacetChipBar.tsx
│  │  ├─ FacetEditor.tsx
│  │  ├─ FacetEditorTabs.tsx
│  │  ├─ SheafComposer.tsx
│  │  ├─ SheafFacetPills.tsx
│  │  ├─ SheafMessageBubble.tsx
│  │  ├─ ViewAsBar.tsx
│  │  └─ ViewAsMenu.tsx
│  ├─ stack
│  │  ├─ CommentComposer.tsx
│  │  ├─ SortablePdfGrid.tsx
│  │  └─ StackDiscussion.tsx
│  ├─ threejs
│  │  ├─ BackgroundCanvas.tsx
│  │  └─ backdropPlane
│  │     ├─ BackdropPlane.tsx
│  │     ├─ backdropPlane.frag
│  │     └─ backdropPlane.vert
│  ├─ ui
│  │  ├─ AnimatedDialog.tsx
│  │  ├─ Chip.tsx
│  │  ├─ FancyScroller.tsx
│  │  ├─ ScrollReveal.tsx
│  │  ├─ SkeletonB.tsx
│  │  ├─ accordion.tsx
│  │  ├─ alert.tsx
│  │  ├─ badge.tsx
│  │  ├─ button.tsx
│  │  ├─ card.tsx
│  │  ├─ chat-message.tsx
│  │  ├─ checkbox.tsx
│  │  ├─ collapsible.tsx
│  │  ├─ command.tsx
│  │  ├─ commenttextarea.tsx
│  │  ├─ dialog.tsx
│  │  ├─ dropdown-menu.tsx
│  │  ├─ form.tsx
│  │  ├─ input.tsx
│  │  ├─ label.tsx
│  │  ├─ markdown-content.tsx
│  │  ├─ multiselect.tsx
│  │  ├─ select.tsx
│  │  ├─ sheet.tsx
│  │  ├─ skeleton.tsx
│  │  ├─ slider.tsx
│  │  ├─ spinner-blue.tsx
│  │  ├─ spinner.tsx
│  │  ├─ switch.tsx
│  │  ├─ tabs.tsx
│  │  └─ textarea.tsx
│  ├─ views
│  │  ├─ SequentBadge.tsx
│  │  ├─ SequentDetails.tsx
│  │  ├─ useNliSequent.ts
│  │  └─ useSequentStatus.ts
│  ├─ work
│  │  ├─ ClaimCiteText.tsx
│  │  ├─ CompareAlternativesPanel.tsx
│  │  ├─ EvaluationSheet.tsx
│  │  ├─ PromoteSlotButton.tsx
│  │  ├─ SelectionPromoteBar.tsx
│  │  ├─ SupplyAuthoringInline.tsx
│  │  ├─ SupplyDrawer.tsx
│  │  ├─ WorkDetailClient.tsx
│  │  ├─ WorkHeaderBar.tsx
│  │  ├─ WorksList.tsx
│  │  ├─ WorksRail.tsx
│  │  └─ editors
│  │     ├─ DNThesesEditor.tsx
│  │     ├─ IHThesesEditor.tsx
│  │     ├─ OPThesesEditor.tsx
│  │     ├─ TCThesesEditor.tsx
│  │     └─ slot-helpers.ts
│  └─ workflow
│     ├─ CustomNodes.tsx
│     ├─ DynamicForm.tsx
│     ├─ IntegrationButtons.tsx
│     ├─ NewWorkflowClient.tsx
│     ├─ ScheduleForm.tsx
│     ├─ TemplatePicker.tsx
│     ├─ WorkflowBuilder.tsx
│     ├─ WorkflowExecutionContext.tsx
│     ├─ WorkflowRunner.tsx
│     ├─ WorkflowSidePanel.tsx
│     ├─ WorkflowViewer.tsx
│     └─ examples
│        ├─ CounterOutputExample.tsx
│        ├─ GmailFlowExample.tsx
│        ├─ RandomDataPlotExample.tsx
│        └─ TriggerButtonExample.tsx
├─ components.json
├─ config
│  ├─ chip_templates.json
│  ├─ explain_map.json
│  └─ flags.ts
├─ constants
│  └─ index.ts
├─ contexts
│  ├─ PrivateChatManager.tsx
│  └─ useChatStore.ts
├─ database
│  └─ migrations
│     ├─ 20250716_edge_logs.sql
│     ├─ 20250801_swapmeet_initial.sql
│     ├─ 20250802_swapmeet_offers_orders.sql
│     ├─ 20260101_lock_wallet.sql
│     ├─ 20260820_swapmeet_heatmap.sql
│     ├─ 20260901_swapmeet_images.sql
│     ├─ 20260921000000_add_stall_updated.sql
│     └─ 20261013000000_add_market_closed_at.sql
├─ docker-compose.yml
├─ docs
│  ├─ CHANGELOG.md
│  ├─ analytics.md
│  ├─ explainability.md
│  ├─ favorites_builder.md
│  ├─ feedback-swipes.md
│  ├─ integration_automation_notes.md
│  ├─ integrations.md
│  ├─ ranker.md
│  ├─ realtime-crdt.md
│  └─ workflows.md
├─ engine
│  └─ presets
│     └─ dialogical.ts
├─ fix-compare-modal.patch
├─ fix-comparison-modal.patch
├─ fonts
│  ├─ BugrinoTrials-Regular.otf
│  ├─ KaTeX_Script-Regular.woff2
│  ├─ KoloniaTrial-Regular.woff2
│  ├─ MediaanTrial-Regular.woff2
│  ├─ NewEdgeTest-RegularRounded.otf
│  ├─ Parabole-DisplayRegular.woff2
│  ├─ TestFoundersGroteskText-Regular.otf
│  ├─ inter-all-400-normal.4c1f8a0d.woff
│  └─ test-founders-grotesk-x-condensed-regular.woff2
├─ functions
│  └─ queueReembed
│     └─ index.ts
├─ hooks
│  ├─ useBooksmarks.ts
│  ├─ useConversationRealtime.ts
│  ├─ useGridNavigator.ts
│  ├─ useKeyPress.ts
│  ├─ useMarket.ts
│  ├─ useNotifications.ts
│  ├─ usePrivateChatSocket.ts
│  ├─ useReceipts.tsx
│  ├─ useSafeForward.ts
│  ├─ useSelectionRects.ts
│  ├─ useSheafPreview.ts
│  ├─ useStallPresence.ts
│  ├─ useStars.ts
│  └─ useUserInbox.ts
├─ infra
│  └─ aurora_media
│     ├─ main.tf
│     ├─ outputs.tf
│     └─ variables.tf
├─ integrations
│  ├─ AnalyticsIntegration.ts
│  ├─ GmailIntegration.ts
│  ├─ GoogleSheetsIntegration.ts
│  ├─ SlackIntegration.ts
│  └─ index.ts
├─ jest
│  └─ __mocks__
│     ├─ @pinecone-database
│     │  └─ pinecone-client-node.ts
│     └─ pg.ts
├─ jest.config.ts
├─ jest.setup.ts
├─ jobs
│  ├─ embed_retry_worker.ts
│  └─ favorites_builder.ts
├─ keys.txt
├─ lib
│  ├─ AuthContext.ts
│  ├─ MultiSelectFunctions.ts
│  ├─ actions
│  │  ├─ auction.server.ts
│  │  ├─ blocks.actions.ts
│  │  ├─ cart.server.ts
│  │  ├─ conversation.actions.ts
│  │  ├─ deepseek.actions.ts
│  │  ├─ feed.actions.ts
│  │  ├─ feed.client.ts
│  │  ├─ feedpost.actions.ts
│  │  ├─ follow.actions.ts
│  │  ├─ friend-suggestions.actions.ts
│  │  ├─ github.actions.ts
│  │  ├─ gmail.actions.ts
│  │  ├─ googleSheets.actions.ts
│  │  ├─ integration.actions.ts
│  │  ├─ like.actions.ts
│  │  ├─ llm.actions.ts
│  │  ├─ message.actions.ts
│  │  ├─ notification.actions.ts
│  │  ├─ offer.server.ts
│  │  ├─ offerCart.server.ts
│  │  ├─ poll.actions.ts
│  │  ├─ portfolio.actions.ts
│  │  ├─ prediction.actions.ts
│  │  ├─ productreview.actions.ts
│  │  ├─ realtimeedge.actions.ts
│  │  ├─ realtimepost.actions.ts
│  │  ├─ realtimeroom.actions.ts
│  │  ├─ recommendation.actions.ts
│  │  ├─ scheduledWorkflow.actions.ts
│  │  ├─ section.server.ts
│  │  ├─ sites.actions.ts
│  │  ├─ slack.actions.ts
│  │  ├─ stack.actions.ts
│  │  ├─ stall.server.ts
│  │  ├─ thread.actions.ts
│  │  ├─ user.actions.ts
│  │  ├─ userattributes.actions.ts
│  │  └─ workflow.actions.ts
│  ├─ activitypub
│  │  ├─ base.ts
│  │  ├─ deliver.ts
│  │  ├─ fanout.ts
│  │  ├─ keys.ts
│  │  └─ signing.ts
│  ├─ amplification
│  │  └─ log.ts
│  ├─ analytics
│  │  └─ upsertSectionPing.ts
│  ├─ argumentation
│  │  ├─ afEngine.ts
│  │  ├─ aif.ts
│  │  ├─ cqPresets.ts
│  │  ├─ cqSuggestions.ts
│  │  ├─ createClaimAttack.ts
│  │  ├─ criticalQuestions.ts
│  │  ├─ toAF.ts
│  │  ├─ vaf.ts
│  │  └─ weightedBAF.ts
│  ├─ article
│  │  ├─ text.ts
│  │  └─ wrapSections.ts
│  ├─ auth
│  │  ├─ normalize.ts
│  │  ├─ roles.ts
│  │  ├─ server.ts
│  │  ├─ serverUser.ts
│  │  └─ types.ts
│  ├─ auth.ts
│  ├─ bigintjson.ts
│  ├─ bus.ts
│  ├─ canonicalise.ts
│  ├─ ceg
│  │  ├─ grounded.ts
│  │  └─ mapWarrantUndercut.ts
│  ├─ chat
│  │  ├─ makePrivateRoomId.ts
│  │  ├─ permalink.ts
│  │  ├─ roomId.ts
│  │  └─ roomKey.ts
│  ├─ components
│  │  └─ CanvasRenderer.tsx
│  ├─ connections
│  │  ├─ client.ts
│  │  └─ service.ts
│  ├─ cq
│  │  └─ guardReason.ts
│  ├─ crypto
│  │  ├─ encryption.ts
│  │  ├─ mergeReceipt.ts
│  │  └─ sha256.ts
│  ├─ dedupeVenues.ts
│  ├─ deepdive
│  │  ├─ af.ts
│  │  ├─ claimEdgeHelpers.ts
│  │  ├─ invalidate.ts
│  │  ├─ selection.ts
│  │  └─ upsert.ts
│  ├─ deepseekclient.ts
│  ├─ definitions.ts
│  ├─ dialogue
│  │  ├─ legalAttacks.ts
│  │  ├─ legalMoves.ts
│  │  ├─ signature.ts
│  │  └─ winningness.ts
│  ├─ diff
│  │  ├─ diffWords.ts
│  │  └─ wordDiff.ts
│  ├─ entropy
│  │  ├─ server.ts
│  │  └─ utils.ts
│  ├─ espSessionStore.ts
│  ├─ export
│  │  └─ aif.ts
│  ├─ firebase
│  │  ├─ config.ts
│  │  └─ firebase.ts
│  ├─ gitchat
│  │  └─ policies.ts
│  ├─ governance
│  │  └─ writers.ts
│  ├─ graph
│  │  └─ supplyOverlay.ts
│  ├─ hooks
│  │  ├─ useCreateFeedPost.ts
│  │  ├─ useCreateLibraryPost.ts
│  │  ├─ useInfiniteRealtimePosts.ts
│  │  ├─ useOfferStream.ts
│  │  ├─ usePartyPresence.ts
│  │  ├─ useScrollAnalytics.ts
│  │  └─ useSession.ts
│  ├─ ids
│  │  ├─ canonicalize.ts
│  │  ├─ mintMoid.ts
│  │  └─ urn.ts
│  ├─ image.ts
│  ├─ integrationLoader.ts
│  ├─ integrations
│  │  └─ types.ts
│  ├─ items.client.ts
│  ├─ jwtHelpers.ts
│  ├─ kv.ts
│  ├─ limiter.ts
│  ├─ models
│  │  ├─ migrations
│  │  │  ├─ 20240626190000_add_follow.sql
│  │  │  ├─ 20240716190000_add_post_expiration.sql
│  │  │  ├─ 20240806000000_group_chat_attachments
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20240807000000_add_library_post.sql
│  │  │  ├─ 2025-08-25-deliberation-rls.sql
│  │  │  ├─ 20250704000000_add_transition_version.sql
│  │  │  ├─ 20250705000000_create_integrations.sql
│  │  │  ├─ 20250705023203_julyfour
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20250713000000_add_music_post_type.sql
│  │  │  ├─ 20250714000000_fix_fkey.sql
│  │  │  ├─ 20250801000000_add_archived_realtime_posts
│  │  │  ├─ 20250801000000_add_archived_realtime_posts.sql
│  │  │  ├─ 20250815000000_add_canonical_media
│  │  │  ├─ 20250815000000_add_canonical_media.sql
│  │  │  ├─ 20250901000000_add_linked_accounts.sql
│  │  │  ├─ 20250916000000_add_notifications
│  │  │  ├─ 20250916000000_add_notifications.sql
│  │  │  ├─ 20250920000000_create_telemetry.sql
│  │  │  ├─ 20250921000000_add_stall_image_position.sql
│  │  │  ├─ 20250926000000_add_room_canvas
│  │  │  ├─ 20250926000000_add_room_canvas.sql
│  │  │  ├─ 20251001000000_add_prediction_market.sql
│  │  │  ├─ 20251002000000_extend_notifications_prediction.sql
│  │  │  ├─ 20251101000000_add_cart_escrow.sql
│  │  │  ├─ 20251115000000_add_caption.sql
│  │  │  ├─ 20251201000000_add_post_expiration_all.sql
│  │  │  ├─ lib
│  │  │  │  └─ models
│  │  │  │     └─ migrations
│  │  │  │        └─ 20251201000000_add_room_shards.sql
│  │  │  └─ migration_lock.toml
│  │  └─ schema.prisma
│  ├─ nl.ts
│  ├─ nli
│  │  ├─ adapter.ts
│  │  ├─ adjucator.ts
│  │  └─ aggregateSequent.ts
│  ├─ parsejsonhelper.ts
│  ├─ payouts.server.ts
│  ├─ permissions
│  │  └─ canEditWork.ts
│  ├─ pineconeClient.ts
│  ├─ pluginImporters.ts
│  ├─ pluginLoader.ts
│  ├─ polyLineMidpoint.ts
│  ├─ portfolio
│  │  ├─ CanvasStoreProvider.tsx
│  │  ├─ canvasStore.ts
│  │  ├─ datasource.ts
│  │  ├─ export.ts
│  │  ├─ lint.ts
│  │  ├─ mapping.ts
│  │  ├─ registry.tsx
│  │  ├─ selection.ts
│  │  ├─ templates.ts
│  │  ├─ transformers.ts
│  │  └─ types.ts
│  ├─ practical
│  │  ├─ compute.ts
│  │  └─ mcda.ts
│  ├─ prediction
│  │  ├─ lmsr.ts
│  │  └─ tradePreview.ts
│  ├─ prisma-cli.ts
│  ├─ prismaclient.ts
│  ├─ queue.ts
│  ├─ reactflow
│  │  ├─ reactflowutils.ts
│  │  ├─ store.ts
│  │  └─ types.ts
│  ├─ realtime
│  │  └─ broadcast.ts
│  ├─ receipts
│  │  ├─ hash.ts
│  │  ├─ jcs.ts
│  │  ├─ sign.ts
│  │  └─ verify.ts
│  ├─ redis.ts
│  ├─ registerDefaultWorkflowActions.ts
│  ├─ registerDefaultWorkflowTriggers.ts
│  ├─ registerIntegrationActions.ts
│  ├─ registerIntegrationTriggerTypes.ts
│  ├─ registerIntegrationTriggers.ts
│  ├─ repostPolicy.ts
│  ├─ represent
│  │  └─ coverSet.ts
│  ├─ rhetoric
│  │  ├─ fallacies.ts
│  │  ├─ mlMini.ts
│  │  └─ sourceQuality.ts
│  ├─ screenshot.ts
│  ├─ semantics
│  │  └─ lfHints.ts
│  ├─ server
│  │  ├─ briefs.ts
│  │  ├─ getUser.ts
│  │  ├─ getUserFromReq.pages.ts
│  │  ├─ pagination.ts
│  │  ├─ resolveRoom.ts
│  │  ├─ stack-helpers.ts
│  │  └─ timing.ts
│  ├─ serverutils.ts
│  ├─ settings
│  │  ├─ schema.ts
│  │  └─ service.ts
│  ├─ sheaf
│  │  ├─ conflict.ts
│  │  ├─ resolveQuote.ts
│  │  └─ visibility.ts
│  ├─ slug.ts
│  ├─ socket.ts
│  ├─ sorters.ts
│  ├─ spotify.ts
│  ├─ spotifyClient.ts
│  ├─ spotifyServer.ts
│  ├─ sse.ts
│  ├─ stateMachine.ts
│  ├─ storage
│  │  ├─ constants.ts
│  │  └─ uploadAttachment.ts
│  ├─ stores
│  │  └─ cart.ts
│  ├─ stripe.ts
│  ├─ supabase-browser.ts
│  ├─ supabase-server.ts
│  ├─ supabase.ts
│  ├─ supabaseAdmin.ts
│  ├─ supabaseclient.ts
│  ├─ text
│  │  ├─ mentions.ts
│  │  └─ urls.ts
│  ├─ tiptap
│  │  ├─ extensions
│  │  │  ├─ FancyTextStyle.ts
│  │  │  ├─ ParagraphKeepEmptySSR.ts
│  │  │  ├─ block-move.ts
│  │  │  ├─ block-style-ssr.ts
│  │  │  ├─ code-tab.ts
│  │  │  ├─ font-family.ts
│  │  │  ├─ font-size.ts
│  │  │  ├─ indent.ts
│  │  │  ├─ quick-link.ts
│  │  │  ├─ sectionBreak.ts
│  │  │  ├─ shared.ts
│  │  │  ├─ ssr-text-align.ts
│  │  │  └─ text-style-ssr.ts
│  │  └─ extensions.ts
│  ├─ topology
│  │  ├─ affinityClusters.ts
│  │  ├─ bridgeSuggest.ts
│  │  └─ topicClusters.ts
│  ├─ transform
│  │  └─ post.ts
│  ├─ twoTower.ts
│  ├─ types
│  │  ├─ argument.ts
│  │  ├─ post.ts
│  │  └─ prediction.ts
│  ├─ unfurl.ts
│  ├─ union.ts
│  ├─ uploadItemImage.ts
│  ├─ uploadthing.ts
│  ├─ uploadthumbnail.ts
│  ├─ useSession.ts
│  ├─ utils
│  │  ├─ authz.ts
│  │  ├─ escape.ts
│  │  └─ validators.ts
│  ├─ utils.ts
│  ├─ validations
│  │  ├─ stall.ts
│  │  ├─ thread.ts
│  │  └─ user.ts
│  ├─ workflow
│  │  ├─ bootstrap.server.ts
│  │  ├─ registry.compat.ts
│  │  ├─ registry.defaults.ts
│  │  ├─ registry.ts
│  │  ├─ runner.ts
│  │  ├─ types.ts
│  │  └─ vars.ts
│  ├─ workflowActions.ts
│  ├─ workflowAnalytics.ts
│  ├─ workflowExecutor.ts
│  ├─ workflowScheduler.ts
│  ├─ workflowSocketRunner.ts
│  ├─ workflowTriggers.ts
│  └─ zod-schemas.ts
├─ ludics-documents
│  ├─ Dialogical-Particle-and-Structural-Rules.md
│  ├─ LocusSolum_Quickstart_Parts1-9.md
│  ├─ LocusSolum_Quickstart_Parts1-9.pdf
│  ├─ Ludics_CheatSheet_Card.pdf
│  ├─ Ludics_Glossary_Complete.md
│  ├─ Ludics_Glossary_Complete.pdf
│  ├─ dialogical-logic-sep.md
│  ├─ engine-presets-dialogical.md
│  └─ ludics_roadmap.md
├─ mesh-lite
│  ├─ api
│  │  ├─ Dockerfile
│  │  ├─ package.json
│  │  ├─ prisma
│  │  │  └─ schema.prisma
│  │  ├─ server.ts
│  │  └─ tsconfig.json
│  ├─ docker-compose.yml
│  └─ import.sh
├─ middleware.ts
├─ ml
│  └─ offline_train_ranker.py
├─ next.config.mjs
├─ nodemon.json
├─ osc.d.ts
├─ package.json
├─ packages
│  ├─ af
│  │  └─ semantics.ts
│  ├─ analysis
│  │  └─ rsa.ts
│  ├─ components
│  │  ├─ DialBadge.tsx
│  │  └─ RSAChip.tsx
│  ├─ dialogue
│  │  └─ computeLegalMoves.ts
│  ├─ entail
│  │  └─ dialogical.ts
│  ├─ halfway-utils
│  │  └─ groupAlgorithm.ts
│  ├─ hooks
│  │  ├─ useDialecticStats.ts
│  │  ├─ useRSA.ts
│  │  └─ useRSABatch.ts
│  ├─ ludics-core
│  │  ├─ errors.ts
│  │  ├─ paths.ts
│  │  └─ types.ts
│  ├─ ludics-engine
│  │  ├─ __tests__
│  │  │  └─ compose.preflight.test.ts
│  │  ├─ appendActs.ts
│  │  ├─ checkOrthogonal.ts
│  │  ├─ commitments.ts
│  │  ├─ compileFromMoves.ts
│  │  ├─ compose.ts
│  │  ├─ concession.ts
│  │  ├─ copy.ts
│  │  ├─ daimon.ts
│  │  ├─ decisive.ts
│  │  ├─ delocate.ts
│  │  ├─ detect-collisions.ts
│  │  ├─ fax.ts
│  │  ├─ faxClone.ts
│  │  ├─ hooks.ts
│  │  ├─ judge.ts
│  │  ├─ locks.ts
│  │  ├─ orthogonal.ts
│  │  ├─ plugins
│  │  │  └─ nli.ts
│  │  ├─ policies.ts
│  │  ├─ saturation.ts
│  │  ├─ stepper.ts
│  │  ├─ testers.ts
│  │  ├─ uniformity.ts
│  │  └─ visibility.ts
│  ├─ ludics-react
│  │  ├─ ActInspector.tsx
│  │  ├─ CommitmentsPanel.tsx
│  │  ├─ DefenseTree.tsx
│  │  ├─ JudgeConsole.tsx
│  │  ├─ LociTree.tsx
│  │  ├─ TraceRibbon.tsx
│  │  └─ mergeDesignsToTree.ts
│  ├─ ludics-rest
│  │  └─ zod.ts
│  ├─ server
│  │  ├─ src
│  │  │  └─ prediction
│  │  │     └─ service.ts
│  │  └─ tests
│  │     ├─ lmsr.test.ts
│  │     ├─ market.flow.test.ts
│  │     └─ security.test.ts
│  ├─ sheaf-acl
│  │  ├─ dist
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ acl.ts
│  │  │  ├─ index.ts
│  │  │  └─ types.ts
│  │  ├─ test
│  │  │  └─ acl.spec.ts
│  │  └─ tsconfig.json
│  └─ ui
│     ├─ useAsyncButton.ts
│     └─ useMicroToast.tsx
├─ pages
│  └─ api
│     ├─ articles
│     ├─ socket
│     │  └─ io.ts
│     └─ y
│        └─ [docId].ts
├─ patch-file.patch
├─ pivotDocs
│  ├─ PivotV2Refactor.md
│  ├─ PivotV2Report.md
│  └─ PivotV2SRS.md
├─ playwright.config.ts
├─ plugins
│  ├─ .SplineViewerNode.tsx.swp
│  ├─ CounterNode.tsx
│  ├─ HelloNode.tsx
│  ├─ PdfViewerNode.tsx
│  └─ SplineViewerNode.tsx
├─ postcss.config.mjs
├─ pr.patch
├─ prisma
│  ├─ brief-seed.ts
│  ├─ migrations
│  │  ├─ 20240805000000_add_article_revision.sql
│  │  ├─ 20240806000000_group_chat_attachments.sql
│  │  ├─ 20240807000000_add_library_post.sql
│  │  ├─ add_wallet_lock.sql
│  │  └─ init_settings.sql
│  ├─ models
│  │  └─ Room.prisma
│  └─ scripts
│     ├─ backfillParticipants.ts
│     └─ sheaf-seed.ts
├─ prisma.config.ts
├─ protos
│  └─ ranker.proto
├─ public
│  ├─ assets
│  │  ├─ 3D-print-mesh.svg
│  │  ├─ CursorSVG.tsx
│  │  ├─ add--alt.svg
│  │  ├─ add--child-node.svg
│  │  ├─ add--parent-node.svg
│  │  ├─ add-comment.svg
│  │  ├─ add-image.svg
│  │  ├─ alarm--add.svg
│  │  ├─ alert-circle.svg
│  │  ├─ annotation-visibility.svg
│  │  ├─ apps.svg
│  │  ├─ attachment.svg
│  │  ├─ barcode.svg
│  │  ├─ barrier.svg
│  │  ├─ blog.svg
│  │  ├─ bookmark--add.svg
│  │  ├─ branch.svg
│  │  ├─ caret--left.svg
│  │  ├─ caret--right.svg
│  │  ├─ carousel.svg
│  │  ├─ chart--bullet.svg
│  │  ├─ chart--point.svg
│  │  ├─ chat--launch.svg
│  │  ├─ checkbox--checked--filled.svg
│  │  ├─ checkbox--checked.svg
│  │  ├─ checkbox.svg
│  │  ├─ chevron--left.svg
│  │  ├─ chevron--right.svg
│  │  ├─ chevron--up--outline.svg
│  │  ├─ circle--filled.svg
│  │  ├─ circle-stroke.svg
│  │  ├─ clock-cross.svg
│  │  ├─ clock-plus.svg
│  │  ├─ clock.svg
│  │  ├─ collaborate.svg
│  │  ├─ community.svg
│  │  ├─ compass.svg
│  │  ├─ create-new.svg
│  │  ├─ create.svg
│  │  ├─ crop.svg
│  │  ├─ dashboard--reference.svg
│  │  ├─ dashboard.svg
│  │  ├─ data-blob.svg
│  │  ├─ data-table.svg
│  │  ├─ decision-node.svg
│  │  ├─ delete-animated.svg
│  │  ├─ delete-static.svg
│  │  ├─ delete.svg
│  │  ├─ delivery--add.svg
│  │  ├─ development.svg
│  │  ├─ document--add.svg
│  │  ├─ document--comment.svg
│  │  ├─ dot-mark-black.svg
│  │  ├─ dot-mark.svg
│  │  ├─ downstream.svg
│  │  ├─ earth--filled.svg
│  │  ├─ edit-animated.svg
│  │  ├─ edit-static.svg
│  │  ├─ edit.svg
│  │  ├─ events (1).svg
│  │  ├─ expand-all.svg
│  │  ├─ face--activated--add (1).svg
│  │  ├─ face--add (1).svg
│  │  ├─ face--dissatisfied--filled.svg
│  │  ├─ face--dissatisfied.svg
│  │  ├─ face--neutral--filled.svg
│  │  ├─ face--neutral.svg
│  │  ├─ face--satisfied--filled.svg
│  │  ├─ face--satisfied-white.svg
│  │  ├─ face--satisfied.svg
│  │  ├─ face--wink--filled.svg
│  │  ├─ face--wink.svg
│  │  ├─ file (2).svg
│  │  ├─ flow--connection.svg
│  │  ├─ flow.svg
│  │  ├─ fonts
│  │  │  ├─ BugrinoTrials-Regular.otf
│  │  │  ├─ KaTeX_Script-Regular.woff2
│  │  │  ├─ KoloniaTrial-Regular.woff2
│  │  │  ├─ MediaanTrial-Regular.woff2
│  │  │  ├─ NewEdgeTest-RegularRounded.otf
│  │  │  ├─ Parabole-DisplayRegular.woff2
│  │  │  ├─ TestFoundersGroteskText-Regular.otf
│  │  │  ├─ foundersgrotesk.woff2
│  │  │  ├─ inter-all-400-normal.4c1f8a0d.woff
│  │  │  └─ test-founders-grotesk-x-condensed-regular.woff2
│  │  ├─ foundersgrotesk.woff2
│  │  ├─ frown-static.svg
│  │  ├─ frown.svg
│  │  ├─ gateway.svg
│  │  ├─ group (1).svg
│  │  ├─ group--access.svg
│  │  ├─ group--resource.svg
│  │  ├─ group.svg
│  │  ├─ gui.svg
│  │  ├─ heart-filled.svg
│  │  ├─ heart-gray.svg
│  │  ├─ heart-helsinki.svg
│  │  ├─ heart.svg
│  │  ├─ heat-map--03.svg
│  │  ├─ home-helsinki.svg
│  │  ├─ home.svg
│  │  ├─ ibm--elo--publishing.svg
│  │  ├─ ibm--lpa.svg
│  │  ├─ ibm-cloud-pak--MANTA-automated-data-lineage.svg
│  │  ├─ image.svg
│  │  ├─ info-circle.svg
│  │  ├─ inventory-management.svg
│  │  ├─ lasso.svg
│  │  ├─ launch.svg
│  │  ├─ layers--external.svg
│  │  ├─ layers.svg
│  │  ├─ leftarrow.svg
│  │  ├─ link.svg
│  │  ├─ location--heart.svg
│  │  ├─ location--info.svg
│  │  ├─ location--person.svg
│  │  ├─ location--star.svg
│  │  ├─ location.svg
│  │  ├─ lock.svg
│  │  ├─ locked.svg
│  │  ├─ login (1).svg
│  │  ├─ login.svg
│  │  ├─ logo-black.svg
│  │  ├─ logo-white.svg
│  │  ├─ logo.svg
│  │  ├─ logout (1).svg
│  │  ├─ logout-ibm.svg
│  │  ├─ logout.svg
│  │  ├─ map.svg
│  │  ├─ members.svg
│  │  ├─ menu-hamburger.svg
│  │  ├─ merge-node.svg
│  │  ├─ message-queue.svg
│  │  ├─ microphone--filled.svg
│  │  ├─ microphone.svg
│  │  ├─ minimize.svg
│  │  ├─ model-builder.svg
│  │  ├─ more.svg
│  │  ├─ multiple-users.svg
│  │  ├─ network--1.svg
│  │  ├─ network--2.svg
│  │  ├─ new-tab.svg
│  │  ├─ notification--new.svg
│  │  ├─ notification.svg
│  │  ├─ notifications-none.svg
│  │  ├─ overflow-menu--horizontal.svg
│  │  ├─ overflow-menu--vertical.svg
│  │  ├─ pause--filled.svg
│  │  ├─ pause--outline.svg
│  │  ├─ pause.svg
│  │  ├─ pivot.svg
│  │  ├─ pivotgame.svg
│  │  ├─ play--filled--alt.svg
│  │  ├─ play--outline--filled.svg
│  │  ├─ play--outline.svg
│  │  ├─ play.svg
│  │  ├─ plus-circle.svg
│  │  ├─ posts.svg
│  │  ├─ process (1).svg
│  │  ├─ process.svg
│  │  ├─ profile.svg
│  │  ├─ question-circle.svg
│  │  ├─ radio-button--checked.svg
│  │  ├─ redo.svg
│  │  ├─ repeat.svg
│  │  ├─ replicate.svg
│  │  ├─ reply--all.svg
│  │  ├─ reply.svg
│  │  ├─ repost.svg
│  │  ├─ request.svg
│  │  ├─ restart.svg
│  │  ├─ review (1).svg
│  │  ├─ review.svg
│  │  ├─ rightarrow.svg
│  │  ├─ robot.svg
│  │  ├─ roughlogo.svg
│  │  ├─ rss.svg
│  │  ├─ run.svg
│  │  ├─ save.svg
│  │  ├─ schematics.svg
│  │  ├─ search-gray.svg
│  │  ├─ search-helsinki.svg
│  │  ├─ search.svg
│  │  ├─ send (2).svg
│  │  ├─ send--alt--filled.svg
│  │  ├─ send--alt.svg
│  │  ├─ settings.svg
│  │  ├─ share.svg
│  │  ├─ shopping--cart--arrow-down.svg
│  │  ├─ shopping--cart--plus.svg
│  │  ├─ signin-helsinki.svg
│  │  ├─ signout-helsinki.svg
│  │  ├─ star-fill.svg
│  │  ├─ star.svg
│  │  ├─ stop--filled.svg
│  │  ├─ stop--outline--filled.svg
│  │  ├─ stop--outline.svg
│  │  ├─ stop.svg
│  │  ├─ strategy-play.svg
│  │  ├─ tag.svg
│  │  ├─ text--creation.svg
│  │  ├─ texture.jpg
│  │  ├─ time.svg
│  │  ├─ trash-can.svg
│  │  ├─ triangle--down--outline.svg
│  │  ├─ triangle--down--solid.svg
│  │  ├─ triangle--outline.svg
│  │  ├─ triangle--solid.svg
│  │  ├─ triangle-down-filled.svg
│  │  ├─ triangle-down-stroke.svg
│  │  ├─ triangle-up-filled.svg
│  │  ├─ triangle-up-stroke.svg
│  │  ├─ undo.svg
│  │  ├─ unlock.svg
│  │  ├─ unlocked.svg
│  │  ├─ upload.svg
│  │  ├─ user--avatar.svg
│  │  ├─ user--feedback.svg
│  │  ├─ user-circle.svg
│  │  ├─ user-helsinki.svg
│  │  ├─ user.svg
│  │  ├─ video--add.svg
│  │  ├─ video.svg
│  │  ├─ view--off.svg
│  │  ├─ view-next.svg
│  │  ├─ view.svg
│  │  └─ workspace.svg
│  ├─ fonts
│  │  ├─ BugrinoTrials-Regular.otf
│  │  ├─ KaTeX_Script-Regular.woff2
│  │  ├─ KoloniaTrial-Regular.woff2
│  │  ├─ MediaanTrial-Regular.woff2
│  │  ├─ NewEdgeTest-RegularRounded.otf
│  │  ├─ Parabole-DisplayRegular.woff2
│  │  ├─ foundersgrotesk.woff2
│  │  ├─ inter-all-400-normal.4c1f8a0d.woff
│  │  └─ test-founders-grotesk-x-condensed-regular.woff2
│  ├─ locales
│  │  └─ en
│  │     └─ editor.json
│  ├─ pdf.worker.min.mjs
│  ├─ pivot
│  │  └─ 4letter.txt
│  ├─ placeholder-stall.svg
│  └─ schematics.svg
├─ requirements.txt
├─ scripts
│  ├─ backfill-block-thumbnails.ts
│  ├─ backfill-dialogue-signatures.ts
│  ├─ closeMarkets.ts
│  ├─ debugTaste.ts
│  ├─ enqueueTaste.ts
│  ├─ entailment-fracas-smoke.ts
│  ├─ gen-ed25519.ts
│  ├─ generate-room-baseline.ts
│  ├─ generateEmbeddings.ts
│  ├─ gmail-token.ts
│  ├─ google-sheets-token.ts
│  ├─ knnHealthCheck.ts
│  ├─ loadtest.js
│  ├─ ludics-contract-seed.ts
│  ├─ ludics-converge-now.ts
│  ├─ ludics-fixtures.ts
│  ├─ ludics-legal-seed.ts
│  ├─ ludics-legal-verify.ts
│  ├─ ludics-qa.ts
│  ├─ ludicsLegalSeed.ts
│  ├─ mockEmbeddings.ts
│  ├─ mockSpotifyRaw.ts
│  ├─ run_fav_builder.ts
│  ├─ seed-agora-super.ts
│  ├─ seed-deliberation-all.ts
│  ├─ seed-demo-deliberation.ts
│  ├─ seed-metrovale.ts
│  ├─ seed-theory-ludics-pipeline.ts
│  ├─ seed.ts
│  ├─ seed_cmd.ts
│  └─ sheaf-seed.ts
├─ server
│  ├─ billing
│  │  └─ stripe.ts
│  ├─ cdc
│  │  └─ emitter.ts
│  ├─ config
│  │  └─ flags.ts
│  ├─ db
│  │  └─ tenant.ts
│  ├─ export
│  │  ├─ manifest.ts
│  │  ├─ pack.ts
│  │  ├─ pgdump.ts
│  │  └─ s3walk.ts
│  ├─ jobs
│  │  ├─ copy
│  │  │  ├─ index.ts
│  │  │  ├─ media.ts
│  │  │  ├─ plan.conversation.ts
│  │  │  ├─ plan.realtime.ts
│  │  │  ├─ sql.ts
│  │  │  └─ types.ts
│  │  ├─ decentralise.worker.ts
│  │  ├─ queues.ts
│  │  └─ usageMeter.ts
│  ├─ metrics
│  │  └─ pool.ts
│  ├─ provisioner
│  │  ├─ db.ts
│  │  ├─ kms.ts
│  │  ├─ orchestrate.ts
│  │  └─ s3.ts
│  ├─ rooms
│  │  └─ dao.ts
│  └─ trust
│     ├─ receipt.ts
│     └─ sign.ts
├─ services
│  ├─ __init__.py
│  ├─ embedding
│  │  ├─ Dockerfile.dev
│  │  ├─ README.md
│  │  ├─ __init__.py
│  │  ├─ docker-compose.yml
│  │  ├─ grpc
│  │  │  ├─ __init__.py
│  │  │  ├─ embedder_pb2.py
│  │  │  └─ embedder_pb2_grpc.py
│  │  ├─ grpc_server.py
│  │  ├─ main.py
│  │  ├─ model.py
│  │  ├─ poetry.lock
│  │  ├─ proto
│  │  │  └─ embedder.proto
│  │  ├─ pyproject.toml
│  │  └─ tests
│  │     ├─ test_embed.py
│  │     └─ test_health.py
│  ├─ embedding-svc
│  │  ├─ Dockerfile
│  │  ├─ app.py
│  │  ├─ embedding_pb2.py
│  │  ├─ embedding_pb2_grpc.py
│  │  ├─ k8s-deployment.yaml
│  │  ├─ protos
│  │  │  └─ embedding.proto
│  │  ├─ requirements.txt
│  │  └─ tests
│  │     └─ test_embed.py
│  ├─ explainer
│  │  ├─ explain.py
│  │  ├─ feature_map.json
│  │  └─ model.txt
│  ├─ feature-store
│  │  ├─ Dockerfile
│  │  ├─ data
│  │  │  └─ user_stats.parquet
│  │  ├─ feature_repo.py
│  │  ├─ feature_store.yaml
│  │  ├─ k8s-deployment.yaml
│  │  ├─ requirements.txt
│  │  └─ tests
│  │     └─ test_ingest_retrieve.py
│  ├─ meta
│  │  ├─ cache.ts
│  │  ├─ index.ts
│  │  ├─ musicbrainz.ts
│  │  ├─ openlibrary.ts
│  │  ├─ tmdb.ts
│  │  └─ types.ts
│  ├─ ranker
│  │  ├─ Dockerfile
│  │  ├─ __init__.py
│  │  ├─ feature_fetcher.py
│  │  ├─ main.py
│  │  ├─ pyproject.toml
│  │  ├─ ranker_pb2.py
│  │  ├─ ranker_pb2_grpc.py
│  │  ├─ server.py
│  │  └─ tests
│  │     ├─ __init__.py
│  │     ├─ test_lgbm_ranking.py
│  │     └─ test_rank_contract.py
│  └─ swapmeet-api
│     ├─ README.md
│     ├─ package.json
│     └─ src
│        ├─ __tests__
│        │  └─ heatmap.test.ts
│        ├─ heatmap.ts
│        ├─ index.ts
│        ├─ section.ts
│        └─ stall.ts
├─ shader.d.ts
├─ spotify
│  └─ callback
│     └─ page.tsx
├─ sql
│  ├─ room_baseline.sql
│  └─ taste_neighbours.sql
├─ supabase
│  ├─ .branches
│  │  └─ _current_branch
│  ├─ .temp
│  │  ├─ cli-latest
│  │  ├─ gotrue-version
│  │  ├─ pooler-url
│  │  ├─ postgres-version
│  │  ├─ project-ref
│  │  ├─ rest-version
│  │  └─ storage-version
│  ├─ config.toml
│  ├─ database-supabase.ts
│  ├─ functions
│  │  ├─ fetch_meta
│  │  │  └─ index.ts
│  │  └─ pdf-thumb
│  │     └─ index.ts
│  └─ migrations
│     ├─ 20250713_enable_pgvector.sql
│     ├─ 20250714125959_create_user_attributes.sql
│     ├─ 20250715095500_create_user_attributes_notify_fn.sql
│     ├─ 20250715100000_recreate_user_attributes_trigger.sql
│     ├─ 20250716_user_attributes_trigger.sql
│     ├─ 20250717_create_scroll_events.sql
│     ├─ 20250720_drop_auth_fks.sql
│     ├─ 20250722_add_user_attr_columns.sql
│     ├─ 20250801000000_swapmeet_initial.sql
│     ├─ 20250802000000_swapmeet_offers_orders.sql
│     ├─ 20250815000000_add_canonical_media.sql
│     ├─ 20250901000000_add_linked_accounts.sql
│     ├─ 20250915000000_create_scroll_events_v2.sql
│     ├─ 20251016000000_create_portfolio_pages.sql
│     ├─ 20251017000000_create_user_similarity_knn.sql
│     ├─ 20260101000000_lock_wallet.sql
│     ├─ 20260110000000_swapmeet_section.sql
│     ├─ 20260510000000_swapmeet_stall.sql
│     ├─ 20260820000000_swapmeet_heatmap.sql
│     ├─ 20260901000000_swapmeet_images.sql
│     ├─ 20260902000000_add_owner_to_stall.sql
│     ├─ 20260921000000_add_stall_updated.sql
│     ├─ 20260923000000_add_doc_to_stall.sql
│     ├─ 20261013000000_add_market_closed_at.sql
│     └─ _archive
│        └─ 20250717_fix_uuid_types.sql
├─ tailwind.config.ts
├─ templates
│  ├─ analytics-dashboard.json
│  ├─ click-counter.json
│  └─ conditional-branch.json
├─ tests
│  ├─ __snapshots__
│  │  └─ portfolio-export.test.ts.snap
│  ├─ adapters.contract.spec.ts
│  ├─ analyticsWorkflow.test.ts
│  ├─ api
│  │  └─ test_embed.py
│  ├─ articles.api.test.ts
│  ├─ canonicalise.test.ts
│  ├─ chip.test.tsx
│  ├─ conversation.actions.test.ts
│  ├─ discovery-candidates.integration.test.ts
│  ├─ embed_dlq.test.ts
│  ├─ embed_route.integration.test.ts
│  ├─ embed_route.test.ts
│  ├─ embed_worker.integration.test.ts
│  ├─ explain_api.test.ts
│  ├─ explain_integration.test.ts
│  ├─ favorites_builder.test.ts
│  ├─ feature_store.test.ts
│  ├─ fetch_meta.unit.spec.ts
│  ├─ friend-suggestions.test.ts
│  ├─ groupAlgorithm.test.ts
│  ├─ integrationLoader.test.ts
│  ├─ listWorkflows.test.ts
│  ├─ llm-chaining.integration.test.ts
│  ├─ lmsr.test.ts
│  ├─ manual
│  │  ├─ audio-node.md
│  │  └─ livekit-audio-recording.md
│  ├─ notifications.api.test.ts
│  ├─ pivotGenerator.test.ts
│  ├─ pluginConvert.test.ts
│  ├─ pluginLoader.test.ts
│  ├─ pluginRuntime.test.ts
│  ├─ portfolio-export.test.ts
│  ├─ postgresVector.test.ts
│  ├─ prediction
│  │  ├─ createMarket.spec.ts
│  │  ├─ lmsr.test.ts
│  │  ├─ resolve-ui.e2e.ts
│  │  ├─ resolve.e2e.ts
│  │  └─ tradeAndResolve.spec.ts
│  ├─ prediction.service.test.ts
│  ├─ redisCache.test.ts
│  ├─ registerDefaultWorkflowActions.test.ts
│  ├─ registerIntegrationTriggers.test.ts
│  ├─ seed_cmd.integration.test.ts
│  ├─ spotify.test.ts
│  ├─ stateMachine.test.ts
│  ├─ test_cron_integrity.py
│  ├─ tradePreview.test.ts
│  ├─ union.test.ts
│  ├─ upsertUserAttributes.test.ts
│  ├─ visibility-metrics.test.ts
│  ├─ walletLock.test.ts
│  ├─ workflowActions.integration.test.ts
│  ├─ workflowBuilder.test.tsx
│  ├─ workflowExecution.test.ts
│  ├─ workflowRunner.test.tsx
│  └─ workflowTriggers.test.ts
├─ tools
│  └─ verifier-cli
│     └─ index.ts
├─ tsconfig.jest.json
├─ tsconfig.json
├─ tsconfig.scripts.json
├─ types
│  ├─ comments.ts
│  ├─ osc.d.ts
│  └─ poll.ts
├─ util
│  ├─ postgresVector.ts
│  └─ taste.ts
├─ vercel.json
└─ workers
   ├─ candidate-builder.ts
   ├─ cron.ts
   ├─ index.ts
   ├─ reembed.ts
   ├─ reembedFromSpotify.ts
   ├─ scrollRealtime.ts
   ├─ sectionHeat.ts
   ├─ spotifyIngest.ts
   ├─ tasteVector.ts
   ├─ tokenRefresh.ts
   └─ user-knn-builder.ts

```
```
mesh
├─ -a
├─ -p
├─ .editorconfig
├─ .eslintrc.json
├─ .next
│  ├─ app-build-manifest.json
│  ├─ build-manifest.json
│  ├─ cache
│  │  ├─ fetch-cache
│  │  │  └─ tags-manifest.json
│  │  ├─ images
│  │  │  ├─ 0+dKhXVzl7Mnu8AsdUZYiCR0gLT4kidU9hsQGeJNv6g=
│  │  │  │  └─ 86400.1758658679851.m+f2F1tuAZn0Q-p55GeaZSxCLg6L2Kk-YuKaslyLwkw=.webp
│  │  │  ├─ 0zSulnQwONLfBSCXMNizPjQ6yE1yak5h0xijtPESunU=
│  │  │  │  └─ 3600.1758843537975.NNqFXz-F0zKvx7Q0myr7hZQmAOLLBTZd1b6WDkWaB7g=.webp
│  │  │  ├─ 16rmN+x9G9f5z7sVNJVK6Y8tX5QHz-sVKJtyFLc1xtM=
│  │  │  │  └─ 3600.1758843538766.Afq1ow+J5JyATZ6sYVxzBSJjnZdenGB1i+TerhoGOg0=.webp
│  │  │  ├─ 1rFY3txqeipPmcCsvahU2oIbdpFN4Jjgjh9uPo8ydYk=
│  │  │  │  └─ 3600.1758843541744.BjhyO+IwXYfznQqkzxUPpjWW1ozBn4YKpca7jYCJVuE=.webp
│  │  │  ├─ 2fL2pKwk6pJD3fJn3vfSbFmi0mUSwjtNBP-Lx2aR+SE=
│  │  │  │  └─ 3600.1758843538470.6w0+8dLJm5+trccsClUL2Wd3OkVee0zrSag5lZt61Ps=.webp
│  │  │  ├─ 3IU6u4hOed-CIcBNStRs3brFCOfQt3GwcRo4+ukj6SA=
│  │  │  │  └─ 3600.1758843539823.Afq1ow+J5JyATZ6sYVxzBSJjnZdenGB1i+TerhoGOg0=.webp
│  │  │  ├─ 3LRHbSDafVjYmxAlpntbBNtmXp1Og-waVd35MDybTDk=
│  │  │  │  └─ 3600.1758843536912.C4iEIjDrG4MimEQrsa+qbqtWqqKBtTiDEXlFEJGmE1I=.webp
│  │  │  ├─ 3ySdpgFamfS0jStOP0JVZdUfrrvUexCWMMEqsgKYpHU=
│  │  │  │  └─ 3600.1758843540455.vZ+jdWl1km5DeBYFem2WvY3+soXRpOXImne4o8somKY=.webp
│  │  │  ├─ 47NWInm1-wL5-eKFDxJBMDTx7MGGFuT3Jn5G9Eu5ICA=
│  │  │  │  └─ 60.1756155113814.jz1PwFf+YEIRJUhHD2tmKQNHlOGmLbmontaSRBWAdJI=.webp
│  │  │  ├─ 5A6XQXEcgxWpoRA0lRjTqPIQ99neNZ5uKd0QEYYbUtk=
│  │  │  │  └─ 3600.1758843538305.Afq1ow+J5JyATZ6sYVxzBSJjnZdenGB1i+TerhoGOg0=.webp
│  │  │  ├─ 6I9hUZd67uro4whk5v2G2Z0JXG9QAVtnc0ea5cndSZg=
│  │  │  │  └─ 60.1758411618944.jz1PwFf+YEIRJUhHD2tmKQNHlOGmLbmontaSRBWAdJI=.webp
│  │  │  ├─ 6lAJ6YGlp6FKOryYMdX1n3DtEjXU45AYiTgddV20OD8=
│  │  │  │  └─ 86400.1758769736922.pMRJ3sGb6hHOyzmKTUjIGIr0qx2gLkWX0uAtA0vMX50=.webp
│  │  │  ├─ 8ELqf4AazdH5egmSIi9r9yobnbWT9r36J4yOShaimGs=
│  │  │  │  └─ 3600.1758843542265.RlRAbiIwXAHa3trKFXNG-pBg9xWgGStXhEyeK-KO9AU=.webp
│  │  │  ├─ 8bQzLRrNY1kred73T6v5y9OrcPHZqg+dDsOUvW3lMXg=
│  │  │  │  └─ 3600.1758843540972.sQKOXeUQIh99czJKRyDZHroIgZUBlXJUheOreKgyjrE=.webp
│  │  │  ├─ 8mq+hFgzF8OoBSVhCXZLCSSxO+TO4BDfQTtyysK26kg=
│  │  │  │  └─ 3600.1755887590166.Rw0CGmoqWN85fLkiT8HwrPQK1H71CvauSxDS5VpgG5Y=.webp
│  │  │  ├─ 8sIIqQAo+AYQ1B3yGSsuVNWc7XoSlwenoMWfZQC458c=
│  │  │  │  └─ 3600.1758843541266.s5qcHcOSzyUKobq5KChHZlJ7hq71cMXhkASZgHYtesM=.webp
│  │  │  ├─ AIFSCeWG84VrHZrFlV++8BcwpXcKI8QXnFm8c-u7mks=
│  │  │  │  └─ 3600.1755897372750.eIW3zRPZlIdWd1-08yo6m24s59xdW9EM3MUfLlu3j7Y=.webp
│  │  │  ├─ B37AonBlIqC4LuorWKCW2T3NLEWHNO6ZQYfVDu8Ngz4=
│  │  │  │  └─ 3600.1755897368344.+xqlk9CcM+EXEP7rW7WaI1yBQ98yqQ7KX9qs0gHFYOk=.webp
│  │  │  ├─ EPJ0sLbLJyaqfGZBS2BAHTfT9vo25TxcvMPqcdjywAI=
│  │  │  │  └─ 3600.1758843538611.i4C2Gq8I7VnVXh+SRdnHFsrtIJE0xaN+gJbmc9cxzWM=.webp
│  │  │  ├─ EV8ceVHRYetEiEx452ozyViZY8P-y3S8UbZOoRmEx8s=
│  │  │  │  └─ 3600.1758843537446.enpfKkyfq8GwFU9veHI2CgPPOLG1ZHOURDeWdcCAjyA=.webp
│  │  │  ├─ Edc10CYvr-V2JkevXqnDEg9m1F5XGbrjacx92Rvp6Tc=
│  │  │  │  └─ 3600.1758843539664.Afq1ow+J5JyATZ6sYVxzBSJjnZdenGB1i+TerhoGOg0=.webp
│  │  │  ├─ GRAXwjPOf2Mdlb8I94cTEnYWa8fV8-00zJr0OXB+9vA=
│  │  │  │  └─ 3600.1755901839651.75He9DDzy3Kq6LT2MdiaTw1x-eoUVe7yQSKJJY7Ozwk=.webp
│  │  │  ├─ KsQmREwLTQDYjWeUaLZbfyyChCFCvBeseAQYfQI4Y20=
│  │  │  │  └─ 3600.1755901847103.Bp2slEZ1XDDMrfaoHELEyERTJi2i1+TJJ2tCWFgo3wg=.webp
│  │  │  ├─ OBvSt4sMvRDyVSFtwRyIoqZoj2xtAKCte8yhbHX2iLk=
│  │  │  │  └─ 60.1756153827106.jz1PwFf+YEIRJUhHD2tmKQNHlOGmLbmontaSRBWAdJI=.webp
│  │  │  ├─ OoGBXzikRYwG9aj3ABeRhG9NWNq2EHkgs8o6CH+H0G8=
│  │  │  │  └─ 60.1758411610744.EDXJXAuFzzMHX-X5+kLzzD7jpdOdIHi9ivCunWfkJgw=.webp
│  │  │  ├─ Ptli5h6z8iwOAaELEHesrKOo-l39d3-sclhTEf+jYpc=
│  │  │  │  └─ 3600.1755887582439.xdSBPVPY7o-z8gp4s2-u5UJpAD08IyC3h-H-pSuXv3Q=.webp
│  │  │  ├─ RRLaajN2P8WyCvSbEZNkKA9oo+6xI4xGn80rryHWdjQ=
│  │  │  │  └─ 60.1758571946755.EDXJXAuFzzMHX-X5+kLzzD7jpdOdIHi9ivCunWfkJgw=.webp
│  │  │  ├─ SpBV1Kn3ZVGTiZgkXQo9ZAPCZ94Aqs+LOmA0iaSCjig=
│  │  │  │  └─ 3600.1755888135955.xkcMW6BZUymUKLBDqj0riy3jNj0lf+u9jj-AsJ-fGqE=.webp
│  │  │  ├─ T+vJxOkmwNPaP2GUnGuB2vafoepz86s0UDLI-Am55GE=
│  │  │  │  └─ 3600.1758843538927.zYRkI7cRfrDQc2+IPEv4qbKRp40Y3Xa48MfIh9FLfWs=.webp
│  │  │  ├─ ThdFJjjfh5uQrvNUQ8vwWSsWpqQry1d55kCx0F2znP4=
│  │  │  │  └─ 60.1758411131346.jz1PwFf+YEIRJUhHD2tmKQNHlOGmLbmontaSRBWAdJI=.webp
│  │  │  ├─ UWKOnky94dhzdPIvgBOcnL-3zlp5ktZ2V0o-2zf4hgQ=
│  │  │  │  └─ 3600.1758843539200.i4C2Gq8I7VnVXh+SRdnHFsrtIJE0xaN+gJbmc9cxzWM=.webp
│  │  │  ├─ VZ+Od365V1sE5MxCrRUIaq8qLleDrctoQHLMbbrndvo=
│  │  │  │  └─ 3600.1758843538144.Afq1ow+J5JyATZ6sYVxzBSJjnZdenGB1i+TerhoGOg0=.webp
│  │  │  ├─ Wex5a-anAf7qjrkA5SSHacpTo2PyANukGB5-gyWI4-o=
│  │  │  │  └─ 2592000.1758432444591.lsTn+x89JcuyaiJ1Y2rI7lcHjM7TDHiSwiM+jW89RyU=.webp
│  │  │  ├─ Y8WP7qkDH1lxH1BNMV-Xfdl3xfFsf-fQIu5by31fSLs=
│  │  │  │  └─ 3600.1758843540128.i4C2Gq8I7VnVXh+SRdnHFsrtIJE0xaN+gJbmc9cxzWM=.webp
│  │  │  ├─ YYajCgHyttP+J1xbZd-0di1h66DZgWmWBS1cRobTceQ=
│  │  │  │  └─ 3600.1758843539988.Afq1ow+J5JyATZ6sYVxzBSJjnZdenGB1i+TerhoGOg0=.webp
│  │  │  ├─ YhTSIA6K4u-GZWBsltQzEr7K9Yy5J5+MF6b7Zow8qCs=
│  │  │  │  └─ 3600.1758843541442.s5qcHcOSzyUKobq5KChHZlJ7hq71cMXhkASZgHYtesM=.webp
│  │  │  ├─ YqHJw3c+jE70nBhCsF2Z7X+PmHc7MP9SisqQ8mVQPMs=
│  │  │  │  └─ 86400.1758926336549.ZuTSw9GZLS04fz1kOMQGwUJ3bZXu7EwjJX25zBmofnY=.webp
│  │  │  ├─ adJwlvCNofIArkkHfAFqQHw3O-pH8TElBO-IEMA9b18=
│  │  │  │  └─ 3600.1755901843742.75He9DDzy3Kq6LT2MdiaTw1x-eoUVe7yQSKJJY7Ozwk=.webp
│  │  │  ├─ agq9Rd48ENidRl-iR-l4tKSMWB1PypP+GKMEbufRMj8=
│  │  │  │  └─ 3600.1758843540282.9uGRJQARaScso451urD5qo-N936s-fYsY+ZO5GU-0RE=.webp
│  │  │  ├─ e3Km6mjmMD91VA4I0g0r0IXkksJ6AyczCt+ez4fZc00=
│  │  │  │  └─ 3600.1758843537598.hcLOF45YIxo4UjnJPYcWBPqUOJWY-Kt3tKkztZXbYog=.webp
│  │  │  ├─ eA-3SZOhBgZiJmJzZ+GNZDjqysvRnmkHdJFINaHzT1U=
│  │  │  │  └─ 60.1758411131229.EDXJXAuFzzMHX-X5+kLzzD7jpdOdIHi9ivCunWfkJgw=.webp
│  │  │  ├─ eamlch2TRIJ0tUobbn58UfkbJGaqBYiLazZvVYN3NSY=
│  │  │  │  └─ 3600.1758843542392.lPDIlS8GL9rRdpG0zg1GG5LLmPfAPlM+yRPn-1S++2w=.webp
│  │  │  ├─ fmcumIB23cRuxec1OiQCYSVV7RY+A8cMhxQ5NwJcYc0=
│  │  │  │  └─ 86400.1759014599238.QXklskBC86+ZhJuSfakVIUI8qcHT-gLiAryQhhiXCUo=.webp
│  │  │  ├─ gOtCHZNT7+nniGoMOAIVY0RuLbbAQJp122TJmXGNUpU=
│  │  │  │  └─ 60.1756154933824.jz1PwFf+YEIRJUhHD2tmKQNHlOGmLbmontaSRBWAdJI=.webp
│  │  │  ├─ hX4bD-LHnQhbadFPneXdHf6Ia+6Q4yE-YZSujMcPPFo=
│  │  │  │  └─ 60.1756155112390.EDXJXAuFzzMHX-X5+kLzzD7jpdOdIHi9ivCunWfkJgw=.webp
│  │  │  ├─ iEVHV6QCec9AwwBEi7GrNPvHDCOJ6lIqf1VWC3wNHaw=
│  │  │  │  └─ 2592000.1758432446985.so+05fK4Gqh6Y4n3LEXTWB51uvUvokdJb4DoD1LwSkw=.webp
│  │  │  ├─ imKWGptwUUB7Z9LMIMgZj6XTbE-FeD-qIcx2CUaZo-o=
│  │  │  │  └─ 86400.1755984431042.ntkFdpnhGEAKRvDl0oAou-MIIZpNGo+t0Am5VDCLO-s=.webp
│  │  │  ├─ jrfl3DfWRlyvRgXmvc8jFv8Mxi8muFvf7kwFByDr26A=
│  │  │  │  └─ 3600.1755848046451.JI9geFa3Ytbn3qi8eeUAqexHdUO3Nfq7c+Zh+OtsHwo=.webp
│  │  │  ├─ k-8ABE1PRi0yOxLCgoDsdiYn02j+VyM4QZ7upH4w9gE=
│  │  │  │  └─ 60.1756153827016.EDXJXAuFzzMHX-X5+kLzzD7jpdOdIHi9ivCunWfkJgw=.webp
│  │  │  ├─ kaYtp2mtSw0P9mH23li8Fcyb7JuQr1-SYYuMf7m5Z0U=
│  │  │  │  └─ 60.1756154863319.EDXJXAuFzzMHX-X5+kLzzD7jpdOdIHi9ivCunWfkJgw=.webp
│  │  │  ├─ kvC1Fw3j2Tm3qVJ5yK0GJgtchvq800iztBp7Lc15ZP0=
│  │  │  │  └─ 3600.1758843539063.i4C2Gq8I7VnVXh+SRdnHFsrtIJE0xaN+gJbmc9cxzWM=.webp
│  │  │  ├─ lyOolPISIf2nU4ezk+P4gGijX+vjs53aM2F8ESHJVgY=
│  │  │  │  └─ 3600.1758843537069.JI9geFa3Ytbn3qi8eeUAqexHdUO3Nfq7c+Zh+OtsHwo=.webp
│  │  │  ├─ o80nE+Jcv32bKWRGhP8cMCZAaNwf0pIZoSQWQSVTt6k=
│  │  │  │  └─ 3600.1758843542074.owqnlcXHMDubBI9M4IpjHJeefu4URW5phOjhcaeWSfg=.webp
│  │  │  ├─ ohtV7NQFvxC1PPMzV9DOfj1x7n6S+0x7MDqcxXHxeWc=
│  │  │  │  └─ 3600.1758843539511.Eh3QM0MbFNtNh-c5+sszJLOIwwPcv43JClNDZroMq9o=.webp
│  │  │  ├─ qOR0khxAYwEjTfjc33zStUyD20nncScbJAyZJQwwDXc=
│  │  │  │  └─ 60.1756154014602.EDXJXAuFzzMHX-X5+kLzzD7jpdOdIHi9ivCunWfkJgw=.webp
│  │  │  ├─ s3Jc-MP9yVpGaWxPssv8by2exrBEPsEniVLZ-WdSf6Y=
│  │  │  │  └─ 3600.1758843537252.Afq1ow+J5JyATZ6sYVxzBSJjnZdenGB1i+TerhoGOg0=.webp
│  │  │  ├─ ub77ERODpANDorVdqCKVk9bnMmkb8U-kpfu1m3dRf1s=
│  │  │  │  └─ 60.1758571946162.jz1PwFf+YEIRJUhHD2tmKQNHlOGmLbmontaSRBWAdJI=.webp
│  │  │  ├─ xgwTfSNHde5DD04wYvR9vPHWFtWJfXURnRsIo2AoAiE=
│  │  │  │  └─ 60.1756154013095.jz1PwFf+YEIRJUhHD2tmKQNHlOGmLbmontaSRBWAdJI=.webp
│  │  │  ├─ ykUV3IUXAo9qT1+FHWB-AMU822J+bKTslHDGkXbqnj0=
│  │  │  │  └─ 3600.1758843539325.rURLHR1ng1ZnogG2nAVE4q-v4XQIZqRv8hdxIbpKwAg=.webp
│  │  │  └─ yrq36phSgKqEGp3DZoedSJIYjmlYQYN0mZsGBu2YrAI=
│  │  │     └─ 3600.1755888139722.xdSBPVPY7o-z8gp4s2-u5UJpAD08IyC3h-H-pSuXv3Q=.webp
│  │  ├─ swc
│  │  │  └─ plugins
│  │  │     └─ v7_macos_aarch64_0.106.15
│  │  └─ webpack
│  │     ├─ client-development
│  │     │  ├─ 0.pack.gz
│  │     │  ├─ 1.pack.gz
│  │     │  ├─ 10.pack.gz
│  │     │  ├─ 11.pack.gz
│  │     │  ├─ 12.pack.gz
│  │     │  ├─ 13.pack.gz
│  │     │  ├─ 14.pack.gz
│  │     │  ├─ 15.pack.gz
│  │     │  ├─ 16.pack.gz
│  │     │  ├─ 17.pack.gz
│  │     │  ├─ 18.pack.gz
│  │     │  ├─ 19.pack.gz
│  │     │  ├─ 2.pack.gz
│  │     │  ├─ 20.pack.gz
│  │     │  ├─ 21.pack.gz
│  │     │  ├─ 22.pack.gz
│  │     │  ├─ 23.pack.gz
│  │     │  ├─ 24.pack.gz
│  │     │  ├─ 25.pack.gz
│  │     │  ├─ 26.pack.gz
│  │     │  ├─ 27.pack.gz
│  │     │  ├─ 28.pack.gz
│  │     │  ├─ 29.pack.gz
│  │     │  ├─ 3.pack.gz
│  │     │  ├─ 30.pack.gz
│  │     │  ├─ 31.pack.gz
│  │     │  ├─ 32.pack.gz
│  │     │  ├─ 33.pack.gz
│  │     │  ├─ 34.pack.gz
│  │     │  ├─ 35.pack.gz
│  │     │  ├─ 36.pack.gz
│  │     │  ├─ 37.pack.gz
│  │     │  ├─ 38.pack.gz
│  │     │  ├─ 39.pack.gz
│  │     │  ├─ 4.pack.gz
│  │     │  ├─ 40.pack.gz
│  │     │  ├─ 41.pack.gz
│  │     │  ├─ 42.pack.gz
│  │     │  ├─ 43.pack.gz
│  │     │  ├─ 44.pack.gz
│  │     │  ├─ 45.pack.gz
│  │     │  ├─ 46.pack.gz
│  │     │  ├─ 47.pack.gz
│  │     │  ├─ 48.pack.gz
│  │     │  ├─ 5.pack.gz
│  │     │  ├─ 6.pack.gz
│  │     │  ├─ 7.pack.gz
│  │     │  ├─ 8.pack.gz
│  │     │  ├─ 9.pack.gz
│  │     │  ├─ index.pack.gz
│  │     │  └─ index.pack.gz.old
│  │     ├─ client-development-fallback
│  │     │  ├─ 0.pack.gz
│  │     │  ├─ 1.pack.gz
│  │     │  └─ index.pack.gz.old
│  │     ├─ edge-server-development
│  │     │  ├─ 0.pack.gz
│  │     │  ├─ 1.pack.gz
│  │     │  ├─ 2.pack.gz
│  │     │  ├─ 3.pack.gz
│  │     │  ├─ 4.pack.gz
│  │     │  ├─ index.pack.gz
│  │     │  └─ index.pack.gz.old
│  │     └─ server-development
│  │        ├─ 0.pack.gz
│  │        ├─ 1.pack.gz
│  │        ├─ 10.pack.gz
│  │        ├─ 11.pack.gz
│  │        ├─ 12.pack.gz
│  │        ├─ 13.pack.gz
│  │        ├─ 14.pack.gz
│  │        ├─ 15.pack.gz
│  │        ├─ 16.pack.gz
│  │        ├─ 17.pack.gz
│  │        ├─ 18.pack.gz
│  │        ├─ 19.pack.gz
│  │        ├─ 2.pack.gz
│  │        ├─ 20.pack.gz
│  │        ├─ 21.pack.gz
│  │        ├─ 22.pack.gz
│  │        ├─ 23.pack.gz
│  │        ├─ 24.pack.gz
│  │        ├─ 25.pack.gz
│  │        ├─ 26.pack.gz
│  │        ├─ 27.pack.gz
│  │        ├─ 28.pack.gz
│  │        ├─ 29.pack.gz
│  │        ├─ 3.pack.gz
│  │        ├─ 30.pack.gz
│  │        ├─ 31.pack.gz
│  │        ├─ 32.pack.gz
│  │        ├─ 33.pack.gz
│  │        ├─ 34.pack.gz
│  │        ├─ 35.pack.gz
│  │        ├─ 36.pack.gz
│  │        ├─ 37.pack.gz
│  │        ├─ 38.pack.gz
│  │        ├─ 39.pack.gz
│  │        ├─ 4.pack.gz
│  │        ├─ 40.pack.gz
│  │        ├─ 41.pack.gz
│  │        ├─ 42.pack.gz
│  │        ├─ 43.pack.gz
│  │        ├─ 44.pack.gz
│  │        ├─ 45.pack.gz
│  │        ├─ 46.pack.gz
│  │        ├─ 47.pack.gz
│  │        ├─ 48.pack.gz
│  │        ├─ 49.pack.gz
│  │        ├─ 5.pack.gz
│  │        ├─ 50.pack.gz
│  │        ├─ 51.pack.gz
│  │        ├─ 52.pack.gz
│  │        ├─ 53.pack.gz
│  │        ├─ 54.pack.gz
│  │        ├─ 55.pack.gz
│  │        ├─ 56.pack.gz
│  │        ├─ 6.pack.gz
│  │        ├─ 7.pack.gz
│  │        ├─ 8.pack.gz
│  │        ├─ 9.pack.gz
│  │        ├─ index.pack.gz
│  │        └─ index.pack.gz.old
│  ├─ package.json
│  ├─ react-loadable-manifest.json
│  ├─ server
│  │  ├─ app
│  │  │  ├─ (auth)
│  │  │  │  └─ login
│  │  │  │     ├─ page.js
│  │  │  │     └─ page_client-reference-manifest.js
│  │  │  ├─ agora
│  │  │  │  ├─ page.js
│  │  │  │  └─ page_client-reference-manifest.js
│  │  │  ├─ api
│  │  │  │  ├─ agora
│  │  │  │  │  ├─ events
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  └─ network
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ arguments
│  │  │  │  │  ├─ [id]
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  └─ batch
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ bus
│  │  │  │  │  ├─ sse
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  └─ subscribe
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ claim-citations
│  │  │  │  │  └─ route.js
│  │  │  │  ├─ claims
│  │  │  │  │  ├─ [id]
│  │  │  │  │  │  └─ top-argument
│  │  │  │  │  │     └─ route.js
│  │  │  │  │  ├─ batch
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  ├─ labels
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  └─ summary
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ content-status
│  │  │  │  │  └─ route.js
│  │  │  │  ├─ cqs
│  │  │  │  │  ├─ attachments
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  └─ route.js
│  │  │  │  ├─ decisions
│  │  │  │  │  └─ route.js
│  │  │  │  ├─ deliberations
│  │  │  │  │  └─ [id]
│  │  │  │  │     ├─ approvals
│  │  │  │  │     │  └─ summary
│  │  │  │  │     │     └─ route.js
│  │  │  │  │     ├─ arguments
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ bridges
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ clusters
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ cq
│  │  │  │  │     │  └─ summary
│  │  │  │  │     │     └─ route.js
│  │  │  │  │     ├─ dialectic
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ graph
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ issues
│  │  │  │  │     │  └─ counts
│  │  │  │  │     │     └─ route.js
│  │  │  │  │     ├─ moves
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ prefs
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ rsa
│  │  │  │  │     │  └─ route.js
│  │  │  │  │     ├─ topology
│  │  │  │  │     │  └─ summary
│  │  │  │  │     │     └─ route.js
│  │  │  │  │     └─ viewpoints
│  │  │  │  │        └─ select
│  │  │  │  │           └─ route.js
│  │  │  │  ├─ dialogue
│  │  │  │  │  ├─ legal-moves
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  ├─ move
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  ├─ moves
│  │  │  │  │  │  └─ route.js
│  │  │  │  │  └─ open-cqs
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ events
│  │  │  │  │  └─ route.js
│  │  │  │  ├─ follow
│  │  │  │  │  └─ route.js
│  │  │  │  ├─ ludics
│  │  │  │  │  └─ compile-step
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ nli
│  │  │  │  │  └─ batch
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ sheets
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ stacks
│  │  │  │  │  └─ subscriptions
│  │  │  │  │     └─ route.js
│  │  │  │  ├─ works
│  │  │  │  │  ├─ page.js
│  │  │  │  │  ├─ page_client-reference-manifest.js
│  │  │  │  │  └─ route.js
│  │  │  │  └─ xref
│  │  │  │     └─ route.js
│  │  │  └─ article
│  │  │     └─ (by-key)
│  │  │        └─ [key]
│  │  │           ├─ page.js
│  │  │           └─ page_client-reference-manifest.js
│  │  ├─ app-paths-manifest.json
│  │  ├─ edge-runtime-webpack.js
│  │  ├─ interception-route-rewrite-manifest.js
│  │  ├─ middleware-build-manifest.js
│  │  ├─ middleware-manifest.json
│  │  ├─ middleware-react-loadable-manifest.js
│  │  ├─ middleware.js
│  │  ├─ next-font-manifest.js
│  │  ├─ next-font-manifest.json
│  │  ├─ pages-manifest.json
│  │  ├─ server-reference-manifest.js
│  │  ├─ server-reference-manifest.json
│  │  ├─ static
│  │  │  └─ webpack
│  │  │     └─ 633457081244afec._.hot-update.json
│  │  ├─ vendor-chunks
│  │  │  ├─ @firebase.js
│  │  │  ├─ @floating-ui.js
│  │  │  ├─ @opentelemetry.js
│  │  │  ├─ @radix-ui.js
│  │  │  ├─ @supabase.js
│  │  │  ├─ @swc.js
│  │  │  ├─ @tiptap.js
│  │  │  ├─ aria-hidden.js
│  │  │  ├─ class-variance-authority.js
│  │  │  ├─ clsx.js
│  │  │  ├─ compromise.js
│  │  │  ├─ css-what.js
│  │  │  ├─ date-fns.js
│  │  │  ├─ dequal.js
│  │  │  ├─ devlop.js
│  │  │  ├─ efrt.js
│  │  │  ├─ firebase.js
│  │  │  ├─ framer-motion.js
│  │  │  ├─ get-nonce.js
│  │  │  ├─ grad-school.js
│  │  │  ├─ highlight.js.js
│  │  │  ├─ idb.js
│  │  │  ├─ katex.js
│  │  │  ├─ linkifyjs.js
│  │  │  ├─ lowlight.js
│  │  │  ├─ lucide-react.js
│  │  │  ├─ motion-dom.js
│  │  │  ├─ motion-utils.js
│  │  │  ├─ nanoid.js
│  │  │  ├─ next-firebase-auth-edge.js
│  │  │  ├─ next.js
│  │  │  ├─ orderedmap.js
│  │  │  ├─ prosemirror-commands.js
│  │  │  ├─ prosemirror-dropcursor.js
│  │  │  ├─ prosemirror-gapcursor.js
│  │  │  ├─ prosemirror-history.js
│  │  │  ├─ prosemirror-keymap.js
│  │  │  ├─ prosemirror-model.js
│  │  │  ├─ prosemirror-schema-list.js
│  │  │  ├─ prosemirror-state.js
│  │  │  ├─ prosemirror-transform.js
│  │  │  ├─ prosemirror-view.js
│  │  │  ├─ react-remove-scroll-bar.js
│  │  │  ├─ react-remove-scroll.js
│  │  │  ├─ react-style-singleton.js
│  │  │  ├─ react-virtuoso.js
│  │  │  ├─ rope-sequence.js
│  │  │  ├─ suffix-thumb.js
│  │  │  ├─ swr.js
│  │  │  ├─ tailwind-merge.js
│  │  │  ├─ tr46.js
│  │  │  ├─ tslib.js
│  │  │  ├─ undici.js
│  │  │  ├─ use-callback-ref.js
│  │  │  ├─ use-sidecar.js
│  │  │  ├─ use-sync-external-store.js
│  │  │  ├─ w3c-keyname.js
│  │  │  ├─ whatwg-url.js
│  │  │  ├─ zeed-dom.js
│  │  │  └─ zod.js
│  │  └─ webpack-runtime.js
│  ├─ static
│  │  ├─ chunks
│  │  │  ├─ _app-pages-browser_components_graph_GraphPanel_tsx.js
│  │  │  ├─ app
│  │  │  │  ├─ (auth)
│  │  │  │  │  ├─ layout.js
│  │  │  │  │  └─ login
│  │  │  │  │     └─ page.js
│  │  │  │  ├─ agora
│  │  │  │  │  ├─ layout.js
│  │  │  │  │  └─ page.js
│  │  │  │  ├─ api
│  │  │  │  │  ├─ layout.js
│  │  │  │  │  └─ works
│  │  │  │  │     └─ page.js
│  │  │  │  └─ article
│  │  │  │     ├─ (by-key)
│  │  │  │     │  └─ [key]
│  │  │  │     │     └─ page.js
│  │  │  │     └─ layout.js
│  │  │  ├─ app-pages-internals.js
│  │  │  ├─ main-app.js
│  │  │  ├─ polyfills.js
│  │  │  └─ webpack.js
│  │  ├─ css
│  │  │  └─ app
│  │  │     ├─ (auth)
│  │  │     │  ├─ layout.css
│  │  │     │  └─ login
│  │  │     │     └─ page.css
│  │  │     ├─ agora
│  │  │     │  └─ layout.css
│  │  │     └─ article
│  │  │        └─ layout.css
│  │  ├─ development
│  │  │  ├─ _buildManifest.js
│  │  │  └─ _ssgManifest.js
│  │  ├─ media
│  │  │  ├─ 19cfc7226ec3afaa-s.woff2
│  │  │  ├─ 21350d82a1f187e9-s.woff2
│  │  │  ├─ 8e9860b6e62d6359-s.woff2
│  │  │  ├─ b93511356ce2edce-s.p.otf
│  │  │  ├─ ba9851c3c22cd980-s.woff2
│  │  │  ├─ c5fe6dc8356a8c31-s.woff2
│  │  │  ├─ df0a9ae256c0569c-s.woff2
│  │  │  └─ e4af272ccee01ff0-s.p.woff2
│  │  └─ webpack
│  │     ├─ 024672ac202e0e03.webpack.hot-update.json
│  │     ├─ 075036903388f327.webpack.hot-update.json
│  │     ├─ 081e3e020dcc4327.webpack.hot-update.json
│  │     ├─ 11c06bc0d02dd470.webpack.hot-update.json
│  │     ├─ 125976ea5967f675.webpack.hot-update.json
│  │     ├─ 142036636fddee60.webpack.hot-update.json
│  │     ├─ 16367d91e414afa4.webpack.hot-update.json
│  │     ├─ 175c8ac74120f418.webpack.hot-update.json
│  │     ├─ 1a679772ed9a0d67.webpack.hot-update.json
│  │     ├─ 1f9f0f791f67e7a0.webpack.hot-update.json
│  │     ├─ 23d73167253b0767.webpack.hot-update.json
│  │     ├─ 2924adf7e092fba1.webpack.hot-update.json
│  │     ├─ 2cc4535eb573ba37.webpack.hot-update.json
│  │     ├─ 3d74169b35d747f6.webpack.hot-update.json
│  │     ├─ 3eda735d858c16d1.webpack.hot-update.json
│  │     ├─ 458a5659f67a75f9.webpack.hot-update.json
│  │     ├─ 4cc95c272497f0b0.webpack.hot-update.json
│  │     ├─ 58ab250edec79688.webpack.hot-update.json
│  │     ├─ 5f5b4e8a6228806a.webpack.hot-update.json
│  │     ├─ 5fd1b4c3beb88a7d.webpack.hot-update.json
│  │     ├─ 633457081244afec._.hot-update.json
│  │     ├─ 69fb7d59d94182ac.webpack.hot-update.json
│  │     ├─ 6e86ad835623f626.webpack.hot-update.json
│  │     ├─ 6fb1666371492c4a.webpack.hot-update.json
│  │     ├─ 7a772cf8a30a6ca6.webpack.hot-update.json
│  │     ├─ 7b376443113bf4f2.webpack.hot-update.json
│  │     ├─ 7e43210012305fda.webpack.hot-update.json
│  │     ├─ 8034794562f638a1.webpack.hot-update.json
│  │     ├─ 85b473ac5acb5cbc.webpack.hot-update.json
│  │     ├─ 8ab2e97bc7bb7da7.webpack.hot-update.json
│  │     ├─ 8ed879c2a4aebb95.webpack.hot-update.json
│  │     ├─ 906fc9f6dc7636af.webpack.hot-update.json
│  │     ├─ 9605110998bee7b6.webpack.hot-update.json
│  │     ├─ 991a389c72a6cddd.webpack.hot-update.json
│  │     ├─ a4f4aa25a56b9a15.webpack.hot-update.json
│  │     ├─ a91ed5eeabf7f1d5.webpack.hot-update.json
│  │     ├─ a928f265222a528b.webpack.hot-update.json
│  │     ├─ ac70461fc3f57b56.webpack.hot-update.json
│  │     ├─ ae567709cf072b20.webpack.hot-update.json
│  │     ├─ app
│  │     │  ├─ (auth)
│  │     │  │  ├─ layout.024672ac202e0e03.hot-update.js
│  │     │  │  ├─ layout.075036903388f327.hot-update.js
│  │     │  │  ├─ layout.081e3e020dcc4327.hot-update.js
│  │     │  │  ├─ layout.11c06bc0d02dd470.hot-update.js
│  │     │  │  ├─ layout.125976ea5967f675.hot-update.js
│  │     │  │  ├─ layout.16367d91e414afa4.hot-update.js
│  │     │  │  ├─ layout.1a679772ed9a0d67.hot-update.js
│  │     │  │  ├─ layout.1f9f0f791f67e7a0.hot-update.js
│  │     │  │  ├─ layout.23d73167253b0767.hot-update.js
│  │     │  │  ├─ layout.2cc4535eb573ba37.hot-update.js
│  │     │  │  ├─ layout.3d74169b35d747f6.hot-update.js
│  │     │  │  ├─ layout.3eda735d858c16d1.hot-update.js
│  │     │  │  ├─ layout.458a5659f67a75f9.hot-update.js
│  │     │  │  ├─ layout.4cc95c272497f0b0.hot-update.js
│  │     │  │  ├─ layout.58ab250edec79688.hot-update.js
│  │     │  │  ├─ layout.5f5b4e8a6228806a.hot-update.js
│  │     │  │  ├─ layout.5fd1b4c3beb88a7d.hot-update.js
│  │     │  │  ├─ layout.69fb7d59d94182ac.hot-update.js
│  │     │  │  ├─ layout.6e86ad835623f626.hot-update.js
│  │     │  │  ├─ layout.6fb1666371492c4a.hot-update.js
│  │     │  │  ├─ layout.7a772cf8a30a6ca6.hot-update.js
│  │     │  │  ├─ layout.7e43210012305fda.hot-update.js
│  │     │  │  ├─ layout.8034794562f638a1.hot-update.js
│  │     │  │  ├─ layout.85b473ac5acb5cbc.hot-update.js
│  │     │  │  ├─ layout.8ab2e97bc7bb7da7.hot-update.js
│  │     │  │  ├─ layout.8ed879c2a4aebb95.hot-update.js
│  │     │  │  ├─ layout.906fc9f6dc7636af.hot-update.js
│  │     │  │  ├─ layout.9605110998bee7b6.hot-update.js
│  │     │  │  ├─ layout.991a389c72a6cddd.hot-update.js
│  │     │  │  ├─ layout.a4f4aa25a56b9a15.hot-update.js
│  │     │  │  ├─ layout.a91ed5eeabf7f1d5.hot-update.js
│  │     │  │  ├─ layout.a928f265222a528b.hot-update.js
│  │     │  │  ├─ layout.ac70461fc3f57b56.hot-update.js
│  │     │  │  ├─ layout.ae567709cf072b20.hot-update.js
│  │     │  │  ├─ layout.c7a0e2d5826238f3.hot-update.js
│  │     │  │  ├─ layout.c98ff572830390cd.hot-update.js
│  │     │  │  ├─ layout.d3ec5ed13157ab08.hot-update.js
│  │     │  │  ├─ layout.d3fece9834c9a08f.hot-update.js
│  │     │  │  ├─ layout.dad8cb90316af737.hot-update.js
│  │     │  │  ├─ layout.daf5cf414e496142.hot-update.js
│  │     │  │  ├─ layout.dc418fd4e4377149.hot-update.js
│  │     │  │  ├─ layout.de930f791ee5cf33.hot-update.js
│  │     │  │  ├─ layout.df0f6c24ed590dff.hot-update.js
│  │     │  │  ├─ layout.eccf2e8bb1c74b31.hot-update.js
│  │     │  │  ├─ layout.f007c29dbef30c7a.hot-update.js
│  │     │  │  ├─ layout.f5c5e301478e768d.hot-update.js
│  │     │  │  ├─ layout.fa7d7cd31d13da73.hot-update.js
│  │     │  │  ├─ layout.fb1c6823fed47596.hot-update.js
│  │     │  │  └─ layout.fc154dac58025cd6.hot-update.js
│  │     │  ├─ agora
│  │     │  │  ├─ layout.024672ac202e0e03.hot-update.js
│  │     │  │  ├─ layout.075036903388f327.hot-update.js
│  │     │  │  ├─ layout.081e3e020dcc4327.hot-update.js
│  │     │  │  ├─ layout.11c06bc0d02dd470.hot-update.js
│  │     │  │  ├─ layout.125976ea5967f675.hot-update.js
│  │     │  │  ├─ layout.16367d91e414afa4.hot-update.js
│  │     │  │  ├─ layout.1a679772ed9a0d67.hot-update.js
│  │     │  │  ├─ layout.1f9f0f791f67e7a0.hot-update.js
│  │     │  │  ├─ layout.23d73167253b0767.hot-update.js
│  │     │  │  ├─ layout.2cc4535eb573ba37.hot-update.js
│  │     │  │  ├─ layout.3d74169b35d747f6.hot-update.js
│  │     │  │  ├─ layout.3eda735d858c16d1.hot-update.js
│  │     │  │  ├─ layout.458a5659f67a75f9.hot-update.js
│  │     │  │  ├─ layout.4cc95c272497f0b0.hot-update.js
│  │     │  │  ├─ layout.58ab250edec79688.hot-update.js
│  │     │  │  ├─ layout.5f5b4e8a6228806a.hot-update.js
│  │     │  │  ├─ layout.5fd1b4c3beb88a7d.hot-update.js
│  │     │  │  ├─ layout.69fb7d59d94182ac.hot-update.js
│  │     │  │  ├─ layout.6e86ad835623f626.hot-update.js
│  │     │  │  ├─ layout.6fb1666371492c4a.hot-update.js
│  │     │  │  ├─ layout.7a772cf8a30a6ca6.hot-update.js
│  │     │  │  ├─ layout.7e43210012305fda.hot-update.js
│  │     │  │  ├─ layout.8034794562f638a1.hot-update.js
│  │     │  │  ├─ layout.85b473ac5acb5cbc.hot-update.js
│  │     │  │  ├─ layout.8ab2e97bc7bb7da7.hot-update.js
│  │     │  │  ├─ layout.8ed879c2a4aebb95.hot-update.js
│  │     │  │  ├─ layout.906fc9f6dc7636af.hot-update.js
│  │     │  │  ├─ layout.9605110998bee7b6.hot-update.js
│  │     │  │  ├─ layout.991a389c72a6cddd.hot-update.js
│  │     │  │  ├─ layout.a4f4aa25a56b9a15.hot-update.js
│  │     │  │  ├─ layout.a91ed5eeabf7f1d5.hot-update.js
│  │     │  │  ├─ layout.a928f265222a528b.hot-update.js
│  │     │  │  ├─ layout.ac70461fc3f57b56.hot-update.js
│  │     │  │  ├─ layout.ae567709cf072b20.hot-update.js
│  │     │  │  ├─ layout.c7a0e2d5826238f3.hot-update.js
│  │     │  │  ├─ layout.c98ff572830390cd.hot-update.js
│  │     │  │  ├─ layout.d3fece9834c9a08f.hot-update.js
│  │     │  │  ├─ layout.dad8cb90316af737.hot-update.js
│  │     │  │  ├─ layout.daf5cf414e496142.hot-update.js
│  │     │  │  ├─ layout.dc418fd4e4377149.hot-update.js
│  │     │  │  ├─ layout.de930f791ee5cf33.hot-update.js
│  │     │  │  ├─ layout.df0f6c24ed590dff.hot-update.js
│  │     │  │  ├─ layout.eccf2e8bb1c74b31.hot-update.js
│  │     │  │  ├─ layout.f007c29dbef30c7a.hot-update.js
│  │     │  │  ├─ layout.f5c5e301478e768d.hot-update.js
│  │     │  │  ├─ layout.fa7d7cd31d13da73.hot-update.js
│  │     │  │  ├─ layout.fb1c6823fed47596.hot-update.js
│  │     │  │  ├─ layout.fc154dac58025cd6.hot-update.js
│  │     │  │  ├─ page.024672ac202e0e03.hot-update.js
│  │     │  │  ├─ page.11c06bc0d02dd470.hot-update.js
│  │     │  │  ├─ page.125976ea5967f675.hot-update.js
│  │     │  │  ├─ page.142036636fddee60.hot-update.js
│  │     │  │  ├─ page.16367d91e414afa4.hot-update.js
│  │     │  │  ├─ page.1a679772ed9a0d67.hot-update.js
│  │     │  │  ├─ page.23d73167253b0767.hot-update.js
│  │     │  │  ├─ page.3d74169b35d747f6.hot-update.js
│  │     │  │  ├─ page.3eda735d858c16d1.hot-update.js
│  │     │  │  ├─ page.58ab250edec79688.hot-update.js
│  │     │  │  ├─ page.6e86ad835623f626.hot-update.js
│  │     │  │  ├─ page.7a772cf8a30a6ca6.hot-update.js
│  │     │  │  ├─ page.8034794562f638a1.hot-update.js
│  │     │  │  ├─ page.85b473ac5acb5cbc.hot-update.js
│  │     │  │  ├─ page.8ed879c2a4aebb95.hot-update.js
│  │     │  │  ├─ page.991a389c72a6cddd.hot-update.js
│  │     │  │  ├─ page.a4f4aa25a56b9a15.hot-update.js
│  │     │  │  ├─ page.a928f265222a528b.hot-update.js
│  │     │  │  ├─ page.ac70461fc3f57b56.hot-update.js
│  │     │  │  ├─ page.ae567709cf072b20.hot-update.js
│  │     │  │  ├─ page.c7a0e2d5826238f3.hot-update.js
│  │     │  │  ├─ page.cc8db11ef9465250.hot-update.js
│  │     │  │  ├─ page.dc418fd4e4377149.hot-update.js
│  │     │  │  ├─ page.f007c29dbef30c7a.hot-update.js
│  │     │  │  └─ page.fa7d7cd31d13da73.hot-update.js
│  │     │  └─ article
│  │     │     ├─ (by-key)
│  │     │     │  └─ [key]
│  │     │     │     ├─ page.23d73167253b0767.hot-update.js
│  │     │     │     └─ page.c98ff572830390cd.hot-update.js
│  │     │     ├─ layout.024672ac202e0e03.hot-update.js
│  │     │     ├─ layout.075036903388f327.hot-update.js
│  │     │     ├─ layout.081e3e020dcc4327.hot-update.js
│  │     │     ├─ layout.11c06bc0d02dd470.hot-update.js
│  │     │     ├─ layout.125976ea5967f675.hot-update.js
│  │     │     ├─ layout.16367d91e414afa4.hot-update.js
│  │     │     ├─ layout.1a679772ed9a0d67.hot-update.js
│  │     │     ├─ layout.1f9f0f791f67e7a0.hot-update.js
│  │     │     ├─ layout.23d73167253b0767.hot-update.js
│  │     │     ├─ layout.2cc4535eb573ba37.hot-update.js
│  │     │     ├─ layout.3d74169b35d747f6.hot-update.js
│  │     │     ├─ layout.3eda735d858c16d1.hot-update.js
│  │     │     ├─ layout.458a5659f67a75f9.hot-update.js
│  │     │     ├─ layout.4cc95c272497f0b0.hot-update.js
│  │     │     ├─ layout.58ab250edec79688.hot-update.js
│  │     │     ├─ layout.5f5b4e8a6228806a.hot-update.js
│  │     │     ├─ layout.5fd1b4c3beb88a7d.hot-update.js
│  │     │     ├─ layout.69fb7d59d94182ac.hot-update.js
│  │     │     ├─ layout.6e86ad835623f626.hot-update.js
│  │     │     ├─ layout.6fb1666371492c4a.hot-update.js
│  │     │     ├─ layout.7a772cf8a30a6ca6.hot-update.js
│  │     │     ├─ layout.7b376443113bf4f2.hot-update.js
│  │     │     ├─ layout.7e43210012305fda.hot-update.js
│  │     │     ├─ layout.8034794562f638a1.hot-update.js
│  │     │     ├─ layout.85b473ac5acb5cbc.hot-update.js
│  │     │     ├─ layout.8ab2e97bc7bb7da7.hot-update.js
│  │     │     ├─ layout.8ed879c2a4aebb95.hot-update.js
│  │     │     ├─ layout.906fc9f6dc7636af.hot-update.js
│  │     │     ├─ layout.9605110998bee7b6.hot-update.js
│  │     │     ├─ layout.991a389c72a6cddd.hot-update.js
│  │     │     ├─ layout.a4f4aa25a56b9a15.hot-update.js
│  │     │     ├─ layout.a91ed5eeabf7f1d5.hot-update.js
│  │     │     ├─ layout.a928f265222a528b.hot-update.js
│  │     │     ├─ layout.ac70461fc3f57b56.hot-update.js
│  │     │     ├─ layout.ae567709cf072b20.hot-update.js
│  │     │     ├─ layout.c7a0e2d5826238f3.hot-update.js
│  │     │     ├─ layout.c98ff572830390cd.hot-update.js
│  │     │     ├─ layout.d3ec5ed13157ab08.hot-update.js
│  │     │     ├─ layout.d3fece9834c9a08f.hot-update.js
│  │     │     ├─ layout.dad8cb90316af737.hot-update.js
│  │     │     ├─ layout.daf5cf414e496142.hot-update.js
│  │     │     ├─ layout.dc418fd4e4377149.hot-update.js
│  │     │     ├─ layout.de930f791ee5cf33.hot-update.js
│  │     │     ├─ layout.df0f6c24ed590dff.hot-update.js
│  │     │     ├─ layout.eccf2e8bb1c74b31.hot-update.js
│  │     │     ├─ layout.f007c29dbef30c7a.hot-update.js
│  │     │     ├─ layout.f5c5e301478e768d.hot-update.js
│  │     │     ├─ layout.fa7d7cd31d13da73.hot-update.js
│  │     │     ├─ layout.fb1c6823fed47596.hot-update.js
│  │     │     └─ layout.fc154dac58025cd6.hot-update.js
│  │     ├─ c7a0e2d5826238f3.webpack.hot-update.json
│  │     ├─ c98ff572830390cd.webpack.hot-update.json
│  │     ├─ cc8db11ef9465250.webpack.hot-update.json
│  │     ├─ d3ec5ed13157ab08.webpack.hot-update.json
│  │     ├─ d3fece9834c9a08f.webpack.hot-update.json
│  │     ├─ dad8cb90316af737.webpack.hot-update.json
│  │     ├─ daf5cf414e496142.webpack.hot-update.json
│  │     ├─ dc418fd4e4377149.webpack.hot-update.json
│  │     ├─ de930f791ee5cf33.webpack.hot-update.json
│  │     ├─ df0f6c24ed590dff.webpack.hot-update.json
│  │     ├─ eccf2e8bb1c74b31.webpack.hot-update.json
│  │     ├─ f007c29dbef30c7a.webpack.hot-update.json
│  │     ├─ f5c5e301478e768d.webpack.hot-update.json
│  │     ├─ fa7d7cd31d13da73.webpack.hot-update.json
│  │     ├─ fb1c6823fed47596.webpack.hot-update.json
│  │     ├─ fc154dac58025cd6.webpack.hot-update.json
│  │     ├─ feae1c1584ad5bf7.webpack.hot-update.json
│  │     ├─ webpack.024672ac202e0e03.hot-update.js
│  │     ├─ webpack.075036903388f327.hot-update.js
│  │     ├─ webpack.081e3e020dcc4327.hot-update.js
│  │     ├─ webpack.11c06bc0d02dd470.hot-update.js
│  │     ├─ webpack.125976ea5967f675.hot-update.js
│  │     ├─ webpack.142036636fddee60.hot-update.js
│  │     ├─ webpack.16367d91e414afa4.hot-update.js
│  │     ├─ webpack.175c8ac74120f418.hot-update.js
│  │     ├─ webpack.1a679772ed9a0d67.hot-update.js
│  │     ├─ webpack.1f9f0f791f67e7a0.hot-update.js
│  │     ├─ webpack.23d73167253b0767.hot-update.js
│  │     ├─ webpack.2924adf7e092fba1.hot-update.js
│  │     ├─ webpack.2cc4535eb573ba37.hot-update.js
│  │     ├─ webpack.3d74169b35d747f6.hot-update.js
│  │     ├─ webpack.3eda735d858c16d1.hot-update.js
│  │     ├─ webpack.458a5659f67a75f9.hot-update.js
│  │     ├─ webpack.4cc95c272497f0b0.hot-update.js
│  │     ├─ webpack.58ab250edec79688.hot-update.js
│  │     ├─ webpack.5f5b4e8a6228806a.hot-update.js
│  │     ├─ webpack.5fd1b4c3beb88a7d.hot-update.js
│  │     ├─ webpack.69fb7d59d94182ac.hot-update.js
│  │     ├─ webpack.6e86ad835623f626.hot-update.js
│  │     ├─ webpack.6fb1666371492c4a.hot-update.js
│  │     ├─ webpack.7a772cf8a30a6ca6.hot-update.js
│  │     ├─ webpack.7b376443113bf4f2.hot-update.js
│  │     ├─ webpack.7e43210012305fda.hot-update.js
│  │     ├─ webpack.8034794562f638a1.hot-update.js
│  │     ├─ webpack.85b473ac5acb5cbc.hot-update.js
│  │     ├─ webpack.8ab2e97bc7bb7da7.hot-update.js
│  │     ├─ webpack.8ed879c2a4aebb95.hot-update.js
│  │     ├─ webpack.906fc9f6dc7636af.hot-update.js
│  │     ├─ webpack.9605110998bee7b6.hot-update.js
│  │     ├─ webpack.991a389c72a6cddd.hot-update.js
│  │     ├─ webpack.a4f4aa25a56b9a15.hot-update.js
│  │     ├─ webpack.a91ed5eeabf7f1d5.hot-update.js
│  │     ├─ webpack.a928f265222a528b.hot-update.js
│  │     ├─ webpack.ac70461fc3f57b56.hot-update.js
│  │     ├─ webpack.ae567709cf072b20.hot-update.js
│  │     ├─ webpack.c7a0e2d5826238f3.hot-update.js
│  │     ├─ webpack.c98ff572830390cd.hot-update.js
│  │     ├─ webpack.cc8db11ef9465250.hot-update.js
│  │     ├─ webpack.d3ec5ed13157ab08.hot-update.js
│  │     ├─ webpack.d3fece9834c9a08f.hot-update.js
│  │     ├─ webpack.dad8cb90316af737.hot-update.js
│  │     ├─ webpack.daf5cf414e496142.hot-update.js
│  │     ├─ webpack.dc418fd4e4377149.hot-update.js
│  │     ├─ webpack.de930f791ee5cf33.hot-update.js
│  │     ├─ webpack.df0f6c24ed590dff.hot-update.js
│  │     ├─ webpack.eccf2e8bb1c74b31.hot-update.js
│  │     ├─ webpack.f007c29dbef30c7a.hot-update.js
│  │     ├─ webpack.f5c5e301478e768d.hot-update.js
│  │     ├─ webpack.fa7d7cd31d13da73.hot-update.js
│  │     ├─ webpack.fb1c6823fed47596.hot-update.js
│  │     ├─ webpack.fc154dac58025cd6.hot-update.js
│  │     └─ webpack.feae1c1584ad5bf7.hot-update.js
│  ├─ trace
│  └─ types
│     ├─ app
│     │  ├─ (auth)
│     │  │  ├─ layout.ts
│     │  │  └─ login
│     │  │     └─ page.ts
│     │  ├─ agora
│     │  │  ├─ layout.ts
│     │  │  └─ page.ts
│     │  ├─ api
│     │  │  ├─ agora
│     │  │  │  ├─ events
│     │  │  │  │  └─ route.ts
│     │  │  │  └─ network
│     │  │  │     └─ route.ts
│     │  │  ├─ arguments
│     │  │  │  ├─ [id]
│     │  │  │  │  └─ route.ts
│     │  │  │  └─ batch
│     │  │  │     └─ route.ts
│     │  │  ├─ bus
│     │  │  │  ├─ sse
│     │  │  │  │  └─ route.ts
│     │  │  │  └─ subscribe
│     │  │  │     └─ route.ts
│     │  │  ├─ claim-citations
│     │  │  │  └─ route.ts
│     │  │  ├─ claims
│     │  │  │  ├─ [id]
│     │  │  │  │  └─ top-argument
│     │  │  │  │     └─ route.ts
│     │  │  │  ├─ batch
│     │  │  │  │  └─ route.ts
│     │  │  │  ├─ labels
│     │  │  │  │  └─ route.ts
│     │  │  │  └─ summary
│     │  │  │     └─ route.ts
│     │  │  ├─ content-status
│     │  │  │  └─ route.ts
│     │  │  ├─ cqs
│     │  │  │  ├─ attachments
│     │  │  │  │  └─ route.ts
│     │  │  │  └─ route.ts
│     │  │  ├─ decisions
│     │  │  │  └─ route.ts
│     │  │  ├─ deliberations
│     │  │  │  └─ [id]
│     │  │  │     ├─ approvals
│     │  │  │     │  └─ summary
│     │  │  │     │     └─ route.ts
│     │  │  │     ├─ arguments
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ bridges
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ clusters
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ cq
│     │  │  │     │  └─ summary
│     │  │  │     │     └─ route.ts
│     │  │  │     ├─ dialectic
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ graph
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ issues
│     │  │  │     │  └─ counts
│     │  │  │     │     └─ route.ts
│     │  │  │     ├─ moves
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ prefs
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ rsa
│     │  │  │     │  └─ route.ts
│     │  │  │     ├─ topology
│     │  │  │     │  └─ summary
│     │  │  │     │     └─ route.ts
│     │  │  │     └─ viewpoints
│     │  │  │        └─ select
│     │  │  │           └─ route.ts
│     │  │  ├─ dialogue
│     │  │  │  ├─ legal-moves
│     │  │  │  │  └─ route.ts
│     │  │  │  ├─ move
│     │  │  │  │  └─ route.ts
│     │  │  │  ├─ moves
│     │  │  │  │  └─ route.ts
│     │  │  │  └─ open-cqs
│     │  │  │     └─ route.ts
│     │  │  ├─ events
│     │  │  │  └─ route.ts
│     │  │  ├─ follow
│     │  │  │  └─ route.ts
│     │  │  ├─ layout.ts
│     │  │  ├─ ludics
│     │  │  │  └─ compile-step
│     │  │  │     └─ route.ts
│     │  │  ├─ nli
│     │  │  │  └─ batch
│     │  │  │     └─ route.ts
│     │  │  ├─ sheets
│     │  │  │  └─ [id]
│     │  │  │     └─ route.ts
│     │  │  ├─ stacks
│     │  │  │  └─ subscriptions
│     │  │  │     └─ route.ts
│     │  │  ├─ works
│     │  │  │  ├─ page.ts
│     │  │  │  └─ route.ts
│     │  │  └─ xref
│     │  │     └─ route.ts
│     │  └─ article
│     │     ├─ (by-key)
│     │     │  └─ [key]
│     │     │     └─ page.ts
│     │     └─ layout.ts
│     └─ package.json
├─ .npmrc
├─ .yarnrc.yml
├─ AGENTS.md
├─ AgoraAFSemantics.md
├─ AgoraEventListenerV2Roadmap.rtf
├─ AgoraFoundations.md
├─ AgoraLudics.md
├─ AgoraProtocol.md
├─ AgoraSchemes.md
├─ CoolUnicodeSymbols.md
├─ DeliberationButtonRoadmapV1
├─ DigitalAgoraPlanning
│  ├─ ML_Deliberation_v2.md
│  └─ Sep_5_Roadmaps.md
├─ Dockerfile
├─ Formal Foundations for the Mesh Digital Agora .txt
├─ InteractionInNaturalLanguage.txt
├─ Internal_Documents
│  ├─ Advanced_Node_System_SRS.md
│  ├─ Advanced_Prediction_Market_Guide.md
│  ├─ AgoraV2Roadmap.md
│  ├─ Analytics_Dashboard_Flow_Builder_SRS.md
│  ├─ Article_Annotations_Guide.md
│  ├─ Article_New_Post_Type.md
│  ├─ Article_Post_Packets.md
│  ├─ Article_Post_Type_Brainstorm.md
│  ├─ Article_Post_Type_SRS.md
│  ├─ Article_Template_Switcher.md
│  ├─ Codex_Environment_Guide.md
│  ├─ Creating_New_Post_Type_Guide.md
│  ├─ Direct_Message_GroupChat_Attachments_Plan.md
│  ├─ Direct_Message_SRS.md
│  ├─ Embedded_Room_Canvas_Post_SRS.md
│  ├─ EndtoEnd_Security_Manual.md
│  ├─ Entropy_Game.md
│  ├─ FlowBuilder_Case_Study.md
│  ├─ Flow_Builder_FLOWSTATE_Report.md
│  ├─ Flowstate_Codex_Guide.md
│  ├─ Flowstate_Flow_Builder.md
│  ├─ Flowstate_v2_Overview.md
│  ├─ Flowstate_v2_SRS.md
│  ├─ Ideas_Backlog.md
│  ├─ Internetwork_Interoperability_Roadmap.md
│  ├─ Investor_Report.md
│  ├─ LaunchDay_Preparation_Guide.md
│  ├─ Library_Post_Type_SRS.md
│  ├─ Linear_Workflow_Builder_SRS.md
│  ├─ Livechat_Node_SRS.md
│  ├─ MESH_ActivityPub.md
│  ├─ MESH_DIFFERENTIATION.md
│  ├─ MESH_REGULATION_STRATEGY.md
│  ├─ MESH_ROOM_EXPLANATION.md
│  ├─ MESH_RSS.md
│  ├─ MESH_SECURITY_GUIDE_V1.md
│  ├─ MESH_SITE_BLOCKS_ROADMAP.md
│  ├─ MeshPlayBook.md
│  ├─ Mesh_Governance_Roadmap.md
│  ├─ Mesh_Performance_Improvements.md
│  ├─ Mesh_Perplexity_Principle.md
│  ├─ Mesh_Roadmap.md
│  ├─ Mesh_Settings_Implementation.md
│  ├─ Mobile_App_SRS.md
│  ├─ Pivot_Game_srs.md
│  ├─ Pivot_V2_Game_ROADMAP.md
│  ├─ Platform_Integrations_UserFlow_SRS.md
│  ├─ Plugin_Architecture_SRS.md
│  ├─ Portfolio_Node_SRS.md
│  ├─ Portfolio_Page_Builder_SRS.md
│  ├─ PredictionMarket_Development_Playbook.md
│  ├─ PredictionMarket_Implementation_Plan.md
│  ├─ PredictionMarket_Next_Steps.md
│  ├─ PredictionMarket_Post_Type_Guide.md
│  ├─ Product_Review_Node_SRS.md
│  ├─ RelevantMessageFeatureCode.md
│  ├─ RoomShard_Sprints.md
│  ├─ Room_Shards_Development_Guide.md
│  ├─ SM_AUG4_TASKS.md
│  ├─ Shards_Product_Brief.md
│  ├─ Site_Builder_Next_Steps.md
│  ├─ SocialDiscoverEngine_V2_SRS.md
│  ├─ SocialDiscoveryEnginev2.md
│  ├─ SocialDiscovery_Codex_Guide.md
│  ├─ Social_Discovery_Engine_Roadmap.md
│  ├─ Social_Discovery_SRS.md
│  ├─ Spotify_Favorites_Import_Ingest.md
│  ├─ SwapMeet_Advanced_Features.md
│  ├─ SwapMeet_Docs
│  │  └─ SwapMeet_Phase2_Task_List.md
│  ├─ SwapMeet_Implementation_Plan.md
│  ├─ SwapMeet_Libraries_Tools_SDKs.md
│  ├─ SwapMeet_Phase2_Task_List.md
│  ├─ SwapMeet_ProductPlaybook.md
│  ├─ SwapMeet_Steps.md
│  ├─ SwapMeet_UI_Guide.md
│  ├─ SwapMeet_v1_SRS.md
│  ├─ Swapmeet_Differentiation.md
│  ├─ Word_Rails_Game_srs.md
│  ├─ adding-elements-sitebuilder.md
│  └─ ludics-documents
│     ├─ DecisionPlaybook.md
│     ├─ Dialogical-Particle-and-Structural-Rules.md
│     ├─ LocusSolum_Quickstart_Parts1-9.md
│     ├─ LocusSolum_Quickstart_Parts1-9.pdf
│     ├─ LudicsFAQ.md
│     ├─ Ludics_CheatSheet_Card.pdf
│     ├─ Ludics_Glossary_Complete.md
│     ├─ Ludics_Glossary_Complete.pdf
│     ├─ dialogical-logic-sep.md
│     ├─ engine-presets-dialogical.txt.rtf
│     └─ ludics_roadmap.md
├─ Makefile
├─ MeshAgoraPlanning.txt
├─ MeshAgoraRoadmap.rtf
├─ Mesh_Product_Overview
├─ Mesh_Product_Overview.txt
├─ README.md
├─ __tests__
│  ├─ roles.test.ts
│  └─ tenant.spec.ts
├─ api
│  └─ embed.py
├─ app
│  ├─ (app)
│  │  └─ layout.tsx
│  ├─ (auth)
│  │  ├─ MetaBg.tsx
│  │  ├─ auth-bg.css
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  ├─ NewEdgeTest-LightRounded.otf
│  │  │  └─ page.tsx
│  │  ├─ meta-bg.css
│  │  ├─ onboarding
│  │  │  ├─ NewEdgeTest-LightRounded.otf
│  │  │  ├─ layout.tsx
│  │  │  ├─ onboarding-flow.tsx
│  │  │  └─ page.tsx
│  │  └─ register
│  │     └─ page.tsx
│  ├─ (dashboard)
│  │  ├─ components
│  │  │  └─ CostEstimate.tsx
│  │  └─ rooms
│  │     └─ [id]
│  │        └─ settings
│  │           └─ SovereigntyPanel.tsx
│  ├─ (editor)
│  │  ├─ EditorStyleGate.tsx
│  │  ├─ article
│  │  │  ├─ article.global.scss
│  │  │  ├─ by-id
│  │  │  │  └─ [id]
│  │  │  │     └─ edit
│  │  │  │        └─ page.tsx
│  │  │  ├─ new
│  │  │  │  └─ page.tsx
│  │  │  └─ styles
│  │  ├─ editor.global.css
│  │  ├─ layout.tsx
│  │  ├─ profile
│  │  │  └─ edit
│  │  └─ prosemirror.css
│  ├─ (pages)
│  │  ├─ layout.tsx
│  │  └─ settings
│  │     └─ integrations
│  │        ├─ SpotifyButton.tsx
│  │        └─ page.tsx
│  ├─ (root)
│  │  ├─ (realtime)
│  │  │  ├─ post
│  │  │  │  ├─ [id]
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ layout.tsx
│  │  │  └─ room
│  │  │     ├─ [id]
│  │  │     │  └─ page.tsx
│  │  │     ├─ join
│  │  │     │  └─ [id]
│  │  │     │     └─ page.tsx
│  │  │     └─ layout.tsx
│  │  ├─ (standard)
│  │  │  ├─ BugrinoTrials-Bold.otf
│  │  │  ├─ BugrinoTrials-Heavy.otf
│  │  │  ├─ BugrinoTrials-Regular.otf
│  │  │  ├─ BugrinoTrials-Thin.otf
│  │  │  ├─ KoloniaTrial-Regular.woff2
│  │  │  ├─ MediaanTrial-Regular.woff2
│  │  │  ├─ NewEdgeTest-LightRounded.otf
│  │  │  ├─ NewEdgeTest-RegularRounded.otf
│  │  │  ├─ NewEdgeTest-SemiboldRounded.otf
│  │  │  ├─ NewEdgeTest-UltraLightRounded.otf
│  │  │  ├─ activity
│  │  │  │  └─ page.tsx
│  │  │  ├─ applications
│  │  │  │  └─ page.tsx
│  │  │  ├─ client-providers.tsx
│  │  │  ├─ create-lounge
│  │  │  │  └─ page.tsx
│  │  │  ├─ create-room
│  │  │  │  └─ page.tsx
│  │  │  ├─ create-thread
│  │  │  │  └─ page.tsx
│  │  │  ├─ discussions
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx
│  │  │  ├─ entropy
│  │  │  │  ├─ data.ts
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ utilities.ts
│  │  │  ├─ explore
│  │  │  │  └─ page.tsx
│  │  │  ├─ feed
│  │  │  │  └─ page.tsx
│  │  │  ├─ foundersgrotesk.woff2
│  │  │  ├─ groups
│  │  │  │  └─ page.tsx
│  │  │  ├─ halfway
│  │  │  │  └─ page.tsx
│  │  │  ├─ integrations
│  │  │  │  ├─ integration-form.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ layout.tsx
│  │  │  ├─ lounges
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx
│  │  │  ├─ messages
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx
│  │  │  ├─ notifications
│  │  │  │  ├─ NotificationsList.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ page.tsx
│  │  │  ├─ pageflow
│  │  │  │  └─ page.tsx
│  │  │  ├─ pivot
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ pivotGenerator.ts
│  │  │  │  ├─ pivotReducer.ts
│  │  │  │  ├─ types
│  │  │  │  │  └─ pivot.ts
│  │  │  │  └─ words4.ts
│  │  │  ├─ profile
│  │  │  │  ├─ [id]
│  │  │  │  │  ├─ customize
│  │  │  │  │  │  ├─ customize-components.tsx
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  ├─ messages
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ articles
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  └─ ui
│  │  │  │  │     └─ ArticlesDashboard.tsx
│  │  │  │  ├─ deliberations
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  └─ ui
│  │  │  │  │     └─ DelibsDashboard.tsx
│  │  │  │  ├─ messages
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ settings
│  │  │  │  │  ├─ (admin)
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  ├─ (client)
│  │  │  │  │  │  └─ AccountForm.tsx
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ sites
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  └─ ui
│  │  │  │  │     └─ SitesDashboard.tsx
│  │  │  │  └─ stacks
│  │  │  │     ├─ page.tsx
│  │  │  │     └─ ui
│  │  │  │        └─ StacksDashboard.tsx
│  │  │  ├─ search
│  │  │  │  └─ page.tsx
│  │  │  ├─ thread
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx
│  │  │  ├─ wordrails
│  │  │  │  ├─ data.ts
│  │  │  │  └─ page.tsx
│  │  │  └─ workflows
│  │  │     ├─ [id]
│  │  │     │  └─ page.tsx
│  │  │     ├─ click-counter
│  │  │     │  └─ page.tsx
│  │  │     ├─ example
│  │  │     │  └─ page.tsx
│  │  │     ├─ new
│  │  │     │  └─ page.tsx
│  │  │     ├─ page.tsx
│  │  │     └─ templates
│  │  │        └─ page.tsx
│  │  └─ WebVitals.tsx
│  ├─ (server)
│  │  └─ sheafActions.ts
│  ├─ .well-known
│  │  └─ webfinger
│  │     └─ route.ts
│  ├─ _startup
│  │  └─ ludics-hooks.ts
│  ├─ admin
│  │  └─ sheaf
│  │     ├─ layout.tsx
│  │     └─ page.tsx
│  ├─ agora
│  │  ├─ LiveEventsProvider.tsx
│  │  ├─ agorastyles.css
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  ├─ threads
│  │  │  ├─ ThreadsClient.tsx
│  │  │  └─ page.tsx
│  │  └─ ui
│  │     ├─ Agora.tsx
│  │     ├─ EventCard.tsx
│  │     ├─ FiltersPanels.tsx
│  │     ├─ RightRail.tsx
│  │     ├─ StackSummaryCard.tsx
│  │     └─ TopBar.tsx
│  ├─ api
│  │  ├─ _cron
│  │  │  ├─ close_auctions
│  │  │  │  └─ route.ts
│  │  │  ├─ embed_retry_worker
│  │  │  │  └─ route.ts
│  │  │  └─ favorites_builder
│  │  │     └─ route.ts
│  │  ├─ _internal
│  │  │  └─ run_favorites_builder
│  │  │     └─ route.ts
│  │  ├─ _sheaf-acl-demo
│  │  │  ├─ _store.ts
│  │  │  ├─ _util.ts
│  │  │  ├─ admin
│  │  │  │  ├─ messages
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ forward-check
│  │  │  │  └─ route.ts
│  │  │  ├─ messages
│  │  │  │  └─ route.ts
│  │  │  └─ preview
│  │  │     └─ route.ts
│  │  ├─ af
│  │  │  ├─ explain
│  │  │  │  └─ route.ts
│  │  │  └─ stable
│  │  │     └─ route.ts
│  │  ├─ agora
│  │  │  ├─ events
│  │  │  │  └─ route.ts
│  │  │  ├─ network
│  │  │  │  └─ route.ts
│  │  │  ├─ sidebar
│  │  │  │  ├─ AgoraBlueprint.md
│  │  │  │  └─ route.ts
│  │  │  └─ threads
│  │  │     └─ route.ts
│  │  ├─ amplification-events
│  │  │  ├─ by-origin
│  │  │  │  └─ [originId]
│  │  │  │     └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ ap
│  │  │  └─ follow
│  │  │     └─ route.ts
│  │  ├─ argument-annotations
│  │  │  └─ route.ts
│  │  ├─ argument-edges
│  │  │  └─ [id]
│  │  │     └─ subtype
│  │  │        └─ route.ts
│  │  ├─ arguments
│  │  │  ├─ [id]
│  │  │  │  ├─ meta
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ qualifier
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  └─ batch
│  │  │     └─ route.ts
│  │  ├─ articles
│  │  │  ├─ [id]
│  │  │  │  ├─ (by-id)
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ (draft)
│  │  │  │  │  └─ draft
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ (publish)
│  │  │  │  │  └─ publish
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ (restore)
│  │  │  │  │  └─ restore
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ (revisions)
│  │  │  │  │  └─ revisions
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ threads
│  │  │  │     └─ route.ts
│  │  │  ├─ layout.tsx
│  │  │  ├─ mine
│  │  │  │  └─ route.ts
│  │  │  ├─ presign.ts
│  │  │  ├─ preview
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ attacks
│  │  │  └─ route.ts
│  │  ├─ auction
│  │  │  ├─ [id]
│  │  │  │  ├─ events
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ bid
│  │  │  │  └─ route.ts
│  │  │  ├─ create
│  │  │  │  └─ route.ts
│  │  │  └─ finalize
│  │  │     └─ route.ts
│  │  ├─ behaviors
│  │  │  ├─ arrow-check
│  │  │  │  └─ route.ts
│  │  │  ├─ function-space
│  │  │  │  └─ run
│  │  │  │     └─ route.ts
│  │  │  └─ scan-contradictions
│  │  │     └─ route.ts
│  │  ├─ blocks
│  │  │  ├─ [id]
│  │  │  │  ├─ fork
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ thumbnail
│  │  │  │     └─ route.ts
│  │  │  ├─ from-element
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ bridges
│  │  │  ├─ [id]
│  │  │  │  ├─ assign
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ complete
│  │  │  │     └─ route.ts
│  │  │  ├─ assignments
│  │  │  │  ├─ [id]
│  │  │  │  │  ├─ accept
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ complete
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ preview
│  │  │  │  └─ route.ts
│  │  │  └─ requests
│  │  │     ├─ [id]
│  │  │     │  └─ assign
│  │  │     │     └─ route.ts
│  │  │     └─ route.ts
│  │  ├─ briefs
│  │  │  ├─ [brief]
│  │  │  │  ├─ provenance
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ publish
│  │  │  │     └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ bus
│  │  │  ├─ sse
│  │  │  │  └─ route.ts
│  │  │  └─ subscribe
│  │  │     └─ route.ts
│  │  ├─ cart
│  │  │  ├─ add
│  │  │  │  └─ route.ts
│  │  │  ├─ checkout
│  │  │  │  └─ route.ts
│  │  │  ├─ count
│  │  │  │  └─ route.ts
│  │  │  ├─ expire
│  │  │  │  └─ route.ts
│  │  │  ├─ release
│  │  │  │  └─ route.ts
│  │  │  └─ view
│  │  │     └─ route.ts
│  │  ├─ citations
│  │  │  ├─ [id]
│  │  │  │  └─ verify
│  │  │  │     └─ route.ts
│  │  │  ├─ attach
│  │  │  │  └─ route.ts
│  │  │  ├─ batch
│  │  │  │  └─ route.ts
│  │  │  ├─ format
│  │  │  │  └─ route.ts
│  │  │  ├─ resolve
│  │  │  │  └─ route.ts
│  │  │  ├─ verify
│  │  │  │  └─ route.ts
│  │  │  └─ zotero
│  │  │     └─ import
│  │  │        └─ route.ts
│  │  ├─ claim-citations
│  │  │  └─ route.ts
│  │  ├─ claims
│  │  │  ├─ [id]
│  │  │  │  ├─ citations
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ cq
│  │  │  │  │  └─ summary
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ edges
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ evidence
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ grounds
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ rebut
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  ├─ threshold
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ top-argument
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ toulmin
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ warrant
│  │  │  │     └─ route.ts
│  │  │  ├─ batch
│  │  │  │  └─ route.ts
│  │  │  ├─ label
│  │  │  │  ├─ compute
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ labels
│  │  │  │  └─ route.ts
│  │  │  ├─ quick-create
│  │  │  │  └─ route.ts
│  │  │  ├─ route.ts
│  │  │  ├─ search
│  │  │  │  └─ route.ts
│  │  │  └─ summary
│  │  │     └─ route.ts
│  │  ├─ comment-threads
│  │  │  └─ [id]
│  │  │     └─ resolve
│  │  │        └─ route.ts
│  │  ├─ comments
│  │  │  ├─ [id]
│  │  │  │  ├─ reply
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ vote
│  │  │  │     └─ route.ts
│  │  │  ├─ lift
│  │  │  │  ├─ AgoraV0.5Roadmap.md
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ commitments
│  │  │  ├─ apply
│  │  │  │  └─ route.ts
│  │  │  ├─ contradictions
│  │  │  │  └─ route.ts
│  │  │  ├─ entitlement
│  │  │  │  └─ route.ts
│  │  │  └─ state
│  │  │     └─ route.ts
│  │  ├─ compose
│  │  │  └─ preflight
│  │  │     └─ route.ts
│  │  ├─ computeRoutes
│  │  │  └─ route.ts
│  │  ├─ connections
│  │  │  └─ info
│  │  │     └─ route.ts
│  │  ├─ content-status
│  │  │  └─ route.ts
│  │  ├─ conversations
│  │  │  ├─ [id]
│  │  │  │  ├─ bookmark
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ ensure-member
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ read
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ readers
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ stars
│  │  │  │     └─ route.ts
│  │  │  ├─ group
│  │  │  │  └─ route.ts
│  │  │  └─ list
│  │  │     └─ route.ts
│  │  ├─ cqs
│  │  │  ├─ attachments
│  │  │  │  └─ route.ts
│  │  │  ├─ route.ts
│  │  │  └─ toggle
│  │  │     └─ route.ts
│  │  ├─ debug
│  │  │  └─ db
│  │  │     └─ route.ts
│  │  ├─ decisions
│  │  │  └─ route.ts
│  │  ├─ deliberations
│  │  │  ├─ [id]
│  │  │  │  ├─ activity
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ aif
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ approvals
│  │  │  │  │  └─ summary
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ approve
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ arguments
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ bridges
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ cards
│  │  │  │  │  ├─ [cardId]
│  │  │  │  │  │  └─ warrant
│  │  │  │  │  │     └─ undercut
│  │  │  │  │  │        └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ ceg
│  │  │  │  │  └─ mini
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ claims
│  │  │  │  │  ├─ backfill
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ clusters
│  │  │  │  │  ├─ affinity
│  │  │  │  │  │  └─ recompute
│  │  │  │  │  │     └─ route.ts
│  │  │  │  │  ├─ recompute
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ cq
│  │  │  │  │  └─ summary
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ dialectic
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ digest
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ edges
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ graph
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ issues
│  │  │  │  │  ├─ [issueId]
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  ├─ counts
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ moves
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ prefs
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  ├─ rsa
│  │  │  │  │  ├─ :targetType
│  │  │  │  │  │  └─ :targetId
│  │  │  │  │  │     └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ timeline
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ topology
│  │  │  │  │  └─ summary
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ viewpoints
│  │  │  │     └─ select
│  │  │  │        └─ route.ts
│  │  │  ├─ ensure
│  │  │  │  └─ route.ts
│  │  │  ├─ route.ts
│  │  │  ├─ spawn
│  │  │  │  └─ route.ts
│  │  │  └─ upsert
│  │  │     └─ route.ts
│  │  ├─ dev
│  │  │  └─ verify
│  │  │     └─ route.ts
│  │  ├─ dialogue
│  │  │  ├─ answer-and-commit
│  │  │  │  └─ route.ts
│  │  │  ├─ commitments
│  │  │  │  └─ route.ts
│  │  │  ├─ forum
│  │  │  │  └─ route.ts
│  │  │  ├─ legal-attacks
│  │  │  │  └─ route.ts
│  │  │  ├─ legal-moves
│  │  │  │  └─ route.ts
│  │  │  ├─ move
│  │  │  │  └─ route.ts
│  │  │  ├─ moves
│  │  │  │  └─ route.ts
│  │  │  ├─ open-cqs
│  │  │  │  └─ route.ts
│  │  │  └─ panel
│  │  │     ├─ confirm
│  │  │     │  └─ route.ts
│  │  │     └─ delocate
│  │  │        └─ route.ts
│  │  ├─ dialogues
│  │  │  └─ [id]
│  │  │     └─ status
│  │  │        └─ route.ts
│  │  ├─ discussions
│  │  │  ├─ [id]
│  │  │  │  ├─ bridge
│  │  │  │  │  └─ promote
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ deliberations
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ forum
│  │  │  │     ├─ [commentId]
│  │  │  │     │  ├─ route.ts
│  │  │  │     │  ├─ save
│  │  │  │     │  │  └─ route.ts
│  │  │  │     │  └─ vote
│  │  │  │     │     └─ route.ts
│  │  │  │     ├─ me
│  │  │  │     │  └─ route.ts
│  │  │  │     └─ route.ts
│  │  │  ├─ ensure
│  │  │  │  └─ route.ts
│  │  │  ├─ list
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ drifts
│  │  │  ├─ [id]
│  │  │  │  └─ messages
│  │  │  │     └─ route.ts
│  │  │  ├─ list
│  │  │  │  └─ route.ts
│  │  │  ├─ query
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ embed
│  │  │  └─ route.ts
│  │  ├─ entail
│  │  │  └─ dialogical
│  │  │     ├─ route.ts
│  │  │     └─ visualize
│  │  │        └─ route.ts
│  │  ├─ eristic
│  │  │  └─ marks
│  │  │     └─ route.ts
│  │  ├─ escrow
│  │  │  └─ release
│  │  │     └─ route.ts
│  │  ├─ esp
│  │  │  └─ open
│  │  │     └─ route.ts
│  │  ├─ events
│  │  │  └─ route.ts
│  │  ├─ feed
│  │  │  ├─ [id]
│  │  │  │  └─ route.ts
│  │  │  ├─ delete
│  │  │  │  └─ route.ts
│  │  │  ├─ replicate
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ follow
│  │  │  └─ route.ts
│  │  ├─ geocode
│  │  │  └─ route.ts
│  │  ├─ get-participant-token
│  │  │  └─ route.ts
│  │  ├─ googleProxy
│  │  │  └─ route.ts
│  │  ├─ governance
│  │  │  └─ status
│  │  │     └─ route.ts
│  │  ├─ group-halfway
│  │  │  ├─ create
│  │  │  │  └─ route.ts
│  │  │  ├─ heatmap
│  │  │  │  └─ [id]
│  │  │  │     └─ route.ts
│  │  │  ├─ info
│  │  │  │  └─ [id]
│  │  │  │     └─ route.ts
│  │  │  ├─ origins
│  │  │  │  └─ [id]
│  │  │  │     └─ route.ts
│  │  │  └─ vote
│  │  │     └─ [id]
│  │  │        └─ route.ts
│  │  ├─ hub
│  │  │  └─ deliberations
│  │  │     └─ route.ts
│  │  ├─ integrations
│  │  │  └─ route.ts
│  │  ├─ knowledge-edges
│  │  │  └─ route.ts
│  │  ├─ labels
│  │  │  └─ route.ts
│  │  ├─ layout.tsx
│  │  ├─ ledger
│  │  │  └─ route.ts
│  │  ├─ library
│  │  │  ├─ import
│  │  │  │  └─ route.ts
│  │  │  ├─ post
│  │  │  │  └─ route.ts
│  │  │  ├─ search
│  │  │  │  └─ route.ts
│  │  │  ├─ status
│  │  │  │  └─ route.ts
│  │  │  └─ upload
│  │  │     └─ route.ts
│  │  ├─ livekit-token
│  │  │  └─ route.ts
│  │  ├─ loci
│  │  │  ├─ copy
│  │  │  │  └─ route.ts
│  │  │  ├─ instantiate
│  │  │  │  └─ route.ts
│  │  │  └─ saturate
│  │  │     └─ route.ts
│  │  ├─ ludics
│  │  │  ├─ acts
│  │  │  │  └─ route.ts
│  │  │  ├─ additive
│  │  │  │  └─ pick
│  │  │  │     └─ route.ts
│  │  │  ├─ compile
│  │  │  │  └─ route.ts
│  │  │  ├─ compile-step
│  │  │  │  └─ route.ts
│  │  │  ├─ concession
│  │  │  │  └─ route.ts
│  │  │  ├─ delocate
│  │  │  │  └─ route.ts
│  │  │  ├─ designs
│  │  │  │  └─ route.ts
│  │  │  ├─ examples
│  │  │  │  └─ dialogues-in-ludics
│  │  │  │     └─ route.ts
│  │  │  ├─ fax
│  │  │  │  ├─ branch
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ clone
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ judge
│  │  │  │  └─ force
│  │  │  │     └─ route.ts
│  │  │  ├─ orthogonal
│  │  │  │  └─ route.ts
│  │  │  ├─ step
│  │  │  │  └─ route.ts
│  │  │  └─ uniformity
│  │  │     └─ check
│  │  │        └─ route.ts
│  │  ├─ map
│  │  │  ├─ edges
│  │  │  │  └─ route.ts
│  │  │  ├─ nodes
│  │  │  │  └─ route.ts
│  │  │  └─ seed
│  │  │     └─ route.ts
│  │  ├─ market
│  │  │  ├─ [id]
│  │  │  │  ├─ resolve
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ trade
│  │  │  │     └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ me
│  │  │  └─ route.ts
│  │  ├─ messages
│  │  │  ├─ [id]
│  │  │  │  ├─ ack
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ bookmark
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ lock
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ receipts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ star
│  │  │  │     └─ route.ts
│  │  │  ├─ attachments
│  │  │  │  └─ [id]
│  │  │  │     └─ sign
│  │  │  │        └─ route.ts
│  │  │  ├─ ensureParticipant.ts
│  │  │  ├─ item
│  │  │  │  └─ [messageId]
│  │  │  │     └─ route.ts
│  │  │  ├─ messages
│  │  │  │  └─ receipts
│  │  │  └─ start
│  │  │     └─ route.ts
│  │  ├─ missing-premises
│  │  │  ├─ [id]
│  │  │  │  ├─ accept
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ decline
│  │  │  │     └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ monological
│  │  │  ├─ bridge
│  │  │  │  └─ route.ts
│  │  │  ├─ defaults
│  │  │  │  └─ route.ts
│  │  │  ├─ extract
│  │  │  │  └─ route.ts
│  │  │  ├─ slots
│  │  │  │  └─ route.ts
│  │  │  └─ telemetry
│  │  │     └─ route.ts
│  │  ├─ nearbyPlaces
│  │  │  └─ route.ts
│  │  ├─ nl
│  │  │  └─ normalize
│  │  │     └─ route.ts
│  │  ├─ nli
│  │  │  └─ batch
│  │  │     └─ route.ts
│  │  ├─ notifications
│  │  │  ├─ [id]
│  │  │  │  └─ route.ts
│  │  │  ├─ clear
│  │  │  │  └─ route.ts
│  │  │  ├─ read
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ orthogonality
│  │  │  └─ run
│  │  │     └─ route.ts
│  │  ├─ panels
│  │  │  ├─ [panelId]
│  │  │  │  ├─ close
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ decide
│  │  │  │     └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ party
│  │  │  ├─ [id]
│  │  │  │  └─ events
│  │  │  │     └─ route.ts
│  │  │  ├─ join
│  │  │  │  └─ route.ts
│  │  │  └─ leave
│  │  │     └─ route.ts
│  │  ├─ polls
│  │  │  ├─ [id]
│  │  │  │  └─ vote
│  │  │  │     └─ route.ts
│  │  │  ├─ query
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ portfolio
│  │  │  └─ export
│  │  │     └─ route.ts
│  │  ├─ profile
│  │  │  └─ deliberations
│  │  │     └─ route.ts
│  │  ├─ proposals
│  │  │  ├─ candidates
│  │  │  │  └─ route.ts
│  │  │  ├─ ensure
│  │  │  │  └─ route.ts
│  │  │  ├─ list
│  │  │  │  └─ route.ts
│  │  │  ├─ merge
│  │  │  │  └─ route.ts
│  │  │  └─ signal
│  │  │     └─ route.ts
│  │  ├─ random-rooms
│  │  │  └─ route.ts
│  │  ├─ random-secret
│  │  │  └─ route.ts
│  │  ├─ random-users
│  │  │  └─ route.ts
│  │  ├─ reactions
│  │  │  └─ route.ts
│  │  ├─ realtime-posts
│  │  │  ├─ [id]
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ recommendations
│  │  │  ├─ click
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ replicated-post
│  │  │  └─ route.ts
│  │  ├─ rooms
│  │  │  ├─ [id]
│  │  │  │  ├─ decentralise
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ status
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ export
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ kms
│  │  │  │  │  ├─ revoke
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ rotate
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ logbook
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ receipts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ settings
│  │  │  │  │  └─ representation-rule
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ usage
│  │  │  │     └─ route.ts
│  │  │  └─ import
│  │  │     ├─ restore.ts
│  │  │     └─ route.ts
│  │  ├─ routeMidpoint
│  │  │  └─ route.ts
│  │  ├─ schemes
│  │  │  ├─ instances
│  │  │  │  └─ route.ts
│  │  │  ├─ questions
│  │  │  │  └─ [id]
│  │  │  │     └─ counter
│  │  │  │        └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ semantics
│  │  │  ├─ hints
│  │  │  │  └─ route.ts
│  │  │  └─ lf
│  │  │     └─ route.ts
│  │  ├─ settings
│  │  │  └─ me
│  │  │     └─ route.ts
│  │  ├─ sheaf
│  │  │  ├─ _map.ts
│  │  │  ├─ _prisma.ts
│  │  │  ├─ _util.ts
│  │  │  ├─ forward-check
│  │  │  │  └─ route.ts
│  │  │  ├─ lists
│  │  │  │  └─ route.ts
│  │  │  ├─ messages
│  │  │  │  └─ route.ts
│  │  │  ├─ participants
│  │  │  │  └─ route.ts
│  │  │  ├─ preview
│  │  │  │  └─ route.ts
│  │  │  └─ upload
│  │  │     └─ route.ts
│  │  ├─ sheets
│  │  │  ├─ [id]
│  │  │  │  ├─ edges
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ nodes
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ sites
│  │  │  ├─ [id]
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ snapshots
│  │  │  └─ route.ts
│  │  ├─ stacks
│  │  │  ├─ [id]
│  │  │  │  └─ route.ts
│  │  │  ├─ route.ts
│  │  │  ├─ subscriptions
│  │  │  │  └─ route.ts
│  │  │  └─ summary
│  │  │     └─ route.ts
│  │  ├─ stall
│  │  │  └─ [id]
│  │  │     ├─ doc
│  │  │     │  └─ route.ts
│  │  │     └─ heat
│  │  │        └─ route.ts
│  │  ├─ stalls
│  │  │  └─ [stallId]
│  │  │     ├─ events
│  │  │     │  └─ route.ts
│  │  │     └─ items
│  │  │        ├─ [itemId]
│  │  │        │  └─ checkout
│  │  │        │     └─ route.ts
│  │  │        └─ route.ts
│  │  ├─ stripe
│  │  │  ├─ onboard
│  │  │  │  └─ route.ts
│  │  │  ├─ status
│  │  │  │  └─ route.ts
│  │  │  └─ webhook
│  │  │     └─ route.ts
│  │  ├─ suggested-friends
│  │  │  └─ route.ts
│  │  ├─ swapmeet
│  │  │  ├─ orders
│  │  │  │  └─ route.ts
│  │  │  └─ spawn
│  │  │     └─ route.ts
│  │  ├─ telemetry
│  │  │  └─ route.ts
│  │  ├─ theoryworks
│  │  │  ├─ [id]
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ threads
│  │  │  ├─ [id]
│  │  │  │  └─ resolve
│  │  │  │     └─ route.ts
│  │  │  └─ ensure
│  │  │     └─ route.ts
│  │  ├─ track
│  │  │  └─ route.ts
│  │  ├─ triggers
│  │  │  └─ webhook
│  │  │     └─ [workflowId]
│  │  │        └─ [secret]
│  │  │           └─ route.ts
│  │  ├─ uniformity
│  │  │  └─ check
│  │  │     └─ route.ts
│  │  ├─ uploadthing
│  │  │  ├─ core.ts
│  │  │  └─ route.ts
│  │  ├─ urns
│  │  │  └─ mint
│  │  │     └─ route.ts
│  │  ├─ user-attributes
│  │  │  ├─ route.ts
│  │  │  └─ search
│  │  │     └─ route.ts
│  │  ├─ users
│  │  │  └─ search
│  │  │     └─ route.ts
│  │  ├─ v2
│  │  │  ├─ discovery
│  │  │  │  ├─ candidates
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ feedback
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ why
│  │  │  │     └─ [targetId]
│  │  │  │        └─ route.ts
│  │  │  ├─ favorites
│  │  │  │  ├─ import
│  │  │  │  │  └─ spotify
│  │  │  │  │     ├─ route.ts
│  │  │  │  │     ├─ status
│  │  │  │  │     │  └─ route.ts
│  │  │  │  │     └─ summary
│  │  │  │  │        └─ route.ts
│  │  │  │  └─ spotify
│  │  │  │     ├─ status
│  │  │  │     │  └─ route.ts
│  │  │  │     └─ summary
│  │  │  │        └─ route.ts
│  │  │  ├─ music
│  │  │  │  └─ candidates
│  │  │  │     └─ route.ts
│  │  │  └─ people
│  │  │     └─ candidates
│  │  │        └─ route.ts
│  │  ├─ votes
│  │  │  ├─ [id]
│  │  │  │  └─ vote
│  │  │  │     └─ route.ts
│  │  │  ├─ sessions
│  │  │  │  └─ route.ts
│  │  │  └─ votes
│  │  │     └─ [id]
│  │  │        └─ close
│  │  │           └─ route.ts
│  │  ├─ wallet
│  │  │  └─ route.ts
│  │  ├─ workflow-broadcast
│  │  │  └─ route.ts
│  │  ├─ workflows
│  │  │  ├─ [id]
│  │  │  │  ├─ route.ts
│  │  │  │  └─ runs
│  │  │  │     └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ works
│  │  │  ├─ [id]
│  │  │  │  ├─ dn
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ dossier
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ hermeneutic
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ ih
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ integrity
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ ludics-testers
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ op
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ pascal
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ practical
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ promote-claim
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  ├─ slots
│  │  │  │  │  └─ promote
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ supplies
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ tc
│  │  │  │     └─ route.ts
│  │  │  ├─ by-ids
│  │  │  │  └─ route.ts
│  │  │  ├─ page.tsx
│  │  │  └─ route.ts
│  │  ├─ xref
│  │  │  └─ route.ts
│  │  └─ youtube-audio
│  │     └─ route.ts
│  ├─ article
│  │  ├─ (by-key)
│  │  │  └─ [key]
│  │  │     └─ page.tsx
│  │  ├─ article.templates.css
│  │  ├─ editor.global.css
│  │  ├─ layout.tsx
│  │  ├─ rhetoric.css
│  │  ├─ type-tokens.css
│  │  └─ type-utilities.css
│  ├─ article.templates.css
│  ├─ blocks
│  │  └─ [id]
│  │     └─ preview
│  │        └─ page.tsx
│  ├─ briefs
│  │  ├─ [slug]
│  │  │  └─ page.tsx
│  │  └─ layout.tsx
│  ├─ cancel
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ deliberation
│  │  ├─ [id]
│  │  │  ├─ forum
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ ui
│  │  │  │     └─ ForumLens.tsx
│  │  │  └─ page.tsx
│  │  ├─ components
│  │  │  ├─ DeliberationPage.tsx
│  │  │  └─ layout
│  │  │     └─ ReaderColumn.tsx
│  │  └─ layout.tsx
│  ├─ favicon.ico
│  ├─ fonts
│  │  └─ fonts.css
│  ├─ globals.css
│  ├─ group-halfway
│  │  ├─ [id]
│  │  │  ├─ page.tsx
│  │  │  └─ wizard.tsx
│  │  └─ layout.tsx
│  ├─ hub
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ ui
│  │     └─ Hub.tsx
│  ├─ ledger
│  │  └─ [id]
│  │     └─ page.tsx
│  ├─ m
│  │  ├─ [messageId]
│  │  │  └─ compare
│  │  │     └─ page.tsx
│  │  └─ layout.tsx
│  ├─ passport
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ verifier
│  │     └─ page.tsx
│  ├─ portfolio
│  │  ├─ [slug]
│  │  │  ├─ data
│  │  │  │  └─ route.ts
│  │  │  ├─ page.tsx
│  │  │  └─ tailwind.css
│  │  │     └─ route.ts
│  │  ├─ builder
│  │  │  ├─ BlockLibrary.tsx
│  │  │  ├─ ResizeHandle.tsx
│  │  │  ├─ RightPanelAccordians.tsx
│  │  │  ├─ page.tsx
│  │  │  └─ resize-handles.module.css
│  │  ├─ builder.global.css
│  │  └─ layout.tsx
│  ├─ providers.tsx
│  ├─ server
│  │  ├─ db
│  │  │  └─ tenant.ts
│  │  └─ rooms
│  │     └─ dao.ts
│  ├─ spotify
│  │  ├─ callback
│  │  │  ├─ DashboardCharts.tsx
│  │  │  └─ page.tsx
│  │  └─ layout.tsx
│  ├─ stacks
│  │  ├─ [slugOrId]
│  │  │  └─ page.tsx
│  │  └─ layout.tsx
│  ├─ success
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ swapmeet
│  │  ├─ api
│  │  │  ├─ chat
│  │  │  │  └─ route.ts
│  │  │  ├─ heatmap
│  │  │  │  └─ route.ts
│  │  │  ├─ items
│  │  │  │  └─ route.ts
│  │  │  ├─ my-stalls
│  │  │  │  └─ route.ts
│  │  │  ├─ offers
│  │  │  │  ├─ route.ts
│  │  │  │  └─ stream
│  │  │  │     └─ route.ts
│  │  │  ├─ section
│  │  │  │  └─ route.ts
│  │  │  ├─ spawn
│  │  │  │  └─ route.ts
│  │  │  ├─ stall
│  │  │  │  ├─ [id]
│  │  │  │  │  ├─ events
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  ├─ items
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  ├─ live
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  ├─ orders
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ viewers
│  │  │  │     └─ route.ts
│  │  │  ├─ stall-image
│  │  │  │  └─ route.ts
│  │  │  └─ teleport
│  │  │     └─ route.ts
│  │  ├─ auctions
│  │  │  └─ page.tsx
│  │  ├─ components
│  │  │  ├─ AnimatedBoard.tsx
│  │  │  ├─ AuctionBar.tsx
│  │  │  ├─ AuctionCard.tsx
│  │  │  ├─ BuyNowButton.tsx
│  │  │  ├─ ChatPane.tsx
│  │  │  ├─ CreateAuctionDialog.tsx
│  │  │  ├─ EdgeNav.tsx
│  │  │  ├─ ImageCarousel.tsx
│  │  │  ├─ ItemsPane.tsx
│  │  │  ├─ Minimap.tsx
│  │  │  ├─ NavArrow.tsx
│  │  │  ├─ NavHook.tsx
│  │  │  ├─ NickCompleter.tsx
│  │  │  ├─ OfferLadder.tsx
│  │  │  ├─ ReviewPane.tsx
│  │  │  ├─ StallCard.tsx
│  │  │  ├─ StallGrid.tsx
│  │  │  ├─ StallSheet.tsx
│  │  │  ├─ TeleportButton.tsx
│  │  │  ├─ ThumbPad.tsx
│  │  │  ├─ TrackGrid.tsx
│  │  │  ├─ VideoPane.tsx
│  │  │  ├─ dashboard
│  │  │  │  ├─ LivePanel.tsx
│  │  │  │  └─ LivePanelClient.tsx
│  │  │  ├─ useArrowNav.ts
│  │  │  └─ useMove.ts
│  │  ├─ dashboard
│  │  │  └─ stalls
│  │  │     └─ page.tsx
│  │  ├─ layout.tsx
│  │  ├─ market
│  │  │  └─ [x]
│  │  │     └─ [y]
│  │  │        ├─ loading.tsx
│  │  │        └─ page.tsx
│  │  ├─ page.tsx
│  │  └─ stall
│  │     ├─ [id]
│  │     │  ├─ dashboard
│  │     │  │  └─ page.tsx
│  │     │  ├─ layout.tsx
│  │     │  └─ page.tsx
│  │     └─ layout.tsx
│  ├─ users
│  │  └─ [handle]
│  │     ├─ followers
│  │     │  └─ route.ts
│  │     ├─ inbox
│  │     │  └─ route.ts
│  │     ├─ outbox
│  │     │  └─ route.ts
│  │     └─ route.ts
│  └─ works
│     ├─ [id]
│     │  └─ page.tsx
│     ├─ layout.tsx
│     └─ page.tsx
├─ apply_copy_module.py
├─ apply_room_shards_drop.py
├─ apps
│  ├─ builder
│  │  └─ __tests__
│  │     └─ embed.spec.ts
│  └─ web
│     └─ src
│        └─ components
│           └─ modals
│              └─ ResolveMarketDialog.tsx
├─ backup.dump
├─ components
│  ├─ @modal
│  │  ├─ (.)article
│  │  │  └─ [slug]
│  │  │     └─ page.tsx
│  │  └─ default.tsx
│  ├─ AttackSubtypePicker.tsx
│  ├─ CartButton.tsx
│  ├─ DefaultRuleEditor.tsx
│  ├─ Discovery
│  │  └─ CardStack.tsx
│  ├─ GridNavControls.tsx
│  ├─ GroupHalfwayMap.tsx
│  ├─ HeatWidget.tsx
│  ├─ ImageDropzone.tsx
│  ├─ Minimap.tsx
│  ├─ NotificationBell.tsx
│  ├─ PartyOverlay.tsx
│  ├─ PresenceBadge.tsx
│  ├─ PrivateChatPane.tsx
│  ├─ SkeletonSquare.tsx
│  ├─ TimeRemaining.tsx
│  ├─ actions
│  │  └─ openDiscussion.ts
│  ├─ af
│  ├─ agora
│  │  ├─ ArgumentPopout.tsx
│  │  ├─ DebateSheetReader.tsx
│  │  └─ Plexus.tsx
│  ├─ article
│  │  ├─ ArticleActions.tsx
│  │  ├─ ArticleCard.tsx
│  │  ├─ ArticleEditor.tsx
│  │  ├─ ArticleReader.tsx
│  │  ├─ ArticleReaderWithPins.tsx
│  │  ├─ CommentModal.tsx
│  │  ├─ CommentSidebar.tsx
│  │  ├─ DeepDiveBackground.tsx
│  │  ├─ Editor.tsx
│  │  ├─ HeroRenderer.tsx
│  │  ├─ SectionState.tsx
│  │  ├─ article.annotations.css
│  │  ├─ article.module.scss
│  │  ├─ editor
│  │  │  ├─ Outline.tsx
│  │  │  ├─ SlashCommand.tsx
│  │  │  ├─ TemplateSelector.tsx
│  │  │  └─ Toolbar.tsx
│  │  ├─ extensions
│  │  │  ├─ font-family.ts
│  │  │  └─ font-size.ts
│  │  └─ templates.ts
│  ├─ blocks
│  │  ├─ BlockPreviewClient.tsx
│  │  └─ EmbedBlock.tsx
│  ├─ bridge
│  │  ├─ BridgeInbox.tsx
│  │  ├─ RequestBridgeButton.tsx
│  │  └─ SummaryComposer.tsx
│  ├─ briefs
│  │  ├─ BriefCompiler.tsx
│  │  ├─ BriefDiffViewer.tsx
│  │  ├─ BriefViewer.tsx
│  │  ├─ DiffSection.tsx
│  │  └─ ProvenanceRibbon.tsx
│  ├─ buttons
│  │  ├─ ArticlePortal.tsx
│  │  ├─ DeleteButton.tsx
│  │  ├─ DeleteCardButton.tsx
│  │  ├─ EditButton.tsx
│  │  ├─ ExpandButton.tsx
│  │  ├─ FollowButton.tsx
│  │  ├─ GenerateButton.tsx
│  │  ├─ HomeButton.tsx
│  │  ├─ LikeButton.tsx
│  │  ├─ LockButton.tsx
│  │  ├─ MessageButton.tsx
│  │  ├─ NodeDropdown.tsx
│  │  ├─ ReplicateButton.tsx
│  │  ├─ ReplyButton.tsx
│  │  ├─ SearchFollowButton.tsx
│  │  ├─ ShareButton.tsx
│  │  ├─ SitesPortal.tsx
│  │  ├─ StacksPortal.tsx
│  │  └─ TimerButton.tsx
│  ├─ cards
│  │  ├─ DrawCanvas.tsx
│  │  ├─ EmbeddedCanvas.tsx
│  │  ├─ EntropyCard.tsx
│  │  ├─ GalleryCarousel.tsx
│  │  ├─ ImageCard.tsx
│  │  ├─ LibraryCard.tsx
│  │  ├─ LivechatCard.tsx
│  │  ├─ NewEdgeTest-RegularRounded.otf
│  │  ├─ NewEdgeTest-SemiboldRounded.otf
│  │  ├─ PortfolioCard.tsx
│  │  ├─ PostCard.tsx
│  │  ├─ PredictionMarketCard.tsx
│  │  ├─ ProductReviewCard.tsx
│  │  ├─ Repeater.exp.tsx
│  │  ├─ Repeater.lite.tsx
│  │  ├─ Repeater.tsx
│  │  ├─ ReplicatedPostCard.tsx
│  │  ├─ StackCarousel.tsx
│  │  ├─ ThreadCard.tsx
│  │  ├─ UserCard.tsx
│  │  └─ helpers
│  │     └─ slideVariants.ts
│  ├─ cart
│  │  └─ CartDrawer.tsx
│  ├─ chat
│  │  ├─ ChatRoom.tsx
│  │  ├─ ConversationList.tsx
│  │  ├─ ConversationView.tsx
│  │  ├─ DriftChip.tsx
│  │  ├─ DriftPane.tsx
│  │  ├─ GroupCreationModal.tsx
│  │  ├─ LinkCard.tsx
│  │  ├─ MessageActions.tsx
│  │  ├─ MessageComposer.tsx
│  │  ├─ MessageListVirtual.tsx
│  │  ├─ MessageUserModal.tsx
│  │  ├─ MessagesRealtimeBootstrap.tsx
│  │  ├─ MessengerPane.tsx
│  │  ├─ PollChip.tsx
│  │  ├─ PrivateChatDock.tsx
│  │  ├─ PrivateChatShell.tsx
│  │  ├─ QuickPollComposer.tsx
│  │  ├─ QuickPollModal.tsx
│  │  ├─ QuickTempModal.tsx
│  │  ├─ QuoteBlock.tsx
│  │  ├─ StarToggle.tsx
│  │  └─ StarredFilterToggle.tsx
│  ├─ citations
│  │  ├─ CitationsLiveRefresher.tsx
│  │  ├─ CitePicker.tsx
│  │  ├─ CitePickerInline.tsx
│  │  ├─ CitePickerInlinePro.tsx
│  │  ├─ CitePickerModal.tsx
│  │  ├─ LibrarySearchModal.tsx
│  │  ├─ SourceChip.tsx
│  │  └─ SourcesSidebar.tsx
│  ├─ cite
│  │  └─ SchemePicker.tsx
│  ├─ claims
│  │  ├─ ClaimMiniMap.tsx
│  │  ├─ ConfirmEpistemicButton.tsx
│  │  ├─ CriticalQuestions.tsx
│  │  └─ PromoteToClaimButton.tsx
│  ├─ common
│  │  ├─ DeliberationButton.tsx
│  │  └─ OpenInDiscussionsButton.tsx
│  ├─ compose
│  │  └─ TheoryFraming.tsx
│  ├─ cq
│  │  └─ useCQSummaryBatch.ts
│  ├─ cursors
│  │  ├─ Cursor.tsx
│  │  ├─ LiveCursors.tsx
│  │  └─ OwnCursor.tsx
│  ├─ dashboard
│  │  ├─ AddItemModal.tsx
│  │  ├─ DashboardShell.tsx
│  │  ├─ ItemsPanel.tsx
│  │  ├─ OrdersPanel.tsx
│  │  └─ PayoutsPanel.tsx
│  ├─ decision
│  │  ├─ DecisionBanner.tsx
│  │  ├─ ReceiptCard.tsx
│  │  └─ VoteWidget.tsx
│  ├─ deepdive
│  │  ├─ AddGroundRebut.tsx
│  │  ├─ ApprovalsHeatStrip.tsx
│  │  ├─ ArgumentsList.tsx
│  │  ├─ CQBar.tsx
│  │  ├─ CardComposerTab.tsx
│  │  ├─ CardList.tsx
│  │  ├─ CardListVirtuoso.tsx
│  │  ├─ CegMiniMap.tsx
│  │  ├─ ChallengeWarrantCard.tsx
│  │  ├─ ClaimsVirtuoso.tsx
│  │  ├─ DeepDivePanel.tsx
│  │  ├─ DeepDivePanelClient.tsx
│  │  ├─ DeliberationComposer.tsx
│  │  ├─ DialogueTimeline.tsx
│  │  ├─ EnthymemeNudge.tsx
│  │  ├─ IssueRegister.tsx
│  │  ├─ LudicsPanel.tsx
│  │  ├─ RepresentativeViewpoints.tsx
│  │  ├─ RhetoricLensToggle.tsx
│  │  ├─ StartDeepDive.tsx
│  │  ├─ TopologyWidget.tsx
│  │  ├─ ToulminMini.tsx
│  │  ├─ WhyButton.tsx
│  │  └─ WhyQueue.tsx
│  ├─ dialogue
│  │  ├─ CommitmentDelta.tsx
│  │  ├─ CommitmentsPopover.tsx
│  │  ├─ DialogicalPanel.tsx
│  │  ├─ DialogueMoves.tsx
│  │  ├─ DialogueTargetContext.tsx
│  │  ├─ FogForNodesClient.ts
│  │  ├─ ForceChip.tsx
│  │  ├─ InlineMoveForm.tsx
│  │  ├─ LegalMoveChips.tsx
│  │  ├─ LegalMoveToolbar.tsx
│  │  ├─ LudicsBadge.tsx
│  │  ├─ NLCommitPopover.tsx
│  │  ├─ SuggestedAttacks.tsx
│  │  ├─ WinningnessBadge.tsx
│  │  ├─ command-card
│  │  │  ├─ CommandCard.tsx
│  │  │  ├─ adapters.ts
│  │  │  └─ types.ts
│  │  ├─ minimap
│  │  │  ├─ AFMinimap.tsx
│  │  │  └─ types.ts
│  │  ├─ narrateTrace.ts
│  │  ├─ normalizeNL.ts
│  │  ├─ useDialogueMoves.ts
│  │  ├─ useGraphAF.ts
│  │  ├─ useLegalMoves.ts
│  │  ├─ useLudicsPhase.ts
│  │  └─ useSemanticsHints.ts
│  ├─ discussion
│  │  ├─ DeliberateButton.tsx
│  │  ├─ DiscussionContext.tsx
│  │  ├─ DiscussionView.tsx
│  │  ├─ FX.tsx
│  │  ├─ ForumPane.tsx
│  │  ├─ ForumRulesCard.tsx
│  │  └─ ThreadListSidebar.tsx
│  ├─ edges
│  │  └─ DefaultEdge.tsx
│  ├─ engine
│  │  └─ CompositionModeToggle.tsx
│  ├─ entail
│  │  └─ EntailmentWidget.tsx
│  ├─ feed
│  │  └─ WhyThis.tsx
│  ├─ forms
│  │  ├─ AccountProfile.tsx
│  │  ├─ Comment.tsx
│  │  ├─ CreateFeedPost.tsx
│  │  ├─ CreateLounge.tsx
│  │  ├─ CreateLoungePost.tsx
│  │  ├─ CreatePredictionPost.tsx
│  │  ├─ CreateRoom.tsx
│  │  ├─ EntropyNodeForm.tsx
│  │  ├─ GalleryNodeForm.tsx
│  │  ├─ ImageNodeForm.tsx
│  │  ├─ LivechatNodeForm.tsx
│  │  ├─ MusicNodeForm.tsx
│  │  ├─ PdfViewerNodeForm.tsx
│  │  ├─ PortalNodeForm.tsx
│  │  ├─ PortfolioNodeForm.tsx
│  │  ├─ PostThread.tsx
│  │  ├─ ProductReviewNodeForm.tsx
│  │  ├─ RoomCanvasForm.tsx
│  │  ├─ SetPostDuration.tsx
│  │  ├─ SplineViewerNodeForm.tsx
│  │  ├─ StallForm.tsx
│  │  ├─ TextNodeForm.tsx
│  │  └─ YoutubeNodeForm.tsx
│  ├─ forum
│  │  └─ ForumTab.tsx
│  ├─ gitchat
│  │  └─ ReceiptChip.tsx
│  ├─ governance
│  │  ├─ RoomLogbookFeed.tsx
│  │  ├─ StatusChip.tsx
│  │  └─ StatusDropdown.tsx
│  ├─ graph
│  │  ├─ AFLens.tsx
│  │  ├─ BipolarLens.tsx
│  │  ├─ CapsuleOverlay.tsx
│  │  ├─ CyCanvas.tsx
│  │  ├─ GraphHeaderValueToggle.tsx
│  │  ├─ GraphPanel.tsx
│  │  ├─ HullOverlay.tsx
│  │  ├─ Overlays
│  │  │  └─ SchemaOverlay.tsx
│  │  ├─ SchemeOverlayFetch.tsx
│  │  ├─ Toolbar.tsx
│  │  └─ useCegData.ts
│  ├─ help
│  │  ├─ HelpModal.tsx
│  │  ├─ HelpPage.tsx
│  │  └─ RepresentativeViewpointsHelp.md
│  ├─ hermeneutic
│  │  └─ HermeneuticBuilder.tsx
│  ├─ hooks
│  │  ├─ MousePosition.tsx
│  │  ├─ useBusEffect.ts
│  │  └─ useBusMutate.ts
│  ├─ ids
│  │  └─ CopyUrnButton.tsx
│  ├─ integrity
│  │  ├─ IntegrityBadge.tsx
│  │  └─ WorkIntegrityBadge.tsx
│  ├─ issues
│  │  ├─ IssueBadge.tsx
│  │  ├─ IssueComposer.tsx
│  │  ├─ IssueDetail.tsx
│  │  └─ IssuesDrawer.tsx
│  ├─ ludics
│  │  ├─ BehaviourHUD.tsx
│  │  ├─ BehaviourInspectorCard.tsx
│  │  ├─ LociTreeWithControls.tsx
│  │  ├─ LocusControls.tsx
│  │  ├─ TensorProbeCard.tsx
│  │  └─ UniformityPill.tsx
│  ├─ map
│  │  ├─ AnchorToMapButton.tsx
│  │  ├─ DiagramView.tsx
│  │  ├─ MapCanvas.tsx
│  │  ├─ NegotiationDrawer.tsx
│  │  └─ NegotiationDrawerV2.tsx
│  ├─ modals
│  │  ├─ ArticlePostModal.tsx
│  │  ├─ CollageCreationModal.tsx
│  │  ├─ CollageModal.tsx
│  │  ├─ ConnectAccountModal.tsx
│  │  ├─ EntropyNodeModal.tsx
│  │  ├─ GalleryNodeModal.tsx
│  │  ├─ ImageNodeModal.tsx
│  │  ├─ IntegrationConfigModal.tsx
│  │  ├─ LibraryPostModal.tsx
│  │  ├─ LivechatNodeModal.tsx
│  │  ├─ Modal.tsx
│  │  ├─ MusicNodeModal.tsx
│  │  ├─ PdfLightbox.tsx
│  │  ├─ PdfViewerNodeModal.tsx
│  │  ├─ PortalNodeModal.tsx
│  │  ├─ PortfolioModal.tsx
│  │  ├─ PortfolioNodeModal.tsx
│  │  ├─ PortfolioSiteBuilderModal.tsx
│  │  ├─ PredictionMarketModal.tsx
│  │  ├─ ProductPhotoGalleryModal.tsx
│  │  ├─ ProductReviewNodeModal.tsx
│  │  ├─ ResolveMarketDialog.tsx
│  │  ├─ RoomCanvasModal.tsx
│  │  ├─ SendEmailModal.tsx
│  │  ├─ ShareCanvasModal.tsx
│  │  ├─ SharePostModal.tsx
│  │  ├─ ShareRoomModal.tsx
│  │  ├─ SplineViewerNodeModal.tsx
│  │  ├─ StackAddModal.tsx
│  │  ├─ TextNodeModal.tsx
│  │  ├─ TimerModal.tsx
│  │  ├─ TradePredictionModal.tsx
│  │  ├─ UserRoomsModal.tsx
│  │  ├─ ViewGalleryModal.tsx
│  │  ├─ ViewImageModal.tsx
│  │  └─ YoutubeNodeModal.tsx
│  ├─ monological
│  │  ├─ InlineSlotEditor.tsx
│  │  ├─ MonologicalToolbar.tsx
│  │  ├─ QualityBadge.tsx
│  │  ├─ QualityBadgeBreakdown.tsx
│  │  ├─ QuantifierModalityPicker.tsx
│  │  └─ ToulminBox.tsx
│  ├─ nodes
│  │  ├─ AudioNode.tsx
│  │  ├─ BaseNode.tsx
│  │  ├─ CodeNode.tsx
│  │  ├─ CollageNode.tsx
│  │  ├─ DocumentNode.tsx
│  │  ├─ DrawNode.tsx
│  │  ├─ EntropyNode.tsx
│  │  ├─ GalleryNode.tsx
│  │  ├─ ImageComputeNode.tsx
│  │  ├─ ImageURLNode.tsx
│  │  ├─ LLMInstructionNode.tsx
│  │  ├─ LiveStreamNode.tsx
│  │  ├─ LivechatNode.tsx
│  │  ├─ MusicNode.tsx
│  │  ├─ PortalNode.tsx
│  │  ├─ PortfolioNode.tsx
│  │  ├─ ProductReviewNode.tsx
│  │  ├─ RoomCanvasNode.tsx
│  │  ├─ TextInputNode.tsx
│  │  ├─ ThreadNode.tsx
│  │  └─ YoutubeNode.tsx
│  ├─ pageflow
│  │  └─ PageFlowBuilder.tsx
│  ├─ pascal
│  │  └─ PascalBuilder.tsx
│  ├─ players
│  │  └─ SoundCloudPlayer.tsx
│  ├─ portfolio
│  │  ├─ AutoInspector.tsx
│  │  ├─ EmbedEnv.tsx
│  │  ├─ GalleryInspector.tsx
│  │  ├─ GalleryPropsPanel.tsx
│  │  ├─ RepeaterInspector.tsx
│  │  └─ RepeaterPropsPanel.tsx
│  ├─ practical
│  │  ├─ PracticalBuilder.tsx
│  │  ├─ PracticalLedger.tsx
│  │  └─ PracticalSummary.tsx
│  ├─ proposals
│  │  └─ ProposalsCompareModal.tsx
│  ├─ reactflow
│  │  ├─ NodeAuthorDisplay.tsx
│  │  ├─ NodeButtons.tsx
│  │  └─ Room.tsx
│  ├─ reactions
│  │  ├─ EmojiReactions.tsx
│  │  ├─ ReactionBar.tsx
│  │  ├─ ReactionSummary.tsx
│  │  └─ ReactionTrigger.tsx
│  ├─ rhetoric
│  │  ├─ EmotionBadge.tsx
│  │  ├─ FallacyBadge.tsx
│  │  ├─ FrameChips.tsx
│  │  ├─ MethodChip.tsx
│  │  ├─ MiniStructureBox.tsx
│  │  ├─ MixBadge.tsx
│  │  ├─ MixDebug.tsx
│  │  ├─ RhetoricContext.tsx
│  │  ├─ RhetoricControls.tsx
│  │  ├─ RhetoricHtml.tsx
│  │  ├─ RhetoricLensBlock.tsx
│  │  ├─ RhetoricText.tsx
│  │  ├─ SaveHighlights.tsx
│  │  ├─ SchemeCues.tsx
│  │  ├─ SourceQualityBadge.tsx
│  │  ├─ StyleDensityBadge.tsx
│  │  ├─ detect.ts
│  │  ├─ detectors.ts
│  │  ├─ lexiconAnalyzers.ts
│  │  ├─ lexicons
│  │  │  ├─ emotionLex.ts
│  │  │  ├─ framesLex.ts
│  │  │  └─ liwcLite.ts
│  │  ├─ nlpLite.ts
│  │  ├─ schemeSignals.ts
│  │  └─ styleStats.ts
│  ├─ rooms
│  │  ├─ RepresentationRuleSetting.tsx
│  │  ├─ RoomLogbookFeed.tsx
│  │  └─ useDecentraliseStatus.ts
│  ├─ shared
│  │  ├─ AboutTab.tsx
│  │  ├─ AuthProvider.tsx
│  │  ├─ Bottombar.tsx
│  │  ├─ CommentTree.tsx
│  │  ├─ DnDSidebar.tsx
│  │  ├─ FriendsTab.tsx
│  │  ├─ HamburgerMenu.tsx
│  │  ├─ LeftSidebar.tsx
│  │  ├─ MessagesTab.tsx
│  │  ├─ NodeSidebar.tsx
│  │  ├─ Pagination.tsx
│  │  ├─ Parabole-DisplayRegular.woff2
│  │  ├─ ProfileHeader.tsx
│  │  ├─ RealtimeFeed.tsx
│  │  ├─ RealtimePostsTab.tsx
│  │  ├─ RightSidebar.tsx
│  │  ├─ ScrollAnalytics.tsx
│  │  ├─ ScrollList.tsx
│  │  ├─ Searchbar.tsx
│  │  ├─ ThreadsTab.tsx
│  │  └─ Topbar.tsx
│  ├─ sheaf
│  │  ├─ AttachmentList.tsx
│  │  ├─ AudiencePickers.tsx
│  │  ├─ ConflictBanner.tsx
│  │  ├─ FacetChipBar.tsx
│  │  ├─ FacetEditor.tsx
│  │  ├─ FacetEditorTabs.tsx
│  │  ├─ SheafComposer.tsx
│  │  ├─ SheafFacetPills.tsx
│  │  ├─ SheafMessageBubble.tsx
│  │  ├─ ViewAsBar.tsx
│  │  └─ ViewAsMenu.tsx
│  ├─ stack
│  │  ├─ CommentComposer.tsx
│  │  ├─ LiftToDebateButton.tsx
│  │  ├─ SortablePdfGrid.tsx
│  │  └─ StackDiscussion.tsx
│  ├─ threejs
│  │  ├─ BackgroundCanvas.tsx
│  │  └─ backdropPlane
│  │     ├─ BackdropPlane.tsx
│  │     ├─ backdropPlane.frag
│  │     └─ backdropPlane.vert
│  ├─ ui
│  │  ├─ AnimatedDialog.tsx
│  │  ├─ Chip.tsx
│  │  ├─ FancyScroller.tsx
│  │  ├─ ScrollReveal.tsx
│  │  ├─ SkeletonB.tsx
│  │  ├─ accordion.tsx
│  │  ├─ alert.tsx
│  │  ├─ badge.tsx
│  │  ├─ button.tsx
│  │  ├─ card.tsx
│  │  ├─ chat-message.tsx
│  │  ├─ checkbox.tsx
│  │  ├─ collapsible.tsx
│  │  ├─ command.tsx
│  │  ├─ commenttextarea.tsx
│  │  ├─ dialog.tsx
│  │  ├─ dropdown-menu.tsx
│  │  ├─ form.tsx
│  │  ├─ input.tsx
│  │  ├─ label.tsx
│  │  ├─ markdown-content.tsx
│  │  ├─ multiselect.tsx
│  │  ├─ select.tsx
│  │  ├─ sheet.tsx
│  │  ├─ skeleton.tsx
│  │  ├─ slider.tsx
│  │  ├─ spinner-blue.tsx
│  │  ├─ spinner.tsx
│  │  ├─ switch.tsx
│  │  ├─ tabs.tsx
│  │  ├─ textarea.tsx
│  │  └─ tooltip.tsx
│  ├─ views
│  │  ├─ SequentBadge.tsx
│  │  ├─ SequentDetails.tsx
│  │  ├─ useNliSequent.ts
│  │  └─ useSequentStatus.ts
│  ├─ work
│  │  ├─ ClaimCiteText.tsx
│  │  ├─ CompareAlternativesPanel.tsx
│  │  ├─ EvaluationSheet.tsx
│  │  ├─ PromoteSlotButton.tsx
│  │  ├─ SelectionPromoteBar.tsx
│  │  ├─ SupplyAuthoringInline.tsx
│  │  ├─ SupplyDrawer.tsx
│  │  ├─ WorkDetailClient.tsx
│  │  ├─ WorkHeaderBar.tsx
│  │  ├─ WorksList.tsx
│  │  ├─ WorksRail.tsx
│  │  └─ editors
│  │     ├─ DNThesesEditor.tsx
│  │     ├─ IHThesesEditor.tsx
│  │     ├─ OPThesesEditor.tsx
│  │     ├─ TCThesesEditor.tsx
│  │     └─ slot-helpers.ts
│  ├─ workflow
│  │  ├─ CustomNodes.tsx
│  │  ├─ DynamicForm.tsx
│  │  ├─ IntegrationButtons.tsx
│  │  ├─ NewWorkflowClient.tsx
│  │  ├─ ScheduleForm.tsx
│  │  ├─ TemplatePicker.tsx
│  │  ├─ WorkflowBuilder.tsx
│  │  ├─ WorkflowExecutionContext.tsx
│  │  ├─ WorkflowRunner.tsx
│  │  ├─ WorkflowSidePanel.tsx
│  │  ├─ WorkflowViewer.tsx
│  │  └─ examples
│  │     ├─ CounterOutputExample.tsx
│  │     ├─ GmailFlowExample.tsx
│  │     ├─ RandomDataPlotExample.tsx
│  │     └─ TriggerButtonExample.tsx
│  └─ xref
│     └─ Backlinks.tsx
├─ components.json
├─ config
│  ├─ chip_templates.json
│  ├─ explain_map.json
│  └─ flags.ts
├─ constants
│  └─ index.ts
├─ contexts
│  ├─ PrivateChatManager.tsx
│  └─ useChatStore.ts
├─ database
│  └─ migrations
│     ├─ 20250716_edge_logs.sql
│     ├─ 20250801_swapmeet_initial.sql
│     ├─ 20250802_swapmeet_offers_orders.sql
│     ├─ 20260101_lock_wallet.sql
│     ├─ 20260820_swapmeet_heatmap.sql
│     ├─ 20260901_swapmeet_images.sql
│     ├─ 20260921000000_add_stall_updated.sql
│     └─ 20261013000000_add_market_closed_at.sql
├─ docker-compose.yml
├─ docs
│  ├─ CHANGELOG.md
│  ├─ analytics.md
│  ├─ explainability.md
│  ├─ favorites_builder.md
│  ├─ feedback-swipes.md
│  ├─ integration_automation_notes.md
│  ├─ integrations.md
│  ├─ ranker.md
│  ├─ realtime-crdt.md
│  └─ workflows.md
├─ engine
│  └─ presets
│     └─ dialogical.ts
├─ fix-compare-modal.patch
├─ fix-comparison-modal.patch
├─ fonts
│  ├─ BugrinoTrials-Regular.otf
│  ├─ KaTeX_Script-Regular.woff2
│  ├─ KoloniaTrial-Regular.woff2
│  ├─ MediaanTrial-Regular.woff2
│  ├─ NewEdgeTest-RegularRounded.otf
│  ├─ Parabole-DisplayRegular.woff2
│  ├─ TestFoundersGroteskText-Regular.otf
│  ├─ inter-all-400-normal.4c1f8a0d.woff
│  └─ test-founders-grotesk-x-condensed-regular.woff2
├─ functions
│  └─ queueReembed
│     └─ index.ts
├─ hooks
│  ├─ useBookmarks.ts
│  ├─ useConversationRealtime.ts
│  ├─ useGridNavigator.ts
│  ├─ useKeyPress.ts
│  ├─ useMarket.ts
│  ├─ useNotifications.ts
│  ├─ usePrivateChatSocket.ts
│  ├─ useReceipts.tsx
│  ├─ useSafeForward.ts
│  ├─ useSelectionRects.ts
│  ├─ useSheafPreview.ts
│  ├─ useStallPresence.ts
│  ├─ useStars.ts
│  └─ useUserInbox.ts
├─ infra
│  └─ aurora_media
│     ├─ main.tf
│     ├─ outputs.tf
│     └─ variables.tf
├─ integrations
│  ├─ AnalyticsIntegration.ts
│  ├─ GmailIntegration.ts
│  ├─ GoogleSheetsIntegration.ts
│  ├─ SlackIntegration.ts
│  └─ index.ts
├─ jest
│  └─ __mocks__
│     ├─ @pinecone-database
│     │  └─ pinecone-client-node.ts
│     └─ pg.ts
├─ jest.config.ts
├─ jest.setup.ts
├─ jobs
│  ├─ embed_retry_worker.ts
│  └─ favorites_builder.ts
├─ keys.txt
├─ lib
│  ├─ AuthContext.ts
│  ├─ MultiSelectFunctions.ts
│  ├─ actions
│  │  ├─ auction.server.ts
│  │  ├─ blocks.actions.ts
│  │  ├─ cart.server.ts
│  │  ├─ conversation.actions.ts
│  │  ├─ deepseek.actions.ts
│  │  ├─ feed.actions.ts
│  │  ├─ feed.client.ts
│  │  ├─ feedpost.actions.ts
│  │  ├─ follow.actions.ts
│  │  ├─ friend-suggestions.actions.ts
│  │  ├─ github.actions.ts
│  │  ├─ gmail.actions.ts
│  │  ├─ googleSheets.actions.ts
│  │  ├─ integration.actions.ts
│  │  ├─ like.actions.ts
│  │  ├─ llm.actions.ts
│  │  ├─ message.actions.ts
│  │  ├─ notification.actions.ts
│  │  ├─ offer.server.ts
│  │  ├─ offerCart.server.ts
│  │  ├─ poll.actions.ts
│  │  ├─ portfolio.actions.ts
│  │  ├─ prediction.actions.ts
│  │  ├─ productreview.actions.ts
│  │  ├─ realtimeedge.actions.ts
│  │  ├─ realtimepost.actions.ts
│  │  ├─ realtimeroom.actions.ts
│  │  ├─ recommendation.actions.ts
│  │  ├─ scheduledWorkflow.actions.ts
│  │  ├─ section.server.ts
│  │  ├─ sites.actions.ts
│  │  ├─ slack.actions.ts
│  │  ├─ stack.actions.ts
│  │  ├─ stall.server.ts
│  │  ├─ thread.actions.ts
│  │  ├─ user.actions.ts
│  │  ├─ userattributes.actions.ts
│  │  └─ workflow.actions.ts
│  ├─ activitypub
│  │  ├─ base.ts
│  │  ├─ deliver.ts
│  │  ├─ fanout.ts
│  │  ├─ keys.ts
│  │  └─ signing.ts
│  ├─ agora
│  │  ├─ acceptance.ts
│  │  ├─ af.ts
│  │  ├─ cqRollup.ts
│  │  └─ types
│  │     └─ types.ts
│  ├─ amplification
│  │  └─ log.ts
│  ├─ analytics
│  │  └─ upsertSectionPing.ts
│  ├─ argumentation
│  │  ├─ afAcceptance.ts
│  │  ├─ afEngine.ts
│  │  ├─ aif.ts
│  │  ├─ cqPresets.ts
│  │  ├─ cqSuggestions.ts
│  │  ├─ createClaimAttack.ts
│  │  ├─ criticalQuestions.ts
│  │  ├─ toAF.ts
│  │  ├─ vaf.ts
│  │  └─ weightedBAF.ts
│  ├─ arguments
│  │  └─ diagram.ts
│  ├─ article
│  │  ├─ text.ts
│  │  └─ wrapSections.ts
│  ├─ auth
│  │  ├─ normalize.ts
│  │  ├─ roles.ts
│  │  ├─ server.ts
│  │  ├─ serverUser.ts
│  │  └─ types.ts
│  ├─ auth.ts
│  ├─ bigintjson.ts
│  ├─ bus.ts
│  ├─ canonicalise.ts
│  ├─ ceg
│  │  ├─ grounded.ts
│  │  └─ mapWarrantUndercut.ts
│  ├─ chat
│  │  ├─ makePrivateRoomId.ts
│  │  ├─ permalink.ts
│  │  ├─ roomId.ts
│  │  └─ roomKey.ts
│  ├─ citations
│  │  └─ formatters.ts
│  ├─ client
│  │  ├─ burst.ts
│  │  ├─ dialogue
│  │  │  └─ fog.ts
│  │  ├─ minimap
│  │  │  ├─ decorate.ts
│  │  │  └─ useMinimapData.ts
│  │  ├─ scroll.ts
│  │  ├─ useBusEffect.ts
│  │  ├─ useFollowing.ts
│  │  └─ useStackFollowing.ts
│  ├─ components
│  │  └─ CanvasRenderer.tsx
│  ├─ connections
│  │  ├─ client.ts
│  │  └─ service.ts
│  ├─ cq
│  │  └─ guardReason.ts
│  ├─ crypto
│  │  ├─ encryption.ts
│  │  ├─ mergeReceipt.ts
│  │  └─ sha256.ts
│  ├─ decisions
│  │  └─ createReceipt.ts
│  ├─ dedupeVenues.ts
│  ├─ deepdive
│  │  ├─ af.ts
│  │  ├─ claimEdgeHelpers.ts
│  │  ├─ invalidate.ts
│  │  ├─ selection.ts
│  │  └─ upsert.ts
│  ├─ deepseekclient.ts
│  ├─ definitions.ts
│  ├─ deliberations
│  │  └─ spawn.ts
│  ├─ dialogue
│  │  ├─ codes.ts
│  │  ├─ legalAttacks.ts
│  │  ├─ legalMoves.ts
│  │  ├─ legalMovesServer.ts
│  │  ├─ moves.ts
│  │  ├─ signature.ts
│  │  ├─ types.ts
│  │  ├─ validate.ts
│  │  ├─ wellformedness.ts
│  │  └─ winningness.ts
│  ├─ diff
│  │  ├─ diffWords.ts
│  │  └─ wordDiff.ts
│  ├─ entropy
│  │  ├─ server.ts
│  │  └─ utils.ts
│  ├─ espSessionStore.ts
│  ├─ events
│  │  └─ topics.ts
│  ├─ export
│  │  └─ aif.ts
│  ├─ firebase
│  │  ├─ config.ts
│  │  └─ firebase.ts
│  ├─ gitchat
│  │  └─ policies.ts
│  ├─ governance
│  │  └─ writers.ts
│  ├─ graph
│  │  └─ supplyOverlay.ts
│  ├─ hooks
│  │  ├─ useCreateFeedPost.ts
│  │  ├─ useCreateLibraryPost.ts
│  │  ├─ useInfiniteRealtimePosts.ts
│  │  ├─ useOfferStream.ts
│  │  ├─ usePartyPresence.ts
│  │  ├─ useScrollAnalytics.ts
│  │  └─ useSession.ts
│  ├─ ids
│  │  ├─ canonicalize.ts
│  │  ├─ mintMoid.ts
│  │  └─ urn.ts
│  ├─ image.ts
│  ├─ integrationLoader.ts
│  ├─ integrations
│  │  └─ types.ts
│  ├─ issues
│  │  └─ hooks.ts
│  ├─ items.client.ts
│  ├─ jwtHelpers.ts
│  ├─ kv.ts
│  ├─ limiter.ts
│  ├─ models
│  │  ├─ migrations
│  │  │  ├─ 20240626190000_add_follow.sql
│  │  │  ├─ 20240716190000_add_post_expiration.sql
│  │  │  ├─ 20240806000000_group_chat_attachments
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20240807000000_add_library_post.sql
│  │  │  ├─ 2025-08-25-deliberation-rls.sql
│  │  │  ├─ 20250704000000_add_transition_version.sql
│  │  │  ├─ 20250705000000_create_integrations.sql
│  │  │  ├─ 20250705023203_julyfour
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20250713000000_add_music_post_type.sql
│  │  │  ├─ 20250714000000_fix_fkey.sql
│  │  │  ├─ 20250801000000_add_archived_realtime_posts
│  │  │  ├─ 20250801000000_add_archived_realtime_posts.sql
│  │  │  ├─ 20250815000000_add_canonical_media
│  │  │  ├─ 20250815000000_add_canonical_media.sql
│  │  │  ├─ 20250901000000_add_linked_accounts.sql
│  │  │  ├─ 20250916000000_add_notifications
│  │  │  ├─ 20250916000000_add_notifications.sql
│  │  │  ├─ 20250920000000_create_telemetry.sql
│  │  │  ├─ 20250921000000_add_stall_image_position.sql
│  │  │  ├─ 20250926000000_add_room_canvas
│  │  │  ├─ 20250926000000_add_room_canvas.sql
│  │  │  ├─ 20251001000000_add_prediction_market.sql
│  │  │  ├─ 20251002000000_extend_notifications_prediction.sql
│  │  │  ├─ 20251101000000_add_cart_escrow.sql
│  │  │  ├─ 20251115000000_add_caption.sql
│  │  │  ├─ 20251201000000_add_post_expiration_all.sql
│  │  │  ├─ lib
│  │  │  │  └─ models
│  │  │  │     └─ migrations
│  │  │  │        └─ 20251201000000_add_room_shards.sql
│  │  │  └─ migration_lock.toml
│  │  └─ schema.prisma
│  ├─ nl.ts
│  ├─ nli
│  │  ├─ adapter.ts
│  │  ├─ adjucator.ts
│  │  └─ aggregateSequent.ts
│  ├─ parsejsonhelper.ts
│  ├─ payouts.server.ts
│  ├─ permissions
│  │  └─ canEditWork.ts
│  ├─ pineconeClient.ts
│  ├─ pluginImporters.ts
│  ├─ pluginLoader.ts
│  ├─ polyLineMidpoint.ts
│  ├─ portfolio
│  │  ├─ CanvasStoreProvider.tsx
│  │  ├─ canvasStore.ts
│  │  ├─ datasource.ts
│  │  ├─ export.ts
│  │  ├─ lint.ts
│  │  ├─ mapping.ts
│  │  ├─ registry.tsx
│  │  ├─ selection.ts
│  │  ├─ templates.ts
│  │  ├─ transformers.ts
│  │  └─ types.ts
│  ├─ practical
│  │  ├─ compute.ts
│  │  └─ mcda.ts
│  ├─ prediction
│  │  ├─ lmsr.ts
│  │  └─ tradePreview.ts
│  ├─ prisma-cli.ts
│  ├─ prismaclient.ts
│  ├─ queue.ts
│  ├─ reactflow
│  │  ├─ reactflowutils.ts
│  │  ├─ store.ts
│  │  └─ types.ts
│  ├─ realtime
│  │  └─ broadcast.ts
│  ├─ receipts
│  │  ├─ hash.ts
│  │  ├─ jcs.ts
│  │  ├─ sign.ts
│  │  └─ verify.ts
│  ├─ redis.ts
│  ├─ registerDefaultWorkflowActions.ts
│  ├─ registerDefaultWorkflowTriggers.ts
│  ├─ registerIntegrationActions.ts
│  ├─ registerIntegrationTriggerTypes.ts
│  ├─ registerIntegrationTriggers.ts
│  ├─ repostPolicy.ts
│  ├─ represent
│  │  └─ coverSet.ts
│  ├─ rhetoric
│  │  ├─ fallacies.ts
│  │  ├─ mlMini.ts
│  │  └─ sourceQuality.ts
│  ├─ screenshot.ts
│  ├─ semantics
│  │  └─ lfHints.ts
│  ├─ server
│  │  ├─ briefs.ts
│  │  ├─ bus.ts
│  │  ├─ db-retry.ts
│  │  ├─ emit.ts
│  │  ├─ getUser.ts
│  │  ├─ getUserFromReq.pages.ts
│  │  ├─ pagination.ts
│  │  ├─ resolveRoom.ts
│  │  ├─ stack-helpers.ts
│  │  └─ timing.ts
│  ├─ serverutils.ts
│  ├─ settings
│  │  ├─ schema.ts
│  │  └─ service.ts
│  ├─ sheaf
│  │  ├─ conflict.ts
│  │  ├─ resolveQuote.ts
│  │  └─ visibility.ts
│  ├─ slug.ts
│  ├─ socket.ts
│  ├─ sorters.ts
│  ├─ spotify.ts
│  ├─ spotifyClient.ts
│  ├─ spotifyServer.ts
│  ├─ sse.ts
│  ├─ stateMachine.ts
│  ├─ storage
│  │  ├─ constants.ts
│  │  └─ uploadAttachment.ts
│  ├─ stores
│  │  └─ cart.ts
│  ├─ stripe.ts
│  ├─ supabase-browser.ts
│  ├─ supabase-server.ts
│  ├─ supabase.ts
│  ├─ supabaseAdmin.ts
│  ├─ supabaseclient.ts
│  ├─ text
│  │  ├─ mentions.ts
│  │  └─ urls.ts
│  ├─ tiptap
│  │  ├─ extensions
│  │  │  ├─ FancyTextStyle.ts
│  │  │  ├─ ParagraphKeepEmptySSR.ts
│  │  │  ├─ block-move.ts
│  │  │  ├─ block-style-ssr.ts
│  │  │  ├─ code-tab.ts
│  │  │  ├─ font-family.ts
│  │  │  ├─ font-size.ts
│  │  │  ├─ indent.ts
│  │  │  ├─ quick-link.ts
│  │  │  ├─ sectionBreak.ts
│  │  │  ├─ shared.ts
│  │  │  ├─ ssr-text-align.ts
│  │  │  └─ text-style-ssr.ts
│  │  └─ extensions.ts
│  ├─ topology
│  │  ├─ affinityClusters.ts
│  │  ├─ bridgeSuggest.ts
│  │  └─ topicClusters.ts
│  ├─ transform
│  │  └─ post.ts
│  ├─ twoTower.ts
│  ├─ types
│  │  ├─ argument.ts
│  │  ├─ post.ts
│  │  └─ prediction.ts
│  ├─ unfurl.ts
│  ├─ union.ts
│  ├─ uploadItemImage.ts
│  ├─ uploadthing.ts
│  ├─ uploadthumbnail.ts
│  ├─ useSession.ts
│  ├─ utils
│  │  ├─ authz.ts
│  │  ├─ escape.ts
│  │  └─ validators.ts
│  ├─ utils.ts
│  ├─ validations
│  │  ├─ stall.ts
│  │  ├─ thread.ts
│  │  └─ user.ts
│  ├─ workflow
│  │  ├─ bootstrap.server.ts
│  │  ├─ registry.compat.ts
│  │  ├─ registry.defaults.ts
│  │  ├─ registry.ts
│  │  ├─ runner.ts
│  │  ├─ types.ts
│  │  └─ vars.ts
│  ├─ workflowActions.ts
│  ├─ workflowAnalytics.ts
│  ├─ workflowExecutor.ts
│  ├─ workflowScheduler.ts
│  ├─ workflowSocketRunner.ts
│  ├─ workflowTriggers.ts
│  └─ zod-schemas.ts
├─ mesh-lite
│  ├─ api
│  │  ├─ Dockerfile
│  │  ├─ package.json
│  │  ├─ prisma
│  │  │  └─ schema.prisma
│  │  ├─ server.ts
│  │  └─ tsconfig.json
│  ├─ docker-compose.yml
│  └─ import.sh
├─ middleware.ts
├─ ml
│  └─ offline_train_ranker.py
├─ next.config.mjs
├─ nodemon.json
├─ osc.d.ts
├─ package.json
├─ packages
│  ├─ af
│  │  └─ semantics.ts
│  ├─ analysis
│  │  └─ rsa.ts
│  ├─ components
│  │  ├─ DialBadge.tsx
│  │  └─ RSAChip.tsx
│  ├─ dialogue
│  │  └─ computeLegalMoves.ts
│  ├─ entail
│  │  └─ dialogical.ts
│  ├─ halfway-utils
│  │  └─ groupAlgorithm.ts
│  ├─ hooks
│  │  ├─ useDialecticStats.ts
│  │  ├─ useRSA.ts
│  │  └─ useRSABatch.ts
│  ├─ ludics-core
│  │  ├─ errors.ts
│  │  ├─ paths.ts
│  │  ├─ types.ts
│  │  ├─ ve
│  │  │  └─ pathCheck.ts
│  │  └─ ve.ts
│  ├─ ludics-engine
│  │  ├─ __tests__
│  │  │  ├─ compose.preflight.test.ts
│  │  │  └─ dialoguesInLudics.spec.ts
│  │  ├─ appendActs.ts
│  │  ├─ checkOrthogonal.ts
│  │  ├─ commitments.ts
│  │  ├─ compileFromMoves.ts
│  │  ├─ compose.ts
│  │  ├─ concession.ts
│  │  ├─ copy.ts
│  │  ├─ daimon.ts
│  │  ├─ decisive.ts
│  │  ├─ delocate.ts
│  │  ├─ detect-collisions.ts
│  │  ├─ examples
│  │  │  └─ dialoguesInLudics.ts
│  │  ├─ fax.ts
│  │  ├─ faxClone.ts
│  │  ├─ hooks.ts
│  │  ├─ judge.ts
│  │  ├─ locks.ts
│  │  ├─ orthogonal.ts
│  │  ├─ plugins
│  │  │  └─ nli.ts
│  │  ├─ policies.ts
│  │  ├─ saturation.ts
│  │  ├─ stepper.ts
│  │  ├─ testers.ts
│  │  ├─ uniformity.ts
│  │  └─ visibility.ts
│  ├─ ludics-react
│  │  ├─ ActInspector.tsx
│  │  ├─ CommitmentsPanel.tsx
│  │  ├─ DefenseTree.tsx
│  │  ├─ JudgeConsole.tsx
│  │  ├─ LociTree.tsx
│  │  ├─ TraceRibbon.tsx
│  │  ├─ mergeDesignsToTree.ts
│  │  └─ modeLabels.ts
│  ├─ ludics-rest
│  │  └─ zod.ts
│  ├─ server
│  │  ├─ src
│  │  │  └─ prediction
│  │  │     └─ service.ts
│  │  └─ tests
│  │     ├─ lmsr.test.ts
│  │     ├─ market.flow.test.ts
│  │     └─ security.test.ts
│  ├─ sheaf-acl
│  │  ├─ dist
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ acl.ts
│  │  │  ├─ index.ts
│  │  │  └─ types.ts
│  │  ├─ test
│  │  │  └─ acl.spec.ts
│  │  └─ tsconfig.json
│  └─ ui
│     ├─ useAsyncButton.ts
│     └─ useMicroToast.tsx
├─ pages
│  └─ api
│     ├─ articles
│     ├─ socket
│     │  └─ io.ts
│     └─ y
│        └─ [docId].ts
├─ patch-file.patch
├─ pivotDocs
│  ├─ PivotV2Refactor.md
│  ├─ PivotV2Report.md
│  └─ PivotV2SRS.md
├─ playwright.config.ts
├─ plugins
│  ├─ .SplineViewerNode.tsx.swp
│  ├─ CounterNode.tsx
│  ├─ HelloNode.tsx
│  ├─ PdfViewerNode.tsx
│  └─ SplineViewerNode.tsx
├─ postcss.config.mjs
├─ pr.patch
├─ prisma
│  ├─ brief-seed.ts
│  ├─ migrations
│  │  ├─ 20240805000000_add_article_revision.sql
│  │  ├─ 20240806000000_group_chat_attachments.sql
│  │  ├─ 20240807000000_add_library_post.sql
│  │  ├─ add_wallet_lock.sql
│  │  └─ init_settings.sql
│  ├─ models
│  │  └─ Room.prisma
│  └─ scripts
│     ├─ backfillParticipants.ts
│     └─ sheaf-seed.ts
├─ prisma.config.ts
├─ protos
│  └─ ranker.proto
├─ public
│  ├─ assets
│  │  ├─ 3D-print-mesh.svg
│  │  ├─ CursorSVG.tsx
│  │  ├─ add--alt.svg
│  │  ├─ add--child-node.svg
│  │  ├─ add--parent-node.svg
│  │  ├─ add-comment.svg
│  │  ├─ add-image.svg
│  │  ├─ alarm--add.svg
│  │  ├─ alert-circle.svg
│  │  ├─ annotation-visibility.svg
│  │  ├─ apps.svg
│  │  ├─ attachment.svg
│  │  ├─ barcode.svg
│  │  ├─ barrier.svg
│  │  ├─ blog.svg
│  │  ├─ bookmark--add.svg
│  │  ├─ branch.svg
│  │  ├─ caret--left.svg
│  │  ├─ caret--right.svg
│  │  ├─ carousel.svg
│  │  ├─ chart--bullet.svg
│  │  ├─ chart--point.svg
│  │  ├─ chat--launch.svg
│  │  ├─ checkbox--checked--filled.svg
│  │  ├─ checkbox--checked.svg
│  │  ├─ checkbox.svg
│  │  ├─ chevron--left.svg
│  │  ├─ chevron--right.svg
│  │  ├─ chevron--up--outline.svg
│  │  ├─ circle--filled.svg
│  │  ├─ circle-stroke.svg
│  │  ├─ clock-cross.svg
│  │  ├─ clock-plus.svg
│  │  ├─ clock.svg
│  │  ├─ collaborate.svg
│  │  ├─ community.svg
│  │  ├─ compass.svg
│  │  ├─ create-new.svg
│  │  ├─ create.svg
│  │  ├─ crop.svg
│  │  ├─ dashboard--reference.svg
│  │  ├─ dashboard.svg
│  │  ├─ data-blob.svg
│  │  ├─ data-table.svg
│  │  ├─ decision-node.svg
│  │  ├─ delete-animated.svg
│  │  ├─ delete-static.svg
│  │  ├─ delete.svg
│  │  ├─ delivery--add.svg
│  │  ├─ development.svg
│  │  ├─ document--add.svg
│  │  ├─ document--comment.svg
│  │  ├─ dot-mark-black.svg
│  │  ├─ dot-mark.svg
│  │  ├─ downstream.svg
│  │  ├─ earth--filled.svg
│  │  ├─ edit-animated.svg
│  │  ├─ edit-static.svg
│  │  ├─ edit.svg
│  │  ├─ events (1).svg
│  │  ├─ expand-all.svg
│  │  ├─ face--activated--add (1).svg
│  │  ├─ face--add (1).svg
│  │  ├─ face--dissatisfied--filled.svg
│  │  ├─ face--dissatisfied.svg
│  │  ├─ face--neutral--filled.svg
│  │  ├─ face--neutral.svg
│  │  ├─ face--satisfied--filled.svg
│  │  ├─ face--satisfied-white.svg
│  │  ├─ face--satisfied.svg
│  │  ├─ face--wink--filled.svg
│  │  ├─ face--wink.svg
│  │  ├─ file (2).svg
│  │  ├─ flow--connection.svg
│  │  ├─ flow.svg
│  │  ├─ fonts
│  │  │  ├─ BugrinoTrials-Regular.otf
│  │  │  ├─ KaTeX_Script-Regular.woff2
│  │  │  ├─ KoloniaTrial-Regular.woff2
│  │  │  ├─ MediaanTrial-Regular.woff2
│  │  │  ├─ NewEdgeTest-RegularRounded.otf
│  │  │  ├─ Parabole-DisplayRegular.woff2
│  │  │  ├─ TestFoundersGroteskText-Regular.otf
│  │  │  ├─ foundersgrotesk.woff2
│  │  │  ├─ inter-all-400-normal.4c1f8a0d.woff
│  │  │  └─ test-founders-grotesk-x-condensed-regular.woff2
│  │  ├─ foundersgrotesk.woff2
│  │  ├─ frown-static.svg
│  │  ├─ frown.svg
│  │  ├─ gateway.svg
│  │  ├─ group (1).svg
│  │  ├─ group--access.svg
│  │  ├─ group--resource.svg
│  │  ├─ group.svg
│  │  ├─ gui.svg
│  │  ├─ heart-filled.svg
│  │  ├─ heart-gray.svg
│  │  ├─ heart-helsinki.svg
│  │  ├─ heart.svg
│  │  ├─ heat-map--03.svg
│  │  ├─ home-helsinki.svg
│  │  ├─ home.svg
│  │  ├─ ibm--elo--publishing.svg
│  │  ├─ ibm--lpa.svg
│  │  ├─ ibm-cloud-pak--MANTA-automated-data-lineage.svg
│  │  ├─ image.svg
│  │  ├─ info-circle.svg
│  │  ├─ inventory-management.svg
│  │  ├─ lasso.svg
│  │  ├─ launch.svg
│  │  ├─ layers--external.svg
│  │  ├─ layers.svg
│  │  ├─ leftarrow.svg
│  │  ├─ link.svg
│  │  ├─ location--heart.svg
│  │  ├─ location--info.svg
│  │  ├─ location--person.svg
│  │  ├─ location--star.svg
│  │  ├─ location.svg
│  │  ├─ lock.svg
│  │  ├─ locked.svg
│  │  ├─ login (1).svg
│  │  ├─ login.svg
│  │  ├─ logo-black.svg
│  │  ├─ logo-white.svg
│  │  ├─ logo.svg
│  │  ├─ logout (1).svg
│  │  ├─ logout-ibm.svg
│  │  ├─ logout.svg
│  │  ├─ map.svg
│  │  ├─ members.svg
│  │  ├─ menu-hamburger.svg
│  │  ├─ merge-node.svg
│  │  ├─ message-queue.svg
│  │  ├─ microphone--filled.svg
│  │  ├─ microphone.svg
│  │  ├─ minimize.svg
│  │  ├─ model-builder.svg
│  │  ├─ more.svg
│  │  ├─ multiple-users.svg
│  │  ├─ network--1.svg
│  │  ├─ network--2.svg
│  │  ├─ new-tab.svg
│  │  ├─ notification--new.svg
│  │  ├─ notification.svg
│  │  ├─ notifications-none.svg
│  │  ├─ overflow-menu--horizontal.svg
│  │  ├─ overflow-menu--vertical.svg
│  │  ├─ pause--filled.svg
│  │  ├─ pause--outline.svg
│  │  ├─ pause.svg
│  │  ├─ pivot.svg
│  │  ├─ pivotgame.svg
│  │  ├─ play--filled--alt.svg
│  │  ├─ play--outline--filled.svg
│  │  ├─ play--outline.svg
│  │  ├─ play.svg
│  │  ├─ plus-circle.svg
│  │  ├─ posts.svg
│  │  ├─ process (1).svg
│  │  ├─ process.svg
│  │  ├─ profile.svg
│  │  ├─ question-circle.svg
│  │  ├─ radio-button--checked.svg
│  │  ├─ redo.svg
│  │  ├─ repeat.svg
│  │  ├─ replicate.svg
│  │  ├─ reply--all.svg
│  │  ├─ reply.svg
│  │  ├─ repost.svg
│  │  ├─ request.svg
│  │  ├─ restart.svg
│  │  ├─ review (1).svg
│  │  ├─ review.svg
│  │  ├─ rightarrow.svg
│  │  ├─ robot.svg
│  │  ├─ roughlogo.svg
│  │  ├─ rss.svg
│  │  ├─ run.svg
│  │  ├─ save.svg
│  │  ├─ schematics.svg
│  │  ├─ search-gray.svg
│  │  ├─ search-helsinki.svg
│  │  ├─ search.svg
│  │  ├─ send (2).svg
│  │  ├─ send--alt--filled.svg
│  │  ├─ send--alt.svg
│  │  ├─ settings.svg
│  │  ├─ share.svg
│  │  ├─ shopping--cart--arrow-down.svg
│  │  ├─ shopping--cart--plus.svg
│  │  ├─ signin-helsinki.svg
│  │  ├─ signout-helsinki.svg
│  │  ├─ star-fill.svg
│  │  ├─ star.svg
│  │  ├─ stop--filled.svg
│  │  ├─ stop--outline--filled.svg
│  │  ├─ stop--outline.svg
│  │  ├─ stop.svg
│  │  ├─ strategy-play.svg
│  │  ├─ tag.svg
│  │  ├─ text--creation.svg
│  │  ├─ texture.jpg
│  │  ├─ time.svg
│  │  ├─ trash-can.svg
│  │  ├─ triangle--down--outline.svg
│  │  ├─ triangle--down--solid.svg
│  │  ├─ triangle--outline.svg
│  │  ├─ triangle--solid.svg
│  │  ├─ triangle-down-filled.svg
│  │  ├─ triangle-down-stroke.svg
│  │  ├─ triangle-up-filled.svg
│  │  ├─ triangle-up-stroke.svg
│  │  ├─ undo.svg
│  │  ├─ unlock.svg
│  │  ├─ unlocked.svg
│  │  ├─ upload.svg
│  │  ├─ user--avatar.svg
│  │  ├─ user--feedback.svg
│  │  ├─ user-circle.svg
│  │  ├─ user-helsinki.svg
│  │  ├─ user.svg
│  │  ├─ video--add.svg
│  │  ├─ video.svg
│  │  ├─ view--off.svg
│  │  ├─ view-next.svg
│  │  ├─ view.svg
│  │  └─ workspace.svg
│  ├─ fonts
│  │  ├─ BugrinoTrials-Regular.otf
│  │  ├─ KaTeX_Script-Regular.woff2
│  │  ├─ KoloniaTrial-Regular.woff2
│  │  ├─ MediaanTrial-Regular.woff2
│  │  ├─ NewEdgeTest-RegularRounded.otf
│  │  ├─ Parabole-DisplayRegular.woff2
│  │  ├─ foundersgrotesk.woff2
│  │  ├─ inter-all-400-normal.4c1f8a0d.woff
│  │  └─ test-founders-grotesk-x-condensed-regular.woff2
│  ├─ locales
│  │  └─ en
│  │     └─ editor.json
│  ├─ pdf.worker.min.mjs
│  ├─ pivot
│  │  └─ 4letter.txt
│  ├─ placeholder-stall.svg
│  └─ schematics.svg
├─ requirements.txt
├─ scripts
│  ├─ backfill-block-thumbnails.ts
│  ├─ backfill-dialogue-signatures.ts
│  ├─ backfill_commitments.ts
│  ├─ closeMarkets.ts
│  ├─ debugTaste.ts
│  ├─ dedupe-deliberations.ts
│  ├─ enqueueTaste.ts
│  ├─ entailment-fracas-smoke.ts
│  ├─ gen-ed25519.ts
│  ├─ generate-room-baseline.ts
│  ├─ generateEmbeddings.ts
│  ├─ gmail-token.ts
│  ├─ google-sheets-token.ts
│  ├─ knnHealthCheck.ts
│  ├─ loadtest.js
│  ├─ ludics-contract-seed.ts
│  ├─ ludics-converge-now.ts
│  ├─ ludics-fixtures.ts
│  ├─ ludics-legal-seed.ts
│  ├─ ludics-legal-verify.ts
│  ├─ ludics-qa.ts
│  ├─ ludicsLegalSeed.ts
│  ├─ ludicsPatterns.ts
│  ├─ mockEmbeddings.ts
│  ├─ mockSpotifyRaw.ts
│  ├─ run_fav_builder.ts
│  ├─ seed-agora-super.ts
│  ├─ seed-deliberation-all.ts
│  ├─ seed-deliberation-ludics.ts
│  ├─ seed-demo-deliberation.ts
│  ├─ seed-ludics.ts
│  ├─ seed-metrovale.ts
│  ├─ seed-theory-ludics-pipeline.ts
│  ├─ seed.ts
│  ├─ seed_cmd.ts
│  └─ sheaf-seed.ts
├─ server
│  ├─ billing
│  │  └─ stripe.ts
│  ├─ cdc
│  │  └─ emitter.ts
│  ├─ config
│  │  └─ flags.ts
│  ├─ db
│  │  └─ tenant.ts
│  ├─ export
│  │  ├─ manifest.ts
│  │  ├─ pack.ts
│  │  ├─ pgdump.ts
│  │  └─ s3walk.ts
│  ├─ jobs
│  │  ├─ copy
│  │  │  ├─ index.ts
│  │  │  ├─ media.ts
│  │  │  ├─ plan.conversation.ts
│  │  │  ├─ plan.realtime.ts
│  │  │  ├─ sql.ts
│  │  │  └─ types.ts
│  │  ├─ decentralise.worker.ts
│  │  ├─ queues.ts
│  │  └─ usageMeter.ts
│  ├─ metrics
│  │  └─ pool.ts
│  ├─ provisioner
│  │  ├─ db.ts
│  │  ├─ kms.ts
│  │  ├─ orchestrate.ts
│  │  └─ s3.ts
│  ├─ rooms
│  │  └─ dao.ts
│  └─ trust
│     ├─ receipt.ts
│     └─ sign.ts
├─ services
│  ├─ __init__.py
│  ├─ embedding
│  │  ├─ Dockerfile.dev
│  │  ├─ README.md
│  │  ├─ __init__.py
│  │  ├─ docker-compose.yml
│  │  ├─ grpc
│  │  │  ├─ __init__.py
│  │  │  ├─ embedder_pb2.py
│  │  │  └─ embedder_pb2_grpc.py
│  │  ├─ grpc_server.py
│  │  ├─ main.py
│  │  ├─ model.py
│  │  ├─ poetry.lock
│  │  ├─ proto
│  │  │  └─ embedder.proto
│  │  ├─ pyproject.toml
│  │  └─ tests
│  │     ├─ test_embed.py
│  │     └─ test_health.py
│  ├─ embedding-svc
│  │  ├─ Dockerfile
│  │  ├─ app.py
│  │  ├─ embedding_pb2.py
│  │  ├─ embedding_pb2_grpc.py
│  │  ├─ k8s-deployment.yaml
│  │  ├─ protos
│  │  │  └─ embedding.proto
│  │  ├─ requirements.txt
│  │  └─ tests
│  │     └─ test_embed.py
│  ├─ explainer
│  │  ├─ explain.py
│  │  ├─ feature_map.json
│  │  └─ model.txt
│  ├─ feature-store
│  │  ├─ Dockerfile
│  │  ├─ data
│  │  │  └─ user_stats.parquet
│  │  ├─ feature_repo.py
│  │  ├─ feature_store.yaml
│  │  ├─ k8s-deployment.yaml
│  │  ├─ requirements.txt
│  │  └─ tests
│  │     └─ test_ingest_retrieve.py
│  ├─ meta
│  │  ├─ cache.ts
│  │  ├─ index.ts
│  │  ├─ musicbrainz.ts
│  │  ├─ openlibrary.ts
│  │  ├─ tmdb.ts
│  │  └─ types.ts
│  ├─ ranker
│  │  ├─ Dockerfile
│  │  ├─ __init__.py
│  │  ├─ feature_fetcher.py
│  │  ├─ main.py
│  │  ├─ pyproject.toml
│  │  ├─ ranker_pb2.py
│  │  ├─ ranker_pb2_grpc.py
│  │  ├─ server.py
│  │  └─ tests
│  │     ├─ __init__.py
│  │     ├─ test_lgbm_ranking.py
│  │     └─ test_rank_contract.py
│  └─ swapmeet-api
│     ├─ README.md
│     ├─ package.json
│     └─ src
│        ├─ __tests__
│        │  └─ heatmap.test.ts
│        ├─ heatmap.ts
│        ├─ index.ts
│        ├─ section.ts
│        └─ stall.ts
├─ shader.d.ts
├─ spotify
│  └─ callback
│     └─ page.tsx
├─ sql
│  ├─ room_baseline.sql
│  └─ taste_neighbours.sql
├─ supabase
│  ├─ .branches
│  │  └─ _current_branch
│  ├─ .temp
│  │  ├─ cli-latest
│  │  ├─ gotrue-version
│  │  ├─ pooler-url
│  │  ├─ postgres-version
│  │  ├─ project-ref
│  │  ├─ rest-version
│  │  └─ storage-version
│  ├─ config.toml
│  ├─ database-supabase.ts
│  ├─ functions
│  │  ├─ fetch_meta
│  │  │  └─ index.ts
│  │  └─ pdf-thumb
│  │     └─ index.ts
│  └─ migrations
│     ├─ 20250713_enable_pgvector.sql
│     ├─ 20250714125959_create_user_attributes.sql
│     ├─ 20250715095500_create_user_attributes_notify_fn.sql
│     ├─ 20250715100000_recreate_user_attributes_trigger.sql
│     ├─ 20250716_user_attributes_trigger.sql
│     ├─ 20250717_create_scroll_events.sql
│     ├─ 20250720_drop_auth_fks.sql
│     ├─ 20250722_add_user_attr_columns.sql
│     ├─ 20250801000000_swapmeet_initial.sql
│     ├─ 20250802000000_swapmeet_offers_orders.sql
│     ├─ 20250815000000_add_canonical_media.sql
│     ├─ 20250901000000_add_linked_accounts.sql
│     ├─ 20250915000000_create_scroll_events_v2.sql
│     ├─ 20251016000000_create_portfolio_pages.sql
│     ├─ 20251017000000_create_user_similarity_knn.sql
│     ├─ 20260101000000_lock_wallet.sql
│     ├─ 20260110000000_swapmeet_section.sql
│     ├─ 20260510000000_swapmeet_stall.sql
│     ├─ 20260820000000_swapmeet_heatmap.sql
│     ├─ 20260901000000_swapmeet_images.sql
│     ├─ 20260902000000_add_owner_to_stall.sql
│     ├─ 20260921000000_add_stall_updated.sql
│     ├─ 20260923000000_add_doc_to_stall.sql
│     ├─ 20261013000000_add_market_closed_at.sql
│     └─ _archive
│        └─ 20250717_fix_uuid_types.sql
├─ tailwind.config.ts
├─ templates
│  ├─ analytics-dashboard.json
│  ├─ click-counter.json
│  └─ conditional-branch.json
├─ tests
│  ├─ __snapshots__
│  │  └─ portfolio-export.test.ts.snap
│  ├─ adapters.contract.spec.ts
│  ├─ analyticsWorkflow.test.ts
│  ├─ api
│  │  └─ test_embed.py
│  ├─ articles.api.test.ts
│  ├─ canonicalise.test.ts
│  ├─ chip.test.tsx
│  ├─ conversation.actions.test.ts
│  ├─ discovery-candidates.integration.test.ts
│  ├─ embed_dlq.test.ts
│  ├─ embed_route.integration.test.ts
│  ├─ embed_route.test.ts
│  ├─ embed_worker.integration.test.ts
│  ├─ explain_api.test.ts
│  ├─ explain_integration.test.ts
│  ├─ favorites_builder.test.ts
│  ├─ feature_store.test.ts
│  ├─ fetch_meta.unit.spec.ts
│  ├─ friend-suggestions.test.ts
│  ├─ groupAlgorithm.test.ts
│  ├─ integrationLoader.test.ts
│  ├─ listWorkflows.test.ts
│  ├─ llm-chaining.integration.test.ts
│  ├─ lmsr.test.ts
│  ├─ manual
│  │  ├─ audio-node.md
│  │  └─ livekit-audio-recording.md
│  ├─ notifications.api.test.ts
│  ├─ pivotGenerator.test.ts
│  ├─ pluginConvert.test.ts
│  ├─ pluginLoader.test.ts
│  ├─ pluginRuntime.test.ts
│  ├─ portfolio-export.test.ts
│  ├─ postgresVector.test.ts
│  ├─ prediction
│  │  ├─ createMarket.spec.ts
│  │  ├─ lmsr.test.ts
│  │  ├─ resolve-ui.e2e.ts
│  │  ├─ resolve.e2e.ts
│  │  └─ tradeAndResolve.spec.ts
│  ├─ prediction.service.test.ts
│  ├─ redisCache.test.ts
│  ├─ registerDefaultWorkflowActions.test.ts
│  ├─ registerIntegrationTriggers.test.ts
│  ├─ seed_cmd.integration.test.ts
│  ├─ spotify.test.ts
│  ├─ stateMachine.test.ts
│  ├─ test_cron_integrity.py
│  ├─ tradePreview.test.ts
│  ├─ union.test.ts
│  ├─ upsertUserAttributes.test.ts
│  ├─ visibility-metrics.test.ts
│  ├─ walletLock.test.ts
│  ├─ workflowActions.integration.test.ts
│  ├─ workflowBuilder.test.tsx
│  ├─ workflowExecution.test.ts
│  ├─ workflowRunner.test.tsx
│  └─ workflowTriggers.test.ts
├─ tools
│  └─ verifier-cli
│     └─ index.ts
├─ tsconfig.jest.json
├─ tsconfig.json
├─ tsconfig.scripts.json
├─ types
│  ├─ agora.ts
│  ├─ comments.ts
│  ├─ osc.d.ts
│  ├─ poll.ts
│  └─ shared.ts
├─ util
│  ├─ postgresVector.ts
│  └─ taste.ts
├─ vercel.json
└─ workers
   ├─ candidate-builder.ts
   ├─ cron.ts
   ├─ index.ts
   ├─ reembed.ts
   ├─ reembedFromSpotify.ts
   ├─ scrollRealtime.ts
   ├─ sectionHeat.ts
   ├─ spotifyIngest.ts
   ├─ tasteVector.ts
   ├─ tokenRefresh.ts
   └─ user-knn-builder.ts

```