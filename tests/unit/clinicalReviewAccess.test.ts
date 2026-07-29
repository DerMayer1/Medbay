import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ProfileRow = { id: string; name: string; role: string } | null;

const state = vi.hoisted(() => ({
  cookieValue: undefined as string | undefined,
  supabaseConfigured: true,
  user: null as { id: string; email: string } | null,
  // The query filters on role = 'clinician', so a non-clinician profile
  // resolves to no row.
  clinicianProfile: null as ProfileRow,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name && state.cookieValue ? { value: state.cookieValue } : undefined) }),
}));

vi.mock("@/lib/supabaseServer", () => ({
  getServerSupabase: async () => {
    if (!state.supabaseConfigured) return null;
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle: async () => ({ data: state.clinicianProfile, error: null }),
    };
    return {
      auth: {
        getUser: async () => (state.user
          ? { data: { user: state.user }, error: null }
          : { data: { user: null }, error: new Error("no session") }),
      },
      from: () => query,
    };
  },
}));

const { resolveClinicalReviewAccess } = await import("@/lib/security");
const { PORTFOLIO_ADMIN_COOKIE_VALUE } = await import("@/lib/portfolioAccess");

const originalFlag = process.env.MEDBAY_PORTFOLIO_ADMIN;

beforeEach(() => {
  state.cookieValue = undefined;
  state.supabaseConfigured = true;
  state.user = null;
  state.clinicianProfile = null;
  delete process.env.MEDBAY_PORTFOLIO_ADMIN;
});

afterEach(() => {
  if (originalFlag === undefined) delete process.env.MEDBAY_PORTFOLIO_ADMIN;
  else process.env.MEDBAY_PORTFOLIO_ADMIN = originalFlag;
});

describe("clinical review authorization", () => {
  it("rejects an unauthenticated request", async () => {
    const access = await resolveClinicalReviewAccess();
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.response.status).toBe(401);
  });

  it("rejects an authenticated user without the clinician role", async () => {
    state.user = { id: "40000000-0000-4000-8000-000000000001", email: "ops@northstar.example" };
    state.clinicianProfile = null;

    const access = await resolveClinicalReviewAccess();
    expect(access.ok).toBe(false);
    if (!access.ok) {
      expect(access.response.status).toBe(403);
      await expect(access.response.json()).resolves.toEqual({ error: "clinician_role_required" });
    }
  });

  it("allows a verified clinician", async () => {
    state.user = { id: "50000000-0000-4000-8000-000000000001", email: "cardio@northstar.example" };
    state.clinicianProfile = { id: "50000000-0000-4000-8000-000000000001", name: "Dr. Reyes", role: "clinician" };

    const access = await resolveClinicalReviewAccess();
    expect(access.ok).toBe(true);
    if (access.ok) {
      expect(access.demo).toBe(false);
      expect(access.reviewer).toEqual({ id: state.clinicianProfile.id, name: "Dr. Reyes" });
    }
  });

  it("fails closed when authentication is not configured", async () => {
    state.supabaseConfigured = false;
    const access = await resolveClinicalReviewAccess();
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.response.status).toBe(503);
  });

  it("ignores the portfolio cookie unless the demo flag is explicitly enabled", async () => {
    state.cookieValue = PORTFOLIO_ADMIN_COOKIE_VALUE;
    const access = await resolveClinicalReviewAccess();
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.response.status).toBe(401);
  });

  it("grants a synthetic reviewer only in explicit demo mode", async () => {
    process.env.MEDBAY_PORTFOLIO_ADMIN = "true";
    state.cookieValue = PORTFOLIO_ADMIN_COOKIE_VALUE;

    const access = await resolveClinicalReviewAccess();
    expect(access.ok).toBe(true);
    if (access.ok) expect(access.demo).toBe(true);
  });
});
