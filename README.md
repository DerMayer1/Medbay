# Medbay

[![CI](https://github.com/DerMayer1/Medbay/actions/workflows/ci.yml/badge.svg)](https://github.com/DerMayer1/Medbay/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)](https://www.typescriptlang.org/)

Medbay is an AI-assisted intake platform for clinics. It turns unstructured patient conversations into structured, auditable intake cases with deterministic safety policies, staff handoff workflows, appointment requests, knowledge-base context, and an operations console.

The reference clinic is fictional: **Northstar Clinic**.

Live demo: [medbay-helix.vercel.app](https://medbay-helix.vercel.app/)

## Product Preview

### Patient Intake Assistant

![Patient intake assistant](docs/screenshots/intake-chat.png)

### Staff Operations Console

![Staff operations console](docs/screenshots/admin-console.png)

### Intake Case Review

![Intake case review](docs/screenshots/case-review.png)

## Why It Exists

Clinics receive high-volume inbound requests across forms, chat, phone, and messaging channels. The operational problem is not just answering quickly. Staff need structured cases that can be reviewed safely, prioritized, routed, scheduled, audited, and closed.

Medbay is built around one boundary:

- AI assists with administrative intake, scheduling support, knowledge-base answers, and handoff.
- Deterministic policies decide when to block, escalate, or ask for clarification.
- Staff review happens in an operations console centered on intake cases.

Medbay does **not** diagnose, prescribe, interpret clinical results, or replace professional care.

## Core Capabilities

- Public intake assistant with conversational data collection.
- Deterministic safety policy engine for clinical-risk boundaries.
- Structured intake extraction and completeness scoring.
- Intake case workflow with validated status transitions.
- Human handoff for unsafe, urgent, or staff-requested cases.
- Admin console for case queue, conversations, appointments, and knowledge base.
- Supabase-backed persistence with audit logs.
- OpenAI, Resend, and Google Calendar provider integrations.
- Degraded chat fallback when infrastructure providers are unavailable.

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

Business logic lives under `src/features/intake`. Route handlers stay thin, adapters isolate persistence and provider integrations, and the domain layer owns deterministic workflow and policy decisions.

Key files:

- `src/app/api/chat/route.ts` - public chat API route.
- `src/features/intake/application/handle-patient-message.ts` - main intake use case.
- `src/features/intake/domain/policy-engine.ts` - deterministic safety decisions.
- `src/features/intake/domain/intake-workflow.ts` - case status transitions.
- `src/features/intake/domain/intake-completeness.ts` - required field scoring.
- `src/features/intake/infrastructure/adapters.ts` - Supabase/OpenAI/Resend/Calendar adapters.
- `supabase/migrations` - database schema and RLS policies.

## Domain Model

The product is modeled around intake operations rather than a generic lead funnel.

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

The Supabase schema keeps the original `leads` table for backwards compatibility, but application code and UI expose the product domain as **Intake Cases**.

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

Workflow transitions are deterministic in `src/features/intake/domain/intake-workflow.ts`. The admin case review console only presents valid next transitions, and the API rejects invalid transitions.

## AI Safety

The policy engine evaluates:

- clinical advice requests
- diagnosis requests
- medication requests
- exam or lab interpretation requests
- emergency red flags
- requests for human staff
- scheduling attempts without contact information
- low-confidence extraction

Policy decisions return `allow`, `block`, `escalate`, or `ask_clarifying_question`, plus severity, reason, handoff state, and safe response guidance. Assistant output is validated before it is persisted.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase / PostgreSQL
- OpenAI API
- Resend
- Google Calendar API
- Zod
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
NODE_ENV=development

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

RESEND_API_KEY=re_...
TEAM_EMAIL=ops@yourclinic.com
FROM_EMAIL=Medbay <noreply@yourdomain.com>

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_CALENDAR_ID=primary
CLINIC_TIMEZONE=America/New_York
DEFAULT_APPOINTMENT_DURATION_MINUTES=45

ADMIN_EMAIL=
# Credential-less demo admin. Only "true" enables it; unset/false fails closed.
# Never enable in a deployment where the admin console can reach real data.
MEDBAY_PORTFOLIO_ADMIN=false
```

Provider configuration is explicit. Missing Supabase, OpenAI, Resend, or Google Calendar credentials fail fast inside provider modules. The public chat route may return a marked degraded response when infrastructure is unavailable so patients are not shown a raw failure.

## Scripts

```bash
npm run dev        # Start local development server
npm run build      # Create production build
npm run start      # Start production server
npm run typecheck  # Run TypeScript checks
npm run lint       # Run ESLint
npm test           # Run Vitest suite
```

## Production Notes

Production-ready pieces:

- typed domain modules
- deterministic workflow validation
- deterministic safety policy engine
- thin route handler for chat
- Zod request validation
- Supabase-compatible persistence
- audit event model
- rate limiting and same-origin mutation checks
- Supabase Auth and admin role checks for protected routes

Current simplifications:

- rate limits are process-local
- notifications are synchronous
- single-tenant reference implementation
- appointment requests do not require staff approval UI beyond status controls
- audit log rendering is intentionally minimal

For a production clinic deployment checklist, see `docs/production-readiness.md`.

## Documentation

- `docs/product-spec.md` - product goals and acceptance criteria.
- `docs/architecture.md` - runtime and feature boundaries.
- `docs/domain-model.md` - product entities and workflow concepts.
- `docs/workflow.md` - intake state machine behavior.
- `docs/ai-safety.md` - AI safety and policy constraints.
- `docs/security-hardening.md` - security controls and Vercel firewall recommendations.
- `ARCHITECTURE.md` - high-level request flow.

## Architecture Decisions

**Why deterministic policy over pure LLM judgment**  
Clinical intake cannot rely on probabilistic AI output for safety decisions. The policy engine runs before and after the AI layer, making escalation and blocking decisions deterministic regardless of model behavior.

**Why use-case orchestration over route handlers**  
Business logic lives in `handlePatientMessage`, not in the Next.js route. This keeps the AI provider, repository, notification, and calendar adapters swappable without touching the domain.

**Why Supabase over a custom auth stack**  
Clinic staff authentication is not the product. Supabase handles it so the domain layer can focus on intake workflow and safety policy.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
