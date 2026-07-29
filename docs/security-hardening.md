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
- Clinician-only authorization for final clinical-artifact decisions, enforced in the
  application and again by the database RPC and RLS policies.
- Immutability triggers on source documents, source pages, brief versions and review decisions.
- The credential-less portfolio admin is refused outright whenever a service-role credential
  is present in the environment. See below.

## Portfolio/demo admin

`MEDBAY_PORTFOLIO_ADMIN=true` enables a credential-less admin session and a synthetic
clinician identity for the public demo. Two independent conditions must hold before it
activates:

1. the opt-in is exactly `"true"`, and
2. `SUPABASE_SERVICE_ROLE_KEY` is **not** set.

The service-role credential bypasses row-level security, so a deployment holding it can reach
real records. Combining it with an unauthenticated admin would let an anonymous visitor read
patient data and approve clinical artifacts through the synthetic reviewer. That combination
is now refused in code rather than left to configuration discipline, and
`resolvePortfolioAdminStatus()` reports the reason for diagnostics.

The anon key and project URL alone are not disqualifying, because row-level security still
applies to them.

## Dependency advisories

CI gates the shipped dependency tree with `npm run audit:prod`
(`npm audit --omit=dev --audit-level=high`). The production tree is clean.

One dev-only advisory is accepted and tracked:

- **`brace-expansion` denial of service.** Reachable only through `minimatch@3.1.5`, which is
  pulled in by the ESLint toolchain (`@eslint/eslintrc`, `eslint-config-next` and its plugins).
  The advisory covers every release at or below `5.0.8`'s predecessor, so the only fix is
  `brace-expansion@5.0.8`, whose changed export shape breaks `minimatch@3` — verified: ESLint
  fails with `expand is not a function`. There is no upstream fix compatible with the current
  ESLint dependency chain. The package is not part of any deployed artifact and is exercised
  only when linting locally or in CI. Re-check when ESLint moves off `minimatch@3`.

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
