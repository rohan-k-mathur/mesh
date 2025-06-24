# Codex Agent Instructions

## Testing and Linting
- Run lint checks with `npm run lint`.
- Backend tests are located in `automat/packages/backend`. Execute them with `yarn test` from that directory.

## Coding Conventions
- Use TypeScript and 2‑space indentation.
- Prefer single quotes for strings.
- Keep Next.js and React imports at the top of files.

## Project Structure
- Frontend code resides in `src/`.
- The Node backend lives in `automat/packages/backend`.
- Documentation lives in `automat/packages/docs`.

## Build Instructions
- Install dependencies with `npm install` (or `pnpm install`).
- Start the frontend with `npm run dev`.
- To run the backend, follow the instructions in `README.md` (e.g., `cd automat && docker-compose up` or `node packages/backend/src/server.js`).

## General Guidance
- Prefer functional React components.
- Avoid adding external state management libraries beyond the existing `zustand` store.
- Keep code modular under `src/components`, `src/hooks`, etc.
