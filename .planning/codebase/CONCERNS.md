# Codebase Concerns

**Analysis Date:** 2026-05-07

---

## Known Issues

### Orchestrate API Endpoint Assumptions

The URL constructed in `src/lib/orchestrate.ts` (line 175) follows this pattern:

```
${WATSONX_BASE_URL}/instances/${WATSONX_INSTANCE_ID}/v1/orchestrate/runs
```

This path (`/instances/{id}/v1/orchestrate/runs`) is an assumed structure — it must
be verified against the actual IBM watsonx Orchestrate API reference. The correct
path may differ (e.g., it may not use an instance-scoped segment, or the version
prefix may be different). The request body shape — `{ agent_id, messages }` — is
also assumed and must match what IBM's deployed endpoint actually accepts.

**Files:** `src/lib/orchestrate.ts` lines 163–183
**Risk:** Every chat request will fail at runtime until confirmed against the IBM
console. The error surface is the `response.ok` check at line 198 which throws a
generic 500 back to the client.

### No TODO/FIXME Comments Found

A full scan of `src/**/*.{ts,tsx}` found zero `TODO`, `FIXME`, `HACK`, or `XXX`
comments. All placeholder text in the codebase is UI input placeholder strings
(HTML attribute), not code stubs.

### `agent` Field Override Logic in `/api/chat`

In `src/app/api/chat/route.ts` lines 110–112, the `body.agent` field is used to
overwrite `agentResponse.agent` after the response is already received. This means
the `targetAgent` parameter passed to `sendMessage()` is always the default
(`"HealthGuide"`) — the `body.agent` field never actually routes to a specific
agent, it only labels the response after the fact. If selective agent routing is
required in a future phase, `body.agent` must be forwarded into `sendMessage()` as
the third argument.

**Files:** `src/app/api/chat/route.ts` lines 102–112

### Response Parsing is Fragile

`src/lib/orchestrate.ts` lines 216–226 try to extract the agent answer from
`data.output` as either a `string` or an object with `.answer` or `.text`. If IBM
returns any other shape (nested array, different key name), `agentAnswer` will be
an empty string and the function throws a generic error with the raw response
serialized into the message. There is no structured logging of the full unexpected
shape.

**Files:** `src/lib/orchestrate.ts` lines 214–227

### IAM Token Cache is Process-Scoped

`src/lib/ibm-auth.ts` stores `cachedToken` and `cachedExpiry` as module-level
variables. In serverless/edge environments (Vercel, AWS Lambda), each cold-start
creates a new module instance, so the cache provides no benefit across invocations.
In development (persistent Node process) it works correctly. This is not a bug but
is a misleading comment ("100 requests only makes 2 network requests") for
production serverless deployments.

**Files:** `src/lib/ibm-auth.ts` lines 38–49

---

## Security

### API Keys: Server-Side Only (Good)

`WATSONX_API_KEY`, `WATSONX_BASE_URL`, `WATSONX_INSTANCE_ID`, and
`WATSONX_AGENT_ID` are read exclusively inside Next.js Route Handlers
(`src/lib/ibm-auth.ts`, `src/lib/orchestrate.ts`). They are never accessed from
any `"use client"` component. Next.js will not expose these to the browser bundle.

### `.env.local` Excluded from Git (Good)

`.gitignore` contains `.env*` which covers `.env.local`. Secrets are not at risk
of being committed.

### PDF Parsing — Untrusted Input

`src/app/api/parse-plan/route.ts` accepts arbitrary `multipart/form-data` uploads
and passes the raw `Buffer` to `pdf-parse` (line 81) with no size limit enforced
in application code. Concerns:

- **No file size limit:** A multi-hundred-megabyte PDF will be fully buffered into
  memory (`file.arrayBuffer()` at line 77) before rejection. This can cause OOM
  errors or timeout a serverless function. Next.js default body size limit is 4 MB
  for JSON but multipart limits may differ. An explicit check against `file.size`
  should be added before `arrayBuffer()`.
- **MIME type check is weak:** The check at line 61 (`file.type.includes("pdf")`)
  trusts the browser-supplied `Content-Type`. A renamed non-PDF file with a
  spoofed MIME type will pass and be sent to `pdf-parse`. Adding a magic-byte
  check on the first bytes of the buffer would be more robust.
- **`pdf-parse` parses malformed/adversarial PDFs:** The library runs synchronously
  in the Node process. A crafted PDF designed to cause excessive CPU usage (e.g.,
  deeply nested XRef chains) can block the event loop. There is no timeout wrapper
  around the `pdf()` call (line 81).

**Files:** `src/app/api/parse-plan/route.ts` lines 61–85

### No Authentication on API Routes

Neither `/api/chat` nor `/api/parse-plan` requires any session token, API key, or
user credential. Both are fully public endpoints. Anyone who can reach the deployed
URL can:

- Send unlimited chat requests to IBM Orchestrate (incurring IBM usage costs).
- Upload and parse arbitrary PDF files.

There is no Next.js middleware (`src/middleware.ts` does not exist) to protect
these routes.

**Files:** `src/app/api/chat/route.ts`, `src/app/api/parse-plan/route.ts`

### No CORS Configuration

