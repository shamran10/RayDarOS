# ReydarOS

Last updated: 2026-07-30

ReydarOS is an autonomous engagement intelligence operating system for finding, evaluating, drafting, governing, and auditing community engagement opportunities. The product is now autonomous-first: source scans create candidates, deliberation runs, policy decisions, drafts, review exceptions, market memory, and audit records without requiring an operator to manually move each item through the system.

## README Maintenance Rule

Update this README in the same conversation whenever a feature, route, workflow, data model, setup step, script, dependency, or user-visible behavior changes.

Every feature update should keep these sections current:

- `Current Architecture`
- `Features`
- `Routes`
- `Admin and Debug Fallbacks`
- `Change Log`

For each meaningful feature change, add a dated `Change Log` entry with a short summary and the main files touched. If a change is only an internal refactor, still update the log when it affects future implementation decisions.

## Current Architecture

The default ReydarOS flow is:

1. `Projects` define the product, audience, risk tolerance, knowledge, and community rules.
2. `Autonomous Pipeline` persists configured signal sources and scans them through mock, manual, or existing Reddit provider adapters.
3. Each database-backed discovery run normalizes and deduplicates discovered items, then deterministically maps them into candidate engagement points.
4. Starting deliberation creates or reuses one database-backed Opportunity for the selected candidate, then persists an immutable eight-agent run revision, score, and final decision.
5. Autonomy policies and guardrails decide whether the item can be auto-cleared, blocked, saved as insight, monitored, or sent to review.
6. `Review Inbox` shows approval-gated exceptions and high-value items needing human attention.
7. `Review Studio` lets the operator edit, approve, reject, or save learning from drafts.
8. `Audit Log` preserves traceability from source signal to candidate, deliberation, final decision, policy snapshot, and action state.

Projects, Product Knowledge, Market Knowledge, Community Rules, Signal Sources, Discovery Runs, Discovered Items, Conversation Candidates, Opportunities, Deliberation Runs, Agent Results, Candidate Scores, and Final Decisions use typed server-side services backed by Prisma/PostgreSQL. Workspace ownership is selected and enforced on the server. These collections are explicitly excluded from browser `localStorage`; legacy local records are not imported or mapped to database project IDs.

Response Drafts, Guardrail Checks, Autonomy Policies, Autonomous Action Logs, Market Insights, Engagement Outcomes, Activity Logs, and analytics remain on the temporary local MVP boundary. Phase 3 database IDs are not connected to those local Phase 4 records.

Manual screens are no longer part of the default operating loop. They remain available only as admin/debug fallbacks from Settings.

## Features

- Database-backed source CRUD and lifecycle-tracked scans with project ownership enforcement
- Reddit API discovery provider using server-side OAuth credentials and read-only subreddit listing/search ingestion
- Mock and manual discovery providers for deterministic local verification
- Normalized, deduplicated discovered items and deterministic database-backed candidate mapping
- Explicit discovery loading, empty, validation, failure, and retry states
- Database-backed Opportunity lifecycle with one Opportunity per persisted candidate
- Deterministic eight-agent deliberation with immutable run revisions, persisted reasoning, scores, final decisions, and failure history
- Idempotent start requests, explicit reruns, and database-enforced prevention of parallel active runs
- Autonomy controls for thresholds, mention levels, links, disclosure, cadence, and community risk
- Guardrails for promotion risk, community norms, product mention levels, links, and account safety
- Review Inbox for approval-gated exceptions and high-risk/high-value opportunities
- Review Studio for draft editing, approval, rejection, and market-memory capture
- Audit Log for autonomous and semi-autonomous action traceability
- Market Memory, analytics, project management, knowledge base, and community rules
- Database-backed CRUD for Projects, Product Knowledge, Market Knowledge, and Community Rules, with Zod validation and workspace ownership enforced on the server
- Explicit Project Brain loading, empty, validation, and database-failure states with retry support
- Accessible application-owned dialogs for Create/Edit Project, Product Knowledge, Market Knowledge, Community Rules, and Add Source, with focus management, Escape/overlay close, and body scroll locking
- Project Brain row-card overview for knowledge health, signal coverage, response settings, and recent memory
- Admin/debug fallbacks for manual intake, candidate inspection, deliberation inspection, and legacy approval review

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Prisma
- PostgreSQL
- Atlaskit
- NextAuth
- OpenAI API

