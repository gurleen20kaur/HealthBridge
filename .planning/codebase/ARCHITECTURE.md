<!-- refreshed: 2026-05-07 -->
# Architecture

**Analysis Date:** 2026-05-07

## System Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│                    Browser (React / Next.js)                      │
│                                                                   │
│  /dashboard   /wellness   /chat   /history                       │
│       │            │        │         │                           │
│       └────────────┴────────┴─────────┘                          │
│                    useUserData() hook                             │
│                    localStorage (healthbridge:userdata)           │
└───────────────────────────┬──────────────────────────────────────┘
                            │ fetch("/api/chat")
                            │ fetch("/api/parse-plan")
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│               Next.js API Routes (Node.js / Edge)                │
│                                                                   │
│   POST /api/chat          POST /api/parse-plan                   │
│   src/app/api/chat/       src/app/api/parse-plan/                │
│   route.ts                route.ts                               │
│        │                        │                                 │
│        │ sendMessage()           │ pdf-parse npm                  │
│        ▼                        ▼                                 │
│   src/lib/orchestrate.ts   Returns extracted text                 │
│        │                                                          │
│        │ getIAMToken()                                            │
│        ▼                                                          │
│   src/lib/ibm-auth.ts                                             │
└────────────────┬─────────────────────────────────────────────────┘
                 │ Bearer <IAM token>  POST /instances/{id}/v1/orchestrate/runs
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                   IBM Watsonx Orchestrate                         │
│                                                                   │
│   HealthGuide (supervisor/router)                                 │
│       ├── SymptomInsight  (symptom analysis)                      │
│       └── CoverageAdvisor (insurance questions)                   │
└──────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | Persistent TabNav + global fonts/styles | `src/app/layout.tsx` |
| Root page | Redirects `/` → `/dashboard` | `src/app/page.tsx` |
| Dashboard page | Overview: welcome, snapshot, AI suggestions, appointments | `src/app/dashboard/page.tsx` |
| Wellness page | Daily check-in form + insurance plan upload | `src/app/wellness/page.tsx` |
| Chat page | Full AI chat with context injection + suggestion chips | `src/app/chat/page.tsx` |
| History page | Mood/energy charts, symptom frequency, appointment timeline | `src/app/history/page.tsx` |
| `/api/chat` | Bridge: browser → `orchestrate.ts` → IBM | `src/app/api/chat/route.ts` |
| `/api/parse-plan` | PDF text extraction via `pdf-parse` | `src/app/api/parse-plan/route.ts` |
| `orchestrate.ts` | Context injection + IBM Orchestrate HTTP client | `src/lib/orchestrate.ts` |
| `ibm-auth.ts` | IAM token exchange + in-memory 55-min cache | `src/lib/ibm-auth.ts` |
| `contextBuilder.ts` | Converts `UserData` → `ChatRequest` fields | `src/lib/contextBuilder.ts` |
| `suggestions.ts` | Generates up to 3 contextual AI suggestion chips from `UserData` | `src/lib/suggestions.ts` |
| `storage.ts` | localStorage read/write/upsert for `UserData`; seeds on first load | `src/lib/storage.ts` |
| `seedData.ts` | 30-day demo `UserData` with 5 appointments, 3 medications | `src/lib/seedData.ts` |
| `useUserData` | React hook: reactive `UserData` from localStorage + update/reset | `src/hooks/useUserData.ts` |
| `TabNav` | Sticky top nav with 4 tab links, active-state via `usePathname` | `src/components/Layout/TabNav.tsx` |

## Pattern Overview

**Overall:** Next.js App Router full-stack application. React frontend with client components for all interactive pages. API Routes serve as a thin server-side proxy to IBM Watsonx Orchestrate. No traditional database — all user data persists in browser localStorage.

**Key Characteristics:**
- All four tab pages are `"use client"` — they read from localStorage via `useUserData`
- The server (API routes) is stateless; it authenticates with IBM on each chat call but uses an in-memory IAM token cache
- Context injection happens client-side (`contextBuilder.ts`) before the HTTP call and server-side (prompt construction in `orchestrate.ts`)
- PDF parsing happens server-side (Node.js Buffer API) because browsers cannot run `pdf-parse`

