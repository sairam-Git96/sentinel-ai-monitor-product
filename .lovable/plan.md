# Enterprise Enhancement Plan

This is a large, multi-area change. I'll group it into 6 implementation phases so each can be verified before moving on. Before starting, I need to confirm the scope and assumptions below.

## Current state (verified)

- App shell + sidebar already exist with routes: dashboard, executive, transactions, fraud, anomalies, rca, investigations, incidents, reports, audit, users, roles, notifications, settings, help, assistant, **and** an existing `app.architecture.tsx`.
- The "System Architecture" module the prompt asks for already has a route stub; it needs to be built out, not created from scratch.
- "Executive Dashboard" exists at `/app/executive` and must be fully removed.
- There is no real backend; all data is mock (`src/lib/mock-data.ts`). Buttons/exports will be wired to client-side mock behavior (CSV download, toasts, dialogs), not real APIs.

## Phase 1 — Header & navigation cleanup

- Strip header down to: logo, app name, global search, notifications, profile menu, theme switcher, role switcher.
- Remove: environment selector, help-centre icon, last-updated timestamp, demo labels, env indicators.
- Sidebar: remove Executive Dashboard entry; keep Architecture entry (rename group as "System Architecture"); ensure active-route highlighting + collapsed icon mode work.

## Phase 2 — Executive Dashboard removal

- Delete `src/routes/app.executive.tsx`.
- Remove all sidebar/menu/route references.
- Replace landing redirect (`/app` → `/app/dashboard`).
- Restructure dashboards by role (Admin, Risk Analyst, Operations, Auditor) on a single `/app/dashboard` route that switches sections by the current role from the role switcher. Compliance/Business user fall back to Risk Analyst view.

## Phase 3 — System Architecture module

Rebuild `/app/architecture` as a tabbed module with these tabs:
Solution Overview, Application Layers, User Access Flow, Data Flow, Transaction Processing, AI Detection Engine, RCA Flow, Database ER, API Architecture, Security Architecture, Deployment Architecture, Future Scalability.

Per tab: an SVG/Mermaid-style interactive diagram (pan/zoom via CSS transform + buttons), expandable cards explaining each component, hover tooltips, and an "Export SVG" button that downloads the rendered diagram. Diagrams are hand-authored SVG (no external lib needed) for crispness and zero deps.

## Phase 4 — Global tooltip framework

- Add a reusable `<InfoTooltip>` component built on shadcn `Tooltip` + `Popover` (hover for desktop, click for touch) that renders a structured card: Definition, Purpose, Usage, Formula, Example, Impact, Recommended Action.
- Add a central `src/lib/tooltips.ts` registry keyed by metric/field id so content is consistent and easy to maintain.
- Wire it into KPI cards, table column headers, chart titles, filter labels, status badges, and action icon buttons across dashboard, transactions, fraud, anomalies, rca, audit, investigations, incidents, reports.

## Phase 5 — Functional buttons

Make every visible button do something meaningful with mock data:
- Export CSV / Excel / PDF / Print → generate file client-side (CSV via Blob, "Excel" as .csv with xlsx mime, PDF via `window.print()` of a printable view) and toast confirmation.
- Add / Edit / Delete / Save / Archive / Restore → open shadcn Dialog, update in-memory store (Zustand) seeded from mock data, toast result.
- Filter / Search / Sort / Group → wire to TanStack Table state on each table.
- AI actions (Generate Insight, RCA, Summary, Recommendation, Explain Anomaly) → call a local `generateMockInsight()` that streams canned but plausible content into a side panel.
- User admin actions → dialogs that mutate the in-memory users store.

## Phase 6 — Polish & consistency

- Loading skeletons + empty-state components on every list/table.
- Keyboard shortcut helper (`?` opens cheat-sheet dialog; `g d` dashboard, `g t` transactions, etc.).
- Accessibility pass: aria-labels on all icon buttons, focus rings, `<main>` landmark, contrast tokens.
- Standardize Card/Button/Table/Badge usage across modules; remove any remaining placeholder text.

## Out of scope (please confirm)

- No real backend / Lovable Cloud — all data stays mock + in-memory.
- "Real PDF export" uses the browser print dialog, not a PDF library, to stay light.
- "Guided onboarding" = a single dismissible coach-mark tour on first dashboard visit, not a full product-tour system.
- "Schedule Report" = a dialog that records the schedule in the mock store; no actual cron.

## Technical notes

- Stack: TanStack Start + Router, shadcn/ui, Tailwind v4, lucide-react. No new heavy deps; add `zustand` for the in-memory mutable store and `papaparse` only if needed for CSV (otherwise hand-roll).
- New files: `src/lib/tooltips.ts`, `src/components/info-tooltip.tsx`, `src/components/export-menu.tsx`, `src/components/keyboard-shortcuts.tsx`, `src/components/architecture/*` (one file per diagram tab), `src/stores/*` for mock CRUD.
- Deleted files: `src/routes/app.executive.tsx`.
- Edited files: `src/components/app-shell.tsx` (header + sidebar), `src/routes/app.tsx` (landing redirect), every existing module route to attach tooltips and wire buttons.

## Estimated size

~25-35 file changes across ~6 turns. I'll commit phase by phase and show you the preview after each so you can course-correct.

## Confirmations I need before starting

1. OK to keep everything client-side mock (no Lovable Cloud)?
2. OK to consolidate dashboards into a single `/app/dashboard` route that swaps content by selected role (vs separate routes per role)?
3. OK with print-to-PDF (browser dialog) instead of adding a PDF generator dependency?

If yes to all three, I'll start with Phase 1 + 2 (header, sidebar, executive removal) in the next turn.