## Getting Started

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Update `.env` with your local database URL, NextAuth secret, and OpenAI API key:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reydaros?schema=public"
NEXTAUTH_SECRET="replace-with-a-secret"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5.4-mini"
REDDIT_CLIENT_ID=""
REDDIT_CLIENT_SECRET=""
REDDIT_USER_AGENT="web:reydaros:v0.1 (by u/your_username)"
REDDIT_SCAN_LIMIT="10"
```

For Reddit discovery, create a Reddit developer app and set:

- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`
- `REDDIT_SCAN_LIMIT`

The Reddit provider is read-only. It fetches subreddit posts through the official API, then persists normalized discovered items and deterministic candidate mappings. Missing credentials fail and record only the attempted Reddit run; mock/manual discovery and the rest of the application remain available. Deliberation is a separate deterministic Phase 3 action and does not call OpenAI. Drafting, posting, and OAuth remain outside this phase. Do not use Reddit content for model training, and review Reddit's Developer Terms/Data API Terms before any commercial deployment or write/posting integration.

Generate the Prisma client:

```bash
npm run prisma:generate
```

Create or update a clean development database with committed migrations:

```bash
npm run db:migrate
```

For a deployment environment, apply committed migrations non-interactively:

```bash
npm run db:migrate:deploy
```

The committed initial migration is the source of truth; do not substitute `prisma db push`. If a database was provisioned from `prisma/schema.prisma` before migration history existed, verify that its schema exactly matches the initial migration, then explicitly baseline it with Prisma Migrate before running `migrate deploy`. Never mark an unverified database as migrated.

The demo seed is destructive and is optional. It refuses production, requires `DATABASE_URL`, and runs only when `ALLOW_DESTRUCTIVE_SEED=true` is explicitly set against a disposable development database. Do not run it against shared or valuable data.

PowerShell:

```powershell
$env:ALLOW_DESTRUCTIVE_SEED="true"
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open the app at `http://localhost:3000`. If that port is occupied, Next.js will choose the next available port.

## Available Scripts

- `npm run dev` - start the Next.js development server
- `npm run build` - build the app for production
- `npm run start` - run the production build
- `npm run lint` - run Next.js linting
- `npm run typecheck` - run TypeScript checks
- `npm run prisma:generate` - generate the Prisma client
- `npm run db:migrate` - create/apply development migrations with `prisma migrate dev`
- `npm run db:migrate:deploy` - apply committed migrations in deployment environments
- `npm run db:seed` - destructively seed an explicitly opted-in disposable development database

## Project Structure

```text
src/app/          Next.js app routes
src/components/   Shared UI components
src/lib/          Domain services, data helpers, Prisma client, and types
src/screens/      Screen-level React components
prisma/           Prisma schema, committed migrations, and guarded demo seed
DESIGN.md         Visual design system notes
```

## Routes

- `/` - command dashboard
- `/projects` - project workspaces
- `/projects/[projectId]` - Project Brain overview
- `/projects/[projectId]/product-knowledge` - project product knowledge
- `/projects/[projectId]/market-knowledge` - project market knowledge
- `/projects/[projectId]/community-rules` - project community rules
- `/signal-discovery` - database-backed signal sources and discovery-run history
- `/signal-monitor` - database-backed one-off manual discovery intake
- `/candidates` - database-backed candidate mapping inspection and deliberation start
- `/deliberation` - database-backed run history and deterministic rerun inspection
- `/opportunities` - database-backed opportunity list for the active project
- `/opportunities/[opportunityId]` - persisted source, candidate, run, score, and decision trail
- `/response-studio` - review studio
- `/autonomy-policies` - autonomy controls
- `/action-log` - audit log
- `/market-insights` - market memory
- `/analytics` - analytics
- `/settings` - settings and admin/debug fallbacks

Project Brain API routes:

- `GET /api/project-brain` - load the current workspace snapshot
- `GET/PATCH/DELETE /api/project-brain/organization` - manage the server-selected workspace organization; deletion is blocked while it owns projects
- `GET/POST /api/project-brain/projects` - list and create projects
- `GET/PATCH/DELETE /api/project-brain/projects/[projectId]` - read, update, or delete an owned project
- `GET/POST /api/project-brain/projects/[projectId]/product-knowledge` - list and create product knowledge
- `GET/PATCH/DELETE /api/project-brain/projects/[projectId]/product-knowledge/[itemId]` - read, update, or delete owned product knowledge
- `GET/POST /api/project-brain/projects/[projectId]/market-knowledge` - list and create market knowledge
- `GET/PATCH/DELETE /api/project-brain/projects/[projectId]/market-knowledge/[itemId]` - read, update, or delete owned market knowledge
- `GET/POST /api/project-brain/projects/[projectId]/community-rules` - list and create community rules
- `GET/PATCH/DELETE /api/project-brain/projects/[projectId]/community-rules/[ruleId]` - read, update, or delete owned community rules

Discovery API routes:

- `GET /api/discovery` - load the workspace discovery snapshot
- `GET/POST /api/discovery/projects/[projectId]/sources` - list and create signal sources for an owned project
- `GET/PATCH/DELETE /api/discovery/projects/[projectId]/sources/[sourceId]` - manage an owned source; deletion is blocked when run history exists
- `POST /api/discovery/projects/[projectId]/sources/[sourceId]/runs` - run the source provider and persist its lifecycle, items, and candidate mappings
- `POST /api/discovery/projects/[projectId]/manual` - persist a manual run, item, and deterministic candidate mapping
- `POST /api/discovery/reddit` - legacy read-only Reddit provider route; database-backed source scans invoke the same provider server-side

Deliberation API routes:

- `GET /api/deliberation/projects/[projectId]/opportunities` - list persisted Opportunities and their current terminal run for an owned project
- `GET /api/deliberation/projects/[projectId]/opportunities/[opportunityId]` - load the full source, candidate, revision, score, agent-result, and decision trail
- `GET /api/deliberation/projects/[projectId]/opportunities/[opportunityId]/runs` - load immutable run history for an owned Opportunity
- `POST /api/deliberation/projects/[projectId]/candidates/[candidateId]/start` - idempotently create/reuse the candidate Opportunity and start its first run
- `POST /api/deliberation/projects/[projectId]/opportunities/[opportunityId]/rerun` - create the next immutable run revision for the same Opportunity

Start and rerun payloads contain only a request UUID. Project, organization, candidate, and Opportunity ownership are derived and verified server-side. Starting an already-deliberated candidate returns the existing record; reruns are explicit. A `PENDING` or `RUNNING` revision returns HTTP 409, and a partial unique index prevents parallel active runs at the database layer.

## Admin and Debug Fallbacks

These routes are intentionally demoted from the primary navigation. They should be used for recovery, inspection, provider testing, or debugging older records.

- `/signal-monitor` - one-off manual intake into persisted discovery and candidate mapping
- `/candidates` - persisted candidate map inspection and explicit deliberation start
- `/deliberation` - persisted deliberation and revision-history debug
- `/autonomy-queue` - legacy approval queue
- `/guardrails` - guardrail results

## Change Log

### 2026-07-30 Phase 3 Opportunity and Deliberation Persistence

- Moved Opportunities, Deliberation Runs, all eight Agent Results, Candidate Scores, and Final Decisions to typed Prisma/PostgreSQL services and App Router APIs.
- Added one-Opportunity-per-candidate ownership, immutable run revisions, idempotent request handling, short reservation/finalization transactions, and database-enforced active-run and result uniqueness.
- Connected Candidate Map, Deliberation Debug, Opportunity Inbox, and Opportunity Detail to persisted records with loading, empty, conflict, failure, history, and retry states.
- Kept deterministic reasoning outside database transactions and made no OpenAI, Reddit, OAuth, Apify, drafting, posting, autonomy, analytics, or background-job changes.
- Removed Phase 3 collections from browser `localStorage` reads and writes without importing legacy IDs; Phase 4 records remain on their isolated local compatibility boundary.

Main files touched:

- `prisma/schema.prisma`
- `prisma/migrations/20260730120000_phase3_opportunity_deliberation_persistence/migration.sql`
- `src/lib/deliberation/`
- `src/app/api/deliberation/`
- `src/lib/store.tsx`
- `src/screens/candidate-map-screen.tsx`
- `src/screens/deliberation-room-screen.tsx`
- `src/screens/opportunity-inbox-screen.tsx`
- `src/screens/opportunity-detail-screen.tsx`
- `README.md`

