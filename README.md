# Mesh

Mesh is an experimental social platform built with **Next.js** that lets users interact in real-time rooms. Each room hosts a collaborative canvas where posts are represented as nodes. Node types range from simple text posts to livestreams and AI-generated images.

See [`Mesh_Roadmap.md`](Mesh_Roadmap.md) for the long term product plan.

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

## Development

1. Install dependencies

   ```bash
   yarn install
   ```

2. Create `.env.local` with the required environment variables (Firebase, OpenAI, database, etc.) and copy it to `.env` so Prisma can read them:

   ```bash
   cp .env.local .env
   ```
3. Start the development server

   ```bash
   yarn dev
   ```

4. Apply Prisma schema changes

   ```bash
   npx prisma db push
   ```

5. Seed the database

   ```bash
   yarn seed    # populate the Supabase database with sample users and posts
   ```

The app runs at [http://localhost:3000](http://localhost:3000).

### Scripts

- `npm run build` – build for production
- `npm run start` – start a production build
- `npm run lint` – run ESLint

## Adding new node types

Nodes are defined in `components/nodes` and typed in `lib/reactflow/types.ts`. To add a node type, create a new React component, extend the types, and register it in the React Flow store.

## Deployment

Mesh is deployed on Vercel: <https://vercel.com/18vijaybs-projects/ephemera>

