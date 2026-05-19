# Javalab Tech — Digital Command Center (v1 Plan)

The full spec is an entire operating system (15+ major modules). Shipping all of it in one pass would produce shallow, broken screens. This plan delivers a **production-quality v1 shell** with the full navigation, design system, and 6 fully-built priority modules. Remaining modules get polished "coming soon" routes wired into the nav so the structure is complete and you can iterate module-by-module.

## Design system

- Pure coal-black background (`oklch(0.12 0 0)`), elevated glass surfaces with subtle white borders and backdrop blur
- Electric blue primary (`oklch(0.72 0.22 250)`) with a glow variant for accents, focus rings, chart strokes
- White / muted-white text hierarchy
- Typography: Space Grotesk (display) + Inter (body)
- Tokens: `--bg`, `--surface`, `--surface-elevated`, `--glass`, `--border-glass`, `--primary`, `--primary-glow`, `--accent-cyan`, `--success`, `--warning`, `--danger`, gradients (`--gradient-primary`, `--gradient-glow`), shadows (`--shadow-glow`, `--shadow-elevated`)
- Reusable primitives: `GlassCard`, `StatCard`, `SectionHeader`, `DataTable`, `StatusPill`, `LiveDot`, `TrendSparkline`
- Recharts for charts, framer-motion for entrance + number-tick animations

## App shell

- Collapsible multi-level sidebar (shadcn `Sidebar`) grouped: Overview · Clients · Revenue · Products · Workspace · Marketing · Support · Finance · System
- Top bar: global search, environment switcher, notifications popover, AI assistant launcher, staff avatar menu
- Command palette (⌘K) for jump-to-anything
- All routes use TanStack Start file-based routing under `src/routes/`

## Modules — fully built in v1

1. **Dashboard / HQ Overview** (`/`) — hero KPI grid (active clients, MRR, today's revenue, active projects, staff online, SMS sent, POS tx, tickets), revenue area chart, subscription mix donut, server/API health strip, live activity feed, notifications
2. **Clients** (`/clients` + `/clients/$id`) — searchable table, client profile with tabs (Overview, Subscriptions, Invoices, KYC, Activity, Notes), status pills, "Login as customer" action
3. **Subscriptions** (`/subscriptions`) — plans grid, active subscriptions table, MRR/churn cards, failed payments queue, renewal calendar
4. **SaaS Products** (`/products`) — catalog of all product lines (POS variants, Financial, Business mgmt, Mobile, Web, SMS) as glass cards with active-tenant counts and per-product drill-in
5. **Projects** (`/projects`) — Kanban board + list view, task detail drawer, milestones, team avatars
6. **Staff & Departments** (`/staff`) — department tree, staff directory, role/permission matrix, attendance snapshot

## Modules — scaffolded routes (nav-linked, branded "coming in next iteration" pages with the module's planned widgets sketched as skeletons)

Office Desk · Password Vault · Marketing Center · Bulk SMS · Support · Finance · Security · Developer Center · AI Assistant

This keeps the IA complete so you can ask me to flesh out any one next.

## Technical notes (for your Node.js backend later)

- All data in v1 is from a typed `src/lib/mock-data.ts` module so swap-to-API is a one-file change per module
- Each list view uses TanStack Query keys named after the eventual REST resource (`['clients']`, `['subscriptions']`, etc.) — wire to your Node endpoints by replacing the query function
- Auth, real-time (websockets), and AI endpoints are stubbed behind typed client interfaces in `src/lib/api/` so the contract is visible

## Out of scope for v1 (explicit)

- Real auth / RBAC enforcement (UI roles shown, no backend gate)
- Real payments, STK Push, SMS sending
- Video meetings, live chat transport
- Encryption for password vault (UI only)

## Deliverable

A coal-black, electric-blue, glassmorphic HQ that *feels* like a real enterprise command center on first load, with 6 deep modules and the rest scaffolded. After approval I'll build it in one pass and you can point me at the next module to deepen.
