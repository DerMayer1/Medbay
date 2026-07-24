export const PORTFOLIO_ADMIN_COOKIE = "medbay_portfolio_admin";
export const PORTFOLIO_ADMIN_COOKIE_VALUE = "enabled";

export function isPortfolioAdminEnabled() {
  // Fail closed: the credential-less portfolio/demo admin is only available when
  // explicitly opted in. Any other value (including unset) keeps it disabled so a
  // real deployment never exposes the admin console without Supabase auth.
  return process.env.MEDBAY_PORTFOLIO_ADMIN === "true";
}

export function isPortfolioAdminCookie(value?: string) {
  return isPortfolioAdminEnabled() && value === PORTFOLIO_ADMIN_COOKIE_VALUE;
}

export async function isPortfolioAdminSession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return isPortfolioAdminCookie(cookieStore.get(PORTFOLIO_ADMIN_COOKIE)?.value);
}
