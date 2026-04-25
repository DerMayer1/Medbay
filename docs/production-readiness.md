# Production Readiness

Medbay is designed as a portfolio-grade product engineering case study with a clear path to production hardening.

## Current Demo Architecture

Demo mode is enabled with `NEXT_PUBLIC_DEMO_MODE=true`.

In demo mode:

- AI responses can be simulated when no OpenAI key exists.
- email notifications are logged instead of sent.
- calendar behavior is mocked when Google credentials are absent.
- Supabase-backed tables can be replaced by in-memory demo records.
- recruiter exploration does not require credentials.

## Production-Ready Pieces

- TypeScript strict mode.
- Thin App Router API handlers.
- Zod request validation.
- Deterministic intake workflow engine.
- Deterministic policy engine for AI safety boundaries.
- Supabase-compatible persistence model.
- Audit event model.
- Admin review console.
- Backend-only access to OpenAI, Resend, Supabase service role, and Google Calendar credentials.

## Intentionally Mocked

- demo storage
- email delivery without Resend keys
- calendar creation without Google credentials
- response time and demo dashboard metrics
- minimal audit trail visualization

## Redis / Upstash / Vercel KV Needs

The current rate limiter is process-local. Production should move rate limits and abuse counters to Redis, Upstash, or Vercel KV so limits work across regions and serverless instances.

Recommended keys:

- per-IP chat rate limit
- per-visitor chat rate limit
- admin mutation rate limit
- failed auth attempts

## Queues and Background Jobs

Synchronous notifications are acceptable for the demo, but production should use queues for:

- email notification retries
- calendar sync retries
- summary generation
- long-running audit export
- webhook delivery

Candidates include Vercel Queues, Inngest, Trigger.dev, or a Postgres-backed job table.

## RBAC

Current admin access is intentionally simple. Production should add stronger roles:

- owner
- operations_admin
- scheduler
- clinician_reviewer
- read_only

Each role should have scoped permissions for case status changes, knowledge editing, appointment confirmation, and audit export.

## PHI and Privacy

Production clinical deployments must treat intake data as sensitive health information.

Needed hardening:

- explicit privacy policy and retention policy
- data deletion workflow
- least-privilege service role usage
- row-level security coverage for every table
- audit logs for staff access
- encryption posture review
- data processing agreements with vendors
- careful model/provider configuration for PHI handling

## Observability Gaps

The demo logs important events but does not include full production observability.

Production should add:

- structured logs
- error reporting
- trace IDs across request, AI, notification, and calendar calls
- dashboard for policy decisions and handoffs
- alerting for OpenAI, Supabase, Resend, and Google failures
- audit export tooling

## Deployment Notes

For Vercel:

- set all environment variables per environment
- keep demo mode enabled for public portfolio deployments
- disable demo mode for real clinics
- configure Supabase migrations before production traffic
- use a durable external rate limiter before public launch
