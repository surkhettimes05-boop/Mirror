# MIRROR — Personal Evidence-Based Agent

Mirror is a private personal agent that connects intentions, decisions, commitments, predictions and outcomes. It must distinguish observed evidence from interpretation and never fabricate personal history.

## Architecture
- Next.js mobile-first PWA
- NestJS API and agent tool runtime
- PostgreSQL + Prisma; pgvector optional for semantic search
- Hosted model adapters (OpenRouter, Gemini, Groq) with no credentials committed
- PostgreSQL-backed durable jobs and audit events

## Principles
1. Keep original user entries immutable; corrections are linked records.
2. Claims about the user require cited evidence IDs and counter-evidence.
3. Treat inferred patterns as hypotheses, never diagnoses.
4. Require approval for external actions and destructive operations.
5. Do not claim actions happened until the tool confirms success.
6. Protect sensitive data: authenticated access, scoped queries, secrets only in environment variables.
7. Work without an LLM for capture, search, commitments and reviews; clearly label AI unavailable.
8. Never silently invent outcomes or completion of commitments.

## Planned modules
Auth, Entries, Conversations, Goals, Decisions, Predictions, Commitments, Evidence, Patterns, Reviews, Agent, Tools, Jobs, Audit.

## Build sequence
1. Schema and migrations; identity and authorization.
2. CRUD, append-only raw entries, evidence links and audit.
3. Agent runtime with strict tool schemas, approvals and provider interface.
4. Reviews, durable scheduling and pattern evaluation.
5. Next.js PWA and end-to-end tests.
6. Configure an eligible no-card inference provider, then deploy.

**Status:** architecture initialized; not yet a running application.
