# Production Readiness

Medbay now runs in a production-provider posture. It does not include demo mode, in-memory persistence, simulated email, simulated calendar behavior, or AI response fallbacks for missing credentials.

## Required Providers

The application expects these services to be configured:

- Supabase/PostgreSQL for persistence, auth, audit logs, conversations, messages, intake cases, appointments, and knowledge base records.
- OpenAI API for assistant response generation.
- Resend for operational notification delivery.
- Google Calendar API for availability and appointment event creation.

Missing provider credentials fail explicitly instead of silently switching to local behavior.

## Production-Ready Pieces

- TypeScript strict mode.
- Thin App Router API handlers.
- Zod request validation.
- Deterministic intake workflow engine.
- Deterministic policy engine for AI safety boundaries.
- Supabase-backed persistence model.
- Audit event model.
- Admin review console.
- Backend-only access to OpenAI, Resend, Supabase service role, and Google Calendar credentials.

## Current Simplifications

- Rate limits are process-local and should be moved to a distributed store.
- Notifications are sent synchronously in the request path.
- Appointment requests have status controls, but no full staff approval queue yet.
- Audit trail rendering is intentionally compact.

## Redis / Upstash / Vercel KV Needs

The current rate limiter is process-local. Production should move rate limits and abuse counters to Redis, Upstash, or Vercel KV so limits work across regions and serverless instances.

Recommended keys:

- per-IP chat rate limit
- per-visitor chat rate limit
- admin mutation rate limit
- failed auth attempts

## Queues and Background Jobs

Synchronous notifications are acceptable for early production, but production scale should use queues for:

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
- configure Supabase migrations before production traffic
- configure admin users in Supabase Auth and `profiles`
- use a durable external rate limiter before public launch