### 2026-07-30 Phase 2 Discovery and Candidate Persistence

- Moved Signal Sources, Discovery Runs, Discovered Items, and Conversation Candidates to typed Prisma/PostgreSQL services and App Router APIs.
- Added workspace-scoped source CRUD, provider lifecycle tracking, mock/manual/Reddit scan handling, stable-key deduplication, and deterministic candidate mapping without OpenAI or Opportunity persistence.
- Added a normal migration for run provider snapshots and database-enforced discovery/candidate uniqueness, plus explicit loading, failure, retry, and legacy-localStorage boundaries across Autonomous Pipeline, Manual Intake, and Candidates.
- Failed Reddit runs remain `FAILED`, preserve their error, and do not update the source's last successful scan timestamp.

Main files touched:

- `prisma/schema.prisma`
- `prisma/migrations/20260730000000_phase2_discovery_persistence/migration.sql`
- `src/lib/discovery/`
- `src/app/api/discovery/`
- `src/lib/store.tsx`
- `src/screens/signal-discovery-screen.tsx`
- `src/screens/signal-monitor-screen.tsx`
- `src/screens/candidate-map-screen.tsx`
- `README.md`

### 2026-07-30 Remaining Project Brain Dialog Repair

- Replaced the remaining Atlaskit modal portal surfaces in Product Knowledge, Market Knowledge, and Community Rules with the shared application-owned dialog.
- Preserved the existing Project Brain create/update API calls, validation and failure feedback, while restoring add and edit visibility, safe cancellation, and close-after-success behavior.
- Kept unrelated workflow surfaces unchanged; Community Rules exposes its edit action directly while retaining the existing risk-action menu.

Main files touched:

- `src/screens/knowledge-base-screen.tsx`
- `src/screens/community-rules-screen.tsx`
- `README.md`

### 2026-07-30 Shared Modal Visibility Repair

- Replaced the broken Atlaskit portal surfaces used by Create/Edit Project and Add Source with a small shared application-owned dialog.
- Added a fixed full-screen blanket, explicit layering, accessible dialog semantics, focus restoration and trapping, Escape/overlay close, and body scroll locking.
- Removed the animation-frame portal refresh workaround; existing Project Brain API submission and local Signal Source state behavior remain unchanged.

Main files touched:

- `src/components/app-dialog.tsx`
- `src/screens/projects-screen.tsx`
- `src/screens/signal-discovery-screen.tsx`
- `src/app/globals.css`
- `README.md`

### 2026-07-27 Project Brain Neon Connection Repair

- Aligned `prisma`, `@prisma/client`, and `@prisma/adapter-pg` at `7.9.0`.
- Reused one PostgreSQL pool and one Prisma client across Next.js development hot reloads, with explicit connection and idle timeouts.
- Replaced the read-only Project Brain snapshot transaction with concurrent independent reads, avoiding unnecessary transaction acquisition through the Neon pooled connection.
- Preserved transactional boundaries for future atomic multi-record writes; no schema, migration, seed, or API contract changes were made.

Main files touched:

- `package.json`
- `package-lock.json`
- `src/lib/prisma.ts`
- `src/lib/project-brain/service.ts`
- `README.md`

### 2026-07-24 Atlaskit Modal Rendering Repair

- Restored Create/Edit Project and Add Source modal visibility under React Strict Mode by locally refreshing the affected Atlaskit portal after its initial mount.
- Project modal transitions now receive exactly one stable keyed modal child, Cancel buttons are non-submitting, and existing async validation/error behavior remains unchanged.
- Signal Sources continue to use the local MVP store.

Main files touched:

- `src/screens/projects-screen.tsx`
- `src/screens/signal-discovery-screen.tsx`
- `README.md`

### 2026-07-24 Project Brain Persistence Foundation

