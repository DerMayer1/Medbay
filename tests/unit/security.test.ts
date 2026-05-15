import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/security";

describe("security helpers", () => {
  it("blocks requests over the configured rate limit", () => {
    const key = `test:${crypto.randomUUID()}`;
    expect(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed).toBe(false);
  });
});
