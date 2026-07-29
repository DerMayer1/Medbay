# Medbay Architecture

Medbay is organized around a feature-oriented intake domain plus a source-bounded visit-preparation domain.

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

```text
src/features/briefs
  domain
    pre-consultation-brief.ts
```

The brief domain is deterministic. It validates a strict 2.0.1 schema and verifies that every citation quote occurs on the exact extracted PDF page before approval can succeed.

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

## Brief Review Flow

```text
born-digital PDF (max 6 MB)
  -> extractor port returns page text
  -> document and page SHA-256 hashes
  -> strict, versioned pre-consultation brief
  -> deterministic provenance validation
  -> identified clinician review with expected content hash
  -> atomic approve / reject + decision + audit event
  -> immutable exportable version
```

The current demo begins after extraction with fictional embedded pages. The PDF validator/extractor port exists, but a concrete PDF library, upload UI, storage orchestration, and AI draft provider are not connected in 2.0.1. OCR and EHR/FHIR ingestion are explicitly out of scope.

Audit events record the review decision, reviewer boundary, timestamp, brief version, and provenance-check result. They do not duplicate the brief facts or source content into the audit metadata.

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

Production integrations use Supabase, OpenAI, Resend, and Google Calendar behind the same use-case boundary. Missing provider configuration fails explicitly instead of switching to local behavior.

## Persistence

Migration 005 adds clinics, source documents, source pages, immutable brief versions, and immutable review decisions. The review RPC uses the authenticated clinician session and commits the final status, decision, and audit event in one transaction. The migration is checked in but was not applied during this implementation run.

## Security

Admin routes use Supabase Auth when configured. Final brief review requires a `clinician` profile; generic admins cannot approve it. Mutating routes enforce same-origin checks. The source bucket is private and clinic-scoped through RLS. API responses containing operational data use `Cache-Control: no-store`.