## Layers

**Frontend Layer:**
- Purpose: Render UI, manage local state, trigger API calls
- Location: `src/app/*/page.tsx`, `src/components/**`
- Contains: React client components, page layouts, UI-only logic
- Depends on: `useUserData` hook, `contextBuilder.ts`, `suggestions.ts`
- Used by: End users via browser

**Hook / State Layer:**
- Purpose: Reactive bridge between localStorage and React component trees
- Location: `src/hooks/useUserData.ts`
- Contains: `useState`, `useEffect` for SSR-safe localStorage reads; `update` and `reset` callbacks
- Depends on: `src/lib/storage.ts`
- Used by: Every page (`dashboard`, `wellness`, `chat`, `history`)

**Client-Side Library Layer:**
- Purpose: Pure functions over `UserData` — context building, suggestion generation, storage helpers
- Location: `src/lib/storage.ts`, `src/lib/contextBuilder.ts`, `src/lib/suggestions.ts`, `src/lib/seedData.ts`
- Contains: No React; plain TypeScript functions
- Depends on: `src/types/index.ts`
- Used by: `useUserData` hook, page components, `contextBuilder`

**API Route Layer (Server):**
- Purpose: Proxy browser requests to IBM; parse PDFs server-side
- Location: `src/app/api/chat/route.ts`, `src/app/api/parse-plan/route.ts`
- Contains: Next.js Route Handlers (`POST` exports)
- Depends on: `src/lib/orchestrate.ts`, `pdf-parse` npm package
- Used by: Browser `fetch()` calls from `/chat` and `/wellness` pages

**Integration Layer (Server):**
- Purpose: IBM IAM authentication and Orchestrate HTTP communication
- Location: `src/lib/orchestrate.ts`, `src/lib/ibm-auth.ts`
- Contains: Token caching logic, prompt construction, HTTP `fetch` to IBM
- Depends on: `WATSONX_API_KEY`, `WATSONX_BASE_URL`, `WATSONX_INSTANCE_ID`, `WATSONX_AGENT_ID` env vars
- Used by: `/api/chat` route handler only

## Data Flow

### Primary Chat Request Path

1. User types message in `ChatPage` (`src/app/chat/page.tsx`)
2. `handleSend()` calls `buildChatRequest(message, userData, agent)` from `src/lib/contextBuilder.ts`
   - Serializes last 7 wellness entries → `healthData` string
   - Serializes insurance plan text + medications → `planText` string
   - Serializes today's symptoms → `symptomHistory` string
3. Browser POSTs `{ message, planText, healthData, symptomHistory, agent }` to `POST /api/chat`
4. `src/app/api/chat/route.ts` calls `sendMessage(message, context)` from `src/lib/orchestrate.ts`
5. `orchestrate.ts` calls `getIAMToken()` from `src/lib/ibm-auth.ts`
   - Returns cached token if `cachedExpiry > Date.now()` (valid for 55 min)
   - Otherwise POSTs to `https://iam.cloud.ibm.com/identity/token` with API key
6. `orchestrate.ts` calls `constructPrompt(message, context)` — injects `planText`, `healthData`, `symptomHistory` above the user question
7. POSTs to `${WATSONX_BASE_URL}/instances/${WATSONX_INSTANCE_ID}/v1/orchestrate/runs` with `{ agent_id, messages: [{ role: "user", content: enrichedPrompt }] }`
8. IBM Orchestrate routes to HealthGuide (supervisor), which delegates to SymptomInsight or CoverageAdvisor
9. Response `{ output, metadata }` is parsed — `output` may be a `string` or `{ answer, text }` object
10. `{ response, agent, timestamp }` returned to browser → appended to `userData.chatHistory` in localStorage

### PDF Insurance Plan Upload Path

