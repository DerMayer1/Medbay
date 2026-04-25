# Security hardening

Medbay includes application-level controls, but production DDoS and bot mitigation should also be enabled at the Vercel edge.

## Implemented in code

- Security headers in `next.config.ts`.
- Same-origin checks on mutating API routes.
- In-memory rate limiting for public and sensitive routes.
- Supabase Auth and admin role requirement for admin API routes.
- Supabase RLS migrations.
- Audit log writes for chat, handoff, knowledge, lead, and appointment mutations.
- Public route responses use `Cache-Control: no-store` where data may be sensitive.

## Vercel Firewall recommendations

Enable these in the Vercel dashboard for production:

- Bot Protection: challenge.
- AI bot blocking: deny, unless indexing is desired.
- Rate limit `/api/chat`: 20 requests per minute per IP.
- Rate limit `/api/handoff`: 5 requests per minute per IP.
- Rate limit `/api/appointments`: 10 requests per minute per IP.
- Challenge suspicious non-browser user agents.
- Deny scanner paths such as `/wp-admin`, `/wp-login`, `/xmlrpc.php`.

Vercel provides automatic Layer 3/4 and Layer 7 DDoS mitigation. The `vercel.json` file adds basic challenge/deny rules, but dashboard Firewall rate limits are still recommended because declarative `vercel.json` does not support rate limit rules.
