# Codebase Structure

**Analysis Date:** 2026-05-07

## Directory Layout

```
HealthBridge/
├── src/
│   ├── app/                        # Next.js App Router root
│   │   ├── layout.tsx              # Root layout: TabNav + global fonts + body styles
│   │   ├── page.tsx                # Root route — redirects / → /dashboard
│   │   ├── globals.css             # Tailwind base styles
│   │   ├── favicon.ico
│   │   ├── dashboard/
│   │   │   └── page.tsx            # /dashboard — overview with 4 cards
│   │   ├── wellness/
│   │   │   └── page.tsx            # /wellness — daily check-in + PDF upload
│   │   ├── chat/
│   │   │   └── page.tsx            # /chat — AI chat UI with context sidebar
│   │   ├── history/
│   │   │   └── page.tsx            # /history — charts + appointment timeline
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.ts        # POST /api/chat — browser → Orchestrate proxy
│   │       └── parse-plan/
│   │           └── route.ts        # POST /api/parse-plan — PDF → text extractor
│   │
│   ├── components/                 # Reusable React components
│   │   ├── MessageBubble.tsx       # Single chat message (user or agent bubble)
│   │   ├── Layout/
│   │   │   └── TabNav.tsx          # Sticky top nav with 4 tab links
│   │   ├── Dashboard/
│   │   │   ├── WelcomeCard.tsx     # Greeting + today's summary
│   │   │   ├── WellnessSnapshotCard.tsx  # Last check-in stats snapshot
│   │   │   ├── AISuggestionsCard.tsx     # 3 contextual AI suggestion chips
│   │   │   ├── AppointmentsCard.tsx      # Upcoming appointments list
│   │   │   └── AddAppointmentModal.tsx   # Modal form to add new appointment
│   │   ├── Wellness/
│   │   │   ├── CheckInForm.tsx     # Daily wellness log form (mood, energy, pain, sleep)
│   │   │   ├── MoodSelector.tsx    # 1–5 emoji mood picker
│   │   │   ├── EnergySlider.tsx    # 1–10 energy range slider
│   │   │   └── PlanSection.tsx     # Insurance plan PDF upload + display
│   │   ├── History/
│   │   │   ├── MoodEnergyChart.tsx        # Recharts line chart: mood + energy over time
│   │   │   ├── SymptomFrequencyChart.tsx  # Recharts bar chart: feeling note keywords
│   │   │   └── AppointmentsTimeline.tsx   # Chronological appointment list
│   │   └── Chat/
│   │       ├── SuggestionChips.tsx  # Clickable prompt chips above chat input
│   │       └── ContextSidebar.tsx   # "AI is using:" transparency panel
│   │
│   ├── hooks/
│   │   └── useUserData.ts          # Reactive localStorage hook (load/update/reset)
│   │
│   ├── lib/                        # Pure TypeScript utilities (no React)
│   │   ├── ibm-auth.ts             # IBM IAM token exchange + 55-min in-memory cache
│   │   ├── orchestrate.ts          # Prompt construction + IBM Orchestrate HTTP client
│   │   ├── contextBuilder.ts       # UserData → ChatRequest field serializer
│   │   ├── suggestions.ts          # 5-rule suggestion generator over UserData
│   │   ├── storage.ts              # localStorage CRUD + SSR guard + upsert helpers
│   │   └── seedData.ts             # 30-day demo UserData (isSeedData: true)
│   │
│   └── types/
│       └── index.ts                # All shared TypeScript interfaces
│
├── .planning/
│   └── codebase/                   # GSD codebase analysis documents
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md
│
├── package.json                    # Dependencies: next 16, react 19, recharts, pdf-parse, papaparse
├── tsconfig.json                   # TypeScript config (path alias: @/ → src/)
├── .env.local                      # IBM credentials (NOT committed)
└── test-api.sh                     # Manual API test script (untracked)
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router pages and API routes
- Contains: Page components (one `page.tsx` per route), API route handlers (`route.ts`), root layout, global CSS
- Key files: `layout.tsx` (wraps all pages with `TabNav`), `dashboard/page.tsx` (main entry), `api/chat/route.ts` (IBM proxy)

**`src/app/api/`:**
- Purpose: Server-side Next.js Route Handlers — the only code that runs in Node.js and can safely hold IBM credentials
- Contains: Two endpoints: `chat` and `parse-plan`
- Note: All other app logic is client-side. These are the only files where `process.env.WATSONX_*` are accessed

**`src/components/`:**
- Purpose: Reusable React components organized by the page/domain they serve
- Contains: All `"use client"` components
- Subdirectory conventions: `Layout/` (app-wide), `Dashboard/`, `Wellness/`, `History/`, `Chat/` (match the four tab pages)

**`src/hooks/`:**
- Purpose: Custom React hooks
- Contains: `useUserData.ts` — the single state management entry point for the entire frontend
- Note: Only one hook exists; all pages consume it directly rather than a global context provider

**`src/lib/`:**
- Purpose: Framework-agnostic TypeScript modules — no React imports
- Contains: IBM integration (`ibm-auth.ts`, `orchestrate.ts`), client-side data logic (`contextBuilder.ts`, `suggestions.ts`, `storage.ts`, `seedData.ts`)
- Server vs client split:
  - `ibm-auth.ts`, `orchestrate.ts` — server-only (imported only from API routes)
  - `storage.ts`, `contextBuilder.ts`, `suggestions.ts`, `seedData.ts` — client-only (use `window`/`localStorage`)

**`src/types/`:**
- Purpose: Single source of truth for all TypeScript interfaces
- Contains: `index.ts` with Phase 3 chat types and Phase 4 wellness platform types
- Note: All interfaces are exported from `@/types` (barrel pattern via single file)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root shell — sets fonts, background color, renders `TabNav` above every page
- `src/app/page.tsx`: Root route — `redirect("/dashboard")`; nothing else

**API Endpoints:**
- `src/app/api/chat/route.ts`: `POST /api/chat` — validates `message`, calls `sendMessage()`, returns `{ response, agent, timestamp }`
- `src/app/api/parse-plan/route.ts`: `POST /api/parse-plan` — accepts multipart PDF, returns `{ text, fileName, pages }`

**State / Data:**
- `src/hooks/useUserData.ts`: The only place React state is managed — provides `{ userData, isLoading, update, reset }`
- `src/lib/storage.ts`: localStorage layer — `getUserData()`, `setUserData()`, `updateUserData()`, `upsertTodayWellnessEntry()`
- `src/types/index.ts`: All interfaces — `UserData`, `WellnessEntry`, `Appointment`, `Medication`, `Message`, `Suggestion`, etc.

**IBM Integration:**
- `src/lib/ibm-auth.ts`: `getIAMToken()` — module-level cached token
- `src/lib/orchestrate.ts`: `sendMessage(userMessage, context, targetAgent?)` — constructs prompt, calls IBM

**Context / Personalization:**
- `src/lib/contextBuilder.ts`: `buildChatRequest(message, userData, agent?)` — serializes wellness log, plan, symptoms
- `src/lib/suggestions.ts`: `generateSuggestions(userData)` — returns `Suggestion[]` array (pure function, no API call)

**Demo Data:**
- `src/lib/seedData.ts`: `getSeedData()` — returns hardcoded 30-day `UserData` for demo mode

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `WelcomeCard.tsx`, `CheckInForm.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useUserData.ts`)
- Lib utilities: `camelCase.ts` (e.g., `contextBuilder.ts`, `ibm-auth.ts`)
- API routes: always named `route.ts` (Next.js App Router convention)
- Pages: always named `page.tsx` (Next.js App Router convention)

**Directories:**
- Feature-based under `src/components/`: `Dashboard/`, `Wellness/`, `History/`, `Chat/`, `Layout/`
- Route-based under `src/app/`: `dashboard/`, `wellness/`, `chat/`, `history/`, `api/`

**TypeScript:**
- Interfaces: `PascalCase` (e.g., `UserData`, `WellnessEntry`, `OrchestrateResponse`)
- Functions: `camelCase` (e.g., `buildChatRequest`, `generateSuggestions`, `getIAMToken`)
- Constants: `SCREAMING_SNAKE_CASE` for module-level config arrays (e.g., `TABS`, `DEFAULT_SUGGESTIONS`, `STORAGE_KEY`, `PRIORITY_BADGE`)

## What Routes Exist

**Page Routes (React, client-side):**

| URL | File | Purpose |
|-----|------|---------|
| `/` | `src/app/page.tsx` | Redirects to `/dashboard` |
| `/dashboard` | `src/app/dashboard/page.tsx` | Main overview page |
| `/wellness` | `src/app/wellness/page.tsx` | Daily check-in + insurance plan upload |
| `/chat` | `src/app/chat/page.tsx` | AI chat UI; accepts `?prompt=...&agent=...` query params |
| `/history` | `src/app/history/page.tsx` | Wellness charts + appointment timeline |

**API Routes (Server-side, Next.js Route Handlers):**

| Method + URL | File | Purpose |
|-------------|------|---------|
| `POST /api/chat` | `src/app/api/chat/route.ts` | Proxy user message → IBM Orchestrate → response |
| `POST /api/parse-plan` | `src/app/api/parse-plan/route.ts` | Extract text from uploaded PDF |

**Chat URL Parameters (`/chat`):**
- `?prompt=<text>` — pre-fills the chat input (used by dashboard suggestion chip links)
- `?agent=<name>` — targets a specific Orchestrate agent (e.g., `CoverageAdvisor`, `SymptomInsight`)

## Where to Add New Code

**New dashboard card:**
- Component: `src/components/Dashboard/YourCardName.tsx`
- Import in: `src/app/dashboard/page.tsx`

**New API endpoint:**
- Create directory: `src/app/api/<endpoint-name>/`
- Create file: `src/app/api/<endpoint-name>/route.ts`
- Export named functions: `export async function POST(request: NextRequest)`
- Access IBM only here (not in components or lib files accessed by client)

**New page / tab:**
- Create directory: `src/app/<route-name>/`
- Create file: `src/app/<route-name>/page.tsx` with `"use client"` if it reads `localStorage`
- Add to `TABS` array in `src/components/Layout/TabNav.tsx`

**New shared TypeScript type:**
- Add to `src/types/index.ts` — all interfaces live in this single file

**New wellness component:**
- Component: `src/components/Wellness/YourComponent.tsx`
- Import in: `src/app/wellness/page.tsx`

**New chart or history visualization:**
- Component: `src/components/History/YourChart.tsx`
- Uses `recharts` library (already installed)
- Import in: `src/app/history/page.tsx`

**New suggestion rule:**
- Add rule to `generateSuggestions()` in `src/lib/suggestions.ts`
- Returns a `Suggestion` object with `{ id, icon, title, prompt, agent?, priority }`

**New IBM lib utility (server-only):**
- Add to `src/lib/` as a new `.ts` file
- Import only from `src/app/api/*/route.ts` files — never from components or hooks

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents used by planning and execution agents
- Generated: By `/gsd-map-codebase` command
- Committed: Yes (planning artifacts belong in the repo)

**`src/app/api/`:**
- Purpose: Server-side only — these files run in Node.js, not the browser
- Generated: No
- Note: Only these files may safely use `process.env.WATSONX_*` — never import IBM libs into client components

---

*Structure analysis: 2026-05-07*
