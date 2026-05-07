# Testing Patterns

**Analysis Date:** 2026-05-07

## Test Framework

**Runner:** None installed.

No test runner (Jest, Vitest, Playwright, Cypress) appears in `package.json` dependencies or devDependencies. There is no `jest.config.*`, `vitest.config.*`, or `playwright.config.*` file in the repository.

**Assertion Library:** None.

**Run Commands:**
```bash
# No test commands exist. package.json scripts:
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

There is no `"test"` script in `package.json`.

---

## Test File Inventory

**Unit/integration test files:** Zero.

A glob for `**/*.test.*` and `**/*.spec.*` in `src/` returns no results. There are no `__tests__/` directories anywhere in the project source.

**The only test artifact in the repository:**
- `test-api.sh` — a manual bash script for smoke-testing the `/api/chat` endpoint

---

## Manual API Testing (test-api.sh)

`test-api.sh` is a bash curl script that requires `npm run dev` to be running. It is not automated and must be run by hand.

**What it covers:**

| Test | Method | Payload | Expected |
|------|--------|---------|----------|
| Simple message | POST `/api/chat` | `{ message: "What are the side effects of metformin?" }` | 200 with agent response |
| Insurance context | POST `/api/chat` | message + `planText` with Gold PPO details | 200, response references plan |
| Health data context | POST `/api/chat` | message + `healthData` with heart rate/steps | 200, response acknowledges metrics |
| Empty message | POST `/api/chat` | `{ message: "" }` | 400 EMPTY_MESSAGE error |

**How it works:**
```bash
curl -X POST "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"What are the side effects of metformin?"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || curl ...  # fallback without jq
```

Results are verified by eye. There is no assertion logic — the developer reads the output and checks the checklist at the bottom of the script.

**Limitations:**
- Requires a live IBM Watsonx Orchestrate connection with valid `.env.local`
- Returns real AI responses (non-deterministic) — cannot assert on content
- No CI integration — only works locally

---

## Coverage

**Requirements:** None enforced. No coverage tooling installed.

**Untested surface area:** 100% of source code lacks automated test coverage.

---

## Test Coverage Gaps

**Critical — API route logic (`src/app/api/chat/route.ts`):**
- What's not tested: request validation (empty message → 400), error propagation from `sendMessage()` → 500, correct forwarding of `planText`/`healthData`/`symptomHistory` to `sendMessage()`
- Risk: Breaking validation or error shape goes undetected until a user hits it
- Priority: High

**Critical — IBM auth caching (`src/lib/ibm-auth.ts`):**
- What's not tested: token is cached after first fetch, cache expiry logic (55-minute window), behavior when `WATSONX_API_KEY` is missing (should throw), behavior when IBM returns non-200
- Risk: A cache bug silently makes every request hit IBM's auth server, causing rate-limit failures
- Priority: High

**Critical — Prompt construction (`src/lib/orchestrate.ts` → `constructPrompt`):**
- What's not tested: context injection ordering (plan → health → symptoms → question), behavior when all context fields are undefined (should produce bare question), context fields present vs. absent combinations
- Risk: Prompt format regression causes the agent to ignore injected context
- Priority: High

**High — `localStorage` data layer (`src/lib/storage.ts`):**
- What's not tested: first-time user gets seed data, parse error returns null gracefully, `upsertTodayWellnessEntry` creates new entry when none exists, updates existing entry without duplicating
- Files: `src/lib/storage.ts`, `src/lib/seedData.ts`
- Risk: Data corruption silently drops wellness entries or corrupts UserData shape
- Priority: High

**High — `useUserData` hook (`src/hooks/useUserData.ts`):**
- What's not tested: `isLoading` is true before mount and false after, `update()` merges patch without overwriting unrelated fields, `reset()` replaces data with fresh seed
- Risk: Partial update bug could silently wipe unrelated UserData fields
- Priority: High

**Medium — Context builder (`src/lib/contextBuilder.ts`):**
- What's not tested: `buildChatRequest` includes correct context fields, `summarizeContext` correctly computes counts and flags
- Risk: Chat sends wrong context to agent (e.g., no insurance plan even when uploaded)
- Priority: Medium

**Medium — Suggestion generation (`src/lib/suggestions.ts`):**
- What's not tested: correct suggestions based on appointments/medications/wellness log state
- Risk: Dashboard shows stale or wrong suggestions
- Priority: Medium

**Low — UI components:**
- `MessageBubble`, `CheckInForm`, `SuggestionChips`, `ContextSidebar`, `WelcomeCard`, `AppointmentsCard`
- Risk: Mostly cosmetic. Key logical branches (showing today's entry vs. no entry, agent badge rendering) are untested
- Priority: Low

---

## Recommended Testing Approach

**Recommended stack for this project:**

```
Vitest         — unit/integration test runner (works natively with Next.js + Vite)
@testing-library/react — component testing
msw (Mock Service Worker) — mock fetch calls for API route tests
```

**Why Vitest over Jest:**
The project uses Next.js 16 / React 19 / TypeScript 5. Vitest has zero-config ESM support and is significantly faster than Jest for this stack.

**Install:**
```bash
npm install -D vitest @testing-library/react @testing-library/user-event @vitejs/plugin-react jsdom msw
```

**Suggested `vitest.config.ts`:**
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

**Suggested `package.json` scripts:**
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

---

## Priority Test Cases to Write First

**1. `constructPrompt` — pure function, easiest to test:**
```typescript
// src/lib/orchestrate.test.ts
import { describe, it, expect } from "vitest";

describe("constructPrompt", () => {
  it("returns bare question when no context", () => { ... });
  it("prepends planText when provided", () => { ... });
  it("includes all three context sections in correct order", () => { ... });
});
```

**2. `getIAMToken` — token caching logic:**
```typescript
// src/lib/ibm-auth.test.ts
// Mock fetch, verify IBM is only called once across two getIAMToken() calls
// Verify second call after expiry fetches again
```

**3. POST `/api/chat` route — validation and error codes:**
```typescript
// src/app/api/chat/route.test.ts
// Use Request constructor to call the exported POST function directly
// Assert 400 on empty message, 200 shape on success, 500 on sendMessage() throw
```

**4. `storage.ts` — localStorage operations:**
```typescript
// src/lib/storage.test.ts
// Use jsdom's localStorage in vitest (available with environment: "jsdom")
// Test first-read seeds, upsert creates, upsert updates
```

**5. `useUserData` hook:**
```typescript
// src/hooks/useUserData.test.ts
// Use @testing-library/react renderHook
// Assert isLoading transitions, update merges correctly
```

---

## Test File Placement Convention (Recommended)

Place test files co-located with source files using `.test.ts` / `.test.tsx` suffix:

```
src/
  lib/
    ibm-auth.ts
    ibm-auth.test.ts       ← new
    orchestrate.ts
    orchestrate.test.ts    ← new
    storage.ts
    storage.test.ts        ← new
  hooks/
    useUserData.ts
    useUserData.test.ts    ← new
  app/
    api/
      chat/
        route.ts
        route.test.ts      ← new
  components/
    MessageBubble.tsx
    MessageBubble.test.tsx ← new (lower priority)
```

---

*Testing analysis: 2026-05-07*
