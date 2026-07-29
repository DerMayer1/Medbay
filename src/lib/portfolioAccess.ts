export const PORTFOLIO_ADMIN_COOKIE = "medbay_portfolio_admin";
export const PORTFOLIO_ADMIN_COOKIE_VALUE = "enabled";

export type PortfolioAdminStatus = {
  enabled: boolean;
  /** Diagnostic reason, safe to log. Never contains credential material. */
  reason: string;
};

/**
 * Resolves whether the credential-less portfolio/demo admin may be used.
 *
 * Two independent conditions must both hold. The opt-in must be explicit, and
 * the deployment must be unable to reach real clinical data. The service-role
 * credential bypasses row-level security entirely, so a deployment holding it
 * must never also accept an unauthenticated admin — that combination would let
 * an anonymous visitor read real patient records and approve clinical
 * artifacts through the synthetic reviewer identity.
 *
 * The anon key and project URL alone are not disqualifying: row-level security
 * still applies to them.
 */
export function resolvePortfolioAdminStatus(): PortfolioAdminStatus {
  if (process.env.MEDBAY_PORTFOLIO_ADMIN !== "true") {
    return { enabled: false, reason: "not_opted_in" };
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { enabled: false, reason: "refused_service_role_credential_present" };
  }
  return { enabled: true, reason: "synthetic_demo_deployment" };
}

export function isPortfolioAdminEnabled() {
  return resolvePortfolioAdminStatus().enabled;
}

export function isPortfolioAdminCookie(value?: string) {
  return isPortfolioAdminEnabled() && value === PORTFOLIO_ADMIN_COOKIE_VALUE;
}

export async function isPortfolioAdminSession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return isPortfolioAdminCookie(cookieStore.get(PORTFOLIO_ADMIN_COOKIE)?.value);
}
