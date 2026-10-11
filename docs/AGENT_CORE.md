# Mirror Agent Core

## Implemented endpoints

- `GET /memory/search?userId=...&q=...` — scoped retrieval across entries, decisions, commitments and evidence.
- `GET /memory/context?userId=...` — active goals, overdue commitments, recent decisions and active/proposed patterns.
- `POST /evidence` — create evidence, optionally tied to an immutable raw entry.
- `POST /evidence/link` — explicitly mark evidence as SUPPORTS or COUNTERS for a pattern.
- `POST /decisions`, `GET /decisions`.
- `POST /commitments`, `GET /commitments`, `POST /commitments/:id/complete`.
- `GET /why/pattern/:id?userId=...` — deterministic WHY trace: claim, supporting evidence, counter-evidence, confidence basis and uncertainty.
- `POST /agent/chat` — retrieves memory/context and invokes the configured provider.

## Agent tools

The internal registry currently exposes `search_memory`, `get_current_context`, `create_decision`, `create_commitment`, and `complete_commitment`.

The mock provider does not autonomously execute write tools. Real provider adapters must return validated structured tool calls. The runtime must execute only allowlisted tools, scope every call to the authenticated user, append the result to the reasoning loop, cap iterations, and audit tool execution.

## Security gate before public deployment

Current API accepts `userId` for development. **Do not expose this API publicly yet.** Authentication must replace caller-supplied identity so one user cannot request another user's memory.

## Provider acceptance gate

Before connecting OpenRouter/Gemini/Groq:
1. strict JSON/tool-call validation;
2. max reasoning iterations;
3. read vs write tool permissions;
4. approval state for consequential/external tools;
5. tool-call audit events;
6. prompt-injection boundary: retrieved memory is data, never executable instruction;
7. graceful provider timeout/rate-limit handling.

## Test scenarios

1. Entry -> evidence -> pattern -> WHY shows exact support.
2. Counter-evidence changes WHY from support to contested where applicable.
3. User A cannot retrieve or mutate User B records after auth lands.
4. Completing an already completed commitment fails safely.
5. Agent response never claims a tool executed when trace has no tool result.
6. No provider configured: deterministic memory endpoints remain usable.
