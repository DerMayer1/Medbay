import { NextRequest } from "next/server";
import {
  isPortfolioAdminEnabled,
  PORTFOLIO_ADMIN_COOKIE,
  PORTFOLIO_ADMIN_COOKIE_VALUE,
} from "@/lib/portfolioAccess";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation } from "@/lib/security";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;

  const rateLimitError = enforceRateLimit(request, "portfolio_admin_login", { limit: 10, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;

  if (!isPortfolioAdminEnabled()) {
    return noStoreJson({ error: "portfolio_access_disabled" }, { status: 403 });
  }

  const response = noStoreJson({ ok: true });
  response.cookies.set(PORTFOLIO_ADMIN_COOKIE, PORTFOLIO_ADMIN_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
