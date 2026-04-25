import { afterEach, describe, expect, it } from "vitest";
import { createIntakeUseCaseDependencies } from "@/features/intake/infrastructure/adapters";

describe("adapter selection", () => {
  const previousDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE;

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = previousDemoMode;
  });

  it("selects demo-capable adapters in demo mode", () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    const dependencies = createIntakeUseCaseDependencies();
    expect(dependencies.caseRepository).toBeDefined();
    expect(dependencies.aiProvider).toBeDefined();
    expect(dependencies.auditLogger).toBeDefined();
  });
});
