import { describe, expect, it } from "vitest";
import { createDegradedChatReply } from "@/lib/degradedChat";

describe("degraded chat", () => {
  it("continues intake without claiming that data was submitted", () => {
    const result = createDegradedChatReply("Hello");

    expect(result.reply).toContain("full name");
    expect(result.handoffRequired).toBe(false);
  });

  it("advances through the intake history", () => {
    const result = createDegradedChatReply("lucas@example.com", ["Hello", "Lucas Silva"]);

    expect(result.reply).toContain("reason for the visit");
  });

  it("keeps clinical requests inside the safety boundary", () => {
    const result = createDegradedChatReply("Can you interpret my lab result?");

    expect(result.handoffRequired).toBe(true);
    expect(result.reply).toContain("not been submitted");
  });
});
