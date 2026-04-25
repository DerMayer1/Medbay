# Medbay Architecture

Medbay is organized around a feature-oriented intake domain.

## Runtime

The application uses Next.js App Router for UI and route handlers. React components render the public intake assistant and the admin operations console.

## Feature Boundary

```text
src/features/intake
  domain
    intake-workflow.ts
    intake-completeness.ts
    policy-engine.ts
    appointment-workflow.ts
    types.ts
  application
    handle-patient-message.ts
    ports.ts
  infrastructure
    adapters.ts
    legacy-mappers.ts
```

## Request Flow

```text
Patient message
  -> POST /api/chat
  -> handlePatientMessage
  -> load/create conversation
  -> load/create intake case
  -> persist user message
  -> policy engine
  -> intake extraction
  -> completeness scoring
  -> workflow decision
  -> AI provider
  -> output safety validation
  -> persist assistant message
  -> audit events
  -> notification provider
  -> UI response
```

## Adapter Boundary

The use case depends on interfaces:

- `CaseRepository`
- `PatientRepository`
- `ConversationRepository`
- `KnowledgeBaseRepository`
- `AuditLogger`
- `AIProvider`
- `NotificationProvider`
- `CalendarProvider`

Demo mode is selected through adapter construction. Production integrations use Supabase, OpenAI, Resend, and Google Calendar behind the same use-case boundary.

## Persistence

Supabase stores profiles, conversations, messages, leads, knowledge items, appointments, and audit logs. The `leads` table remains for backwards compatibility, while application code maps it to `IntakeCase`.

## Security

Admin routes use Supabase Auth when configured. Mutating routes enforce same-origin checks. API responses containing operational data are returned with `Cache-Control: no-store`.
