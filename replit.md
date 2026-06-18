# AI Recruiter

An intelligent candidate ranking system that acts as an AI recruiter — ranking candidates against complex job descriptions using multi-dimensional semantic scoring. No LLM API key required.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/ai-recruiter run dev` — run the frontend (port 24295)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + shadcn/ui + Tailwind CSS + Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions: jobs.ts, candidates.ts, rankings.ts
- `artifacts/api-server/src/routes/` — Express route handlers: jobs.ts, candidates.ts, rankings.ts, stats.ts
- `artifacts/api-server/src/lib/ranking-engine.ts` — Core multi-dimensional ranking algorithm
- `artifacts/ai-recruiter/src/` — React frontend with pages for dashboard, jobs, candidates, rankings

## Architecture decisions

- **No LLM required**: The ranking engine uses weighted multi-dimensional scoring with a skill taxonomy/synonym system for semantic matching. Skills are normalized and grouped into canonical categories (e.g. "nodejs" maps to "javascript" group).
- **Weights**: Skill match (38%), Experience (22%), Career trajectory (18%), Cultural signals (13%), Availability (9%)
- **Skill taxonomy**: 30+ canonical skill groups with aliases handle synonyms (e.g. "k8s" → "kubernetes", "js" → "javascript")
- **Verdicts**: Strong Hire (≥88), Good Fit (≥75), Possible (≥60), Weak Match (≥45), Not Suitable (<45)
- **Rankings are replaced on each run**: Each POST /rankings/run deletes prior results for the job, keeping storage clean.

## Product

- **Dashboard**: Overview stats (active jobs, candidates, ranking runs, avg top score), recent ranking history, top candidates leaderboard
- **Jobs**: Create/manage job descriptions with required skills, nice-to-haves, seniority level, remote policy
- **Candidates**: Rich profiles with skills, behavioral signals (activity score, response rate), career progression, notable achievements
- **Ranking**: Run AI ranking from any job detail page — get an animated ranked shortlist with per-dimension score breakdowns, verdicts, reasoning text, strengths and gaps

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before using updated types
- CSS `@import url(...)` for Google Fonts must be the very first line in `index.css` — before any other @import statements
- Ranking uses `inArray` workaround for multiple candidate IDs due to Drizzle's API; currently fetches all and filters in memory for PoC simplicity

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Ranking engine: `artifacts/api-server/src/lib/ranking-engine.ts`
- Skill taxonomy is in the ranking engine — extend it to add more synonym groups
