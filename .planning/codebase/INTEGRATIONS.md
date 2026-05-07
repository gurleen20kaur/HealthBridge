# External Integrations

**Analysis Date:** 2026-05-07

## IBM Cloud IAM (Identity and Access Management)

**Purpose:** OAuth2 token exchange — converts a long-lived API key into short-lived Bearer tokens used to authenticate all Watsonx API calls.

**Implementation:** `src/lib/ibm-auth.ts`

**Auth Endpoint:**
```
POST https://iam.cloud.ibm.com/identity/token
Content-Type: application/x-www-form-urlencoded
Accept: application/json

grant_type=urn:ibm:params:oauth:grant-type:apikey
apikey=<WATSONX_API_KEY>
response_type=cloud_iam
```

**Token Lifecycle:**
- IBM issues tokens valid for 3600 seconds (1 hour)
- HealthBridge caches for 3300 seconds (55 minutes) with a 5-minute safety buffer
- Cache stored as module-level variables (`cachedToken: string | null`, `cachedExpiry: number`) — in-memory, per Node.js process

**Caching Strategy:**
```
First call        → fetch from IBM (~500ms), store in memory
Subsequent calls  → return cached token (<1ms), ~99% of requests
After 55 min      → cache expired, fetch again (~500ms)
```

**Env Var Required:** `WATSONX_API_KEY`

**Error Conditions:**
- `WATSONX_API_KEY` not set → throws immediately before any network call
- IBM returns non-2xx → throws with HTTP status + IBM error body

---

## IBM Watsonx Orchestrate

**Purpose:** AI agent runtime — routes user messages to specialized health agents (HealthGuide, SymptomInsight, CoverageAdvisor) and returns their natural-language responses.

**Implementation:** `src/lib/orchestrate.ts`

**API Endpoint:**
```
POST {WATSONX_BASE_URL}/instances/{WATSONX_INSTANCE_ID}/v1/orchestrate/runs
Content-Type: application/json
Authorization: Bearer <IAM_token>

{
  "agent_id": "<WATSONX_AGENT_ID>",
  "messages": [
    { "role": "user", "content": "<prompt>" }
  ]
}
```

**URL Construction:**
- `WATSONX_BASE_URL` + `/instances/` + `WATSONX_INSTANCE_ID` + `/v1/orchestrate/runs`
- All three env vars validated at call time; missing any throws before the HTTP request

**Env Vars Required:**
- `WATSONX_BASE_URL` — Base URL for the Orchestrate instance (e.g., `https://...watsonx.ibm.com`)
- `WATSONX_INSTANCE_ID` — Instance ID embedded in URL path
- `WATSONX_AGENT_ID` — Agent ID sent in request body

**Response Parsing:**
The `output` field in the response can be either a plain string or an object:
```typescript
if (typeof data.output === "string") {
  agentAnswer = data.output;
} else if (typeof data.output === "object" && data.output !== null) {
  agentAnswer = data.output.answer || data.output.text || "";
}
```
Agent identity extracted from `data.metadata?.agent_used`, falling back to the `targetAgent` parameter.

**Default Routing:** All calls default to `targetAgent = "HealthGuide"` (the supervisor agent that routes to specialists internally).

**Context Injection Pattern:**
User data is NOT uploaded to IBM. Instead, `src/lib/orchestrate.ts → constructPrompt()` prepends extracted context above the user's question:
```
Insurance Plan Information:
<planText>

Your Health Data:
<healthData>

Symptom History:
<symptomHistory>

User Question: <userMessage>
```
This keeps IBM stateless — each request is self-contained.

---

## Next.js API Routes (Internal Endpoints)

These are the internal HTTP surface that the browser talks to; they proxy to IBM externally.

### POST /api/chat

**File:** `src/app/api/chat/route.ts`

**Request body:**
```typescript
{
  message: string;        // required
  planText?: string;      // insurance PDF text (injected into prompt)
  healthData?: string;    // wellness log summary (injected)
  symptomHistory?: string; // today's symptoms (injected)
  agent?: string;         // target agent override
}
```

