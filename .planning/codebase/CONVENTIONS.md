# Coding Conventions

**Analysis Date:** 2026-05-07

## TypeScript Patterns

**Interfaces — always, never `type`:**
All data shapes are defined with `interface`, not `type`. Every module has its own local interfaces for request/response shapes, and shared domain types live in `src/types/index.ts`.

```typescript
// Local (per-file) interfaces — for API request/response shapes
interface ChatRequest {
  message: string;
  planText?: string;
  agent?: string;
}

// Shared interfaces — exported from src/types/index.ts
export interface WellnessEntry { ... }
export interface UserData { ... }
```

**Optional fields with `?`:**
Optional fields use `?` (not `| undefined` unions). All context fields on interfaces are optional.

```typescript
interface MessageContext {
  planText?: string;
  healthData?: string;
  symptomHistory?: string;
}
```

**Type assertions with `as`:**
JSON fetch responses are cast with `as InterfaceName` immediately after `.json()`.

```typescript
const data = (await response.json()) as IBMTokenResponse;
const body = (await request.json()) as ChatRequest;
```

**Generics:**
Used sparingly. `Partial<UserData>` is used for the `update()` hook patch parameter. `Omit<WellnessEntry, "createdAt" | "updatedAt">` is used for form submission shapes. No custom generic utilities are defined.

**Discriminated unions:**
`role: "user" | "agent"` on `Message`, `status: "upcoming" | "completed" | "cancelled"` on `Appointment`, `priority: "high" | "medium" | "low"` on `Suggestion`. All use string literal union types on interface fields.

**`strict: true` enforced:**
`tsconfig.json` has `"strict": true`. All function returns are typed explicitly. `instanceof Error` guards are used before accessing `.message`.

```typescript
const errorMessage = error instanceof Error ? error.message : "Unknown error";
```

**Index signatures used sparingly:**
`OrchestrateAPIResponse` in `src/lib/orchestrate.ts` uses `[key: string]: any` as an escape hatch for an unpredictable external API. This is the only usage.

---

## React Patterns

**`"use client"` directive — explicit everywhere:**
Every component file and the custom hook starts with `"use client"`. Page components that are pure client pages also carry `"use client"`. The API route (`src/app/api/chat/route.ts`) does NOT have it (server-only).

```typescript
"use client";

import { useState, useEffect } from "react";
```

**Named exports, not default:**
Components use named exports. Page files (`page.tsx`) use default exports as required by Next.js App Router. The inner content component is named and exported as `default` via a thin wrapper.

```typescript
// Component file — named export
export function MessageBubble({ message }: MessageBubbleProps) { ... }

// Page file — default export wrapping named content component
function ChatPageContent() { ... }
export default function ChatPage() {
  return <Suspense ...><ChatPageContent /></Suspense>;
}
```

**Props typed with co-located interfaces:**
Each component defines its own `interface [Name]Props` directly above the component function. Props are always destructured in the parameter list.

```typescript
interface WelcomeCardProps {
  userData: UserData;
}
export function WelcomeCard({ userData }: WelcomeCardProps) { ... }
```

**Hook pattern — `useCallback` for stable references:**
All event handlers inside the `useUserData` hook and chat page use `useCallback` with explicit dependency arrays. `useRef` is used for DOM scroll targets and one-time flag guards (URL param handling).

**Custom hook — single source of truth:**
`src/hooks/useUserData.ts` is the only custom hook. It wraps `localStorage` reads/writes and exposes `{ userData, isLoading, update, reset }`. All pages call `useUserData()` — no page reads `localStorage` directly.

**Loading guard pattern:**
Pages that consume `useUserData()` return a loading skeleton before data is available:

```typescript
if (isLoading || !userData) {
  return <div className="animate-pulse text-slate-400">Loading…</div>;
}
```

**`Suspense` boundary for `useSearchParams`:**
The chat page wraps its content in `<Suspense>` because `useSearchParams()` requires it in the Next.js App Router.

