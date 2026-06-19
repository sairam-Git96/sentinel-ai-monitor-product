# Sentinel AI — AI-Powered Transaction Monitoring Platform

> **Monitor millions of authorizations. Diagnose in seconds.**

Sentinel AI is an enterprise-grade platform for **AI-powered card-transaction monitoring, anomaly detection, root-cause analysis, and GenAI-driven investigations** built for card issuers and payment processors. It detects fraud spikes, approval-rate drops, gateway latency issues, and other anomalies in near-real-time, then explains root causes in plain language via an AI Diagnostic Assistant.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Architecture](#architecture)
- [Roles & Permissions](#roles--permissions)
- [Application Modules](#application-modules)
- [AI Integration](#ai-integration)
- [Design System](#design-system)
- [Routing Conventions](#routing-conventions)
- [Scripts](#scripts)

---

## Features

- **Real-time anomaly detection** — monitors fraud spikes, approval-rate drops, MCC/country/channel outliers, gateway latency, decline surges, and authentication failures.
- **GenAI root-cause analysis** — plain-language explanations of detected anomalies powered by Google Gemini via the Lovable AI Gateway.
- **AI Diagnostic Assistant** — a persistent, session-aware chat interface for querying anomaly data, drafting notes, and getting next-step recommendations.
- **Investigation Module** — a single-scroll, end-to-end case workspace featuring an 8-step AI pipeline, real-time progress simulation, root-cause probability charts, timelines, collaborative notes, and evidence management.
- **Role-scoped dashboards** — tailored views for Risk Analysts, Fraud Investigators, Operations Managers, Compliance Officers, Executives, and Super Admins.
- **Case & incident management** — Kanban + table toggle, full CRUD, escalation, SLA tracking, and audit trails.
- **Fraud analytics** — trend charts, BIN/MCC/country heatmaps, and top attack-vector breakdowns.
- **Reports & exports** — report templates, CSV export, and browser print-to-PDF.
- **SOC2-aligned, explainable AI** — every metric surfaced with an `InfoTooltip` drawn from a central tooltip registry.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start v1 (React 19, Vite 7 + Nitro), file-based routing |
| Language | TypeScript 5 (`strict` mode, ES2022 target) |
| Styling | Tailwind CSS v4 (`@theme` semantic tokens), shadcn/ui primitives |
| Charts | Recharts via shadcn Chart wrapper |
| Icons | lucide-react |
| Toasts | sonner |
| Forms | react-hook-form + Zod |
| State | Local component state + `localStorage` (no real backend) |
| AI | Lovable AI Gateway (`@ai-sdk/openai-compatible`), model: `google/gemini-3-flash-preview` |
| Server boundary | `createServerFn` from `@tanstack/react-start` in `*.functions.ts` files |
| Auth | Demo only — any credentials work; role stored in `localStorage["sentinel.session"]` |
| Package manager | Bun |
| Fonts | Inter (UI), JetBrains Mono (code blocks) |

---

## Setup

### Prerequisites

- [Bun](https://bun.sh/) v1.0+ (recommended) **or** Node.js 18+
- A `LOVABLE_API_KEY` for AI features (see [AI Integration](#ai-integration))

### 1. Clone the repository

```bash
git clone https://github.com/sairam-Git96/sentinel-ai-monitor-product.git
cd sentinel-ai-monitor-product
```

### 2. Install dependencies

```bash
bun install
```

> If you prefer npm: `npm install`

### 3. Configure environment variables

Create a `.env` file at the project root:

```env
# Required for AI features (investigateAnomaly server function + AI Assistant)
LOVABLE_API_KEY=your_lovable_api_key_here
```

> **Important:** The API key is accessed **only server-side** inside `src/lib/ai-gateway.server.ts`. It is never bundled into the client. If the key is missing, the `investigateAnomaly` function will throw a clear error message.

Without a key, all UI features still work — only the real AI calls (Investigate button, Assistant responses) will return an error. The rest of the app runs fully on mock data.

### 4. Start the development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Demo login

Navigate to `/login`. Any email and password are accepted.

**Default credentials:**
- Email: `admin@sentinel.ai`
- Password: `demo`

Select a role from the tile grid, then click **Sign in**. The session is persisted in `localStorage["sentinel.session"]` and survives page refreshes.

To switch roles mid-session, use the **Role Switcher** in the top-right header — no sign-out required.

### Build for production

```bash
bun run build
```

Preview the production build locally:

```bash
bun run preview
```

The Vite/Nitro config in `vite.config.ts` (via `@lovable.dev/vite-tanstack-config`) handles SSR bundling, Cloudflare target output, `@` path aliases, and env injection automatically. Do not add those plugins manually.

### Linting & formatting

```bash
bun run lint      # ESLint
bun run format    # Prettier
```

---

## Architecture

### High-Level Overview

```
Browser (React 19 SPA)
    │
    ├── TanStack Router  (file-based, client-side navigation)
    │       └── AppShell  (header · sidebar · main)
    │               └── Route Components  (/app/*)
    │
    ├── localStorage
    │       ├── sentinel.session          (role, email, loginAt)
    │       ├── sentinel.assistant.history.v1  (chat sessions)
    │       └── sentinel.*                (any other demo state)
    │
    └── createServerFn  (TanStack Start server boundary)
            └── investigateAnomaly  →  Lovable AI Gateway  →  Gemini 3 Flash
```

There is **no database and no auth server**. All data is generated from deterministic mock seeders in `src/lib/mock-data.ts` and `src/lib/investigation-mock.ts`. The only real network call is the AI request, which is proxied through a server function to keep the API key off the client.

---

### Directory Structure

```
sentinel-ai-monitor-product/
├── src/
│   ├── assets/                    # Static images (hero-dashboard.jpg, ai-assistant.jpg)
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   │   ├── app-shell.tsx          # Root layout: sticky header, collapsible sidebar, breadcrumbs
│   │   ├── info-tooltip.tsx       # Structured KPI tooltip (hover/click, renders TooltipSpec)
│   │   ├── investigate-dialog.tsx # Modal: calls investigateAnomaly, renders verdict
│   │   ├── module-actions.tsx     # Standard action bar (Refresh, Export, Print, Filter, AI)
│   │   ├── range-filter.tsx       # Date-range + interval picker
│   │   └── theme-toggle.tsx       # Light / Dark / System switcher
│   │
│   ├── hooks/                     # Custom React hooks
│   │
│   ├── lib/
│   │   ├── ai-gateway.server.ts   # createLovableAiGatewayProvider() — server-only
│   │   ├── error-capture.ts       # SSR error capture helper
│   │   ├── error-page.ts          # Fallback HTML error page renderer
│   │   ├── export.ts              # CSV Blob builder + download trigger
│   │   ├── investigate.functions.ts  # investigateAnomaly createServerFn (POST)
│   │   ├── investigation-mock.ts  # InvestigationCase types + 12–20 seed cases
│   │   ├── lovable-error-reporting.ts # Error reporting integration
│   │   ├── mock-data.ts           # Anomaly, Transaction, Case, Audit, Notification seeds
│   │   ├── session.ts             # RBAC: ROLES, PERMISSIONS, get/set/clearSession
│   │   ├── tooltips.ts            # Central TOOLTIPS registry (metric definitions)
│   │   └── utils.ts               # cn() and shared utilities
│   │
│   ├── routes/
│   │   ├── __root.tsx             # HTML shell, providers, ThemeProvider, Toaster
│   │   ├── index.tsx              # Marketing landing page (/)
│   │   ├── login.tsx              # Demo login + role picker (/login)
│   │   ├── app.tsx                # Authenticated layout — wraps /app/* in AppShell
│   │   ├── app.index.tsx          # Redirects /app → /app/dashboard
│   │   ├── app.dashboard.tsx      # Role-switched dashboard
│   │   ├── app.transactions.tsx   # Transaction monitoring
│   │   ├── app.anomalies.tsx      # Anomaly detection list + detail
│   │   ├── app.rca.tsx            # Root-cause analysis
│   │   ├── app.assistant.tsx      # AI Diagnostic Assistant (chat + history)
│   │   ├── app.investigations.tsx # Case management (Kanban + table)
│   │   ├── app.investigation.tsx  # Investigation Module workspace
│   │   ├── app.incidents.tsx      # Incident management
│   │   ├── app.fraud.tsx          # Fraud analytics
│   │   ├── app.reports.tsx        # Reports & analytics
│   │   ├── app.architecture.tsx   # System architecture (12 diagram tabs)
│   │   ├── app.users.tsx          # User management
│   │   ├── app.roles.tsx          # Role management
│   │   ├── app.audit.tsx          # Audit logs
│   │   ├── app.notifications.tsx  # Notifications inbox
│   │   ├── app.settings.tsx       # Settings
│   │   ├── app.help.tsx           # Help center
│   │   └── README.md              # TanStack file-based routing conventions
│   │
│   ├── routeTree.gen.ts           # Auto-generated by TanStack Router (do not edit)
│   ├── router.tsx                 # Router instance config
│   ├── server.ts                  # SSR fetch handler + catastrophic error normalizer
│   ├── start.ts                   # TanStack Start instance + error middleware
│   └── styles.css                 # Tailwind v4 @theme tokens + brand utilities
│
├── AGENTS.md                      # Lovable branch sync notes
├── MASTER_PROMPT.md               # Full product build specification
├── bun.lock
├── bunfig.toml
├── components.json                # shadcn/ui config
├── eslint.config.js
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

### Request Lifecycle

```
User action in browser
    │
    ▼
TanStack Router (client)
    │  file-based routes, no full page reloads
    ▼
Route Component renders
    │
    ├── reads mock data from lib/mock-data.ts  (synchronous, in-memory)
    ├── reads session from localStorage        (synchronous)
    │
    └── [if AI action] ──► createServerFn (POST to /api/_server)
                                │
                                ▼
                          src/start.ts  (error middleware)
                                │
                                ▼
                          investigate.functions.ts
                                │  reads LOVABLE_API_KEY from process.env
                                ▼
                          Lovable AI Gateway (HTTPS)
                          https://ai.gateway.lovable.dev/v1
                                │
                                ▼
                          Google Gemini 3 Flash Preview
                                │  structured JSON verdict (Zod schema)
                                ▼
                          Back to browser → InvestigateDialog renders result
```

---

### Authentication & Session Architecture

Authentication is **demo-only** — there is no real auth server or token validation.

```
/login  →  setSession({ email, role, loginAt })
               └── JSON.stringify → localStorage["sentinel.session"]

AppShell mounts
    └── getSession() reads localStorage
            └── hasPermission(role, perm) gates every nav item and action

Role Switcher (header)
    └── setSession({ email, newRole })  →  React state update  →  entire app re-renders

Sign Out
    └── clearSession()
            ├── removes localStorage["sentinel.session"]
            ├── removes all keys starting with "sentinel."
            └── clears sessionStorage
    └── navigate("/login", { replace: true })
```

Session shape:

```ts
interface Session {
  email: string;
  role: Role;
  loginAt: number;  // Unix ms timestamp
}
```

---

### RBAC Architecture

All permission checks flow through a single helper in `src/lib/session.ts`:

```ts
hasPermission(role: Role | null, perm: Permission): boolean
```

- `super_admin` uses `permissions: "all"` — the helper returns `true` for every permission.
- All other roles carry an explicit `Permission[]` array.
- The sidebar filters nav items client-side using `hasPermission`.
- Route components gate destructive actions (buttons, dropdowns) using the same call.
- No server-side route protection is implemented (demo app).

**Permission IDs:** `dashboard` · `transactions` · `anomalies` · `rca` · `assistant` · `cases` · `incidents` · `fraud` · `reports` · `executive` · `investigation` · `users` · `roles` · `audit` · `settings` · `help`

---

### AI Architecture

#### Provider setup (`src/lib/ai-gateway.server.ts`)

```ts
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}
```

This file is **server-only** (`.server.ts` suffix). It is never imported from client code.

#### `investigateAnomaly` server function (`src/lib/investigate.functions.ts`)

A `createServerFn({ method: "POST" })` that:

1. Validates input with Zod (`InvestigateInput` schema).
2. Reads `process.env.LOVABLE_API_KEY` — throws clearly if missing.
3. Builds a payments-domain prompt with the anomaly context.
4. Calls `generateText()` with `experimental_output: Output.object({ schema })` to get a structured JSON response.
5. Maps HTTP errors: `429` → `"RATE_LIMITED"`, `402` → `"CREDITS_EXHAUSTED"`.

**Input schema:**

```ts
{
  id, metric, severity, status,
  country, mcc, channel,
  impact, affectedTxns, confidence,
  description, rootCauses[], recommendations[]
}
```

**Output schema:**

```ts
{
  verdict: "clear" | "needs_action" | "inconclusive",
  confidence: number,          // 0–1
  summary: string,
  rootCause: string,
  evidence: string[],          // 2–6 items
  nextSteps: string[],         // 2–5 items
  recommendedStatus: "Resolved" | "Investigating" | "Escalated"
}
```

---

### Data Architecture

All application data comes from two deterministic mock libraries:

**`src/lib/mock-data.ts`** — seeds for:

| Export | Type | Description |
|---|---|---|
| `Anomaly` | Interface | Anomaly with severity, confidence, root causes, recommendations |
| `Investigation` | Interface | Case record linked to an anomaly |
| `NotificationItem` | Interface | Typed notification (fraud/approval/merchant/case/system) |
| `AuditEntry` | Interface | User action log entry with IP |
| `TrendPoint` | Interface | Time-series point (approval, decline, fraud, volume, revenue) |
| `Severity` | Union type | `"Critical" \| "High" \| "Medium" \| "Low"` |
| `Status` | Union type | `"Open" \| "Investigating" \| "Escalated" \| "Resolved" \| "Closed"` |

**`src/lib/investigation-mock.ts`** — seeds for the Investigation Module:

| Export | Type | Description |
|---|---|---|
| `InvestigationCase` | Interface | Full case with AI pipeline state, findings, timeline, notes |
| `INV_STEPS` | `const[]` | 8-step AI pipeline labels |
| `AnomalyType` | Union type | 8 anomaly categories |
| `InvCaseStatus` | Union type | 7 case statuses including `"AI Running"` |
| `SlaStatus` | Union type | `"On Track" \| "At Risk" \| "Breached"` |
| `InvestigationType` | Union type | `"AI-Led" \| "Analyst-Led" \| "Hybrid"` |

Data is generated with **deterministic seeds** so charts and tables don't reshuffle on every render.

---

### AI Diagnostic Assistant — Persistence Architecture

Chat history is persisted entirely in the browser with no backend:

```
localStorage["sentinel.assistant.history.v1"]
    └── JSON array of ChatSession[]

interface ChatSession {
  id: string;
  title: string;           // auto-derived from first user message
  anomalyId?: string;      // context chip in the chat header
  messages: {
    role: "user" | "assistant";
    content: string;
    at: number;            // Unix ms
  }[];
  createdAt: number;
  updatedAt: number;
}
```

Operations: `loadSessions()` · `saveSessions()` · `newChat()` · `loadSession(id)` · `deleteSession(id)` · `clearAllHistory()`

Every send/receive updates the active session's `messages` + `updatedAt` and immediately persists to `localStorage`.

---

### SSR & Server Error Handling

TanStack Start runs a Nitro/Vite SSR server. Two layers handle errors:

**`src/start.ts`** — `errorMiddleware` wraps every server-side request. Non-HTTP errors are caught, logged, and returned as a 500 HTML error page.

**`src/server.ts`** — the Cloudflare/Nitro fetch handler. It additionally catches a Nitro/h3 quirk where in-handler throws are swallowed into a `{"unhandled":true}` JSON response, detects that pattern, and converts it to a proper HTML error page.

---

### Build & Deployment

Configured via `@lovable.dev/vite-tanstack-config` which bundles the following automatically — **do not add these manually**:

- `tanstackStart` plugin (SSR + file-based routing)
- `viteReact` plugin
- `tailwindcss` plugin (v4 native)
- `tsConfigPaths` (`@/*` alias)
- Nitro build targeting Cloudflare Workers
- `componentTagger` (dev-only Lovable tooling)
- `VITE_*` env injection
- React + TanStack deduplication

`vite.config.ts` only configures the custom server entry point:

```ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },  // → src/server.ts
  },
});
```

---

## Roles & Permissions

Six roles are defined in `src/lib/session.ts`, each with a scoped permission set:

| Role | Label | Module Access |
|---|---|---|
| `super_admin` | Super Admin | All modules |
| `risk_analyst` | Risk Analyst | Dashboard, Transactions, Anomalies, RCA, Assistant, Cases, Reports, Investigation |
| `fraud_investigator` | Fraud Investigator | Dashboard, Anomalies, Fraud, Cases, Incidents, Assistant, Investigation |
| `ops_manager` | Operations Manager | Dashboard, Transactions, Incidents, Reports, Investigation |
| `compliance_officer` | Compliance Officer | Dashboard, Cases, Audit, Reports, Investigation (read-only) |
| `executive` | Executive Viewer | Dashboard, Reports — read-only, **no Investigation Module** |

The role switcher in the header allows instant role changes for demo purposes.

---

## Application Modules

### Public Routes

| URL | Description |
|---|---|
| `/` | Marketing landing page |
| `/login` | Demo login with role picker |

### Authenticated Routes (`/app/*`)

All authenticated routes are wrapped in the `AppShell` layout (sticky header, collapsible sidebar, breadcrumbs).

| URL | Module |
|---|---|
| `/app/dashboard` | Role-switched operational dashboard |
| `/app/transactions` | Real-time transaction monitoring table |
| `/app/anomalies` | Anomaly detection list + detail sheet |
| `/app/rca` | Root-cause analysis driver tree |
| `/app/assistant` | AI Diagnostic Assistant (chat + persistent history) |
| `/app/investigations` | Case management (Kanban + table) |
| `/app/investigation` | Investigation Module workspace |
| `/app/incidents` | Incident management timeline |
| `/app/fraud` | Fraud analytics (trends, heatmaps, vectors) |
| `/app/reports` | Reports & analytics export center |
| `/app/architecture` | System architecture (12 diagram tabs) |
| `/app/users` | User management |
| `/app/roles` | Role & permission management |
| `/app/audit` | Audit logs |
| `/app/notifications` | Notifications inbox |
| `/app/settings` | System settings |
| `/app/help` | Help center |

### Investigation Module

The Investigation Module (`/app/investigation`) is the core workspace of Sentinel AI. It is a **single-scroll layout** (no tabs) with:

1. **Case queue sidebar** — searchable list with status, severity, and AI progress.
2. **Case header** — case ID, anomaly type, status pill, assignee, and RBAC-gated actions (Escalate, Re-run AI, Export, Close).
3. **KPI strip** — Risk Score, AI Confidence, Financial Impact, Affected Transactions.
4. **AI Progress Pipeline** — real-time 8-step tracker: Data Collection → Pattern Analysis → Historical Comparison → Root Cause Analysis → Impact Assessment → Similar Incident Search → Recommendation Generation → Final Conclusion.
5. **AI Reasoning + Root Cause grid** — findings, flagged reasons, evidence chips, and a root-cause probability bar chart.
6. **Timeline + Recommendations** — chronological event timeline with Accept/Reject recommendation actions.
7. **Notes & Evidence** — collaborative notes feed + evidence attachment area.
8. **AI Copilot dock** — floating collapsible chat for in-context AI queries.

---

## Design System

Defined in `src/styles.css` using Tailwind v4 `@theme` tokens. **Dark theme is the default.**

### Semantic Tokens

`--background` · `--foreground` · `--card` · `--card-foreground` · `--primary` · `--primary-foreground` · `--secondary` · `--muted` · `--muted-foreground` · `--accent` · `--accent-foreground` · `--destructive` · `--destructive-foreground` · `--success` · `--warning` · `--border` · `--input` · `--ring` · `--radius`

### Brand Utilities

| Class | Effect |
|---|---|
| `.gradient-brand` | Diagonal gradient from primary to accent |
| `.text-gradient-brand` | Same gradient applied via `background-clip: text` |
| `.ring-grid` | Faint dotted grid background overlay (hero, login) |

> **Rule:** No hardcoded colors anywhere in components — only semantic tokens.

---

## Routing Conventions

File-based routing under `src/routes/` using TanStack Start's flat dot-separated convention:

| File | URL |
|---|---|
| `index.tsx` | `/` |
| `login.tsx` | `/login` |
| `app.tsx` | `/app` (layout wrapper) |
| `app.dashboard.tsx` | `/app/dashboard` |
| `app.transactions.tsx` | `/app/transactions` |
| `__root.tsx` | HTML shell, providers, theme, toaster |

`routeTree.gen.ts` is auto-generated — do not edit manually.

---

## Scripts

```bash
bun dev           # Start development server (http://localhost:3000)
bun run build     # Production build (SSR + Cloudflare target)
bun run build:dev # Development build
bun run preview   # Preview production build locally
bun run lint      # ESLint
bun run format    # Prettier
```

---

## Notes

- This application uses **no real backend or database**. All data is seeded from mock generators in `src/lib/mock-data.ts` and persisted only in `localStorage`.
- The project is connected to [Lovable](https://lovable.dev). Avoid force-pushing or rewriting published git history — it rewrites history on Lovable's side.
- Do not create a `/app/executive` route — the Executive dashboard is served through the role-switched `/app/dashboard`.
- Do not add duplicate Vite plugins — `@lovable.dev/vite-tanstack-config` includes TanStack Start, React, Tailwind, Nitro, and path aliases automatically.

---

*Sentinel AI — Enterprise card-transaction intelligence. SOC2-aligned. Explainable by design.*