1. User selects PDF file in `PlanSection` component (`src/components/Wellness/PlanSection.tsx`)
2. Browser POSTs `multipart/form-data` with the file to `POST /api/parse-plan`
3. `src/app/api/parse-plan/route.ts` uses `pdf-parse` npm to extract text from `Buffer`
4. Returns `{ text, fileName, pages }` to browser
5. Browser stores `{ text, fileName, uploadedAt }` in `userData.insurancePlan` via `useUserData.update()`
6. Plan text is now included in every subsequent chat request via `contextBuilder.ts`

### Dashboard AI Suggestions Flow

1. `DashboardPage` renders `AISuggestionsCard` with full `userData`
2. `generateSuggestions(userData)` from `src/lib/suggestions.ts` runs 5 priority rules client-side (no API call)
3. Up to 3 suggestions rendered as links: `/chat?prompt=...&agent=...`
4. User clicks → navigates to `/chat`; `useEffect` in `ChatPage` reads `searchParams.get("prompt")` and pre-fills the input

### First-Load Seed Data Flow

1. First visit: localStorage has no `"healthbridge:userdata"` key
2. `getUserData()` in `src/lib/storage.ts` calls `getSeedData()` from `src/lib/seedData.ts`
3. Seeds 30-day wellness log, 5 appointments, 3 medications, empty plan
4. Writes seed to localStorage with `isSeedData: true`
5. `DashboardPage` shows amber "You're seeing demo data" banner while `isSeedData === true`
6. Any `update()` call sets `isSeedData: false` automatically

**State Management:**
- All user data is one `UserData` object stored under `"healthbridge:userdata"` in localStorage
- React state is a mirror: `useUserData` holds a `useState<UserData | null>` that is populated once on mount via `useEffect` (SSR-safe)
- Updates are synchronous: `update(patch)` merges the patch, writes to localStorage, and calls `setUserData` — components re-render immediately
- Chat history (`userData.chatHistory: Message[]`) is part of the same localStorage object — no separate server session

## Context Injection Pattern

The key personalization mechanism is **client-side context assembly + server-side prompt injection**.

**Step 1 — Client serializes `UserData` into text fields** (`src/lib/contextBuilder.ts`):
```typescript
// buildChatRequest() produces:
{
  message: "What's my copay?",
  planText:  "Gold PPO, Deductible: $1,500...\nCurrent medications:\n- Lisinopril 10mg...",
  healthData: "Recent wellness (last 7 days):\n2026-05-06: mood 3/5, energy 6/10...",
  symptomHistory: "Today: headache. Pain level: 4/10."
}
```

**Step 2 — Server injects context above the user question** (`src/lib/orchestrate.ts → constructPrompt()`):
```
Insurance Plan Information:
{planText}

Your Health Data:
{healthData}

Symptom History:
{symptomHistory}

User Question: {message}
```

This pattern avoids uploading files to IBM — text is extracted client-side (wellness log) or server-side (PDF → `/api/parse-plan`) and injected as plain text context in every request.

## Authentication Architecture

IBM Watsonx uses short-lived OAuth2 Bearer tokens (1-hour TTL) instead of permanent API keys in request headers.

**Flow in `src/lib/ibm-auth.ts`:**
1. Server holds `WATSONX_API_KEY` (never sent to browser)
2. On first chat: POST to `https://iam.cloud.ibm.com/identity/token` with `grant_type=urn:ibm:params:oauth:grant-type:apikey`
3. IBM returns `{ access_token, expires_in: 3600 }`
4. Token cached in module-level variables (`cachedToken`, `cachedExpiry`) for 55 minutes (not 60, to avoid clock-skew expiry)
5. Subsequent requests within 55 min return the cached token in `<1ms`
6. After 55 min, a new token is fetched transparently

**Security properties:**
- API key lives only in `.env.local` (server-side only, never exposed to browser)
- IAM token lives only in Node.js module memory, never serialized to client
- Browser never sees either the API key or the IAM token

## Phase Breakdown

