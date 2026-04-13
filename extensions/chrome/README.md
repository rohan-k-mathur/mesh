# Isonomia Chrome Extension

Manifest V3 Chrome extension that lets you create evidence-backed arguments from any webpage and see rich inline previews for Isonomia links on Reddit, Twitter/X, and Hacker News.

## Features

- **Context menu**: Select text → right-click → "Create Isonomia Argument"
- **Popup builder**: Quick argument creation with claim, evidence, and scheme selection
- **Inline previews**: Rich preview cards for `isonomia.app/a/` and `/c/` links on supported sites
- **Search & recent**: Search and browse your recent arguments from the popup

## Project Structure

```
extensions/chrome/
├── manifest.json          # Manifest V3 definition
├── package.json           # Build dependencies
├── tsconfig.json          # TypeScript config (Preact JSX)
├── webpack.config.js      # Webpack build (4 entry points)
├── popup.html             # Popup shell
├── options.html           # Options page shell
└── src/
    ├── shared/
    │   ├── types.ts       # Shared type definitions
    │   ├── auth.ts        # Firebase auth (token storage, refresh)
    │   └── api-client.ts  # Authenticated API client
    ├── background/
    │   └── service-worker.ts  # Context menus, message routing, auth exchange
    ├── content/
    │   ├── link-detector.ts   # Detects isonomia.app links on pages
    │   ├── inline-renderer.ts # Renders rich preview cards (Shadow DOM)
    │   └── content-entry.ts   # Content script orchestrator
    ├── popup/
    │   ├── popup.tsx      # Popup UI (Create/Search/Recent tabs)
    │   └── popup.css      # Popup styles
    └── options/
        ├── options.tsx    # Options page (account, previews, theme)
        └── options.css    # Options page styles
```

## Setup & Build

```bash
cd extensions/chrome
npm install
npm run build        # Production build → dist/
npm run dev          # Watch mode for development
npm run typecheck    # Type-check without emitting
```

## Load in Chrome

1. Run `npm run build`
2. Open `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the `extensions/chrome/` directory
5. The extension icon should appear in the toolbar

## Authentication

The extension authenticates via Firebase:

1. User clicks "Sign in" in the popup or options page
2. A new tab opens to `isonomia.app/login?ext={extensionId}&redirect=extension`
3. After Firebase auth, the login page sends the token to the extension via `chrome.runtime.sendMessageExternal`
4. The service worker stores the auth in `chrome.storage.local`
5. API calls include the token via `Authorization: Bearer <idToken>`
6. Token refresh is handled automatically via `POST /api/auth/extension-token`

## Server-Side Support

The extension requires two server-side components:

- **`/api/auth/extension-token`** — Validates Firebase ID tokens and exchanges refresh tokens. Added to `PUBLIC_API` in middleware so it bypasses cookie auth.
- **Bearer token support in `getCurrentUserId()`** — Falls back to verifying `Authorization: Bearer` headers when no cookie session exists, so existing API routes work transparently with extension requests.

## Development

For local development, set the API base to `http://localhost:3000` in the extension options page (Advanced section). This points all API calls to your local Next.js dev server.

## Icons

Placeholder icon paths are defined in `manifest.json`. Replace `icons/icon-16.png`, `icons/icon-48.png`, and `icons/icon-128.png` with actual Isonomia icons before publishing to the Chrome Web Store.