**State management — `useState` only:**
No global state library. All state is local `useState` within components. Cross-component data flows only through `useUserData` (localStorage) and props. No React Context is used.

**Optimistic updates:**
The chat page adds the user's message to state immediately before the API call resolves, then appends the agent reply (or an error bubble) after.

---

## File Naming Conventions

**Component files:** PascalCase matching the exported component name.
- `MessageBubble.tsx` → `export function MessageBubble`
- `CheckInForm.tsx` → `export function CheckInForm`
- `WelcomeCard.tsx` → `export function WelcomeCard`

**Library files:** camelCase.
- `ibm-auth.ts`, `orchestrate.ts`, `contextBuilder.ts`, `seedData.ts`, `storage.ts`, `suggestions.ts`

**Hooks:** camelCase prefixed with `use`.
- `useUserData.ts` → `export function useUserData`

**Pages:** lowercase `page.tsx` as required by Next.js App Router.

**Component subdirectories:** PascalCase matching feature area.
- `src/components/Dashboard/`, `src/components/Wellness/`, `src/components/History/`, `src/components/Chat/`, `src/components/Layout/`

---

## Comment Style

**Educational block headers — mandatory on every file:**
Every `.ts` and `.tsx` file opens with a JSDoc block explaining what the module does, why it exists, and how it works. These comments are written for developers unfamiliar with the domain.

```typescript
/**
 * IBM Watsonx Authentication Module
 *
 * This module handles OAuth2 token exchange:
 * 1. Takes your API key (from .env.local)
 * 2. Exchanges it for a temporary token with IBM
 * 3. Caches the token in memory
 * ...
 *
 * Why? Tokens expire (60 min), making them safer than permanent API keys.
 * Why cache? Each request would be 500ms slower if we fetched a token every time.
 */
```

**Section dividers inside files:**
Long files use `// ====...====` banners to separate TYPE DEFINITIONS, HELPER functions, and MAIN EXPORTS.

```typescript
// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
```

**Inline comments on non-obvious lines:**
Single-line comments explain the "why" next to magic numbers, HTTP status codes, and branching logic.

```typescript
cachedExpiry = Date.now() + 55 * 60 * 1000;
// Date.now() = current time in milliseconds
// 55 * 60 * 1000 = 3,300,000 milliseconds = 55 minutes
// So: cachedExpiry = now + 55 minutes
```

**JSDoc on exported functions:**
All exported functions have JSDoc with `@param`, `@returns`, and usage examples in the doc comment.

**JSX section comments:**
In TSX, sections of markup are separated by `{/* SECTION NAME */}` comments.

```tsx
{/* MOOD */}
<div className="space-y-3">...</div>

{/* ENERGY */}
<div className="space-y-3">...</div>
```

---

## Error Handling Patterns

**Server-side (API route) — try/catch with HTTP codes:**
The POST handler in `src/app/api/chat/route.ts` wraps the entire body in `try/catch`. Validation failures return `400`. Any thrown error from the service layer returns `500`.

```typescript
return NextResponse.json(
  { error: "Message cannot be empty", code: "EMPTY_MESSAGE", timestamp: ... },
  { status: 400 }
);
// ...
return NextResponse.json(
  { error: `Failed to get response: ${errorMessage}`, code: "ORCHESTRATE_ERROR", timestamp: ... },
  { status: 500 }
);
```

**Machine-readable `code` field on all errors:**
Every `ErrorResponse` includes a string `code` alongside the human-readable `error`. Defined codes: `EMPTY_MESSAGE`, `ORCHESTRATE_ERROR`.

**Library-level — throw `Error` with descriptive messages:**
`src/lib/ibm-auth.ts` and `src/lib/orchestrate.ts` throw `new Error(...)` with context about which env var is missing or what the HTTP status was. Callers are expected to catch and wrap.