`next.config.ts` is empty (default config). No explicit CORS headers are set on
the API routes. Next.js defaults allow same-origin requests only for server-side
routes, but cross-origin requests from a different domain would need explicit
`Access-Control-Allow-Origin` headers. This is fine for same-origin web usage but
worth noting if the API is ever consumed from a mobile app or external client.

### User Data Stored in `localStorage` Without Encryption

All health data — wellness entries, medications, appointment details, insurance
plan text (full PDF content), and chat history — is written to `localStorage` under
the key `"healthbridge:userdata"` as plain JSON. Any browser extension, injected
script, or XSS vulnerability can read the full health record. For a health
application this is a meaningful privacy risk if sensitive real data is entered.

**Files:** `src/lib/storage.ts` lines 33–56

### Chat History Grows Without Bound

`userData.chatHistory` (type `Message[]`) is appended on every send
(`src/app/chat/page.tsx`) and persisted to `localStorage` in full. There is no
pruning, pagination, or maximum count. A long-running session will eventually push
`localStorage` past its 5–10 MB browser limit, causing `setItem` to throw a
`QuotaExceededError`. The catch block in `src/lib/storage.ts` line 58 only logs
the error — the write silently fails and data is lost.

**Files:** `src/lib/storage.ts` lines 52–59, `src/app/chat/page.tsx`

---

## Performance

### Token Caching: 55-Minute Window (Good in Dev)

`src/lib/ibm-auth.ts` caches the IBM IAM token for 55 minutes (line 166), giving
a 5-minute safety buffer before the 60-minute token expiry. In a long-running
development server this eliminates repeated auth round-trips. See the scalability
note above about serverless cold starts.

### No Rate Limiting on API Routes

`/api/chat` makes an outbound request to IBM Orchestrate and `/api/parse-plan`
buffers a full file into memory on every call. Neither route has:

- Request throttling (per IP or per session)
- Concurrent request limiting
- Backpressure handling

A burst of parallel requests will generate parallel IBM API calls and parallel
in-memory PDF parses with no queuing.

**Files:** `src/app/api/chat/route.ts`, `src/app/api/parse-plan/route.ts`

### PDF Parsing is Blocking (Synchronous in Event Loop)

`pdf-parse`'s `pdf()` function (used at `src/app/api/parse-plan/route.ts` line 81)
runs synchronously on the main Node.js event loop thread via a CPU-bound operation.
For large PDFs this will block all other incoming requests until parsing completes.
The `await` in the route handler only suspends the async function; it does not move
the CPU work off the main thread.

**Files:** `src/app/api/parse-plan/route.ts` lines 80–85

### Context Payload Size is Unbounded

`src/lib/contextBuilder.ts` injects `userData.insurancePlan.text` (full PDF text,
potentially tens of thousands of tokens) plus wellness log and medication lists into
every chat request. IBM Orchestrate has a context/token limit; exceeding it will
cause 400/413 errors. There is no truncation logic on `planText`.

**Files:** `src/lib/contextBuilder.ts` lines 96–103

---

## Scalability

### All State Lives in `localStorage` — No Backend Persistence

The entire data model (`UserData` — wellness log, appointments, medications,
insurance plan, chat history) is stored client-side in `localStorage` via
`src/lib/storage.ts`. Consequences:

- Data is siloed per browser. A user switching devices or browsers loses all data.
- There is no server-side record of what any user has entered.
- Clearing browser storage or using a private window resets everything to seed data.
- Multi-tab edits are not synchronized — two open tabs will overwrite each other's
  writes because there is no `storage` event listener in `useUserData`.

**Files:** `src/lib/storage.ts`, `src/hooks/useUserData.ts`

### No User Authentication System

There is no concept of a logged-in user. All pages are public. There are no
session cookies, JWTs, OAuth flows, or identity providers wired up. Adding
authentication would require:

1. An auth provider (e.g., NextAuth.js, Clerk, Supabase Auth).
2. Protecting routes via `src/middleware.ts`.
3. Migrating `localStorage` data to a user-scoped backend store.

This is a deliberate Phase 4 limitation but becomes the primary blocker for any
real multi-user deployment.

### `wellnessLog` Array Grows Indefinitely

`src/lib/storage.ts` appends one `WellnessEntry` per day with no archiving or
pruning. After one year of daily check-ins that is ~365 entries serialized as JSON
on every page load and deserialized on every `getUserData()` call. At scale this
will degrade parse time and approach browser `localStorage` quota.

**Files:** `src/lib/storage.ts`, `src/types/index.ts` (`UserData.wellnessLog`)

---

## Phase Completion Status

| Phase | Description | Status | Notes |
|-------|-------------|--------|-------|
| Phase 1 | IBM Orchestrate agent definitions (HealthGuide, SymptomInsight, CoverageAdvisor) | Complete — done externally in IBM console | Agents must be deployed and `WATSONX_AGENT_ID` must reference a live agent |
| Phase 2 | Next.js backend — `/api/chat` and `/api/parse-plan` route handlers, IBM auth + token caching, prompt construction | Complete | Orchestrate endpoint URL and request body shape still need verification against the IBM console |
| Phase 3 | React frontend — chat UI, insurance PDF upload, context sidebar, suggestion chips | Complete | Fully wired to Phase 2 backend |
| Phase 4 | Wellness dashboard — dashboard overview, wellness check-in, history tab, appointments, `localStorage` data layer, seed data | Complete | All state is client-side only; no backend persistence |

---

*Concerns audit: 2026-05-07*
