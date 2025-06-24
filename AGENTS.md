# Development Guidelines for the Mesh Repository

This project is a Next.js (React + TypeScript) application managed with **Yarn**.
Use these steps when modifying the repository.

## Setup
- Install dependencies with `yarn install`.
- Code should compile under Node.js 18 or later.
- The `@/` path alias points to the project root (defined in `tsconfig.json`).

## Coding Conventions
- Use double quotes for string literals in TypeScript files.
- Maintain existing formatting; run `npm run lint` to verify code quality.
- Keep changes focused and avoid modifying files in `node_modules` or `.next`.

## Commit & PR Guidelines
- Use short, present‑tense commit messages ("Add feature", "Fix bug").
- Summaries should mention key files and brief explanations of the changes.
- After code changes, run `npm run lint` and ensure it finishes without errors or warnings.

