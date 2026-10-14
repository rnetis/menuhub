# MenuHub

Bilingual (Persian/English) multi-tenant online menu SaaS. Restaurants, cafés and food courts get a mobile-first digital menu with QR codes, analytics, team access control, and full RTL/LTR support — no code required.

## Features

- **Bilingual menus by design** — every category, item, description and variant lives in FA and EN, with automatic RTL/LTR rendering and per-restaurant fallback language
- **Public menu** — 7 themes, tenant branding (logo, cover, colors, radius), variants, add-ons, attribute badges, Persian-aware search, scheduled item availability, branch open/closed badges
- **QR codes** — downloadable PNG/SVG per restaurant plus a printable bilingual table card; QR scans tracked separately from menu views
- **Analytics** — views, scans, language/device/source split, hourly heatmap, top items & categories (privacy-friendly: no PII)
- **Team & RBAC** — 5 roles (OWNER, ADMIN, MANAGER, EDITOR, VIEWER) with per-plan seat limits
- **Multi-branch** — per-branch hours, contact info and open-now logic (handles overnight spans)
- **Plans** — FREE / STARTER / BUSINESS / ENTERPRISE with enforced limits (items, team size, branding locks)
- **Import/Export** — CSV preview & import, CSV/JSON export
- **Platform admin** — tenant management, plan switching, suspension, MRR stats

## Tech stack

- Next.js 16 (App Router, Turbopack, standalone output) · React 19 · TypeScript
- Tailwind CSS 4 + shadcn/ui (Radix primitives) · Zustand · TanStack Query
- Prisma + SQLite
- Single-page frontend with hash routing (`/` only); API under `/api/**`

## Getting started

```bash
bun install        # or npm install

# point DATABASE_URL at your local db (see .env)
npm run db:push    # create SQLite schema
npm run db:generate

npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

### Demo accounts

| Account | Email | Password |
|---|---|---|
| Restaurant owner (Cafe Nova) | `demo@menuhub.app` | `demo1234` |
| Platform admin | `admin@menuhub.app` | `admin1234` |

Demo menu: `/#/m/cafe-nova`

### Seeding

`scripts/seed.ts` creates the demo tenant (Cafe Nova — 6 categories, 19 bilingual items with variants/add-ons, 2 branches, ~600 analytics events over 30 days) and the demo accounts above.

## Project layout

```
prisma/schema.prisma        # data model (User, Session, Tenant, Membership,
                            # Branch, Domain, Category, MenuItem, Variant, AddOn,
                            # AnalyticsEvent)
src/app/api/**              # REST API routes (auth, tenants, categories, items,
                            # branches, team, public menu, tracking, QR, admin)
src/app/page.tsx            # SPA hash router
src/components/app/**       # views: Landing, Auth, Onboarding, Dashboard,
                            # MenuEditor, PublicMenu, QR, Analytics, Admin, ...
src/lib/**                  # auth (scrypt + sessions), rbac, plans, i18n,
                            # Persian search normalizer, menu themes
scripts/seed.ts             # demo data seeder
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `start` | Standalone production build & serve |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Prisma schema to SQLite |
| `npm run db:generate` | Generate Prisma client |