**Phase 1 — Project Setup:**
- Next.js 16 app scaffolded with TypeScript, Tailwind CSS v4, App Router
- `src/types/index.ts` created with `Message`, `ChatRequest`, `ChatResponse` types
- `.env.local` structure established for IBM credentials

**Phase 2 — IBM Authentication:**
- `src/lib/ibm-auth.ts` implemented: IAM token exchange + 55-min in-memory cache
- Env vars required: `WATSONX_API_KEY`

**Phase 3 — AI Chat Core:**
- `src/lib/orchestrate.ts` implemented: context injection pattern + Orchestrate HTTP client
- `src/app/api/chat/route.ts` created: validates input, calls `sendMessage()`, returns response
- `src/app/api/parse-plan/route.ts` created: multipart upload → `pdf-parse` → returns text
- Basic chat UI component `src/components/MessageBubble.tsx`

**Phase 4 — Wellness Dashboard:**
- `src/types/index.ts` extended: `WellnessEntry`, `Appointment`, `Medication`, `UserData`, `Suggestion`
- `src/lib/storage.ts`: localStorage CRUD with SSR guard, seed-on-first-load
- `src/lib/seedData.ts`: 30-day demo dataset (5 appointments, 3 medications, 30 wellness entries)
- `src/lib/contextBuilder.ts`: `buildChatRequest()` — serializes `UserData` for chat context
- `src/lib/suggestions.ts`: `generateSuggestions()` — 5-rule engine for AI suggestion chips
- `src/hooks/useUserData.ts`: reactive hook over localStorage
- Full dashboard UI at `/dashboard`, `/wellness`, `/chat`, `/history`
- Components: `WelcomeCard`, `WellnessSnapshotCard`, `AISuggestionsCard`, `AppointmentsCard`, `AddAppointmentModal`, `CheckInForm`, `MoodSelector`, `EnergySlider`, `PlanSection`, `MoodEnergyChart`, `SymptomFrequencyChart`, `AppointmentsTimeline`, `SuggestionChips`, `ContextSidebar`

## Anti-Patterns

### Agent name override on the wrong side

**What happens:** `src/app/api/chat/route.ts` overrides `agentResponse.agent` with `body.agent` after `sendMessage()` returns — the string sent in the request body replaces the metadata from IBM.
**Why it's wrong:** The real agent used (`data.metadata?.agent_used`) is already extracted in `orchestrate.ts`. The override means the UI may display the wrong agent name if IBM routes to a specialist.
**Do this instead:** Pass `body.agent` as the `targetAgent` parameter to `sendMessage()` and let `orchestrate.ts` merge it correctly.

### Module-level IAM token cache

**What happens:** `cachedToken` and `cachedExpiry` are module-level variables in `src/lib/ibm-auth.ts`.
**Why it's wrong:** In serverless/edge deployments each invocation may be a cold start, making the cache ineffective. In multi-instance deployments the cache is not shared.
**Do this instead:** For production, store the token in an external cache (e.g., Redis, KV store) keyed by the IBM instance ID.

## Error Handling

**Strategy:** Throw-on-failure in library functions; catch-and-return-JSON in API routes.

**Patterns:**
- `ibm-auth.ts` throws `Error` with descriptive messages if IBM auth fails — caller gets a 500
- `orchestrate.ts` throws if response is not ok (`response.ok === false`) or if `output` is empty
- `/api/chat` wraps `sendMessage()` in try/catch → returns `{ error, code, timestamp }` with HTTP 500
- `/api/parse-plan` validates `file` presence and MIME type before calling `pdf-parse`, returns 400 for invalid input
- Browser `ChatPage` shows an inline error bubble if `fetch("/api/chat")` fails; does not crash the session

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.warn`/`console.error` with emoji prefixes (e.g., `📨`, `✅`, `❌`). Server-side only; no client-side logging framework.
**Validation:** Manual `if (!field)` guards in API routes; no schema validation library (Zod not used).
**Authentication:** IBM IAM only — there is no user authentication layer. All users share the same IBM credentials. The app is effectively single-user or demo-mode.

---

*Architecture analysis: 2026-05-07*