**Response (200):**
```typescript
{ response: string; agent: string; timestamp: string }
```

**Errors:**
- `400` with `{ error, code: "EMPTY_MESSAGE", timestamp }` — message is blank
- `500` with `{ error, code: "ORCHESTRATE_ERROR", timestamp }` — IBM call failed

**Flow:**
1. Parse + validate request body
2. Call `sendMessage()` from `src/lib/orchestrate.ts`
3. `sendMessage` → `getIAMToken()` from `src/lib/ibm-auth.ts` → POST to IBM IAM
4. `sendMessage` → POST to Orchestrate runs endpoint
5. Return agent response JSON to browser

### POST /api/parse-plan

**File:** `src/app/api/parse-plan/route.ts`

**Request:** `multipart/form-data` with field `file` (PDF)

**Response (200):**
```typescript
{ text: string; fileName: string; pages: number }
```

**Errors:**
- `400` — no file, non-PDF MIME type, or empty extracted text
- `500` — pdf-parse threw

**Flow:**
1. Read `file` field from `FormData`
2. Validate MIME type includes `"pdf"`
3. `file.arrayBuffer()` → `Buffer.from()` → `pdf(buffer)` (pdf-parse)
4. Return `{ text, fileName, pages }`

---

## pdf-parse

**Package:** `pdf-parse` ^1.1.1

**Purpose:** Server-side PDF text extraction — pulls raw text from uploaded insurance plan PDFs so the content can be injected into Orchestrate prompts without any file storage.

**Usage pattern** (`src/app/api/parse-plan/route.ts`):
```typescript
import pdf from "pdf-parse";

const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
const data = await pdf(buffer);
// data.text   → extracted string
// data.numpages → page count
```

**No configuration** — called with default options; no custom renderers or page limits set.

**Constraint:** Runs server-side only (Node.js API route). Not imported in any client component.

---

## papaparse

**Package:** `papaparse` ^5.4.1

**Purpose:** CSV parsing for health data imports (e.g., Apple Health exports). Available as a dependency but no active usage found in current API route code — intended for client-side or future health data import feature.

---

## Data Storage

**Server-side database:** None — no database, ORM, or server-side cache.

**Client-side persistence:** Browser `localStorage` via `src/lib/storage.ts`
- Single key: `"healthbridge:userdata"`
- Full `UserData` object serialized as JSON
- Auto-seeded with 30-day demo data (`src/lib/seedData.ts`) on first load
- All reads guarded with `typeof window === "undefined"` check (safe for SSR)

**File storage:** None — PDFs are processed in-memory and discarded; only extracted text is stored in `localStorage`.

---

## Authentication & Identity

**User authentication:** None — no login, sessions, or user accounts. All data is local to the browser.

**Service authentication:** IBM IAM (see above) — server-side only, credentials never exposed to the browser.

---

## Monitoring & Observability

**Error tracking:** None — no Sentry, Datadog, or equivalent.

**Logging:** `console.log` / `console.warn` / `console.error` throughout API routes and lib modules. No structured logging library.

---

## CI/CD & Deployment

**Hosting:** Not specified in codebase config — `next.config.ts` is empty/default, compatible with Vercel, Railway, or any Node.js host.

**CI Pipeline:** Not detected — no `.github/workflows/` or equivalent.

---

## Webhooks & Callbacks

**Incoming:** None

**Outgoing:** None — all IBM calls are synchronous request/response initiated by user actions.

---

## Environment Configuration Summary

All secrets are server-side only (Next.js API routes). The browser never receives any IBM credentials.

| Variable | Service | Required |
|----------|---------|----------|
| `WATSONX_API_KEY` | IBM IAM | Yes |
| `WATSONX_BASE_URL` | IBM Watsonx Orchestrate | Yes |
| `WATSONX_INSTANCE_ID` | IBM Watsonx Orchestrate | Yes |
| `WATSONX_AGENT_ID` | IBM Watsonx Orchestrate | Yes |

Store in `.env.local` for development. For production, inject via host environment (Vercel env vars, Railway secrets, etc.).

---

*Integration audit: 2026-05-07*
