# Medbay Architecture

## Runtime

Medbay uses Next.js App Router route handlers for backend APIs and React components for public and admin surfaces.

## Request Flow

```text
Patient message
  -> POST /api/chat
  -> Zod validation
  -> rate limit and origin checks
  -> conversation/message persistence
  -> knowledge-base context loading
  -> OpenAI structured response or demo fallback
  -> deterministic guardrails
  -> lead update
  -> notification/calendar hooks
  -> response to UI
```

## Persistence

Supabase stores profiles, conversations, messages, leads, knowledge items, appointments, and audit logs. Demo mode uses in-memory data and seed records so the app can run without credentials.

## Providers

- OpenAI: structured administrative assistant output.
- Resend: notification emails.
- Google Calendar: availability and event creation.
- Mock providers: enabled when env vars are missing or demo mode is enabled.

## Admin Security

Admin routes require Supabase Auth and a `profiles.role = admin` record when Supabase is configured. API responses are no-store and protected by same-origin checks for mutations.
