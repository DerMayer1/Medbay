# Domain Model

Medbay models clinic intake as an operations workflow, not a generic lead funnel.

## Patient

Represents the person or requester associated with an intake case.

Key fields:

- name
- contact
- email
- phone

## IntakeCase

The central operational object. An Intake Case contains structured intake fields, workflow status, safety state, summary, handoff state, and audit history.

Statuses:

- `opened`
- `collecting_information`
- `needs_human_review`
- `ready_for_scheduling`
- `appointment_requested`
- `scheduled`
- `closed`
- `discarded`

## Conversation and Message

Conversation is the communication container. Message is the immutable user or assistant entry attached to a conversation.

## TriageAssessment

Captures deterministic triage metadata:

- urgency level
- risk flags
- confidence
- whether human review is required

## HandoffRequest

Represents an escalation to staff. It includes reason, severity, case ID, and resolution state.

## AppointmentRequest and Appointment

Appointment requests are not automatically confirmed by AI. They move through operational states:

- `requested`
- `under_review`
- `slot_offered`
- `confirmed`
- `cancelled`
- `completed`

## KnowledgeBaseItem

Administrative context used by the assistant. Categories include services, pricing, schedule, policies, FAQ, and safety.

## AuditEvent

Important workflow events are recorded:

- `case_created`
- `message_received`
- `policy_evaluated`
- `intake_extracted`
- `status_changed`
- `handoff_requested`
- `appointment_requested`
- `notification_sent`
