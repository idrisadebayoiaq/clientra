# Clientra — Implementation Plan

Work incrementally. Do not fake live discovery APIs.

## Phase order

| Phase | Focus | Status |
| --- | --- | --- |
| 1 | Existing project audit | Done |
| 2 | Application shell + navigation | Done |
| 3 | Supabase database + RLS | Done |
| 4 | Authentication and onboarding | Done |
| 5 | Dashboard | Done |
| 6 | Opportunity / lead data model + UI | Done |
| 7 | AI service using OpenRouter | Done |
| 8 | Website analysis UI | Done |
| 9 | Gmail OAuth | Done |
| 10 | Gmail send/read service | Done |
| 11 | Gmail Pub/Sub webhook | Done |
| 12 | AI reply detection | Done |
| 13 | CRM | Done |
| 14 | Outreach + follow-ups | Done |
| 15 | Discovery source adapters | Done |
| 16 | Future API integrations | Social networks remain copy-only |

## Rules

1. Reuse the design system on every page.
2. Server secrets stay on the server. Never put them in `NEXT_PUBLIC_*`.
3. Unconfigured APIs show **Not configured** / **Coming soon**. Empty connected sources show **No records imported yet**.
4. Demo records must be marked `DEMO` and never mixed with live provider data.
5. All Supabase schema changes go through MCP `apply_migration`.
6. After each phase, document files, env vars, migrations, and how to test.

## Live discovery sources

- urlscan → Website Opportunities
- Hacker News Algolia (public official API) → Problem Opportunities
- Apollo organizations search → companies in Discover
- Adzuna jobs API → Job Opportunities
- First signed-in workspace visit auto-imports when the feed is empty

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

Required env names are listed in `doc/env-variables.md` and `.env.example`.
