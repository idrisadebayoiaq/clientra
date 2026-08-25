# Clientra — Implementation Plan

Work incrementally. Do not fake live discovery APIs.

## Phase order

| Phase | Focus | Status |
| --- | --- | --- |
| 1 | Existing project audit | Done |
| 2 | Application shell + navigation | In progress |
| 3 | Supabase database + RLS | Pending |
| 4 | Authentication and onboarding | Pending |
| 5 | Dashboard | Pending |
| 6 | Opportunity / lead data model + UI | Pending |
| 7 | AI service using OpenRouter | Pending |
| 8 | Website analysis UI | Pending |
| 9 | Gmail OAuth | Pending |
| 10 | Gmail send/read service | Pending |
| 11 | Gmail Pub/Sub webhook | Pending |
| 12 | AI reply detection | Pending |
| 13 | CRM | Pending |
| 14 | Outreach + follow-ups | Pending |
| 15 | Discovery source adapters | Pending |
| 16 | Future API integrations | Pending |

## Rules

1. Reuse the design system on every page.
2. Server secrets stay on the server. Never put them in `NEXT_PUBLIC_*`.
3. Unconfigured APIs show **Not configured** / **Coming soon**.
4. Demo records must be marked `DEMO` and never mixed with live provider data.
5. All Supabase schema changes go through MCP `apply_migration`.
6. After each phase, document files, env vars, migrations, and how to test.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

Required env names are listed in `doc/env-variables.md` and `.env.example`.
