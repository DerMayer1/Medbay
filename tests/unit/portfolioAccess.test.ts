import { afterEach, describe, expect, it } from "vitest";
import {
  isPortfolioAdminCookie,
  isPortfolioAdminEnabled,
  PORTFOLIO_ADMIN_COOKIE_VALUE,
} from "@/lib/portfolioAccess";

const original = process.env.MEDBAY_PORTFOLIO_ADMIN;

afterEach(() => {
  if (original === undefined) delete process.env.MEDBAY_PORTFOLIO_ADMIN;
  else process.env.MEDBAY_PORTFOLIO_ADMIN = original;
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
    process.env.MEDBAY_PORTFOLIO_ADMIN = "true";
    expect(isPortfolioAdminEnabled()).toBe(true);
    expect(isPortfolioAdminCookie(PORTFOLIO_ADMIN_COOKIE_VALUE)).toBe(true);
    expect(isPortfolioAdminCookie("wrong-value")).toBe(false);
  });
});
