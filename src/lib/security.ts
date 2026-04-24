import { NextRequest, NextResponse } from "next/server";
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
  const visitorId = request.cookies.get("juliana_visitor_id")?.value;
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
      message: "Muitas solicitações em pouco tempo. Tente novamente em instantes.",
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

export async function requireAdmin() {
  const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseEnv) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
    }
    return null;
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
    .eq("role", "admin")
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return null;
}

export function noStoreJson(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return NextResponse.json(data, { ...init, headers });
}
