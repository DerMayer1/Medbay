# Architecture

## Request Flow

```text
POST /api/chat
  -> Zod validation
  -> rate limit check
  -> handlePatientMessage (use case)
    -> policy engine (pre-AI)
    -> AI provider (OpenAI)
    -> output validation
    -> policy engine (post-AI)
    -> intake extraction
    -> workflow transition
    -> repository (persist message + case state)
    -> audit event emission
    -> notification dispatch (if handoff)
    -> calendar request (if scheduling)
  -> stream response to client
```

## Safety Boundary

The policy engine evaluates every inbound message and every AI output.
It returns one of: allow | block | escalate | ask_clarifying_question.
The AI provider is never called when the policy returns block or escalate.
AI output is validated before persistence regardless of policy result.

## Tenant Model

Currently single-tenant (Northstar Clinic reference implementation).
The repository layer is structured to support tenant scoping as a
follow-on. See docs/production-readiness.md for migration path.
