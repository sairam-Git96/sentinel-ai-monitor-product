# Sentinel AI — Master Build Prompt

Copy this entire document into a fresh Lovable project to rebuild **Sentinel AI** end-to-end. It captures every module, role, permission, route, UI behavior, AI integration, and design rule of the current app. Build in the order given; do not skip sections.

---

## 1. Product Brief

**Sentinel AI** is an enterprise platform for **AI-powered card-transaction monitoring, anomaly detection, root-cause analysis, and GenAI-driven investigations** for card issuers and payment processors.

Primary jobs the app does:

1. Monitor millions of card authorizations in near-real-time.
2. Detect anomalies (fraud spikes, approval-rate drops, MCC/country/channel outliers, gateway latency, decline surges, authentication failures).
3. Explain root cause in plain language via an AI Diagnostic Assistant.
4. Drive end-to-end investigation workflows (AI-led, analyst-led, hybrid) with audit trails.
5. Provide role-scoped dashboards and reporting for Risk, Fraud, Ops, Compliance, and Executives.

Tone of the product: **enterprise, calm, confident, SOC2-aligned, "explainable AI"**. Never mention Supabase in any user-facing copy — always say "Lovable Cloud" if backend is referenced at all (this build is mock/local, so backend isn't referenced).

---

## 2. Tech Stack & Conventions

- **Framework:** TanStack Start v1 (React 19, Vite 7), file-based routing under `src/routes/`.
- **Styling:** Tailwind v4 via `src/styles.css` (native `@import` + `@theme` tokens). **No hardcoded colors** in components — only semantic tokens (e.g. `bg-card`, `text-foreground`, `bg-primary`, `text-accent`, `border`, `bg-destructive/10`).
- **UI kit:** shadcn/ui (all primitives under `src/components/ui/*`), lucide-react icons, `sonner` for toasts.
- **Charts:** `recharts` via shadcn `Chart` wrapper.
- **State:** local component state + `localStorage` for session, chat history, and any demo "persistence". No real backend.
- **AI:** Lovable AI Gateway via the AI SDK (`ai`, `@ai-sdk/openai-compatible`). Default model **`google/gemini-3-flash-preview`**. Key `LOVABLE_API_KEY` is read **only inside server handlers** via `process.env`.
- **Server boundary:** app-internal AI calls use `createServerFn` from `@tanstack/react-start` in `*.functions.ts` files. No public API routes are required for this app.
- **No real auth, no real DB.** Login is a demo: any credentials work; the chosen role is persisted in `localStorage` under key `sentinel.session`.

File conventions:

- Route files use the flat dot-separated convention (`app.dashboard.tsx` → `/app/dashboard`).
- Server-only helpers end with `.server.ts`. Server functions live in `*.functions.ts` files under `src/lib/`.
- Every shareable page sets its own `head()` with title + meta description.

---

## 3. Design System

Define these in `src/styles.css` as CSS variables on `:root` and `.dark`, then expose via `@theme`:

- Semantic tokens: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--success`, `--warning`, `--border`, `--input`, `--ring`, `--radius`.
- Brand utilities (custom CSS classes):
  - `.gradient-brand` — diagonal gradient from primary to accent.
  - `.text-gradient-brand` — same gradient applied via `background-clip: text`.
  - `.ring-grid` — faint dotted/grid background overlay used on hero and login.
- Dark theme is the default; provide a `ThemeToggle` (light / dark / system) using `next-themes`-style class toggling on `<html>`.
- Typography: system UI stack with `font-feature-settings: "rlig" 1, "calt" 1`. Headings use `tracking-tight`. Numbers in KPI cards use `tabular-nums`.
- Spacing scale: prefer `gap-2/3/4/6`, `p-4/6`, `rounded-md/lg/2xl`. Cards use `border bg-card`.
- Status colors: success = green token, warning = amber token, destructive = red token, accent = brand teal/violet. Always via tokens.

---

## 4. Routes Inventory

Create exactly these route files. Public routes are at top level; the authenticated app lives under `/app/*` rendered inside a shared `AppShell`.

| File                              | URL                     | Purpose                              |
| --------------------------------- | ----------------------- | ------------------------------------ |
| `src/routes/__root.tsx`           | (root)                  | HTML shell, providers, theme, toaster |
| `src/routes/index.tsx`            | `/`                     | Marketing landing page               |
| `src/routes/login.tsx`            | `/login`                | Demo login + role picker             |
| `src/routes/app.tsx`              | `/app` (layout)         | Wraps every `/app/*` route in `AppShell` |
| `src/routes/app.index.tsx`        | `/app`                  | Redirects to `/app/dashboard`        |
| `src/routes/app.dashboard.tsx`    | `/app/dashboard`        | Role-switched dashboard              |
| `src/routes/app.transactions.tsx` | `/app/transactions`     | Transaction monitoring               |
| `src/routes/app.anomalies.tsx`    | `/app/anomalies`        | Anomaly detection list + detail      |
| `src/routes/app.rca.tsx`          | `/app/rca`              | Root-cause analysis                  |
| `src/routes/app.assistant.tsx`    | `/app/assistant`        | AI Diagnostic Assistant (chat + history) |
| `src/routes/app.investigations.tsx` | `/app/investigations` | Case management list                 |
| `src/routes/app.investigation.tsx`  | `/app/investigation`  | **Investigation Module** workspace   |
| `src/routes/app.incidents.tsx`    | `/app/incidents`        | Incident management                  |
| `src/routes/app.fraud.tsx`        | `/app/fraud`            | Fraud analytics                      |
| `src/routes/app.reports.tsx`      | `/app/reports`          | Reports & analytics                  |
| `src/routes/app.architecture.tsx` | `/app/architecture`     | System architecture (12 diagram tabs) |
| `src/routes/app.users.tsx`        | `/app/users`            | User management                      |
| `src/routes/app.roles.tsx`        | `/app/roles`            | Role management                      |
| `src/routes/app.audit.tsx`        | `/app/audit`            | Audit logs                           |
| `src/routes/app.notifications.tsx`| `/app/notifications`    | Notifications inbox                  |
| `src/routes/app.settings.tsx`     | `/app/settings`         | Settings                             |
| `src/routes/app.help.tsx`         | `/app/help`             | Help center                          |

**Explicit nos:** do NOT create `src/routes/app.executive.tsx` (Executive Dashboard was removed). Do NOT add "View Dashboard" / "View Live Dashboard" buttons on the landing page.

---

## 5. Roles & RBAC Matrix

Six roles, defined in `src/lib/session.ts`:

| Role value             | Label              | Short        | Permissions                                                                                                |
| ---------------------- | ------------------ | ------------ | ---------------------------------------------------------------------------------------------------------- |
| `super_admin`          | Super Admin        | Admin        | **All** modules                                                                                            |
| `risk_analyst`         | Risk Analyst       | Analyst      | dashboard, transactions, anomalies, rca, assistant, cases, reports, investigation, help                    |
| `fraud_investigator`   | Fraud Investigator | Investigator | dashboard, anomalies, fraud, cases, incidents, assistant, investigation, help                              |
| `ops_manager`          | Operations Manager | Operations   | dashboard, transactions, incidents, reports, executive, investigation, help                                |
| `compliance_officer`   | Compliance Officer | Compliance   | dashboard, cases, audit, reports, investigation, help                                                      |
| `executive`            | Executive Viewer   | Executive    | dashboard, executive, reports, help — **read only**, no Investigation Module                               |

Permission ids (the `Permission` union type): `dashboard | transactions | anomalies | rca | assistant | cases | incidents | fraud | reports | executive | investigation | users | roles | audit | settings | help`.

**Investigation Module access rule:** visible to every role *except* `executive`. For `compliance_officer` the module is **Read / Investigate** (no destructive actions); `super_admin`, `risk_analyst`, `fraud_investigator`, `ops_manager`, and any "manager" role get **Full Access**.

Helper exports required from `src/lib/session.ts`:

- `ROLES: RoleDef[]`, `PERMISSION_LABELS: Record<Permission, string>`
- `getSession() / setSession() / clearSession()`
- `getRoleDef(role)`, `roleLabel(role)`, `hasPermission(role, perm)`, `formatLastLogin(ts)`
- Session shape: `{ email: string; role: Role; loginAt: number }` persisted at `localStorage["sentinel.session"]`.
- `clearSession()` also wipes any `localStorage` keys starting with `sentinel.` and clears `sessionStorage`.

---

## 6. Session, Login, Sign-Out

`/login` (`src/routes/login.tsx`):

- Split-screen layout: left panel uses `gradient-brand` with `ring-grid` overlay, brand mark, tagline ("Monitor millions of authorizations. Diagnose in seconds."), SOC2/MFA/SSO footnote.
- Right panel: Welcome heading, three quick OAuth-style buttons (Google, Microsoft, SSO) that immediately sign in with the currently selected role, then "or with email" divider, email + password inputs (defaults `admin@sentinel.ai` / `demo`), a **role tile grid** (one tile per `ROLES` entry) showing label + description, and a Sign-in button.
- On submit: validate non-empty creds + valid role, call `setSession({ email, role })`, navigate to `/app/dashboard`.
- Demo banner: "Demo mode · any credentials work."

Sign-out (in the header user menu):

1. `clearSession()`
2. `navigate({ to: "/login", replace: true })`

---

## 7. App Shell (`src/components/app-shell.tsx`)

The single layout wrapping every `/app/*` route. Required regions:

### 7.1 Header (top bar, sticky)

- Brand: gradient logo tile + "Sentinel AI" + "Risk Intelligence" eyebrow.
- Global command/search input (`⌘K` placeholder).
- **Notifications popover** (bell icon with unread dot) — list with "View all" link to `/app/notifications`.
- **Theme toggle** (light / dark / system).
- **Role switcher** dropdown showing current role + description + activities; selecting a role calls `setSession` and updates the entire app.
- **Profile menu**: avatar with initials, email, last login, links to Users / Roles / Audit / Settings / Notifications / Help, divider, **Sign out**.
- Breadcrumbs row underneath: `Home > <current module label>`.

### 7.2 Sidebar (left)

- Collapsible (icon-only mode toggled by `PanelLeftClose` / `PanelLeftOpen`).
- Items grouped by `NAV_ORDER = ["Monitoring", "Detection", "Intelligence", "Investigations", "Reporting", "Platform", "Administration", "Support"]`.
- Filtered by `hasPermission(session.role, item.perm)` — items the current role can't access are not rendered.
- Active route highlighted; in collapsed mode show shadcn `Tooltip` with the item's `tooltip` string on hover.
- **Exact NAV list** (label · path · icon · perm · group · tooltip):
  - Dashboard · `/app/dashboard` · LayoutDashboard · `dashboard` · Monitoring · "Role-based operational overview of your portfolio."
  - Transaction Monitoring · `/app/transactions` · Activity · `transactions` · Monitoring · "Monitor volumes, approvals, declines, and fraud metrics."
  - Anomaly Detection · `/app/anomalies` · AlertTriangle · `anomalies` · Detection · "AI-detected abnormal patterns across the platform."
  - Root Cause Analysis · `/app/rca` · Network · `rca` · Detection · "Drill down into contributing factors for each anomaly."
  - AI Diagnostic Assistant · `/app/assistant` · Bot · `assistant` · Intelligence · "Ask questions and get grounded AI explanations."
  - Case Management · `/app/investigations` · Briefcase · `cases` · Investigations · "Create, assign, and track investigation cases."
  - Investigation Module · `/app/investigation` · SearchCheck · `investigation` · Investigations · "AI-assisted anomaly investigation workspace."
  - Incident Management · `/app/incidents` · Flame · `incidents` · Investigations · "Manage operational and fraud incidents."
  - Fraud Analytics · `/app/fraud` · BarChart3 · `fraud` · Intelligence · "Review fraud trends, patterns, and attack vectors."
  - Reports & Analytics · `/app/reports` · FileText · `reports` · Reporting · "Generate and export business reports."
  - System Architecture · `/app/architecture` · Building2 · `help` · Platform · "Solution, data, security, and deployment architecture."
  - User Management · `/app/users` · Users · `users` · Administration · "Manage users, roles, and access controls."
  - Role Management · `/app/roles` · KeyRound · `roles` · Administration · "Create and manage role-based permissions."
  - Audit Logs · `/app/audit` · ShieldCheck · `audit` · Administration · "Review user activities and system changes."
  - Settings · `/app/settings` · Settings · `settings` · Administration · "Configure system preferences."
  - Help Center · `/app/help` · LifeBuoy · `help` · Support · "Documentation, FAQs, and support resources."

### 7.3 Main

`<main>` landmark with page title, optional actions slot, and the route's content. Standard width: `max-w-7xl mx-auto px-6 py-6`.

---

## 8. Shared Libraries

- **`src/lib/mock-data.ts`** — seeds for transactions, anomalies, cases, incidents, users, audit logs. Exports `Severity = "Low" | "Medium" | "High" | "Critical"` and similar enums. Deterministic generators so charts and tables don't reshuffle on every render.
- **`src/lib/tooltips.ts`** — central tooltip registry `TOOLTIPS` keyed by metric id. Each entry has `{ title, definition, purpose, usage?, formula?, example?, impact?, action? }`. Pre-seeded entries: `approval_rate`, `decline_rate`, `fraud_rate`, `total_transactions`, plus anomaly severity, risk score, AI confidence, SLA, MCC, BIN, decline reason codes, etc.
- **`src/lib/export.ts`** — CSV export helper: takes rows + filename, builds a `Blob`, triggers download, toasts confirmation.
- **`src/lib/investigation-mock.ts`** — types and seed data for the Investigation Module (see §13).
- **`src/lib/ai-gateway.server.ts`** — `createLovableAiGatewayProvider(key)` returns an `@ai-sdk/openai-compatible` provider pointed at `https://ai.gateway.lovable.dev/v1` with headers `Lovable-API-Key` and `X-Lovable-AIG-SDK: vercel-ai-sdk`. Never imported from client code.
- **`src/lib/investigate.functions.ts`** — see §14.

Shared components:

- **`InfoTooltip`** (`src/components/info-tooltip.tsx`) — `Tooltip` + `Popover` (hover desktop, click touch) rendering a structured card from a `TooltipSpec`. Use on KPI titles, column headers, chart titles, filter labels, status badges, icon buttons.
- **`ModuleActions`** — standard action bar (Refresh, Export CSV, Print, Filter, AI Insight) used on every module header.
- **`RangeFilter`** — date-range + interval picker.
- **`InvestigateDialog`** — modal that calls the `investigateAnomaly` server function and renders the structured verdict.
- **`ThemeToggle`** — light / dark / system.

---

## 9. Landing Page (`/`)

Sections in order:

1. **Sticky nav** — gradient logo + brand, in-page anchors (`Features`, `Platform`, `AI Assistant`, `Customers`), right side **Login** (ghost) and **Get Started** (primary) buttons → `/login`.
2. **Hero** — eyebrow chip ("Trusted by global card issuers · SOC2-aligned"), H1 with `text-gradient-brand` on "Monitoring & Diagnostics", supporting paragraph, two CTAs: **Get Started** (primary → `/login`) and **Request Demo** (outline → `/login`). Right column shows `src/assets/hero-dashboard.jpg` floating over a blurred gradient halo. **Do not add a "View Live Dashboard" button.**
3. **KPI strip** — four stat cards (Authorizations/day, Detection latency, Auto-resolved anomalies, MTTR reduction).
4. **Features grid** — 6 cards with lucide icons: Real-time anomaly detection, GenAI root-cause, Case management, Fraud analytics, Executive reporting, Explainable AI.
5. **AI Assistant preview** — split section: copy on one side ("Ask in plain English…"), `src/assets/ai-assistant.jpg` on the other.
6. **Testimonials** — three quote cards.
7. **Final CTA section** — heading + two buttons: **Get Started** and **Request Demo** (both → `/login`). **No "View Dashboard" button.**
8. **Footer** — brand, columns, fine print.

SEO: `<title>Sentinel AI — AI-Powered Transaction Monitoring</title>`, meta description "Detect, diagnose, and resolve card transaction anomalies in real time with GenAI."

---

## 10. Dashboard (`/app/dashboard`)

Single route that switches the rendered dashboard by `session.role`:

- **Super Admin** — platform-wide KPIs + system health + recent admin events.
- **Risk Analyst** — approval rate, decline rate, fraud rate, anomaly queue.
- **Fraud Investigator** — fraud trend, top attack vectors, open cases.
- **Operations Manager** — issuer latency, decline-reason distribution, incidents.
- **Compliance Officer** — audit summary, case closure stats, controls evidence.
- **Executive Viewer** — read-only executive KPIs, loss trends.

Every KPI card uses `InfoTooltip` with the matching `TOOLTIPS` entry. Every chart has a title + tooltip + skeleton loader + empty state.

---

## 11. Other Modules (summary spec)

For every module: title row with `ModuleActions`, KPI strip, primary table or chart cluster, filters in a slide-out `Sheet`, row-level actions in a dropdown, CSV export, skeleton + empty states, tooltips on every label/header.

- **Transaction Monitoring** — paginated table (TanStack Table), filters (date range, country, MCC, channel, status), sparkline KPIs.
- **Anomaly Detection** — list of anomalies with severity badges, AI confidence, impact; row click opens detail sheet with `InvestigateDialog`.
- **Root Cause Analysis** — driver-tree visualization + contributing-factor cards.
- **Case Management** (`/app/investigations`) — Kanban + table toggle; CRUD via dialogs; assign, escalate, close.
- **Incident Management** — incident timeline, severity, owner, linked anomalies.
- **Fraud Analytics** — trend charts, BIN/MCC/country heatmaps, top attack vectors.
- **Reports & Analytics** — report templates, schedule dialog (mock), export CSV/print-to-PDF.
- **User Management / Role Management / Audit Logs / Notifications / Settings / Help** — standard admin screens, all actions wired to in-memory mock store with toast confirmations.

---

## 12. AI Diagnostic Assistant (`/app/assistant`)

Two-column layout: **History sidebar** (left) + **chat workspace** (right).

### Chat workspace

- Header: current session title (auto-derived from first user message or anomaly id), context chip ("Anomaly: ANM-1234"), actions (New Chat, Rename, Delete, Export transcript).
- Message list: user / assistant bubbles, markdown rendering, code blocks, citations chip, "Why?" expandable reasoning.
- Composer: textarea + send button + quick-prompt chips ("Explain this anomaly", "Suggest next steps", "Draft customer note", "Summarize root cause").
- Streams assistant replies token-by-token (mock streaming acceptable if no live model).
- Greeting helper `greeting()` injects the current anomaly id into the first assistant message of a new session.

### Chat history (REQUIRED)

- Persisted in `localStorage` under key **`sentinel.assistant.history.v1`**.
- Type:
  ```ts
  interface ChatSession {
    id: string;
    title: string;
    anomalyId?: string;
    messages: { role: "user" | "assistant"; content: string; at: number }[];
    createdAt: number;
    updatedAt: number;
  }
  ```
- Functions: `loadSessions()`, `saveSessions()`, `newChat()`, `loadSession(id)`, `deleteSession(id)`, `clearAllHistory()`.
- Sidebar UI: "New chat" button, "Clear all" button, list of past sessions sorted by `updatedAt` desc, each row showing title + relative time (via `formatRelTime()`) + delete icon. Active session highlighted.
- On mount: load sessions from localStorage; if none exists, bootstrap a fresh session.
- Every send/receive updates the current session's `messages` + `updatedAt` and persists.

---

## 13. Investigation Module (`/app/investigation`)

**Critical: single-scroll workspace — no tabs.** RBAC: visible to all roles except `executive`; `compliance_officer` is read/investigate only.

### Data model (`src/lib/investigation-mock.ts`)

- `InvCaseStatus = "Open" | "Under Investigation" | "AI Running" | "Escalated" | "Resolved" | "False Positive" | "Closed"`
- `AnomalyType = "Fraud Spike" | "Approval Rate Drop" | "Country Anomaly" | "MCC Anomaly" | "Volume Spike" | "Authentication Failure" | "Decline Surge" | "Gateway Latency"`
- `InvestigationType = "AI-Led" | "Analyst-Led" | "Hybrid"`
- `SlaStatus = "On Track" | "At Risk" | "Breached"`
- 8-step AI pipeline constant:
  ```ts
  const INV_STEPS = [
    "Data Collection", "Pattern Analysis", "Historical Comparison",
    "Root Cause Analysis", "Impact Assessment", "Similar Incident Search",
    "Recommendation Generation", "Final Conclusion",
  ] as const;
  ```
- `InvestigationCase` shape: id, alertId, anomalyType, severity, status, assignedTo, aiConfidence (0–100), riskScore (0–100), txnImpact, financialImpact, created, updated, sla, country, mcc, channel, priority, investigationType, progress (0–100), currentStep, rootCauses[{cause, probability}], findings[], reasonsFlagged[], evidence[], recommendations[], timeline[{time, label}], notes[{author, at, text}].
- Seed 12–20 cases across all anomaly types/severities/statuses.

### Layout (single scroll)

1. **Left case-queue sidebar** — list of cases with status pill, severity badge, AI progress bar, last update. Search at top. Selecting a case loads it into the workspace.
2. **Filter Sheet** (slide-out, triggered by Filters button) — status, severity, anomaly type, investigation type, assignee, country, MCC, channel, SLA, date range.
3. **Case header** — case id + anomaly type + status pill, alert id link, assignee avatar, action buttons (gated by RBAC): **Escalate**, **Re-run AI**, **Export**, **Close case**.
4. **KPI strip (4 cards)** — Risk Score, AI Confidence, Financial Impact, Affected Transactions. Each with `InfoTooltip`.
5. **AI Progress Pipeline** — horizontal 8-node tracker over `INV_STEPS`, with done / current / pending states. Progress simulates in real time (interval-based) while status is `AI Running`.
6. **AI Reasoning + Root Cause grid** (2 cols on lg):
   - AI Reasoning card — findings list + reasons flagged + evidence chips.
   - Root Cause Probability — bar chart of `rootCauses` sorted by probability.
7. **Timeline + Recommendations split**:
   - Timeline — chronological events (vertical, time-stamped).
   - Recommendations — checklist, each with Accept / Reject buttons that append a timeline event.
8. **Notes & Evidence** — notes feed (author + timestamp) with composer; evidence attachment area (mock file chips).
9. **Floating AI Copilot dock** (bottom-right) — collapsible chat dock "Ask AI Copilot" so the user can converse without leaving the case.

### Behaviors

- Real-time progress simulation: when a case is `AI Running`, advance `progress` and `currentStep` every ~2s until 100% → flip status to `Under Investigation`.
- Generate CSV report on **Export** including header, KPIs, findings, root causes, timeline, recommendations, notes.
- Every action toasts and writes a timeline entry.
- All destructive/state-changing actions are hidden or disabled for `compliance_officer`.

### Success criteria

A user can: open a case → watch AI investigation progress live → see why AI flagged the anomaly → review root-cause analysis → add notes / collaborate → accept or reject AI recommendations → export a report → close the case with full audit history.

---

## 14. AI Integration

`src/lib/ai-gateway.server.ts`:

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

`src/lib/investigate.functions.ts` — exposes `investigateAnomaly` server function:

- Input (Zod): `{ id, metric, severity, status, country, mcc, channel, impact, affectedTxns, confidence, description, rootCauses[], recommendations[] }`.
- Output schema (Zod):
  ```ts
  {
    verdict: "clear" | "needs_action" | "inconclusive",
    confidence: number,        // 0..1
    summary: string,
    rootCause: string,
    evidence: string[],        // 2..6
    nextSteps: string[],       // 2..5
    recommendedStatus: "Resolved" | "Investigating" | "Escalated",
  }
  ```
- Uses `generateText({ model: gateway("google/gemini-3-flash-preview"), prompt, experimental_output: Output.object({ schema }) })`.
- Reads `process.env.LOVABLE_API_KEY` inside `.handler()`; throws clearly if missing.
- Translates gateway errors: `429` → `"RATE_LIMITED"`, `402` → `"CREDITS_EXHAUSTED"`.
- The UI surfaces those error codes as friendly messages and a billing CTA.

No other AI calls are required; the Diagnostic Assistant can either use the same provider via a streaming chat server route or a mocked streamer for the demo build.

---

## 15. Cross-Cutting Requirements

- **Accessibility**: every icon button has `aria-label`; focus rings visible; `<main>` landmark on every page; color-contrast via tokens.
- **SEO**: each route's `head()` sets a unique `title` + meta description; landing also sets `og:title` / `og:description`. Single H1 per page. Semantic HTML.
- **Loading**: shadcn `Skeleton` placeholders on every list/table/chart during initial mock-fetch delay.
- **Empty states**: friendly empty-state card with icon + suggestion CTA on every list.
- **Toasts**: `sonner` confirmations on every mutation, export, and AI action.
- **Keyboard shortcuts**: `?` opens a cheat-sheet dialog; navigation shortcuts `g d` (dashboard), `g t` (transactions), `g a` (anomalies), `g i` (investigation), `g r` (reports), `g u` (users).
- **Print-to-PDF** instead of a PDF library: trigger `window.print()` on a printable view.
- **Error boundaries**: every route with a loader sets `errorComponent` and `notFoundComponent`; root sets `notFoundComponent` and `defaultErrorComponent`.

---

## 16. Out of Scope / Explicit Nos

- No real backend, no Lovable Cloud, no Supabase mention in UI copy.
- No Executive Dashboard route (`/app/executive` must not exist).
- No "View Dashboard" or "View Live Dashboard" buttons anywhere on the landing page. Only **Get Started** and **Request Demo** CTAs (both → `/login`).
- No tabs in the Investigation Module — single-scroll only.
- No PDF generator dependency — use the browser print dialog.
- No tracking/analytics scripts.

---

## 17. Acceptance Checklist

1. ✅ All 22 route files in §4 exist and render; `/app/executive` does **not** exist.
2. ✅ `src/lib/session.ts` exports exactly the 6 roles and 16 permissions in §5, and `hasPermission` matches the matrix.
3. ✅ Sidebar items in §7.2 appear in the listed groups and order, filtered by role.
4. ✅ Landing page has only **Get Started** + **Request Demo** CTAs in both hero and final CTA section; hero shows `hero-dashboard.jpg`; assistant preview shows `ai-assistant.jpg`.
5. ✅ Login page persists `{ email, role, loginAt }` to `localStorage["sentinel.session"]` and redirects to `/app/dashboard`.
6. ✅ AI Diagnostic Assistant persists chat sessions to `localStorage["sentinel.assistant.history.v1"]` with full CRUD (new / load / delete / clear all) and shows them in a left-side history panel with relative timestamps.
7. ✅ Investigation Module is a single-scroll workspace (no `<Tabs>`), contains the 8-step `INV_STEPS` pipeline, case-queue sidebar, filter Sheet, 4-card KPI strip, AI Reasoning + Root Cause grid, Timeline + Recommendations split, Notes + Evidence area, and a floating AI Copilot dock.
8. ✅ Investigation Module is hidden for `executive` and read-only for `compliance_officer`.
9. ✅ `investigateAnomaly` server function returns the structured verdict schema in §14 using `google/gemini-3-flash-preview` and surfaces `RATE_LIMITED` / `CREDITS_EXHAUSTED` errors.
10. ✅ Every KPI / chart / table column uses `InfoTooltip` from the central `TOOLTIPS` registry.
11. ✅ Every list/table has skeleton + empty state; every action toasts.
12. ✅ Theme toggle, role switcher, notifications popover, profile menu, breadcrumbs all present in the header.
13. ✅ No hardcoded colors in components — only semantic Tailwind tokens.
14. ✅ Dark theme is default and visually polished; light theme also works.
15. ✅ No mention of Supabase anywhere in user-facing copy.

Build the app in this order: shell + session + login → landing → dashboard → transactions/anomalies/rca → assistant (with history) → investigation module → remaining admin modules → architecture diagrams → polish (tooltips, skeletons, shortcuts, SEO).