# AI Safety Layer

Medbay treats AI as an administrative operations assistant, not a clinician.

## Disallowed AI Behavior

The assistant must not provide:

- diagnosis
- prescriptions
- medication guidance
- treatment plans
- clinical advice
- diet prescriptions
- supplement advice
- lab, imaging, or exam interpretation
- outcome guarantees

## Policy Engine

Deterministic policy evaluation lives in `src/features/intake/domain/policy-engine.ts`.

The policy engine detects:

- clinical advice requests
- diagnosis requests
- medication requests
- exam or lab interpretation requests
- emergency red flags
- patient requests for staff
- scheduling attempts without contact information
- low-confidence extraction

It returns:

- `decision`: `allow`, `block`, `escalate`, or `ask_clarifying_question`
- `severity`: `info`, `warning`, or `critical`
- `reason`
- `handoffRequired`
- `safeResponseHint`
- `flags`

## Input and Output Safety

The use case evaluates the user message before AI generation. It also validates assistant output before persistence. Unsafe output is replaced with the deterministic safe response hint and the case is routed for human review when needed.

## Human Handoff

Unsafe or ambiguous cases are moved to `needs_human_review` and audit events are written for policy evaluation and handoff.