**Client-side — `catch` with `instanceof Error` guard:**
```typescript
} catch (err) {
  const errMsg = err instanceof Error ? err.message : "Unknown error";
  setError(errMsg);
}
```

**`response.ok` check on every `fetch`:**
Every `fetch` call (both in lib files and in client components) checks `response.ok` before parsing JSON, and reads `response.text()` for error details.

**`localStorage` errors — caught silently with `console.error`:**
`src/lib/storage.ts` wraps `localStorage` reads in `try/catch` and returns `null` on failure rather than crashing.

---

## Tailwind CSS Usage Patterns

**Tailwind v4 (`@tailwindcss/postcss`):**
No `tailwind.config.js`. Configuration is through PostCSS only.

**Utility-first, no custom CSS files beyond globals:**
All styling is inline Tailwind classes. No `.module.css` files. No `className` composition libraries (no `clsx`, no `cn`).

**Conditional classes — template literal concatenation:**
Conditional Tailwind classes use template literals with ternary expressions directly in JSX:

```tsx
className={`px-3 py-2 rounded-full text-sm font-medium border-2 transition-all
  ${isTaken
    ? "bg-teal-500 text-white border-teal-500"
    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
  }`}
```

**Color palette — teal as primary, slate as neutral:**
- Primary actions: `teal-500`, `teal-600` (buttons, focus rings, badges)
- Neutral surfaces: `slate-50`, `slate-100`, `slate-200` (backgrounds, borders)
- Text: `slate-800` (headings), `slate-600` (body), `slate-400`/`slate-500` (muted)
- Accents: `violet-*` (suggestion chips), `green-*` (success states), `amber-*` (warnings)

**Card pattern — white rounded-2xl with shadow:**
All content cards use `bg-white rounded-2xl shadow-md p-6`. This is the consistent container shape across the entire app.

**Responsive layout — `lg:` breakpoint only:**
Grid layouts switch at `lg:` (1024px). Two-column grids use `grid grid-cols-1 lg:grid-cols-2` or `lg:grid-cols-3`. No `sm:` or `md:` grid breakpoints.

**Dark mode — `dark:` prefix on message bubbles only:**
`src/components/MessageBubble.tsx` is the only file using `dark:` variants (`dark:bg-gray-700`, `dark:text-gray-100`). Dark mode is not systematically applied.

**Focus styling — `focus:ring-2 focus:ring-teal-500 focus:border-transparent`:**
All form inputs use this exact focus pattern. No `focus:outline-none` without a ring replacement.

**Animation — Tailwind animate utilities only:**
Loading states use `animate-pulse` (skeleton) and `animate-bounce` (typing indicator dots). No CSS keyframes defined.

---

## Import Patterns

**`@/` alias for all internal imports:**
`tsconfig.json` maps `@/*` → `./src/*`. All cross-directory imports use `@/`. Relative imports (`./`, `../`) are only used within the same directory.

```typescript
import { UserData } from "@/types";
import { getIAMToken } from "@/lib/ibm-auth";
import { useUserData } from "@/hooks/useUserData";
import { MessageBubble } from "@/components/MessageBubble";
```

**Import grouping order (observed):**
1. React/Next.js framework imports (`react`, `next/server`, `next/navigation`, `next/link`)
2. Internal type imports (`@/types`)
3. Internal lib imports (`@/lib/...`)
4. Internal hook imports (`@/hooks/...`)
5. Internal component imports (`@/components/...`)

No blank lines between groups (no enforced separator rule via ESLint).

**No barrel `index.ts` files in component directories:**
Each component is imported by its exact file path. There is one barrel file: `src/types/index.ts` which exports all shared types.

**External packages — minimal:**
Only `next`, `react`, `react-dom`, `recharts`, `papaparse`, `pdf-parse` are used. No UI component library. No form library. No state management library.

---

*Convention analysis: 2026-05-07*
