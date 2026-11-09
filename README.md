# सजग (Sajag) — legal-awareness campaigns

Monorepo with npm workspaces:

```
apps/
  api/        Express + TypeScript API  → Render   (Azure SQL via Prisma, Azure DocumentDB via MongoDB driver)
  web/        React + Vite + TypeScript → Vercel
packages/
  shared/     zod schemas, types, scoring rules, API routes — used by both apps (single source of truth)
```

## Run locally

```bash
nvm use                 # Node 22
npm install             # also generates the Prisma client
npm run setup:env       # creates .env with fresh secrets — then fill the two Azure connection strings
npm run dev             # applies SQL migrations, then starts API :4000 + web :5173
```

Open http://localhost:5173 — admin at `/admin` (first owner comes from `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`).
With `SMS_PROVIDER=console`, OTPs are printed in the API log and shown on screen in dev.

## Schema changes (automatic deploy)

| Store | Where | Applied by |
|---|---|---|
| Azure SQL | `apps/api/prisma/schema.prisma` + `prisma/migrations/*` | `prisma migrate deploy` |
| DocumentDB | `apps/api/src/db/mongo-migrations.ts` (append-only list) | API start + `db:deploy` |

1. Edit `schema.prisma` → `npm run db:migration -- <name>` (diffs against the live DB, writes the SQL) → commit.
2. Render's build runs `npm run db:deploy`: applies pending SQL + document migrations, then **fails the build if
   `schema.prisma` has drifted without a migration**, so a schema change can never ship half-applied.

## Deploy

- **Render (API):** New → Blueprint → this repo; `render.yaml` defines one free web service.
  Fill the `sajag-secrets` env group (same keys as `.env.example`) and set `WEB_ORIGINS` to your Vercel domain(s).
- **Vercel (web):** Root Directory `apps/web` (keep "include files outside root" on). Set `VITE_API_URL` to the Render URL.

## Architecture notes

- Layered API modules (`routes → service → repository`), all input validated with the shared zod schemas.
- Forms are schemaless documents (question types: single, multi-correct with partial/all-or-nothing scoring,
  true/false, open text); people, consent, submissions and compliance records are relational.
- DPDP: itemised notice per campaign, consent ledger, verified guardian consent for minors (OTP; DigiLocker stub),
  encrypted + hashed mobiles, data-rights self-service (`/my-data`), retention job with 48-hour notice, audit log.

## CI

Move `docs/github-ci.yml` to `.github/workflows/ci.yml` to type-check and build every PR.

## Keep the API awake (free plan)

Render's free web service sleeps after ~15 minutes without traffic (the next visit then waits ~1 minute).
Ping `GET https://<your-api>.onrender.com/health` every 10 minutes with a free external monitor — pick one:

- **cron-job.org** (free): new cron job → URL above → every 10 minutes.
- **UptimeRobot** (free): HTTP(s) monitor → URL above → 5-minute interval (also alerts you if the API goes down).
- **GitHub Actions**: `docs/github-keepalive.yml` — only for a public repo (a private repo's free minutes run out).

`/health` deliberately does not query Azure SQL: the free Azure SQL database auto-pauses when idle and has a
monthly free compute allowance, which a 24×7 database ping would exhaust within days. It resumes automatically
(up to ~1 minute) on the next real request. `/api/health` checks both databases and is used by the admin banner.

The DPDP retention pass (48-hour notices, erasure, OTP clean-up) runs daily inside the API, because Render's free
tier has no cron jobs. Run it manually any time with `npm run jobs:retention`.

Local check: `API_URL=http://localhost:4000 npm run keepalive`
