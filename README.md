# Medbay

Medbay is a production-oriented full-stack AI clinic operations platform demo. It presents a fictional clinic, **Northstar Clinic**, to showcase patient intake, lead qualification, scheduling workflows, human handoff, knowledge-base management, and admin operations.

## Live Demo

Deploy on Vercel and enable `NEXT_PUBLIC_DEMO_MODE=true` so recruiters can explore the platform without real API keys.

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

## Core Features

- Public SaaS landing page for an AI clinic operations platform.
- Patient intake assistant with structured fields:
  - name
  - contact
  - reason for visit
  - preferred service or specialty
  - urgency level
  - availability
  - insurance/payment type
  - human handoff requirement
- Admin dashboard for overview, leads, conversations, appointments, knowledge base, and safety settings.
- Lead status management: `new`, `qualified`, `waiting_human`, `scheduled`, `lost`, `resolved`.
- Knowledge-base CRUD for services, pricing, schedule, policies, FAQ, and safety.
- Notification provider with Resend in production and mocked notifications in demo mode.
- Calendar provider with Google Calendar in production and mocked slots/events in demo mode.

## Architecture

```text
Public intake UI
  -> /api/chat
  -> deterministic safety checks
  -> OpenAI or demo fallback
  -> Supabase or in-memory demo store
  -> notification/calendar provider
  -> admin dashboard
```

Backend-only integrations keep API keys out of the browser. Route handlers validate payloads with Zod and enforce rate limits, same-origin mutation checks, admin auth, and no-store responses for sensitive data.

## AI Safety Layer

The assistant is administrative only. It must not provide:

- diagnosis
- prescriptions
- treatment plans
- clinical advice
- diet prescriptions
- supplement advice
- exam or lab interpretation

Unsafe requests are deterministically routed to human handoff before or after model output.

## Data Model

Main tables:

- `leads`
- `conversations`
- `messages`
- `knowledge_items`
- `appointments`
- `audit_logs`
- `profiles`

See `supabase/migrations` for schema and RLS policies.

## Screenshots

Add screenshots after deployment:

- Public intake demo
- Admin overview
- Lead detail and conversation history
- Knowledge-base editor

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
npm run build
```

## Roadmap

- Multi-clinic workspaces
- Role-based admin permissions
- Durable distributed rate limiting
- Calendar writeback approvals
- Analytics for conversion and handoff rates
- EHR/CRM export adapters

## Engineering Notes

- Demo mode intentionally works without external credentials.
- OpenAI, Resend, Supabase, and Google Calendar are lazy-initialized.
- The public assistant uses structured outputs when OpenAI is configured and deterministic fallback otherwise.
- RLS policies protect admin data in Supabase.
