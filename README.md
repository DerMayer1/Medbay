# Medbay

Medbay is an AI-assisted intake infrastructure case study for clinics. It turns unstructured patient conversations into structured, auditable intake cases with deterministic safety policies, handoff workflows, appointment requests, knowledge-base context, and admin review.

The demo clinic is fictional: **Northstar Clinic**.

## Problem

Clinics receive high-volume inbound requests across forms, chat, phone, and messaging channels. The operational problem is not only answering patients quickly. It is converting unstructured requests into structured cases that staff can review safely, prioritize, route, schedule, audit, and close.

## Product Thesis

AI should assist clinic operations by collecting administrative intake data and preparing cases for staff. It should not diagnose, prescribe, interpret clinical results, or replace professional care.

Medbay is built around this boundary:

- The AI assistant supports intake, scheduling, knowledge-base answers, and handoff.
- Deterministic policies decide when to block, escalate, or ask for clarification.
- Staff review happens in an operations console centered on Intake Cases.

## Architecture

```text
Public intake assistant
  -> /api/chat thin route
  -> handlePatientMessage use case
  -> policy engine
  -> intake extraction
  -> intake workflow state machine
  -> AI provider
  -> repository adapters
  -> notifications / calendar providers
  -> audit events
  -> admin case review console
```

The business logic lives under `src/features/intake`. Route handlers stay thin, adapters isolate persistence and providers, and the domain layer owns deterministic workflow and policy decisions.

## Domain Model

Core concepts:

- `Patient`
- `IntakeCase`
- `IntakeCaseStatus`
- `Conversation`
- `Message`
- `TriageAssessment`
- `HandoffRequest`
- `AppointmentRequest`
- `Appointment`
- `KnowledgeBaseItem`
- `AuditEvent`

The Supabase schema keeps the original `leads` table for backwards compatibility, but application code and UI now expose the product domain as Intake Cases.

## Intake Workflow

Supported intake case statuses:

- `opened`
- `collecting_information`
- `needs_human_review`
- `ready_for_scheduling`
- `appointment_requested`
- `scheduled`
- `closed`
- `discarded`

Workflow transitions are deterministic in `src/features/intake/domain/intake-workflow.ts`. The admin case review console only presents valid next transitions.

## AI Safety and Policy Engine

The policy engine in `src/features/intake/domain/policy-engine.ts` evaluates:

- clinical advice requests
- diagnosis requests
- medication requests
- exam or lab interpretation requests
- emergency red flags
- requests for human staff
- scheduling attempts without contact information
- low-confidence extraction

Policy decisions return `allow`, `block`, `escalate`, or `ask_clarifying_question`, plus severity, reason, handoff state, and safe response guidance. Assistant output is also validated before it is persisted.

## Demo Mode

Set `NEXT_PUBLIC_DEMO_MODE=true` to run without external credentials.

Demo mode uses adapter-level fallbacks for:

- fake intake cases
- in-memory conversations
- simulated AI response
- mocked email notification
- mocked calendar behavior
- in-memory audit records

## Production Tradeoffs

Production-ready pieces:

- typed domain modules
- deterministic workflow validation
- deterministic safety policy engine
- thin route handler for chat
- Zod request validation
- Supabase-compatible persistence
- audit event model
- rate limiting and same-origin mutation checks

Intentionally mocked or simplified:

- demo storage is in-memory
- rate limits are process-local
- notifications are synchronous
- appointment requests do not require staff approval UI beyond status controls
- audit log rendering is minimal

For a production clinic deployment, see `docs/production-readiness.md`.

## Engineering Highlights

- Domain-first intake modeling instead of generic chatbot state.
- Use-case orchestration in `handlePatientMessage`.
- Explicit interfaces for repositories, AI, notifications, calendar, and audit.
- Workflow and policy modules covered with Vitest tests.
- Backwards-compatible migration path from `leads` to Intake Cases.
- Demo mode works without exposing API keys or requiring recruiter credentials.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase / PostgreSQL
- OpenAI API
- Zod
- Resend
- Google Calendar API
- Vitest
- Vercel

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

RESEND_API_KEY=
TEAM_EMAIL=
FROM_EMAIL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=
CLINIC_TIMEZONE=America/New_York
DEFAULT_APPOINTMENT_DURATION_MINUTES=45
```

## Running Tests

```bash
npm run test
npm run lint
npm run build
```

## Screenshots

Add screenshots after deployment:

- Public intake assistant
- Admin overview
- Intake Case Review console
- Knowledge-base editor

## Roadmap

- Multi-clinic workspaces
- Stronger RBAC for operations roles
- Durable queue-backed notifications
- Redis/Upstash-backed rate limiting
- Calendar slot approval workflow
- EHR/CRM export adapters
- Observability dashboards for safety and handoff rates
