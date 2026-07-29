import { afterEach, describe, expect, it } from "vitest";
import {
  isPortfolioAdminCookie,
  isPortfolioAdminEnabled,
  resolvePortfolioAdminStatus,
  PORTFOLIO_ADMIN_COOKIE_VALUE,
} from "@/lib/portfolioAccess";

const original = process.env.MEDBAY_PORTFOLIO_ADMIN;
const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

afterEach(() => {
  if (original === undefined) delete process.env.MEDBAY_PORTFOLIO_ADMIN;
  else process.env.MEDBAY_PORTFOLIO_ADMIN = original;
  if (originalServiceRole === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
});

describe("portfolio admin access (fail closed)", () => {
  it("is disabled when the flag is unset", () => {
    delete process.env.MEDBAY_PORTFOLIO_ADMIN;
    expect(isPortfolioAdminEnabled()).toBe(false);
    expect(isPortfolioAdminCookie(PORTFOLIO_ADMIN_COOKIE_VALUE)).toBe(false);
  });

  it("is disabled for any value other than the exact opt-in", () => {
    for (const value of ["", "1", "yes", "TRUE", "false"]) {
      process.env.MEDBAY_PORTFOLIO_ADMIN = value;
      expect(isPortfolioAdminEnabled()).toBe(false);
    }
  });

  it("is enabled only when explicitly set to \"true\"", () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.MEDBAY_PORTFOLIO_ADMIN = "true";
    expect(isPortfolioAdminEnabled()).toBe(true);
    expect(isPortfolioAdminCookie(PORTFOLIO_ADMIN_COOKIE_VALUE)).toBe(true);
    expect(isPortfolioAdminCookie("wrong-value")).toBe(false);
  });

  it("refuses the bypass when the deployment holds a service-role credential", () => {
    // The service-role key bypasses row-level security, so a deployment holding
    // it can reach real patient records. An unauthenticated admin must never be
    // combined with it, whatever the opt-in says.
    process.env.MEDBAY_PORTFOLIO_ADMIN = "true";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const status = resolvePortfolioAdminStatus();
    expect(status.enabled).toBe(false);
    expect(status.reason).toBe("refused_service_role_credential_present");
    expect(isPortfolioAdminCookie(PORTFOLIO_ADMIN_COOKIE_VALUE)).toBe(false);
  });

  it("reports why the bypass is unavailable", () => {
    delete process.env.MEDBAY_PORTFOLIO_ADMIN;
    expect(resolvePortfolioAdminStatus()).toEqual({ enabled: false, reason: "not_opted_in" });
  });
});
