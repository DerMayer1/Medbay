# AI Safety Layer

Medbay treats AI as an administrative operations assistant, not a clinician.

## Disallowed Responses

The assistant must not provide:

- diagnosis
- prescriptions
- treatment plans
- clinical advice
- diet prescriptions
- supplement advice
- lab, imaging, or exam interpretation
- outcome guarantees

## Allowed Responses

The assistant may:

- collect intake information
- answer administrative questions from the knowledge base
- support scheduling workflow
- summarize conversation context
- route to human staff

## Implementation

Safety is enforced in two places:

1. System prompt constraints for model behavior.
2. Deterministic guardrails in `src/lib/guardrails.ts` that classify unsafe content and override output with a handoff response.

## Default Unsafe Reply

The user is told that Medbay cannot provide clinical guidance and can route the request to clinic staff.
