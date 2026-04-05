# Casino Explorer

Full-stack **Next.js App Router** app (TypeScript, Tailwind CSS v4) that reads from **Aiven MySQL** via `mysql2/promise`, with a dark luxury casino-themed UI. Deploys cleanly on **Vercel** using environment variables only (no hardcoded secrets).

## Prerequisites

- **Node.js 20+** (LTS recommended)
- An **Aiven MySQL** service and its credentials
- Optional: **MySQL client** (`mysql` CLI) to import seed SQL

## Quick start (local)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Copy the example file and fill in your Aiven values:

   ```bash
   cp .env.example .env.local
   ```

   Required keys (see [`.env.example`](.env.example)):

   | Variable | Description |
   |----------|-------------|
   | `DB_HOST` | Aiven hostname |
   | `DB_PORT` | Port (often non-3306) |
   | `DB_NAME` | e.g. `defaultdb` |
   | `DB_USER` | e.g. `avnadmin` |
   | `DB_PASSWORD` | Service password |
   | `DB_SSL` | `true` for Aiven |

   **SSL / CA (recommended):** In the Aiven console, open your service → **CA certificate**. Either:

   - Paste the full PEM into `DB_CA` in `.env.local` (use real newlines, or `\n` sequences), or
   - Base64-encode the PEM file and set `DB_CA_BASE64`.

   **Local file path (dev only):** `DB_CA_PATH=./ca.pem` if you saved the cert next to the project.

   **Not recommended:** `DB_SSL_INSECURE=true` skips certificate verification — only for temporary debugging.

3. **Import schema and seed data**

   Download the Aiven CA file as `ca.pem` (from the console). Then:

   ```bash
   mysql --host=YOUR_HOST --port=YOUR_PORT --user=YOUR_USER -p \
     --ssl-mode=VERIFY_CA --ssl-ca=ca.pem YOUR_DB_NAME \
     < sql/CasinoInc.sql
   ```

   You will be prompted for the database password. On **Windows**, use the same command in PowerShell if `mysql` is on your `PATH`, or run it from **WSL**, **Git Bash**, or the MySQL Shell.

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

5. **Optional: health check**

   With the app running and DB configured:

   ```text
   GET http://localhost:3000/api/health
   ```

## Deploy to Vercel

1. Push this repository to GitHub (or use `vercel` CLI).
2. In the Vercel project → **Settings → Environment Variables**, add the same variables as in `.env.local` (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`, and preferably `DB_CA` or `DB_CA_BASE64`).
3. Deploy. Redeploy after changing env vars.

**Notes**

- API routes and server components use the **Node.js** runtime (default) — compatible with `mysql2`.
- Serverless functions are short-lived; a small pool is used and reused when possible. For very high traffic, consider Aiven’s connection pooling or a proxy.

## Project layout (important files)

| Path | Purpose |
|------|---------|
| [`sql/CasinoInc.sql`](sql/CasinoInc.sql) | Tables `CASINO`, `PLAYER`, `GAMES`, `OFFERS`, `VISITS`, `PLAYS` + seed rows |
| [`src/lib/db.ts`](src/lib/db.ts) | Connection pool, Aiven TLS, `queryRows` helper |
| [`src/lib/queries/*.ts`](src/lib/queries) | Parameterized SQL per domain |
| [`src/app/api/*/route.ts`](src/app/api) | REST handlers for the UI |
| [`src/app/page.tsx`](src/app/page.tsx) | Home: stats, chart, featured casinos (server) |
| [`src/app/casinos/page.tsx`](src/app/casinos/page.tsx) | Casino browser + filters (client fetch) |
| [`src/app/games/page.tsx`](src/app/games/page.tsx) | Games + categories |
| [`src/app/players/page.tsx`](src/app/players/page.tsx) | Players + VIP / points / email |
| [`src/app/analytics/page.tsx`](src/app/analytics/page.tsx) | Query widgets → `POST /api/analytics` |
| [`src/components/*`](src/components) | Navbar, cards, tables, charts, explorers |

## Security

- Never commit `.env.local` or passwords.
- If a password was shared in a screenshot or chat, **rotate it** in Aiven.
- All user-controlled filters go through **parameterized** queries in `src/lib/queries`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- mysql2/promise (pooled connections, TLS)
- Sonner (toasts), Lucide (icons), Recharts (home chart), Zod (analytics body validation)

---

**Files created/updated in this implementation:** `.env.example`, `.gitignore`, `README.md`, `public/casino-icon.svg`, `sql/CasinoInc.sql`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/loading.tsx`, `src/app/page.tsx`, `src/app/casinos/page.tsx`, `src/app/games/page.tsx`, `src/app/players/page.tsx`, `src/app/analytics/page.tsx`, `src/app/api/health/route.ts`, `src/app/api/stats/route.ts`, `src/app/api/casinos/route.ts`, `src/app/api/casinos/options/route.ts`, `src/app/api/games/route.ts`, `src/app/api/games/options/route.ts`, `src/app/api/players/route.ts`, `src/app/api/analytics/route.ts`, `src/lib/db.ts`, `src/lib/types.ts`, `src/lib/queries/stats.ts`, `src/lib/queries/casinos.ts`, `src/lib/queries/players.ts`, `src/lib/queries/games.ts`, `src/lib/queries/analytics.ts`, and UI under `src/components/**`. Scaffold files from `create-next-app` remain (`package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, etc.).
