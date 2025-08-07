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

## Roadmap Highlights

The documents in this repo outline the path toward a public launch. Key themes include:

- **Foundation & Refinement** – multi‑factor auth, role‑based room permissions and a hardened middleware layer.
- **Social Discovery Engine** – expanded user attributes and a recommendation API combining embeddings with collaborative filtering.
- **Advanced Node Workflows** – instruction nodes, a state machine builder and plug‑in architecture for custom node types.
- **Real-Time Collaboration Enhancements** – presence labels, ephemeral chat and CRDT conflict resolution.
- **Production Hardening** – CI pipelines, performance monitoring and security reviews.

See `Mesh_Roadmap.md`, `SocialDiscoverEngine_V2_SRS.md`, `Flowstate_v2_SRS.md` and other SRS files for full details.
