# Mirror hosted intelligence

Primary: Groq (default model `openai/gpt-oss-120b`). Fallback: OpenRouter (`openrouter/free`). The provider layer uses compatible chat-completions and local, explicitly allowlisted function calls.

Environment variables (backend only):
- `GROQ_API_KEY`
- `GROQ_MODEL` (optional)
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (optional)

If both keys are missing, the existing mock provider is used. Never commit credentials or expose them to Next.js browser bundles.

The agent exposes **read-only** functions to models initially. Mutating tools exist in the internal registry but are **not** exposed to hosted inference until authenticated approvals are implemented. No tool may execute solely because a model suggested it.

The runtime caps iterations at four, limits tool output, validates tool names and arguments, records tool traces, and stops on provider failures. Retrieved records are data, not system instructions.

**DO NOT DEPLOY PUBLICLY YET:** existing endpoints accept arbitrary `userId` and lack authentication; this is a critical cross-user privacy vulnerability. Introduce session authentication and derive identity server-side before exposing any API to the internet.

Current implementation requires runtime integration tests with actual provider keys before claiming end-to-end operation. Free-tier limits and model capabilities change; validate after account setup.
