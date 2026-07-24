# ReydarOS

Last updated: 2026-05-07

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
2. `Autonomous Pipeline` scans configured signal sources through provider adapters. The first production adapter is the Reddit API provider; the demo adapter remains available for local testing.
3. The pipeline maps discovered items into candidate engagement points.
4. DARM deliberation scores each candidate, creates agent reasoning, and produces a final decision.
5. Autonomy policies and guardrails decide whether the item can be auto-cleared, blocked, saved as insight, monitored, or sent to review.
6. `Review Inbox` shows approval-gated exceptions and high-value items needing human attention.
7. `Review Studio` lets the operator edit, approve, reject, or save learning from drafts.
8. `Audit Log` preserves traceability from source signal to candidate, deliberation, final decision, policy snapshot, and action state.

Manual screens are no longer part of the default operating loop. They remain available only as admin/debug fallbacks from Settings.

## Features

- Autonomous source scanning with configurable project-specific signal sources
- Reddit API discovery provider using server-side OAuth credentials and read-only subreddit listing/search ingestion
- Candidate mapping from discovered conversations into possible engagement points
- DARM deliberation with multi-agent reasoning, scores, final decision, and policy result
- Autonomy controls for thresholds, mention levels, links, disclosure, cadence, and community risk
- Guardrails for promotion risk, community norms, product mention levels, links, and account safety
- Review Inbox for approval-gated exceptions and high-risk/high-value opportunities
- Review Studio for draft editing, approval, rejection, and market-memory capture
- Audit Log for autonomous and semi-autonomous action traceability
- Market Memory, analytics, project management, knowledge base, and community rules
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

The Reddit provider is read-only. It fetches subreddit posts through the official API, then routes returned items into candidate mapping, DARM deliberation, policy checks, drafts, review exceptions, and audit logs. Do not use Reddit content for model training, and review Reddit's Developer Terms/Data API Terms before any commercial deployment or write/posting integration.

Generate the Prisma client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run db:migrate
```

Seed local data:

```bash
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
- `npm run db:migrate` - run Prisma migrations
- `npm run db:seed` - seed the database

## Project Structure

```text
src/app/          Next.js app routes
src/components/   Shared UI components
src/lib/          Domain services, data helpers, Prisma client, and types
src/screens/      Screen-level React components
prisma/           Prisma schema and seed data
DESIGN.md         Visual design system notes
```

## Routes

- `/` - command dashboard
- `/projects` - project workspaces
- `/projects/[projectId]` - Project Brain overview
- `/projects/[projectId]/product-knowledge` - project product knowledge
- `/projects/[projectId]/market-knowledge` - project market knowledge
- `/projects/[projectId]/community-rules` - project community rules
- `/signal-discovery` - autonomous pipeline
- `/opportunities` - review inbox
- `/response-studio` - review studio
- `/autonomy-policies` - autonomy controls
- `/action-log` - audit log
- `/market-insights` - market memory
- `/analytics` - analytics
- `/settings` - settings and admin/debug fallbacks

## Admin and Debug Fallbacks

These routes are intentionally demoted from the primary navigation. They should be used for recovery, inspection, provider testing, or debugging older records.

- `/signal-monitor` - one-off manual intake fallback
- `/candidates` - candidate map debug
- `/deliberation` - deliberation debug
- `/autonomy-queue` - legacy approval queue
- `/guardrails` - guardrail results

## Change Log

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
