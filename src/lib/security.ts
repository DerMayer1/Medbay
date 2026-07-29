import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isPortfolioAdminCookie, PORTFOLIO_ADMIN_COOKIE } from "@/lib/portfolioAccess";
import { getServerSupabase } from "@/lib/supabaseServer";

type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const defaultAllowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
].filter(Boolean) as string[];

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export function getVisitorKey(request: NextRequest, scope: string) {
  const visitorId = request.cookies.get("medbay_visitor_id")?.value;
  return `${scope}:${visitorId || getClientIp(request)}`;
}

export function checkRateLimit(key: string, config: RateLimitConfig) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (existing.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(config.limit - existing.count, 0),
    resetAt: existing.resetAt,
  };
}

export function rateLimitResponse(limit: number, resetAt: number) {
  return NextResponse.json(
    {
      error: "rate_limited",
      message: "Too many requests in a short period. Try again shortly.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(Math.ceil((resetAt - Date.now()) / 1000), 1)),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}

export function enforceRateLimit(request: NextRequest, scope: string, config: RateLimitConfig) {
  const result = checkRateLimit(getVisitorKey(request, scope), config);
  if (!result.allowed) return rateLimitResponse(config.limit, result.resetAt);
  return null;
}

export function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const hostOrigin = `${request.nextUrl.protocol}//${request.headers.get("host")}`;
  const allowed = new Set([hostOrigin, ...defaultAllowedOrigins]);
  return allowed.has(origin);
}

export function rejectCrossOriginMutation(request: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return null;
  if (isAllowedOrigin(request)) return null;
  return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
}

/**
 * Verifies a real Supabase admin session. Returns an error response when the
 * caller is not an authenticated admin, or null when they are. This path never
 * consults the portfolio/demo cookie, so it can only grant access to real data.
 */
async function verifyRealAdmin() {
  const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseEnv) {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
  }

  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .in("role", ["admin", "staff", "clinician"])
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return null;
}

/**
 * Strict real-admin gate. A portfolio/demo cookie does NOT satisfy this check,
 * so any route guarded only by `requireAdmin` fails closed for demo sessions
 * instead of leaking production data. Routes that intentionally support the
 * demo must use `resolveAdminAccess` and branch on `demo`.
 */
export async function requireAdmin() {
  return verifyRealAdmin();
}

export type AdminAccess =
  | { ok: true; demo: boolean }
  | { ok: false; response: NextResponse };

/**
 * Resolves admin access, distinguishing a real Supabase admin from a
 * credential-less portfolio/demo session. Callers MUST serve demo data and
 * avoid real infrastructure whenever `demo` is true.
 */
export async function resolveAdminAccess(): Promise<AdminAccess> {
  const cookieStore = await cookies();
  if (isPortfolioAdminCookie(cookieStore.get(PORTFOLIO_ADMIN_COOKIE)?.value)) {
    return { ok: true, demo: true };
  }

  const response = await verifyRealAdmin();
  if (response) return { ok: false, response };
  return { ok: true, demo: false };
}

export type ClinicalReviewAccess =
  | { ok: true; demo: boolean; reviewer: { id: string; name: string } }
  | { ok: false; response: NextResponse };

/** A final clinical-artifact decision requires a clinician profile, not a generic admin. */
export async function resolveClinicalReviewAccess(): Promise<ClinicalReviewAccess> {
  const cookieStore = await cookies();
  if (isPortfolioAdminCookie(cookieStore.get(PORTFOLIO_ADMIN_COOKIE)?.value)) {
    return {
      ok: true,
      demo: true,
      reviewer: { id: "30000000-0000-4000-8000-000000000001", name: "Dr. Synthetic Reviewer" },
    };
  }

  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, response: NextResponse.json({ error: "auth_not_configured" }, { status: 503 }) };
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return { ok: false, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", auth.user.id)
    .eq("role", "clinician")
    .maybeSingle();
  if (error || !profile) return { ok: false, response: NextResponse.json({ error: "clinician_role_required" }, { status: 403 }) };

  return { ok: true, demo: false, reviewer: { id: profile.id, name: profile.name || auth.user.email || "Clinician" } };
}

export function noStoreJson(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return NextResponse.json(data, { ...init, headers });
}