- Moved Projects, Product Knowledge, Market Knowledge, and Community Rules from browser persistence to typed App Router APIs backed by Prisma/PostgreSQL.
- Added strict Zod mutation validation, consistent API success/error envelopes, fixed-workspace ownership enforcement, and database loading/failure states.
- Kept discovery, candidates, deliberation, autonomy, drafts, analytics, action logs, and memory on the temporary local MVP store boundary.
- Added the initial Prisma migration and deployment migration script; `prisma db push` is not part of the workflow.
- Guarded the destructive demo seed behind explicit disposable-database opt-in and corrected dependency deletion order.

Main files touched:

- `prisma/migrations/20260724000000_initial_schema/migration.sql`
- `prisma/seed.ts`
- `src/lib/project-brain/`
- `src/app/api/project-brain/`
- `src/lib/store.tsx`
- `src/screens/projects-screen.tsx`
- `src/screens/knowledge-base-screen.tsx`
- `src/screens/community-rules-screen.tsx`
- `README.md`

### 2026-05-07 GitHub Repository Setup

- Initialized project Git tracking for publishing to `thixra/RaydarOS`.
- Added TypeScript build info files to the ignore rules so local incremental build cache stays out of commits.

Main files touched:

- `.gitignore`
- `README.md`

### 2026-05-07 Project Brain Layout

- Updated the Project Brain overview from a wrapping grid into full-width row cards, with leading icons, each row keeping the title on the left, and clustering right-aligned supporting text before the status or metric tag and optional right-pinned action; recent-memory chips align to the same right edge.
- Kept Project Brain supporting text on a single line with truncation protection for narrow widths.
- Flattened the Project Brain grounding warning so its icon, title, and suggestion render on one line on desktop.
- Aligned PageHeading controls with the page title line so the project switcher and primary action sit horizontally with the heading.

Main files touched:

- `src/screens/project-brain-screen.tsx`
- `src/app/globals.css`
- `README.md`

### 2026-05-07 Autonomous Workflow

- Made the autonomous pipeline the default product workflow.
- Demoted manual-first screens to Settings admin/debug fallbacks.
- Renamed primary surfaces around the new architecture: `Autonomous Pipeline`, `Review Inbox`, `Review Studio`, `Autonomy Controls`, `Audit Log`, and `Market Memory`.
- Removed manual-only action affordances including simulated auto-action, manual posted logging, legacy copy response action, and manual queue controls.
- Added this living README maintenance rule so feature changes update project memory across future conversations.

Main files touched:

- `src/components/app-shell.tsx`
- `src/screens/settings-screen.tsx`
- `src/screens/signal-discovery-screen.tsx`
- `src/screens/signal-monitor-screen.tsx`
- `src/screens/opportunity-inbox-screen.tsx`
- `src/screens/response-studio-screen.tsx`
- `src/screens/candidate-map-screen.tsx`
- `src/screens/deliberation-room-screen.tsx`
- `src/screens/autonomy-queue-screen.tsx`
- `src/screens/autonomous-action-log-screen.tsx`
- `src/screens/guardrails-screen.tsx`
- `src/lib/store.tsx`
- `README.md`

### 2026-05-07 Reddit API Provider

- Added a server-side Reddit API discovery provider with OAuth client credentials.
- Added `/api/discovery/reddit` so browser code never receives Reddit client secrets.
- Updated the autonomous pipeline to call the Reddit API provider when a source is configured with `sourceType: "reddit"`.
- Updated source setup UI to expose `Reddit API` as a real provider option.
- Added Reddit environment variables to `.env.example` and local `.env` placeholders.

Main files touched:

- `src/lib/discovery/providers/types.ts`
- `src/lib/discovery/providers/reddit-provider.ts`
- `src/app/api/discovery/reddit/route.ts`
- `src/lib/discovery/discovery-service.ts`
- `src/lib/store.tsx`
- `src/screens/signal-discovery-screen.tsx`
- `.env.example`
- `.env`
- `README.md`

### 2026-07-24 Unused Flutter Scaffold Removal

- Removed the standalone Flutter starter scaffold after confirming it had no Next.js imports, scripts, CI/CD workflows, generated integrations, submodules, symlinks, or ReydarOS-specific assets.
- The repository now contains only the active Next.js ReydarOS application; its routes and user-visible behavior are unchanged.

Main files touched:

- `README.md`

## Notes

This repository is private and currently represents an MVP. For visual design guidance, see `DESIGN.md`.
