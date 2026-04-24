import { describe, expect, it } from "vitest";
import { chatPayloadSchema, handoffPayloadSchema, knowledgePayloadSchema } from "@/lib/validators";

describe("validators", () => {
  it("accepts chat payload", () => {
    expect(chatPayloadSchema.parse({ message: "Quero agendar" }).message).toBe("Quero agendar");
  });

  it("rejects empty handoff reason", () => {
    expect(() => handoffPayloadSchema.parse({ conversationId: crypto.randomUUID(), reason: "" })).toThrow();
  });

  it("accepts known knowledge categories", () => {
    expect(knowledgePayloadSchema.parse({ category: "prices", title: "Valores", content: "Confirmar" }).active).toBe(
      true,
    );
  });
});
