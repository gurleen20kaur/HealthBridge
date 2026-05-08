# Technology Stack

**Analysis Date:** 2026-05-07

## Languages

**Primary:**
- TypeScript 5.x - All application code (`src/**/*.ts`, `src/**/*.tsx`)

**Secondary:**
- JavaScript - Config files (`next.config.ts` compiled from TS, PostCSS config)

## Runtime

**Environment:**
- Node.js (LTS, ^20) — server-side API routes and build toolchain

**Package Manager:**
- npm (inferred from `package.json`; no Yarn/pnpm lockfile detected)
- Lockfile: `package-lock.json` (present — standard npm)

## Frameworks

**Core:**
- Next.js 16.2.4 — Full-stack React framework; App Router used for `src/app/`; API routes under `src/app/api/`

**UI:**
- React 19.2.4 — Component rendering
- React DOM 19.2.4 — Browser rendering target

**Styling:**
- Tailwind CSS ^4 — Utility-first CSS; configured via `@tailwindcss/postcss` plugin

**Build/Dev:**
- TypeScript compiler via `next build` (`tsconfig.json` targets ES2017, module `esnext`, `moduleResolution: bundler`)
- ESLint ^9 with `eslint-config-next` 16.2.4 — linting (`npm run lint`)

## Key Dependencies

**Critical:**
- `next` 16.2.4 — Framework core; handles routing, SSR, API routes, environment variable loading
- `react` / `react-dom` 19.2.4 — UI layer
- `pdf-parse` ^1.1.1 — Server-side PDF text extraction; used in `src/app/api/parse-plan/route.ts` to extract insurance plan text from uploaded PDFs; expects a `Buffer` input
- `papaparse` ^5.4.1 — CSV parsing library; available for health data import (Apple Health CSV exports)
- `recharts` ^3.8.1 — Chart library for wellness dashboard data visualization (mood/energy trends)

**Infrastructure:**
- No ORM, database client, or server-side state library — all user data persisted client-side in `localStorage` via `src/lib/storage.ts`

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tailwindcss/postcss` | ^4 | PostCSS plugin to process Tailwind v4 |
| `@types/node` | ^20 | Node.js type definitions for server code |
| `@types/react` | ^19 | React type definitions |
| `@types/react-dom` | ^19 | React DOM type definitions |
| `eslint` | ^9 | Code linting |
| `eslint-config-next` | 16.2.4 | Next.js ESLint rule set |
| `tailwindcss` | ^4 | Tailwind CSS core |
| `typescript` | ^5 | TypeScript compiler |

## TypeScript Configuration

- **Target:** `ES2017`
- **Strict mode:** enabled (`"strict": true`)
- **JSX:** `react-jsx` transform (no explicit React import needed)
- **Path alias:** `@/*` maps to `./src/*` — used throughout codebase as `@/lib/...`, `@/types`, etc.
- **Module resolution:** `bundler` (Next.js/webpack-aware)
- **Isolated modules:** enabled (each file transpiled independently — no `const enum`)

## Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js config (currently empty/default) |
| `tsconfig.json` | TypeScript compiler options |
| `package.json` | Dependencies and npm scripts |

## Environment Variables

`.env.local` is present. Variables required at runtime (server-side only — never exposed to browser):

| Variable | Used In | Purpose |
|----------|---------|---------|
| `WATSONX_API_KEY` | `src/lib/ibm-auth.ts` | IBM Cloud API key for IAM token exchange |
| `WATSONX_BASE_URL` | `src/lib/orchestrate.ts` | Base URL for IBM Watsonx Orchestrate instance |
| `WATSONX_INSTANCE_ID` | `src/lib/orchestrate.ts` | Orchestrate instance identifier (used in URL path) |
| `WATSONX_AGENT_ID` | `src/lib/orchestrate.ts` | Target agent ID sent in request body to Orchestrate |

All four variables are required; absence of any throws an `Error` at request time before any external call is made.

## npm Scripts

```bash
npm run dev      # Start Next.js dev server (hot reload)
npm run build    # Production build
npm start        # Serve production build
npm run lint     # Run ESLint
```

## Platform Requirements

**Development:**
- Node.js ^20
- `.env.local` with all four Watsonx env vars set

**Production:**
- Any Node.js-capable host (Vercel, Railway, etc.)
- Environment variables injected via host secrets manager (not `.env.local`)

---

*Stack analysis: 2026-05-07*
