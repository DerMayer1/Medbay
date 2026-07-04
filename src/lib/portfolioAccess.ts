export const PORTFOLIO_ADMIN_COOKIE = "medbay_portfolio_admin";
export const PORTFOLIO_ADMIN_COOKIE_VALUE = "enabled";

export function isPortfolioAdminEnabled() {
  return process.env.MEDBAY_PORTFOLIO_ADMIN !== "false";
}

export function isPortfolioAdminCookie(value?: string) {
  return isPortfolioAdminEnabled() && value === PORTFOLIO_ADMIN_COOKIE_VALUE;
}

export async function isPortfolioAdminSession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return isPortfolioAdminCookie(cookieStore.get(PORTFOLIO_ADMIN_COOKIE)?.value);
}
