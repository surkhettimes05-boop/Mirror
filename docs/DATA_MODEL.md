# Data model contract (design)

Core records: User, Entry, Conversation, Message, Goal, Decision, Prediction, Commitment, Outcome, Learning, Evidence, Pattern, PatternEvidence, Review, AgentRun, ToolInvocation, Approval, ScheduledJob, AuditEvent.

Every user-owned record has userId and createdAt. Every derived record has provenance (source entry IDs, extractor version and model identifier if AI-generated). Raw entries are append-only; redaction is a separate explicitly approved privacy operation. Predictions preserve the original probability and review date. Commitments have lifecycle transitions, not fabricated completion. Patterns have supporting and counter evidence and status PROPOSED/ACTIVE/REJECTED/SUPERSEDED. Agent actions are idempotent where possible, audited, and authorization-scoped.

Provider keys are never persisted in these tables. Do not store chain-of-thought. Sensitive entries should not be sent to third-party models without user-facing disclosure and consent.
