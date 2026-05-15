# Workflow

## Intake Case State Machine

Workflow rules live in `src/features/intake/domain/intake-workflow.ts`.

```text
opened
  -> collecting_information
  -> ready_for_scheduling
  -> appointment_requested
  -> scheduled
  -> closed
```

Any active case may move to `needs_human_review` when policy requires escalation. Cases may be `discarded` when staff decides they are invalid or out of scope.

## Deterministic Status Decisions

The use case evaluates:

1. policy decision
2. intake completeness
3. scheduling intent
4. current status

Critical policy outcomes always win and route to `needs_human_review`.

## Completeness

The completeness module checks:

- patient name
- contact
- reason for visit
- requested service
- urgency level
- payment type
- availability

A case is ready for scheduling only when all required fields are present.

## Admin Transitions

The admin console only shows valid next transitions from the current status. Invalid transitions are also rejected by the API.
