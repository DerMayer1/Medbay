import { describe, expect, it } from "vitest";
import { chatPayloadSchema, handoffPayloadSchema, knowledgePayloadSchema } from "@/lib/validators";

describe("validators", () => {
  it("accepts chat payload", () => {
    expect(chatPayloadSchema.parse({ message: "Start intake" }).message).toBe("Start intake");
  });

  it("rejects empty handoff reason", () => {
    expect(() => handoffPayloadSchema.parse({ conversationId: crypto.randomUUID(), reason: "" })).toThrow();
  });

  it("accepts clinic knowledge categories", () => {
    expect(knowledgePayloadSchema.parse({ category: "services", title: "Primary care", content: "Available" }).active).toBe(
      true,
    );
  });
});
