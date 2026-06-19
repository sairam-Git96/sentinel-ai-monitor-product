## Goal

Produce a single, self-contained **MASTER_PROMPT.md** that a fresh Lovable project can be built from end-to-end — covering branding, stack, routes, RBAC, every module, AI integrations, and UX behavior currently present in this app.

## Where it goes

Create one new file:

- `MASTER_PROMPT.md` (repo root) — the full rebuild prompt, copy-paste ready.

No source code changes. No deletions. No dependency changes.

## What the document will contain

1. **Product brief** — Sentinel AI: AI-powered card-transaction monitoring, anomaly detection, RCA, GenAI diagnostics, investigation workflow.
2. **Tech stack & conventions** — TanStack Start v1, React 19, Vite 7, Tailwind v4 (`src/styles.css` tokens), shadcn/ui, lucide-react, TanStack Router file-based routes, Lovable AI Gateway via `createServerFn` (`google/gemini-3-flash-preview`), client-side mock data + localStorage session (no Lovable Cloud).
3. **Design system** — dark/light theme, gradient brand tokens (`gradient-brand`, `text-gradient-brand`, `ring-grid`), semantic color tokens only (no hardcoded colors), typography, card/badge/button patterns, info-tooltip pattern.
4. **Routes inventory** — exact file → URL map for every route currently in `src/routes/` (landing, login, app shell + 18 modules including `dashboard`, `transactions`, `anomalies`, `rca`, `assistant`, `investigation`, `investigations`, `incidents`, `fraud`, `reports`, `audit`, `users`, `roles`, `notifications`, `settings`, `help`, `architecture`).
5. **Roles & RBAC matrix** — all 6 roles (`super_admin`, `risk_analyst`, `fraud_investigator`, `ops_manager`, `compliance_officer`, `executive`) with their permission sets exactly as defined in `src/lib/session.ts`, plus the Investigation Module access rule (everyone except Executive Viewer).
6. **Session/auth model** — localStorage-based demo session, role switcher, login screen with quick-sign-in tiles, sign-out hygiene.
7. **Module-by-module spec** — for each route: purpose, KPIs, tables/charts, filters, actions, dialogs, CSV export, AI actions, empty/loading states. Special depth for:
   - **Landing page** — hero with `hero-dashboard.jpg`, features, KPI strip, AI assistant preview with `ai-assistant.jpg`, testimonials, CTA (Get Started + Request Demo only — no "View Dashboard" buttons).
   - **AI Diagnostic Assistant** — streaming chat UX, anomaly context, **Chat History feature** (localStorage key `sentinel.assistant.history.v1`, sessions list, new/load/delete/clear all, relative timestamps).
   - **Investigation Module** — single-scroll workspace (no tabs): case queue sidebar, filter Sheet, case header with action buttons (Escalate, Re-run AI, Export), 4-col KPI strip, 8-step AI progress pipeline, AI Reasoning + Root Cause grid, Timeline + Recommendations split, notes + evidence, floating AI Copilot dock, RBAC enforcement, real-time progress simulation, CSV report.
   - **System Architecture** — 12 diagram tabs with hand-authored SVG, pan/zoom, Export SVG.
   - **Dashboards** — single `/app/dashboard` that switches content by current role.
8. **AI integration spec** — `createServerFn` in `src/lib/investigate.functions.ts`, Lovable AI Gateway provider helper (`src/lib/ai-gateway.server.ts`), structured output via `Output.object` + Zod, 429/402 error handling, model `google/gemini-3-flash-preview`.
9. **Shared UI primitives** — `InfoTooltip`, `ModuleActions`, `RangeFilter`, `InvestigateDialog`, `ThemeToggle`, central tooltip registry (`src/lib/tooltips.ts`), CSV export helper (`src/lib/export.ts`), mock data store (`src/lib/mock-data.ts`).
10. **Cross-cutting requirements** — semantic HTML, SEO `head()` per route, accessible icon buttons, loading skeletons, empty states, keyboard shortcut helper (`?` cheat-sheet, `g d`, `g t`, …), toast confirmations on every action.
11. **Out of scope / explicit nos** — no real backend, no Executive Dashboard route, no "View Dashboard" / "View Live Dashboard" buttons on landing, no Supabase mention in UI copy.
12. **Acceptance checklist** — a numbered list a rebuild can verify against (routes exist, RBAC matrix matches, AI server fn returns structured verdict, Investigation single-scroll layout, Assistant history persists, landing CTAs correct, etc.).

## Length & format

Markdown, ~600–900 lines, organized with H2/H3 sections and tables for the RBAC matrix and route inventory. Self-contained — readable without seeing the current codebase.

## After approval

In build mode I will:
1. Re-scan every route file and `src/lib/session.ts`, `tooltips.ts`, `mock-data.ts`, `investigation-mock.ts` to make sure no module, permission, or behavior is missed.
2. Write `MASTER_PROMPT.md` in a single pass.
3. Report the file path back — no other files touched.
